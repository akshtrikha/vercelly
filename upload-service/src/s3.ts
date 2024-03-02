import {
  ListBucketsCommand,
  S3Client,
  PutObjectCommand,
  PutObjectCommandInput
} from '@aws-sdk/client-s3';

import { filePaths }  from './utils';
import { redisClient } from "./redisClient";

import fs from 'fs';
import path from 'path';

// @ts-ignore
export const s3Client = new S3Client({
  region: 'apac',
  endpoint: process.env.CF_S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.CF_ACCESS_KEY_ID,
    secretAccessKey: process.env.CF_SECRET_ACCESS_KEY,
  },
});

export async function getBucket(s3Client: S3Client) {
  try {
    return (await s3Client.send(new ListBucketsCommand('')))?.Buckets?.[0].Name;
  } catch (err) {
    throw err;
  }
}

export async function upload(s3Client: S3Client) {
  try {
    const ids = await redisClient.KEYS("*");

    console.log("ids: ", ids);

    const id = await redisClient.RPOP("uploadIds");

    console.log("id: ", id);

    const bucket = await getBucket(s3Client);
  
    const files: string[] | undefined | null = filePaths(path.resolve(process.cwd(), `../out/${id}`));

    // console.log(files);
  
    let filesToUpload = files.filter(file => {
      return file.includes('.git') === false;
    }); //! Removing .git files for testing. Revert this change.

    let input: PutObjectCommandInput = {
      Key: `${id}/`,
      Bucket: bucket
    }

    s3Client.send(await new PutObjectCommand(input));

    filesToUpload.forEach(async file => {
      const absolutePath = path.resolve(`../out/${id}`, file);
      const relativePath = (`${id}/` + file).split(path.sep).join(path.posix.sep);

      const stat = fs.statSync(absolutePath);
      if (stat.isFile()) {
        input = {
          Key: relativePath,
          Body: fs.readFileSync(absolutePath),
          Bucket: bucket,
        };
      } else {
        input = {
          Key: relativePath + '/',
          Bucket: bucket,
        };
      }

      s3Client.send(await new PutObjectCommand(input));

    });

  } catch (err) {
    throw err;
  }
}
