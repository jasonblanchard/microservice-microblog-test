import { connect, Payload } from 'ts-nats';

interface Entry {
  id: number;
  text: String;
}

interface TimelineByUser {
  [key: string]: Entry[];
}

let timelineByUser: TimelineByUser = {};

async function start() {
  console.log('starting');

  let nc = await connect({
    servers: ['nats://localhost:4222'],
    payload: Payload.JSON
  });

  nc.subscribe('timeline.insert', (error, message) => {
    const reply = message.reply;
    const { userId, entry } = message.data;

    if (timelineByUser[userId] && !timelineByUser[userId].some(timelineEntry => timelineEntry.id === entry.id)) {
      timelineByUser[userId].push(entry);
    } else {
      timelineByUser[userId] = [entry];
    }

    if (reply) {
      nc.publish(reply);
    }

    nc.publish('info.timeline', { userId, entry });
  }, {
    queue: 'timeline-service',
  });

  nc.subscribe('timeline.insert.list', (error, message) => {
    const reply = message.reply;
    const { userId, entries } = message.data;

    entries.forEach((entry: Entry) => {
      nc.publish('timeline.insert', { userId, entry });
    });

    if (reply) {
      nc.publish(reply);
    }
  }, {
    queue: 'timeline-service',
  });

  nc.subscribe('timeline.list', (error, message) => {
    const reply = message.reply;
    const { userId } = message.data;

    const timeline = timelineByUser[userId] || [];

    if (reply) {
      nc.publish(reply, timeline);
    }
  }, {
    queue: 'timeline-service',
  });

  nc.subscribe('store.destroy', (error, message) => {
    timelineByUser = {};
  }, {
    queue: 'timeline-service',
  });
}

start();
