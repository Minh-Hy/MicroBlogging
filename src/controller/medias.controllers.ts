/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextFunction, Request, Response } from 'express'
import path from 'path'
import { UPLOAD_IMAGE_DIR, UPLOAD_VIDEO_DIR } from '~/constants/dir'
import HTTP_STATUS from '~/constants/httpStatus'
import { USERS_MESSAGES } from '~/constants/messages'
import mediasService from '~/services/medias.services'
import fs from 'fs'
import mime from 'mime'


export const uploadImageController = async (req: Request, res: Response, next: NextFunction) => {
  const url = await mediasService.UploadImage(req)
  res.json({
    message: USERS_MESSAGES.UPLOAD_SUCCESS,
    result: url
  })
}

export const serveImageController = (req: Request, res: Response, next: NextFunction) =>{
  const {name} = req.params
  res.sendFile(path.resolve(UPLOAD_IMAGE_DIR, name + '.jpg'), (err) =>{
    if(err) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      res.status((err as any).status).send('Not found')

      
    }
  
  })
}

export const serveVideoM3U8Controller = (req: Request, res: Response, next: NextFunction) =>{
  const { id } = req.params

  return res.sendFile(path.resolve(UPLOAD_VIDEO_DIR, id, 'master.m3u8'), (err) =>{
    if(err) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      res.status((err as any).status).send('Not found')

      
    }
  
  })
}

export const serveSegmentController = (req: Request, res: Response, next: NextFunction) =>{
  const { id, v, segment } = req.params
  // segment : 0.ts, 1.ts, 2.ts
  return res.sendFile(path.resolve(UPLOAD_VIDEO_DIR, id, v, segment), (err) =>{
    if(err) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      res.status((err as any).status).send('Not found')

      
    }
  
  })
}

export const serveVideoStreamController = (req: Request, res: Response, next: NextFunction) =>{
  const range = req.headers.range
  if(!range) {
    res.status(HTTP_STATUS.BAD_REQUEST).send('Require Range header')
    return
  }

  const {name} = req.params
  const videoPath = path.resolve(UPLOAD_VIDEO_DIR, name)
  // 1MB = 10^6 bytes tinh theo he 10 thuong thay tren ui
  // 1mb = 2^20 bytes tinh theo he 2
  //Dung luong  video(bytes)
  const videoSize = fs.statSync(videoPath).size
  //Dung luong video cho moi phan doan stream
  const chunkSize = 10 ** 6 // 1MB
  //Lay gia tri byte bat dau tu header range 
  const start = Number(range.replace(/\D/g, ''))
  //Lay gia tri byte ket thuc tu header range, vuot qua dung luong video thi lay videoSize
  const end = Math.min(start + chunkSize, videoSize - 11)
  //Dung luong thuc te cho moi doan video stream
  //thuong la chunksize , ngoai tru doan cuoi cung
  const contentLength = end - start + 1
  const contentType = mime.getType(videoPath) || 'video/*'
  const headers = {
    'Content-Range': `bytes ${start}-${end}/${videoSize}`,
    'Accept-Ranges': 'bytes',
    'Content-Length': contentLength,
    'Content-Type': contentType,
  }
  res.writeHead(HTTP_STATUS.PARTIAL_CONTENT, headers)
  const videoStream = fs.createReadStream(videoPath, {start, end})
  videoStream.pipe(res)

}

export const uploadVideoController = async (req: Request, res: Response, next: NextFunction) => {
  const url = await mediasService.UploadVideo(req)
  res.json({
    message: USERS_MESSAGES.UPLOAD_SUCCESS,
    result: url
  })
}
export const uploadVideoHLSController = async (req: Request, res: Response, next: NextFunction) => {
  const url = await mediasService.UploadVideoHLS(req)
  res.json({
    message: USERS_MESSAGES.UPLOAD_SUCCESS,
    result: url
  })
}
export const videoStatusController = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params
  const url = await mediasService.getVideoStatus(id as string)
  res.json({
    message: USERS_MESSAGES.GET_VIDEO_STATUS_SUCCESS,
    result: url
  })
}

