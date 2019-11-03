import { connect, Payload } from 'ts-nats';

interface Entry {
  id: number,
  text: string,
  creatorId: number
}

interface EntriesById {
  [key: string]: Entry
}

let entriesById: EntriesById = {};

let counter = 0;

async function start() {
  console.log('starting');

  let nc = await connect({
    servers: ['nats://localhost:4222'],
    payload: Payload.JSON
  });

  nc.subscribe('store.save.kind.entry', (error, message) => {
    console.log(message);
    const { text, creatorId } = message.data;

    const id = ++counter;
    entriesById[String(id)] = { id, text, creatorId };

    if (message.reply) {
      nc.publish(message.reply, entriesById[id]);
    }
  }, {
    queue: 'entry-service'
  });

  nc.subscribe('store.list.kind.entry', (error, message) => {
    console.log(message);

    const entries = Object.keys(entriesById).map(id => entriesById[id]);

    if (message.reply) {
      nc.publish(message.reply, entries);
    }
  }, {
    queue: 'entry-store-service'
  });

  nc.subscribe('store.destroy', (error, message) => {
    entriesById = {};
  }, {
    queue: 'entry-store-service'
  });

  nc.subscribe('entries.by.user', (error, message) => {
    const { userId } = message.data;

    const entries = Object.keys(entriesById)
      .map(id => entriesById[id])
      .reduce((entries: Entry[], entry) => {
        if (entry.creatorId === userId) return [entry, ...entries];
        return entries;
      }, []);

    if (message.reply) {
      nc.publish(message.reply, entries);
    }
  })
}

start();
