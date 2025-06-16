/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Server, Socket } from 'socket.io'
import jwt from 'jsonwebtoken'
import messagesService from '~/services/messages.services'
import notificationsService from '~/services/notification.services'
import { ENV_CONFIG } from '~/constants/config'
import { InteractionPayload, PrivateMessagePayload } from '~/models/types/socket.types'




export const onlineUsers: Record<string, { socket_id: string }> = {}

export function initSocketIO(httpServer: any) {
  const io = new Server(httpServer, {
    cors: { origin: 'http://localhost:3000' }
  })

  // Middleware verify token
  io.use((socket, next) => {
    const token = socket.handshake.auth.token
    if (!token) return next(new Error('Unauthorized'))

    try {
      const decoded = jwt.verify(token, ENV_CONFIG.JWT_SECRET_ACCESS_TOKEN) as { user_id: string }
      socket.data.user_id = decoded.user_id
      next()
    } catch (error) {
      next(new Error('Invalid token'))
    }
  })

  io.on('connection', (socket: Socket) => {
    const user_id = socket.data.user_id
    console.log(`✅ User ${user_id} connected (socket id ${socket.id})`)

    // Lưu user online
    onlineUsers[user_id] = { socket_id: socket.id }

    /** Handle Private Chat Message */
    socket.on('private message', async (data: PrivateMessagePayload) => {
      try {
        const savedMessage = await messagesService.sendMessage({
          sender_id: user_id,
          receiver_id: data.to,
          content: data.content,
          type: data.type,
          image_url: data.image_url
        })

        // Gửi realtime nếu receiver đang online
        const receiverSocketId = onlineUsers[data.to]?.socket_id
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('receive message', {
            from: user_id,
            content: savedMessage.content,
            type: savedMessage.type,
            image_url: savedMessage.image_url,
            created_at: savedMessage.created_at
          })

          io.to(receiverSocketId).emit('notification', {
            type: 'chat',
            title: 'New Message',
            message: `Bạn có tin nhắn mới từ ${user_id}`,
            sender_id: user_id,
            created_at: savedMessage.created_at
          })
        }

        // Lưu Notification DB
        await notificationsService.createNotification({
          user_id: data.to,
          sender_id: user_id,
          type: 'chat',
          content: data.content || '[Image]'
        })
      } catch (error) {
        console.error('Error private message:', error)
      }
    })

    /** Handle Interaction (Like, Comment, Retweet, Follow...) */
    socket.on('interaction', async (data: InteractionPayload) => {
      try {
        await notificationsService.createNotificationAndEmit({
          user_id: data.target_user_id,
          sender_id: user_id,
          type: data.type,
          content: data.content,
          tweet_id: data.tweet_id
        })
      } catch (error) {
        console.error('Error handling interaction:', error)
      }
    })

    /** Handle disconnect */
    socket.on('disconnect', () => {
      delete onlineUsers[user_id]
      console.log(`❌ User ${user_id} disconnected`)
    })
  })

  return io
}
