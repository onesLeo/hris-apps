import { bootstrapWorker } from './main';

void bootstrapWorker().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
