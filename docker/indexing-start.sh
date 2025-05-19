#!/bin/bash

cd $(dirname "$0")

DOCKER_ENV="indexing"
export DOCKER_ENV

docker compose -f indexing-docker-compose.yml -p web-api-$DOCKER_ENV up -d
