import express from "express";

const PORT = 3000;

const app = express();
app.use(express.json());

app.get("/test", (req, res) => {
    console.log("/test");
    res.send({message: "this is the message"});
})

app.listen(PORT, () => {
    console.log(`Listening on the port ${PORT}`);
});