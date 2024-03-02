#!/bin/bash

echo "Lets see"
for file in out/*
do
    echo "Deleting id = ${file:4:6}"
    rclone purge cloudflare_r2:vercelly/${file:4:6}
    echo "Deleting ${file}"
    rm -rf ${file}
done