import { connect, Payload } from 'ts-nats';
import { SSL_OP_NETSCAPE_CA_DN_BUG } from 'constants';

async function start() {
  console.log('start');

  let nc = await connect({
    servers: ['nats://localhost:4222'],
    payload: Payload.JSON
  });

  nc.subscribe('*.*', (error, message) => {
    console.log(message);
    console.log("\n");
  });
}

start();
