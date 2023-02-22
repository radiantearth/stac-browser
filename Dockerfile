FROM node:lts-alpine

ARG catalogURL

RUN npm install -g serve

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# 2. si build time plus long
RUN npm run build -- --catalogUrl=$catalogURL

EXPOSE 8080

# 1. Essayer build par entrypoint, ARG

CMD [ "serve", "-s", "dist", "-l", "8080" ]