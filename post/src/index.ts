import { connect, Payload } from 'ts-nats';

async function start() {
  console.log('starting');

  let nc = await connect({
    servers: ['nats://localhost:4222'],
    payload: Payload.JSON
  });

  nc.subscribe('post.entry', (error, message) => {
    const reply = message.reply;
    const { text } = message.data.entry;
    const { id: creatorId } = message.data.creator;

    if (reply) {
      nc.request('store.save.kind.entry', 1000, { text, creatorId })
        .then(message => {
          console.log('here');

          const { text, id } = message.data;
          nc.publish(reply, { text, id, creatorId });
          nc.publish('info.entry', { text, id, creatorId });
        })
    }
  }, {
    queue: 'post-service'
  });
}

start();
