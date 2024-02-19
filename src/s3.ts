import {
  ListBucketsCommand,
  S3Client,
  PutObjectCommand,
} from '@aws-sdk/client-s3';

import fs from 'fs';
import path from 'path';

// @ts-ignore
export const client = new S3Client({
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

export async function upload(s3Client: S3Client, id: string, files: string[], bucket: any) {
  let filesToUpload = files.filter(file => {
    return file.includes('.git') === false;
  }); //! Removing .git files for testing. Revert this change.

  let putResponse: Object[] = [];

  try {
    filesToUpload.forEach(async file => {
      const stat = fs.statSync(path.resolve(`out/${id}`, file));
      let input;
      if (stat.isFile()) {
        input = {
          Key: file.split(path.sep).join(path.posix.sep),
          Body: fs.readFileSync(path.resolve(`out/${id}`, file)),
          Bucket: bucket,
        };
      } else {
        input = {
          Key: file.split(path.sep).join(path.posix.sep) + '/',
          Bucket: bucket,
        };
      }

      const res = s3Client.send(await new PutObjectCommand(input));
      putResponse.push(res);

    });

    return putResponse;

  } catch (err) {
    throw err;
  }
}
