import fs from "fs";

import { PathLike } from "fs";

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

export function filePaths(srcPath: PathLike): string[] {
    console.log("filePaths_src: ", srcPath);
    let filePaths: string[] = []
    try {
        filePaths = fs.readdirSync(srcPath, {encoding: 'utf-8', recursive: true});
    } catch(err) {
        console.error("filePaths() error: ", err)
    }
    return filePaths;
}