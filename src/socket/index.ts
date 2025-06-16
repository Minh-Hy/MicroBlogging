/* eslint-disable @typescript-eslint/no-explicit-any */
import { Server, Socket } from 'socket.io';

// Define socket data type
interface PrivateMessagePayload {
  content: string;
  to: string;
}

// User Map kiểu an toàn
interface UserMap {
  [userId: string]: {
    socket_id: string;
  };
}

const users: UserMap = {};

// Hàm khởi tạo Socket.IO server
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

    // Ghi nhận user vào user map
    users[user_id] = { socket_id: socket.id };
    console.log('Current users online:', users);

    // Lắng nghe tin nhắn chat riêng tư
    socket.on('private message', (data: PrivateMessagePayload) => {
      const receiver_socket_id = users[data.to]?.socket_id;
      if (receiver_socket_id) {
        io.to(receiver_socket_id).emit('receiver private message', {
          content: data.content,
          from: user_id
        });

        // ✅ Có thể thêm emit notification ở đây nếu cần:
        io.to(receiver_socket_id).emit('notification', {
          type: 'chat',
          content: data.content,
          from: user_id
        });
      }
    });

    // Lắng nghe ngắt kết nối
    socket.on('disconnect', () => {
      delete users[user_id];
      console.log(`User ${socket.id} disconnected`);
    });
  });

  return io;
}
