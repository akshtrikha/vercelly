const express = require("express");
const httpProxy = require("http-proxy");

const app = express();

const PORT = 8000;
const BASE_PATH='https://vercelly.s3.ap-south-1.amazonaws.com/__outputs'

const proxy = httpProxy.createProxy();

proxy.on('proxyReq', (proxyReq, req, res) => {
    const url = req.url;

    if(url === '/') {
        proxyReq.path += 'index.html';
    }
})

app.use((req, res) => {
    console.log("USE/");
    const hostName = req.hostname;
    const subdomain = hostName.split('.')[0];

    const resolvesTo = `${BASE_PATH}/${subdomain}`
    console.log(resolvesTo);

    console.log(hostName);

    return proxy.web(req, res, {target: resolvesTo, changeOrigin: true})
})


app.listen(PORT, () => {
    console.log(`Running the reverse-proxy on port ${PORT}`);
})