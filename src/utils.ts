import fs from "fs";
import path from "path";

function getRandomInt(max: number) {
    return Math.floor(Math.random() * max)
}

export function generate() {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let randomId = "";
    for (let i = 1; i <= 6; i++) {
        const ind = getRandomInt(chars.length - 1);
        randomId = randomId + chars[ind];
    }

    return randomId;
}

export function filePaths(srcPath: string): string[] {
    console.log("filePaths_src: ", srcPath);
    let filePaths: string[] = []
    try {
        filePaths = fs.readdirSync(srcPath.split(path.sep).join(path.posix.sep));
        console.log(filePaths);
    } catch(err) {
        console.error("filePaths() error: ", err)
    }
    return filePaths;
}