import express from "express";
import cors from "cors";
import simpleGit from "simple-git";

import { filePaths, generate } from "./utils.js";
import path from "path";

const PORT = 3000;
let srcPath = __dirname.split(path.sep).join(path.posix.sep)
console.log("srcPath: ", srcPath)

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
    let src: string = path.join(srcPath, `out/${id}`);
    src = src.split(path.sep).join(path.posix.sep);
    console.log("src: ", src);
    
    const files:string[] | undefined | null = filePaths(src);
    files?.forEach((file:string) => {
        console.log(file);
    });

    res.send({ id: id });
})

app.listen(PORT, () => {
    console.log(`Listening on the port ${PORT}`);
});