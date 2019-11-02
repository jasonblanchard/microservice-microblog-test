import { connect, Payload } from 'ts-nats';

interface InfoEntryContextMap {
  creator: {
    id: string;
    username: string;
  }
}

async function start() {
  console.log('start');

  let nc = await connect({
    servers: ['nats://localhost:4222'],
    payload: Payload.JSON
  });

  nc.subscribe('info.entry', (error, message) => {
    const entry = message.data;
    const { creatorId: userId } = entry;
    const contextMap: InfoEntryContextMap = {
      creator: {
        id: '',
        username: ''
      }
    };

    nc.request('store.get.kind.user', 1000, { id: userId })
      .then(message => {
        const { id, username } = message.data;
        contextMap.creator = {
          id,
          username,
        }
        return nc.request('store.list.kind.followers', 1000, { userId })
      })
      .then(message => {
        const followers = message.data;
        followers.forEach((followerId: number) => {
          nc.request('timeline.insert', 1000, {
            userId: followerId,
            entry: {
              ...entry,
              creator: {
                id: contextMap.creator.id,
                username: contextMap.creator.username
              }
            }
          })
          .catch(error => {
            throw error;
          });
        });
      })
      .then(() => {
        // Also add your own posts to your own timeline
        return nc.request('timeline.insert', 1000, {
          userId,
          entry: {
            ...entry,
            creator: {
              id: contextMap.creator.id,
              username: contextMap.creator.username
            }
          }
        })
      })
      .catch(error => {
        console.log(error);
      });
  });
}

start();
