const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const mime = require("mime-types");
const Redis = require("ioredis");

const publisher = new Redis(process.env.REDIS_URL);

function publishLog(log) {
    // log can be either a string or a buffer
    // publish takes two arguments: channel and the message to push in the channel
    publisher.publish(`logs:${process.env.ID}`, JSON.stringify({ log }));
}

const s3Client = new S3Client({
    region: process.env.AWS_BUCKET_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_DOCKER_USER,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY_DOCKER_USER
    }
})

function filePaths(srcPath) {
    console.log("filePaths_src: ", srcPath);
    let filePaths = []
    try {
        filePaths = fs.readdirSync(srcPath, {encoding: 'utf-8', recursive: true});
    } catch(err) {
        console.error("filePaths() error: ", err)
    }
    return filePaths;
}

async function init() {
    console.log('Executing script.js');
    publishLog("Building...");
    const srcDirPath = path.join(__dirname, "src")

    const p = exec(`cd ${srcDirPath} && npm install && npm run build`);

    p.stdout.on("data", function(data) {
        console.log(data.toString());
    })
    
    p.stderr.on("error", function(data) {
        console.error(`Error: ${data.toString()}`);
        publishLog(`error: ${data.toString()}`);
    })

    p.on("close", async function() {
        console.log("Build Completed!");
        publishLog("Build Completed!");

        const id = process.env.ID

        const distDirPath = path.join(path.dirname(__filename), "src", "dist");

        const distDirFiles = filePaths(distDirPath);

        const files = distDirFiles.filter((file) => {
            return !fs.lstatSync(path.join(path.dirname(__filename), "src", "dist", file)).isDirectory()
        })

        const awsFilePaths = files.map((file => {
            return path.join(`__outputs/${id}`, file);
        }))

        const absolutePaths = files.map((file) => {
            return path.join(path.dirname(__filename), "src", "dist", file);
        })

        console.log(awsFilePaths);
        console.log(absolutePaths);

        publishLog('Starting to upload the files...');

        for(const file in files) {
            console.log(`Uploading ${id}/${files[file]}`);
            publishLog(`Uploading ${id}/${files[file]}`);

            const input = {
                Key: awsFilePaths[file],
                Body: fs.readFileSync(absolutePaths[file]),
                Bucket: process.env.AWS_BUCKET_NAME,
                ContentType: mime.lookup(absolutePaths[file])
            }

            await s3Client.send(new PutObjectCommand(input));
            publishLog(`Uploaded ${id}/${files[file]}`);
        }

        console.log(`Uploading completed: ${id}`);
        publishLog(`Uploading completed: ${id}`);
    })
}

init();