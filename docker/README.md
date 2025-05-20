1. From this directory, run `./build.sh` to build the api image.
2. Supply environment variables in a `.env` file in this directory, modeled after the example (in the parent directory). The compose will pull from here at runtime, the environment variables are not built into the image.
3. Back in the docker directory, run `./start.sh` to start the server.

To stop, run `./stop.sh`.

When rebuilding new images, it is recommended to delete the old ones when they are no longer needed. You can do so with the following command: `docker rmi <image id>`. The image ids can be found from the `docker images` command. Or simply use `docker image prune` to remove unused/dangling images.

# Parallel indexing for scheduled processes

If an environment is "indexable", the `docker-compose.indexable.yml` settings should apply atop the standard compose settings. The indexing environment will run via the `indexing-` scripts/configuration. A shared network is necessary for the indexing environment to access the other's postgres instance.

Once the side indexing is completed, the cutover can be performed using the `indexing-cutover-queries.sql`. Any subset of these transactions can be executed as desired. The indexing environment will continue indexing as long as it is running.