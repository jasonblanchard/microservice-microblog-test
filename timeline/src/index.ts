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

    timelineByUser[userId] ? timelineByUser[userId].push(entry) : timelineByUser[userId] = [entry];

    if (reply) {
      nc.publish(reply);
    }

    nc.publish('info.timeline', { userId, entry });
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
