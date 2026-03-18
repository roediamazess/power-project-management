FROM node:20-alpine AS node_build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY resources ./resources
COPY public ./public
COPY vite.config.js postcss.config.js tailwind.config.js ./
RUN npm run build

FROM nginx:1.27-alpine
WORKDIR /var/www/html
COPY --from=node_build /app/public ./public
COPY --from=node_build /app/public/build ./public/build
COPY docker/nginx/default.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
