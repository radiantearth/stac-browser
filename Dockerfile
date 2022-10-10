FROM node:lts-alpine

ARG catalogURL

RUN npm install -g serve

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build -- --catalogUrl=$catalogURL

EXPOSE 8080

CMD [ "serve", "-s", "dist", "-l", "8080" ]