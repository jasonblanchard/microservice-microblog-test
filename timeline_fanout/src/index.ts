import { connect, Payload } from 'ts-nats';
import { SSL_OP_NETSCAPE_CA_DN_BUG } from 'constants';

async function start() {
  console.log('start');

  let nc = await connect({
    servers: ['nats://localhost:4222'],
    payload: Payload.JSON
  });

  nc.subscribe('info.entry', (error, message) => {
    const entry = message.data;
    const { creatorId: userId } = entry;
    nc.request('store.list.kind.followers', 1000, { userId })
      .then(message => {
        const followers = message.data;
        console.log(userId, followers);

        followers.forEach((followerId: number) => {
          nc.request('timeline.insert', 1000, {
            userId: followerId,
            entry
          })
          .catch(error => {
            throw error;
          });
        });
      })
      .catch(error => {
        console.log(error);
      });
  });
}

start();
