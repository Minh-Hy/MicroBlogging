/* eslint-disable @typescript-eslint/no-explicit-any */
import { Server, Socket } from 'socket.io';

interface UserMap { [key: string]: { socket_id: string } }
const users: UserMap = {};

export function initSocketIO(httpServer: any) {
  const io = new Server(httpServer, {
    cors: { origin: 'http://localhost:3000' }
  });

  io.on('connection', (socket: Socket) => {
    console.log(`User ${socket.id} connected`);

    const user_id = socket.handshake.auth._id;
    if (!user_id) return socket.disconnect();

    users[user_id] = { socket_id: socket.id };
    console.log(users);

    socket.on('private message', (data) => {
      const receiver_socket_id = users[data.to]?.socket_id;
      if (receiver_socket_id) {
        io.to(receiver_socket_id).emit('receiver private message', {
          content: data.content,
          from: user_id
        });
      }
    });

    socket.on('disconnect', () => {
      delete users[user_id];
      console.log(`User ${socket.id} disconnected`);
    });
  });

  return io;
}
