import { connect, Payload } from 'ts-nats';

interface Entry {
  id: string;
  text: string;
  creatorId: string;
}

interface EntryForTimeline {
  entry: {
    id: string;
    text: string;
    creator: {
      id: string;
      username: string;
    }
  }
}

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
  }, {
    queue: 'timeline-fanout-service',
  });

  nc.subscribe('follow.user.info', (error, message) => {
    const { requestor, toBeFollowed } = message.data;

    const contextMap: InfoEntryContextMap = {
      creator: {
        id: '',
        username: ''
      }
    };

    nc.request('store.get.kind.user', 1000, { id: toBeFollowed.id })
      .then(message => {
        const { id, username } = message.data;
        contextMap.creator = {
          id,
          username,
        }
        return nc.request('entries.by.user', 1000, { userId: toBeFollowed.id })
      })
      .then(message => {
        const entries = message.data;
        const entriesForTimeline: EntryForTimeline[] = entries.reduce((entriesForTimeline: EntryForTimeline[], entry: Entry) => {
          return [{
            ...entry,
            creator: {
              id: contextMap.creator.id,
              username: contextMap.creator.username,
            }
          }, ...entriesForTimeline];
        }, []);
        nc.request('timeline.insert.list', 1000, { userId: requestor.id, entries: entriesForTimeline });
      })
      .catch(error => {
        console.log(error);
      })
  })
  .catch(error => {
    console.log(error);
  });
}

start();
