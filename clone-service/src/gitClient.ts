import simpleGit from "simple-git";
import { redisClient } from "./redisClient";


export async function clone() {
    while(true) {
        if((await redisClient.LRANGE("cloneIds", 0, -1)).length > 0) {
            console.log("Cloning...")
            const payload = await redisClient.RPOP("cloneIds");
        
            const jsonData = payload ? JSON.parse(payload) : {id: "XYZ" , url: ""};
        
            const id = jsonData.id;
            const repoURL = jsonData.url;
        
            console.log("id :", id, "repoURL: ", repoURL);
        
            const git = simpleGit();
        
            if(!id) {
                throw new Error("Invalid ID");
            }
        
            try {
                await git.clone(repoURL, `../out/${id}`);
                await redisClient.LPUSH("uploadIds", id);
            } catch {
                throw new Error("Error cloning the repository!");
            }
        }
    }
}