FROM node:20 AS build
WORKDIR /app
COPY ./package*.json ./
COPY ./src ./src
COPY ./vite.config.ts ./
COPY ./tsconfig.json ./
COPY ./tailwind.config.js ./
COPY ./svelte.config.js ./
COPY ./postcss.config.js ./
COPY ./static ./static
RUN npm ci --verbose
RUN npm run build

FROM nginx:stable-alpine
COPY --from=build /app/build /var/www/html
COPY ./nginx.conf /etc/nginx/nginx.conf
COPY ./mime.types /etc/nginx/mime.types
EXPOSE 80
CMD [ "nginx", "-g", "daemon off;" ]