import { redisClient } from "./redisClient";
import { s3Client, upload } from "./s3";

(async () => {
    while(true) {
        if((await redisClient.LRANGE("uploadIds", 0, -1)).length > 0) {
            console.log("Uploading...")
            await upload(s3Client);
        }
    }
})();