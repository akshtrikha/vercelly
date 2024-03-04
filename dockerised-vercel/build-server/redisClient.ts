import { createClient } from 'redis';

export const redisClient = createClient();

redisClient.on('error', (err: Error) => {
  console.log('Redis Client Error.');
  throw err;
});

console.log("this is it!");

(async () => {await redisClient.connect();})();