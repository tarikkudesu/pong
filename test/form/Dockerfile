FROM nginx:1.25.0-alpine

COPY ./nginx.conf /etc/nginx/nginx.conf

COPY ./src /var/www/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]