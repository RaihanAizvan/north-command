import http from 'http';
import { createApp } from './app.js';
import { connectDb } from './config/db.js';
import { env } from './config/env.js';
import { ensureDemoDefaults } from './bootstrap.js';
import { createIo } from './realtime/socket.js';
import { createRealtimeBroadcaster } from './realtime/broadcaster.js';

// wire realtime broadcaster into controllers via global export (simple and explicit)
export let realtime: ReturnType<typeof createRealtimeBroadcaster> | null = null;

async function main() {
  await connectDb();
  await ensureDemoDefaults();

  const app = createApp();
  const server = http.createServer(app);

  const io = createIo(server);
  realtime = createRealtimeBroadcaster(io);

  server.listen(env.PORT, () => {
    console.log(`[north-command] server listening on :${env.PORT}`);
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
