FROM node:16 as build-step
WORKDIR /usr/src/app
COPY package.json .
# COPY package-lock.json .
COPY .npmignore .
RUN npm install
COPY . .
EXPOSE 8080
CMD ["npm","start","--"]