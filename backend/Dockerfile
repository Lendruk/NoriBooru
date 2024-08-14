FROM node:20.11.0
RUN mkdir -p /noribooru/backend
WORKDIR /noribooru/backend
COPY ./package*.json ./
COPY ./config.esbuild.mjs ./
COPY ./src ./src
COPY ./migrations ./migrations
COPY ./tsconfig.json ./
RUN npm install
RUN npm run build