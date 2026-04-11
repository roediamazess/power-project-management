FROM composer:2 AS composer_deps
WORKDIR /app
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-interaction --no-progress --prefer-dist --optimize-autoloader --no-scripts

FROM node:20-alpine AS node_build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY resources ./resources
COPY public ./public
COPY vite.config.js postcss.config.js tailwind.config.js ./
RUN npm run build

FROM php:8.4-fpm-alpine AS app
WORKDIR /var/www/html
RUN apk add --no-cache --upgrade musl \
  && apk add --no-cache icu-libs libzip postgresql-libs postgresql-client unzip bash rclone \
  && apk add --no-cache --virtual .build-deps icu-dev libzip-dev oniguruma-dev postgresql-dev \
  && docker-php-ext-configure intl \
  && docker-php-ext-install -j$(nproc) intl opcache pdo_mysql pdo_pgsql zip \
  && apk del .build-deps
COPY . .
RUN rm -f bootstrap/cache/*.php || true
COPY --from=composer_deps /app/vendor ./vendor
COPY --from=node_build /app/public/build ./public/build_image
RUN php artisan package:discover --ansi \
  && mkdir -p storage bootstrap/cache \
  && chown -R www-data:www-data storage bootstrap/cache
COPY docker/php/php.ini /usr/local/etc/php/conf.d/99-app.ini
COPY docker/php/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
EXPOSE 9000
ENTRYPOINT ["/entrypoint.sh"]
CMD ["php-fpm"]
