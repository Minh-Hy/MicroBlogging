import { Router } from 'express'
import messagesController from '~/controller/messages.controllers'
import { accessTokenValidator, verifiedUserValidator } from '~/middlewares/users.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'
import { validateSendMessage } from '~/middlewares/messages.middlewares'

const messagesRouter = Router()

messagesRouter.post(
  '/',
  accessTokenValidator,
  verifiedUserValidator,
  validateSendMessage,
  wrapRequestHandler(messagesController.sendMessage)
)

messagesRouter.get(
  '/',
  accessTokenValidator,
  verifiedUserValidator,
  wrapRequestHandler(messagesController.getConversation)
)

messagesRouter.put(
  '/read',
  accessTokenValidator,
  verifiedUserValidator,
  wrapRequestHandler(messagesController.markAsRead)
)

export default messagesRouter
