import { createClient } from 'redis';

export const redisClient = createClient();

redisClient.on('error', (err: Error) => {
  console.log('Redis Client Error.');
  throw err;
});

(async () => {await redisClient.connect();})();