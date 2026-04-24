FROM nginx:alpine

RUN if [ -f /etc/nginx/ssl/ssl.crt ] && [ -f /etc/nginx/ssl/ssl.key ]; then \
    cp ssl.conf /etc/nginx/ssl.conf; \
    else \
    export DOMAIN_NAME="_"; \
    fi