import { getNameFromFullName, handleUploadImage, handleUploadVideo } from '~/utils/file';
import { Request } from 'express';
import sharp from 'sharp';
import { UPLOAD_IMAGE_DIR } from '~/constants/dir';
import path from 'path';
import fs from 'fs';
import fsPromise from 'fs/promises';
import { isProduction } from '~/constants/config';
import { config } from 'dotenv';
import { EncodingStatus, MediaType } from '~/constants/enums';
import { Media } from '~/models/other';
import { encodeHLSWithMultipleVideoStreams } from '~/utils/video';
import databaseService from './database.services';
import VideoStatus from '~/models/schemas/VideoStatus.schemas';

config();

class Queue {
  items: string[] = [];
  encoding: boolean = false;

  constructor() {}

  async enqueue(item: string) {
    this.items.push(item);
    const normalizedItem = path.normalize(item);  // Chuẩn hóa đường dẫn
    const idName = getNameFromFullName(normalizedItem.split(path.sep).pop() as string);
    console.log('idName', idName);
    await databaseService.videoStatus.insertOne(new VideoStatus({
      name: idName,
      status: EncodingStatus.Pending,
    }));
    this.processEncode();
  }

  async processEncode() {
    if (this.encoding) return;
    if (this.items.length > 0) {
      this.encoding = true;
      const videoPath = this.items[0];
      const normalizedItem = path.normalize(videoPath);  // Chuẩn hóa đường dẫn
    const idName = getNameFromFullName(normalizedItem.split(path.sep).pop() as string);

      await databaseService.videoStatus.updateOne({
        name: idName
      }, {
        $set: {
          status: EncodingStatus.Processing,
        },
        $currentDate: {
          updated_at: true
        }
      });

      try {
        await encodeHLSWithMultipleVideoStreams(videoPath);
        this.items.shift();
        await fsPromise.unlink(videoPath);

        await databaseService.videoStatus.updateOne({
          name: idName
        }, {
          $set: {
            status: EncodingStatus.Success,
          },
          $currentDate: {
            updated_at: true
          }
        });

        console.log(`Video ${videoPath} encoded and deleted`);
      } catch (error) {
        await databaseService.videoStatus.updateOne({
          name: idName
        }, {
          $set: {
            status: EncodingStatus.Failed,
          },
          $currentDate: {
            updated_at: true
          }
        }).catch((error) => {
          console.log('Error updating video status', error);
        });
        console.log(`Error encoding video ${videoPath} error`);
        console.error(error);
      }

      this.encoding = false;
      this.processEncode();
    } else {
      console.log('No videos to encode');
    }
  }
}

const queue = new Queue();

class MediasService {
  async UploadImage(req: Request) {
    const files = await handleUploadImage(req);
    const result: Media[] = await Promise.all(files.map(async (file) => {
      const newName = getNameFromFullName(file.newFilename);
      const newPath = path.resolve(UPLOAD_IMAGE_DIR, `${newName}.jpg`);
      await sharp(file.filepath).jpeg().toFile(newPath);
      fs.unlinkSync(file.filepath);
      return {
        url: isProduction 
          ? `${process.env.HOST}/static/image/${newName}.jpg` 
          : `http://localhost:${process.env.PORT}/static/image/${newName}.jpg`,
        type: MediaType.Image
      };
    }));

    return result;
  }

  async UploadVideo(req: Request) {
    const files = await handleUploadVideo(req);
    const result: Media[] = files.map((file) => {
      return {
        url: isProduction 
          ? `${process.env.HOST}/static/video/${file.newFilename}` 
          : `http://localhost:${process.env.PORT}/static/video/${file.newFilename}`,
        type: MediaType.Video
      };
    });
    return result;
  }

  async UploadVideoHLS(req: Request) {
    const files = await handleUploadVideo(req);
    const result: Media[] = await Promise.all(files.map(async (file) => {
      const newName = getNameFromFullName(file.newFilename);
      queue.enqueue(file.filepath);
      return {
        url: isProduction 
          ? `${process.env.HOST}/static/video-hls/${newName}.m3u8` 
          : `http://localhost:${process.env.PORT}/static/video-hls/${newName}.m3u8`,
        type: MediaType.HLS
      };
    }));
    return result;
  }

  async getVideoStatus(id: string) {
    const videoStatus = await databaseService.videoStatus.findOne({
      name: id
    });
    return videoStatus;
  }
}

const mediasService = new MediasService();
export default mediasService;
