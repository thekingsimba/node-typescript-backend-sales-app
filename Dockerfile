FROM node:20.14-alpine

WORKDIR /app

COPY package.json ./
# RUN npm cache clean --force
# RUN npm install grpc

RUN npm install -g npm@latest

RUN npm install

COPY . .

RUN npm install -g pm2

RUN npm install typescript-transform-paths

RUN npm install typescript -g

RUN npm install typescript-transform-paths

RUN apk update && apk add bash

RUN chmod +x startup.sh

EXPOSE 8000

CMD [ "/bin/bash", "./startup.sh" ]
