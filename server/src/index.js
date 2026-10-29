import { pathToFileURL } from 'node:url';
import { createApp } from './app.js';
import { env } from './config.js';

const app = createApp();

const isDirectRun = import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  app.listen(env.port, () => {
    console.log(`Consultancy API listening on http://localhost:${env.port}`);
  });
}

export default app;
