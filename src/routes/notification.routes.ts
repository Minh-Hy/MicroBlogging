import { Router } from 'express'
import { accessTokenValidator, verifiedUserValidator } from '~/middlewares/users.middlewares'
import notificationController from '~/controller/notification.controllers'
import { wrapRequestHandler } from '~/utils/handlers'

const notificationRouter = Router()

notificationRouter.get(
  '/',
  accessTokenValidator,
  verifiedUserValidator,
  wrapRequestHandler(notificationController.getNotifications)
)

notificationRouter.patch(
  '/mark-read',
  accessTokenValidator,
  verifiedUserValidator,
  wrapRequestHandler(notificationController.markAsRead)
)

export default notificationRouter
