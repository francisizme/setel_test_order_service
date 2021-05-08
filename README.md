# Usage
* This service provides a way to verify user token and return user info afterward.

# Setup Docker environment

* Please follow the steps to install Docker: https://docs.docker.com/get-docker/
* After installing Docker. Open your Terminal and run the following commands:

```shell
docker run --name redis -d -p 6379:6379 redis
docker run -itd --rm --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3-management
```

# Setup service environment

* Open your Terminal and then run the following commands

```shell
git clone https://github.com/tanhp1506/setel_test_auth_service.git
cd setel_test_auth_service
npm install
npm run build
npm run typeorm migration:run
npm run listen
```
