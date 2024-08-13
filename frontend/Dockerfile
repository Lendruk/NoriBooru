FROM node:20 as build
WORKDIR /app
COPY ./package*.json ./
COPY ./src ./src
COPY ./vite.config.ts ./
COPY ./tsconfig.json ./
COPY ./tailwind.config.js ./
COPY ./svelte.config.js ./
COPY ./postcss.config.js ./
RUN npm install --force
RUN npm run build
CMD ["node", "./build/index.js"]