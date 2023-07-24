FROM node:lts-alpine3.18 AS build-step

ARG catalogURL

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build -- --catalogUrl=$catalogURL

FROM nginx:1-alpine
COPY --from=build-step /app/dist /usr/share/nginx/html

# change default port to 8080
RUN sed -i 's/\s*listen\s*80;/    listen 8080;/' /etc/nginx/conf.d/default.conf

EXPOSE 8080

STOPSIGNAL SIGTERM

CMD ["nginx", "-g", "daemon off;"]