const fetch = require('node-fetch');
const NATS = require('nats');

const nc = NATS.connect({ json: true });

function sleep(n) {
  return new Promise((resolve) => {
    setTimeout(resolve, n);
  });
}

afterAll(() => {
  nc.close();
});

describe('followers', () => {
  beforeAll(done => {
    nc.publish('store.destroy', () => {
      done();
    });
  });

  it('lists entries in follower\'s timeline', async done => {
    // Create follow user 2 => user 1
    await fetch('http://localhost:8080/follows', {
      method: 'POST',
      body: JSON.stringify({
        toBeFollowedId: 1
      }),
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer 2'
      }
    });

    // User 1 creates post
    await fetch('http://localhost:8080/entries', {
      method: 'POST',
      body: JSON.stringify({
        text: 'Entry from user 1'
      }),
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer 1'
      }
    });

    // User 3 creates 2
    await fetch('http://localhost:8080/entries', {
      method: 'POST',
      body: JSON.stringify({
        text: 'Entry from user 3'
      }),
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer 3'
      }
    });

    // User 2 gets timeline with post from user 1
    const timelineResponse = await fetch('http://localhost:8080/users/2/timeline');
    const timelineBody = await timelineResponse.json();

    expect(timelineBody.length).toEqual(1);
    expect(timelineBody[0].text).toEqual('Entry from user 1');
    done();
  });
});

describe('users', () => {
  beforeAll(done => {
    nc.publish('store.destroy', () => {
      done();
    });
  });

  it('creates and lists users', async done => {
    await fetch('http://localhost:8080/users', {
      method: 'POST',
      body: JSON.stringify({
        username: 'user1'
      }),
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const listReply = await fetch('http://localhost:8080/users');
    const listBody = await listReply.json();

    expect(listBody.length).toEqual(1);
    expect(listBody[0].username).toEqual('user1');
    done();
  });
});
