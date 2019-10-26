import { connect, Payload } from 'ts-nats';

interface UsersById {
  [key: string]: {
    id: number,
    username: string
  }
}

let usersById: UsersById = {};

let counter = 0;

async function start() {
  console.log('starting');

  let nc = await connect({
    servers: ['nats://localhost:4222'],
    payload: Payload.JSON
  });

  nc.subscribe('store.save.kind.user', (error, message) => {
    console.log(message);
    const { username } = message.data;

    const id = ++counter;
    usersById[String(id)] = { id, username };

    if (message.reply) {
      nc.publish(message.reply, usersById[id]);
    }
  }, {
    queue: 'user-store-service'
  });

  nc.subscribe('store.list.kind.user', (error, message) => {
    console.log(message);

    const entries = Object.keys(usersById).map(id => usersById[id]);

    if (message.reply) {
      nc.publish(message.reply, entries);
    }
  }, {
    queue: 'user-store-service'
  });

  nc.subscribe('store.destroy', (error, message) => {
    usersById = {};
  });
}

start();
