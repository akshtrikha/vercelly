const express = require("express");
const { generateSlug } = require("random-word-slugs");
const { ECSClient, RunTaskCommand } = require("@aws-sdk/client-ecs");
const { Server } = require("socket.io");
const Redis = require("ioredis");

const subscriber = new Redis(process.env.REDIS_URL);

const app = express();
const io = new Server({ cors: '*' })

const PORT = 9000;
const SOCKET_PORT = 9001;

/**
 * io.on('connection', socket => {...}): 
 * This line sets up an event listener for when a client connects to the server.
 * When a client connects, the provided callback function is executed with a socket object,
 * representing the connection to that client.
 */
io.on('connection', socket => {
    console.log("socket.io/connection");
    /**
     * socket.on('subscribe', channel => {...}):
     * This sets up an event listener for a custom event named 'subscribe' from the client.
     * When the client emits a 'subscribe' event, the provided callback function is executed
     * with the channel parameter representing the channel that the client wants to subscribe to.
     */
    socket.on('subscribe', channel => {
        console.log("socket.io/socket/subscribe");
        /**
         * socket.join(channel): This method instructs the server to make the current socket join 
         * a specific room or channel identified by the channel parameter.
         */
        socket.join(channel);
        /**
         * socket.emit('message', Joined ${channel}): This sends a message to the client who just joined the specified channel
         * indicating that it has successfully joined the channel.
         */
        socket.emit('message', `Joined ${channel}`);
    })
})

/**
 * io.listen(SOCKET_PORT, () => {...}): This line starts the socket server, 
 * causing it to listen for incoming connections on the port specified by SOCKET_PORT.
 */
io.listen(SOCKET_PORT, () => {
    console.log(`Socket Server running on ${SOCKET_PORT}`);
})

const ecsClient = new ECSClient({
    region: process.env.AWS_CLUSTER_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_CLUSTER_MANAGER,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY_CLUSTER_MANAGER,
    }
})

const config = {
    CLUSTER: process.env.AWS_CLUSTER_ARN,
    TASK: process.env.AWS_TASK_ARN,
}

app.use(express.json());

app.get('/test', (req, res) => {
    console.log("GET/test");
    res.json({message: "Hello"});
})

app.post('/project', async (req, res) => {
    const gitUrl = req.body.url;

    console.log("gitUrl: ", gitUrl);

    const projectSlug = generateSlug(2);

    const command = new RunTaskCommand({
        cluster: config.CLUSTER,
        taskDefinition: config.TASK,
        launchType: 'FARGATE',
        count: 1,
        networkConfiguration: {
            awsvpcConfiguration: {
                assignPublicIp: 'ENABLED',
                subnets: ['subnet-0b33d15dc518f0565', 'subnet-022f7d69f99ddc58d', 'subnet-0ec60456ee00ec19a'],
                securityGroups: ['sg-07de1f871a6fc1260']
            }
        },
        overrides: {
            containerOverrides: [
                {
                    name: 'builder-image',
                    environment: [
                        {name: 'GIT_REPOSITORY_URL', value: gitUrl},
                        {name: 'AWS_ACCESS_KEY_DOCKER_USER', value: process.env.AWS_ACCESS_KEY_DOCKER_USER},
                        {name: 'AWS_SECRET_ACCESS_KEY_DOCKER_USER', value: process.env.AWS_SECRET_ACCESS_KEY_DOCKER_USER},
                        {name: 'AWS_BUCKET_NAME', value: process.env.AWS_BUCKET_NAME},
                        {name: 'AWS_BUCKET_REGION', value: process.env.AWS_BUCKET_REGION},
                        {name: 'ID', value: projectSlug},
                        {name: 'REDIS_URL', value: process.env.REDIS_URL}
                    ]
                }
            ]
        }
    })

    await ecsClient.send(command);

    return res.json({status: 'queued', data: { projectSlug, url: `http://${projectSlug}.localhost:8000`}})
})

async function initRedisSubscribe() {
    console.log("Subscribed to logs...");
    /**
     * subscriber.psubscribe('logs:*');: This line subscribes to a Redis channel using pattern-based subscription. 
     * The pattern 'logs:*' indicates that the server subscribes to all channels that match the pattern logs:*,
     * This means the server will subscribe to channels like 'logs:info', 'logs:error', etc.
     */
    subscriber.psubscribe('logs:*');

    /**
     * subscriber.on('pmessage', (pattern, channel, message) => {...}): 
     * This sets up an event listener for when a message is published to a channel that matches the subscribed pattern. 
     * When a message is received, the provided callback function is executed with the pattern, channel, and message parameters 
     * representing the pattern that matched, the specific channel the message was published to, and the content of the message, respectively.
     */
    subscriber.on('pmessage', (pattern, channel, message) => {

        /**
         * io.to(channel).emit('message', message);: This line emits a 'message' event to all clients who have joined the channel specified by channel. 
         * It sends the message received from Redis to all clients in that channel. io.to(channel) selects the clients that are in the specific channel.
         */
        io.to(channel).emit('message', message);
    })
}

initRedisSubscribe();

app.listen(PORT, () => {
    console.log(`API server running on ${PORT}`);
})