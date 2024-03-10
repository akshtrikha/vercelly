const express = require("express");
const { generateSlug } = require("random-word-slugs");
const { ECSClient, RunTaskCommand } = require("@aws-sdk/client-ecs");

const app = express();

const PORT = 9000;

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

app.listen(PORT, () => {
    console.log(`API server running on ${PORT}`);
})