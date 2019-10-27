import express from 'express';
import { connect, Payload } from 'ts-nats';
import bodyParser from 'body-parser';

const app = express();
const port = 8080
const jsonParser = bodyParser.json()

app.use(jsonParser);

function getAuthenticatedUserId(authorization: String | undefined) {
  if (!authorization) return null;
  const match = authorization.match(/^Bearer (.+)/);
  if (!match) return null;
  return Number(match[1]);
}

async function bootstrap() {
  let nc = await connect({
    servers: ['nats://localhost:4222'],
    payload: Payload.JSON
  });

  app.get('/health', (_request, response) => {
    response.json({ health: 'ok' });
  });

  app.post('/entries', async (request, response) => {
    const { text } = request.body;
    const authenticatedUserId = getAuthenticatedUserId(request.headers.authorization);

    if (!authenticatedUserId) return response.status(401).json({ error: 'Unauthorized' });

    nc.request('post.entry', 1000, {
      entry: {
        text
      },
      creator: {
        id: authenticatedUserId
      }
    })
      .then(message => {
        const { id, text } = message.data;
        response.send({ id, text });
      })
      .catch(error => {
        console.log(`Never got a resonse, reason: ${error}`);
        response.status(500).json({ error: 'no response' });
      });

  });

  app.get('/entries', (_request, response) => {
    nc.request('store.list.kind.entry', 1000)
    .then(message => {
        const entries = message.data;
        response.json(entries);
      })
      .catch(error => {
        console.log(`Never got a resonse, reason: ${error}`);
        response.status(500).json({ error: 'no response' });
      });
  });

  app.get('/users', (_request, response) => {
    nc.request('store.list.kind.user', 1000)
      .then(message => {
        const users = message.data;
        response.json(users);
      })
      .catch(error => {
        console.log(`Never got a resonse, reason: ${error}`);
        response.status(500).json({ error: 'no response' });
      });
  });

  app.post('/users', async (request, response) => {
    const { username } = request.body;
;
    nc.request('store.save.kind.user', 1000, {
      username
    })
      .then(message => {
        const { id, username } = message.data;
        response.send({ id, username });
      })
      .catch(error => {
        console.log(`Never got a resonse, reason: ${error}`);
        response.status(500).json({ error: 'no response' });
      });

  });

  app.post('/follows', (request, response) => {
    const { toBeFollowedId } = request.body;
    const authenticatedUserId = getAuthenticatedUserId(request.headers.authorization);

    if (!authenticatedUserId) return response.status(401).json({ error: 'Unauthorized' });

    nc.request('follow.user', 1000, {
      requestor: {
        id: authenticatedUserId
      },
      toBeFollowed: {
        id: toBeFollowedId
      }
    })
      .then(() => {
        response.status(201).send();
      })
      .catch(error => {
        console.log(error);
        response.status(500).json({ error: 'Oops' });
      });
  });

  app.get('/users/:id/followers', (request, response) => {
    nc.request('store.list.kind.followers', 1000, { userId: request.params.id })
      .then(message => {
        const followers = message.data;
        response.json(followers);
      })
      .catch(error => {
        console.log(`Never got a resonse, reason: ${error}`);
        response.status(500).json({ error: 'no response' });
      });
  });

  app.get('/users/:id/timeline', (request, response) => {
    nc.request('timeline.list', 1000, { userId: request.params.id })
      .then(message => {
        const entries = message.data;
        response.json(entries);
      })
      .catch(error => {
        console.log(`Never got a resonse, reason: ${error}`);
        response.status(500).json({ error: 'no response' });
      });
  });

  app.post('/reset', (_request, response) => {
    nc.publish('store.destroy');
    response.send(201);
  });

  app.listen(port, () => console.log(`REST edge listening on port ${port}!`))
}

bootstrap();
