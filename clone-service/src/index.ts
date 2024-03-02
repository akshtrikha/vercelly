import { clone } from "./gitClient"

console.log("Starting the clone service...");

(async () => {
    await clone();
})();