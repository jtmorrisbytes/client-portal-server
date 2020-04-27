FROM node:13.13.0
WORKDIR /web

arg HOST="0.0.0.0"
arg PORT=3000
arg DATABASE_USERNAME=postgres
arg DATABASE_PASSWORD
arg DATABASE_PORT=5432
arg DATABASE_NAME=testdb
arg REDIS_HOST='localhost'
arg REDIS_PORT=5432

COPY chain.pem .
COPY index.js .
COPY privkey.pem .
COPY db.ca-certificate.crt .
COPY fullchain.pem .
COPY controllers ./controllers
COPY routes ./routes
COPY db ./db
COPY .env .

COPY package.json .
COPY package-lock.json .

RUN ["npm","install"]

EXPOSE 3000
ENV [NODE_ENV=production SERVER_HOST=$HOST SERVER_PORT=$PORT DATABASE_USERNAME=$DATABASE_USERNAME \
     DATABASE_PASSWORD=$DATABASE_PASSWORD DATABASE_NAME=$DATABASE_NAME REDIS_HOST=$REDIS_HOST]