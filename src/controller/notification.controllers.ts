import { Request, Response } from "express"
import notificationService from "~/services/notification.services"
import { ParamsDictionary } from "express-serve-static-core"

class NotificationController {
  async getNotifications(req: Request, res: Response) {
    const user_id = req.decoded_authorization?.user_id as string
    const notifications = await notificationService.getNotifications(user_id)
    res.json({
      message: 'Get notifications successfully',
      result: notifications
    })
  }

  async markAsRead(req: Request<ParamsDictionary>, res: Response) {
    const user_id = req.decoded_authorization?.user_id as string
    await notificationService.markAsRead(user_id)
    res.json({ message: 'Mark notifications as read' })
  }
}

export default new NotificationController()
