import { connect, Payload } from 'ts-nats';
import http from 'http';
import socketio, { Socket } from 'socket.io';

const server = http.createServer();
const io = socketio(server);

interface SocketsByUserId {
  [key: string]: any;
}

async function start() {
  console.log('start');

  const socketsByUserId: SocketsByUserId = {};

  let nc = await connect({
    servers: ['nats://localhost:4222'],
    payload: Payload.JSON
  });

  nc.subscribe('info.timeline', (error, message) => {
    const { userId, entry } = message.data;
    console.log({ userId, entry });
    const sockets = socketsByUserId[userId]
    if (sockets) {
      sockets.forEach((socket: Socket) => socket.emit('entry', entry));
    }
  }, {
    queue: 'timeline-stream-service',
  });

  io.on('connection', socket => {
    socket.on('join', data => {
      console.log(socket.id, data);
      if (data.userId) {
        socketsByUserId[data.userId] ? socketsByUserId[data.userId].push(socket) : socketsByUserId[data.userId] = [socket];
      }
    });
    socket.on('disconnect', data => {
      // TODO: Clean up socketsByUserId. Maintain a map of userIdsBySocket and use that map to figure out which clients to pop.
    });
  });

  server.listen(8081);
}

start();
