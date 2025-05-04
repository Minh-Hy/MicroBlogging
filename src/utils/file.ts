/* eslint-disable @typescript-eslint/no-unused-vars */
import fs from 'fs';
import path from 'path';
import { Request } from 'express';
import { File } from 'formidable';
import { UPLOAD_IMAGE_TEMP_DIR, UPLOAD_VIDEO_DIR, UPLOAD_VIDEO_TEMP_DIR } from '~/constants/dir';

export const initFolder = () => {
  ;[UPLOAD_IMAGE_TEMP_DIR, UPLOAD_VIDEO_TEMP_DIR].forEach((dir) => {
    if(!fs.existsSync(dir)){
      fs.mkdirSync(dir,{
        recursive: true // tao folder nested
      })
    }
  })
 
}

export const handleUploadImage = async (req: Request) => {
  const formidable = (await import('formidable')).default
  const form = formidable({
    uploadDir: UPLOAD_IMAGE_TEMP_DIR,
    maxFiles: 4,
    keepExtensions: true,
    maxFieldsSize: 300 * 1024, // 300KB
    maxTotalFileSize: 300 * 1024 * 4, // 300MB
    filter: function({name, originalFilename, mimetype}) {

      const valid = name === 'image' && Boolean(mimetype?.includes('image/'))
      if(!valid) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        form.emit('error' as any , new Error('File is not an image') as any)
      }
      return valid
    } 
  })

  return new Promise<File[]>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        return reject(err)
      }
      // eslint-disable-next-line no-extra-boolean-cast
      if(!Boolean(files.image)) {
        return reject(new Error('File is empty'))
      }
      resolve(files.image as File[])
    })
  })

}

//Cach 1 : Tạo unique id cho video ngay từ đầu
//Cach 2 : Đợi video upload xong rồi tạo folder, move video vào

export const handleUploadVideo = async (req: Request) => {
  const formidable = (await import('formidable')).default
  const nanoid = (await import('nanoid')).nanoid
  const idName = nanoid()
  const folderPath = path.resolve(UPLOAD_VIDEO_DIR, idName)
  fs.mkdirSync(folderPath)
  const form = formidable({
    uploadDir: folderPath,
    maxFiles: 1,
    maxFileSize: 100 * 1024 * 1024, // 100MB cho mỗi file
    
    filter: function({name, originalFilename, mimetype}) {
      const valid = name === 'video' && Boolean(mimetype?.includes('mp4') || mimetype?.includes('video/'))
      if(!valid) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        form.emit('error' as any , new Error('File is not a video') as any)
      }
    return valid 
    },
    filename : function () {
      return idName 
    }
  })

  return new Promise<File[]>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        return reject(err)
      }
      // eslint-disable-next-line no-extra-boolean-cast
      if(!Boolean(files.video)) {
        return reject(new Error('File is empty'))
      }

      const videos = files.video as File[]
      videos.forEach((video) => {
        const ext = getExtensionFromFullName(video.originalFilename as string)
        fs.renameSync(video.filepath, video.filepath + '.' + ext)
        video.newFilename = video.newFilename + '.' + ext
        video.filepath = video.filepath + '.' + ext
      })
      resolve(files.video as File[])
    })
  })

}

export const getNameFromFullName = (fullname: string) => {
  const namearr = fullname.split('.')
  namearr.pop()
  return namearr.join('')
}

export const getExtensionFromFullName = (fullname: string) => {
  const namearr = fullname.split('.')
  return namearr[namearr.length - 1]
}
