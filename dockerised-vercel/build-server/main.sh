#!/bin/bash

export GIT_REPO_URL="$GIT_REPOSITORY_URL"

git clone "$GIT_REPOSITORY_URL" /home/app/src

node script.js