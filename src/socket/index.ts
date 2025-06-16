/* eslint-disable @typescript-eslint/no-explicit-any */
import { Server, Socket } from 'socket.io';
import messagesService from '~/services/messages.services';
import notificationsService from '~/services/notification.services';

// Định nghĩa kiểu dữ liệu message
interface PrivateMessagePayload {
  content: string;
  to: string;
  type: 'text' | 'image';
  image_url?: string;
}

// Định nghĩa kiểu user map an toàn
interface UserMap {
  [userId: string]: {
    socket_id: string;
  };
}

const users: UserMap = {};

export function initSocketIO(httpServer: any) {
  const io = new Server(httpServer, {
    cors: { origin: 'http://localhost:3000' }
  });

  io.on('connection', (socket: Socket) => {
    console.log(`User ${socket.id} connected`);

    const user_id = socket.handshake.auth._id;
    if (!user_id) {
      console.warn('No user_id provided, disconnecting socket.');
      return socket.disconnect();
    }

    // Lưu user vào map
    users[user_id] = { socket_id: socket.id };
    console.log('Current users online:', users);

    // Xử lý tin nhắn riêng tư
    socket.on('private message', async (data: PrivateMessagePayload) => {
      try {
        // 1️⃣ Lưu tin nhắn vào database
        const savedMessage = await messagesService.sendMessage({
          sender_id: user_id,
          receiver_id: data.to,
          content: data.content,
          type: data.type,
          image_url: data.image_url
        });

        // 2️⃣ Lưu notification vào database
        await notificationsService.createNotification({
          user_id: data.to,
          sender_id: user_id,
          type: 'chat',
          content: data.content || '[Image]'
        });

        // 3️⃣ Gửi tin nhắn realtime cho receiver nếu đang online
        const receiver_socket_id = users[data.to]?.socket_id;
        if (receiver_socket_id) {
          io.to(receiver_socket_id).emit('receiver private message', {
            content: savedMessage.content,
            type: savedMessage.type,
            image_url: savedMessage.image_url,
            from: user_id,
            created_at: savedMessage.created_at
          });

          // 4️⃣ Gửi thêm notification realtime
          io.to(receiver_socket_id).emit('notification', {
            type: 'chat',
            title: 'New Message',
            message: `Bạn có tin nhắn mới từ ${user_id}`,
            sender_id: user_id,
            content: savedMessage.content,
            created_at: savedMessage.created_at
          });
        }
      } catch (error) {
        console.error('Error handling private message:', error);
      }
    });

    // Xử lý disconnect
    socket.on('disconnect', () => {
      delete users[user_id];
      console.log(`User ${socket.id} disconnected`);
    });
  });

  return io;
}
