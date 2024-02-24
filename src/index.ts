import express from "express";
import cors from "cors";
import simpleGit from "simple-git";
import path from "path";

import { client, getBucket, upload } from "./s3";
import { filePaths, generate } from "./utils.js";

const PORT = 3000;

const app = express();
app.use(cors());
app.use(express.json());

app.get("/test", (req, res) => {
    console.log("/test");
    res.send({ message: "this is the message" });
});

app.post("/upload", async (req, res) => {
    console.log("/upload");
    const repoURL = req.body.repoURL;
    console.log("repoURL: ", repoURL);

    const id = generate();
    const git = simpleGit();
    await git.clone(repoURL, `out/${id}`);

    const files: string[] | undefined | null = filePaths(path.join(process.cwd(), `out/${id}`));

    try {
        const bucket = await getBucket(client);

        await upload(client, id, files, bucket);

        return res.status(200).send({ id: id, message: "Upload Successful" });

    } catch (err) {
        console.error("Fetching Bucket list error: ", err);
        return res.status(403).send({ message: "Error fetching bucket list." });
    }

})

app.listen(PORT, () => {
    console.log(`Listening on the port ${PORT}`);
});