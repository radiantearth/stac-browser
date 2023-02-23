FROM node:lts-alpine

ENV CATALOG_URL null
ENV ROOT_PATH /

RUN npm install -g serve

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 8080

ENTRYPOINT [ "/bin/sh", "-c", "cd /app && npm run build -- --catalogUrl=${CATALOG_URL} --pathPrefix=${ROOT_PATH} && serve -s dist -l 8080" ]
