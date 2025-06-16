/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response, NextFunction } from 'express'
import { SendMessageReqBody } from '~/models/requests/messages.requests'

export function validateSendMessage(req: Request<any, any, SendMessageReqBody>, res: Response, next: NextFunction): void {
  const { type, content, image_url } = req.body

  if (!type || (type !== 'text' && type !== 'image')) {
    res.status(400).json({ message: 'Invalid type: must be text or image' })
  }

  if (type === 'text' && (!content || content.trim() === '')) {
    res.status(400).json({ message: 'Content is required for text message' })
  }

  if (type === 'image' && (!image_url || image_url.trim() === '')) {
    res.status(400).json({ message: 'Image URL is required for image message' })
  }

  next()
}
