FROM nginx:alpine

RUN rm /etc/nginx/conf.d/default.conf

RUN if [ -f /etc/nginx/ssl/ssl.crt ] && [ -f /etc/nginx/ssl/ssl.key ]; then \
    cp ssl.conf /etc/nginx/conf.d/ssl.conf; \
    else \
    export DOMAIN_NAME="_"; \
    fi