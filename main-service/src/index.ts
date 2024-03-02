import express from "express";
import cors from "cors";
import { generate } from "./utils";
import { redisClient } from "./redisClient";

const PORT = process.env.PORT;
const app = express();


app.use(cors());
app.use(express.json())

app.post("/upload", async (req, res) => {
    console.log("GET upload/")

    const url = req.body.repoURL;

    // if(!validUrl.isHttpsUri(url)) {
    //     return res.status(400).send({message: "Wrong url provided."});
    // }

    console.log("url: ", url);

    const id = generate();

    await redisClient.LPUSH("cloneIds", JSON.stringify({id, url}));

    return res.status(200).send({id: id, message: "Starting to clone..."});
})

app.listen(PORT, () => {
    console.log(`Starting the main server on the port ${PORT}...`);
})