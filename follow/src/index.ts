import { connect, Payload } from 'ts-nats';

interface CreateInput {
  requestor: {
    id: number;
  }
  toBeFollowed: {
    id: number;
  }
}

interface FollowMapping {
  [key: string]: Set<number>;
}

let followersByUserId: FollowMapping = {};
let followsByUserId: FollowMapping = {};

async function start() {
  console.log('starting');

  let nc = await connect({
    servers: ['nats://localhost:4222'],
    payload: Payload.JSON
  });

  nc.subscribe('follow.user', (error, message) => {
    const reply = message.reply;
    const input: CreateInput = message.data;
    const { requestor, toBeFollowed } = input;

    followersByUserId[toBeFollowed.id] ? followersByUserId[toBeFollowed.id].add(requestor.id) : followersByUserId[toBeFollowed.id] = new Set([requestor.id]);
    followsByUserId[requestor.id] ? followsByUserId[requestor.id].add(toBeFollowed.id) : followsByUserId[requestor.id] = new Set([toBeFollowed.id]);

    if (reply) {
      nc.publish(reply);
    }
  }, {
    queue: 'follow-service'
  });

  nc.subscribe('follows.by.user', (error, message) => {
    const reply = message.reply;
    const { userId } = message.data;
    const follows = followsByUserId[userId] ? Array.from(followsByUserId[userId]) : [];

    if (reply) {
      nc.publish(reply, follows);
    }
  });

  nc.subscribe('store.list.kind.followers', (error, message) => {
    const reply = message.reply;
    const { userId } = message.data;
    const followers = followersByUserId[userId] ? Array.from(followersByUserId[userId]) : [];

    if (reply) {
      nc.publish(reply, followers);
    }
  }).catch(error => {
    console.log(error);
  });

  nc.subscribe('store.destroy', (error, message) => {
    followersByUserId = {};
    // usersByFollower = {};
  });
}

start();
