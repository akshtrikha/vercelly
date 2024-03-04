import { exec } from "child_process";
import fs from "fs"
import path from "path"
import { filePaths } from "./utils"

async function init() {
    console.log('Executing script.js');
    const srcDirPath = path.join(__dirname, "src")

    const p = exec(`cd ${srcDirPath} && npm install && npm run build`);

    p.stdout.on("data", function(data) {
        console.log(data.toString());
    })
    
    p.stderr.on("data", function(data) {
        console.error(`Error: ${data.toString()}`);
    })

    p.on("close", async function() {
        console.log("Build Completed!");

        const distDirPath = path.join(__dirname, "src", "dist");

        const distDirFiles = filePaths(distDirPath);

        for(const file of distDirFiles) {
            if(fs.lstatSync(file).isDirectory()) continue;
            
        }
    })
}