FROM node:slim
RUN mkdir -p /noribooru/backend
WORKDIR /noribooru/backend
COPY ./package*.json ./
COPY ./src ./src
COPY ./migrations ./migrations
COPY ./tsconfig.json ./
RUN npm install
RUN npm run build