FROM node:16 as build-step
ARG catalog_url
WORKDIR /usr/src/app
COPY package.json .
# COPY package-lock.json .
COPY .npmignore .
RUN npm install
COPY . .
# currently the env variable is not used, but it will be used in the future
ENV VUE_APP_ENABLE_AUTH=1 
RUN echo "Building with catalog_url: ${catalog_url}"
RUN npm run build -- --catalogUrl=${catalog_url}
RUN pwd

# Get the nginx image and just move the build folder to the nginx folder
FROM nginx:1.21.1-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build-step /usr/src/app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]