#!/bin/bash

cat << EOF > /etc/nginx/nginx.conf
worker_processes 1;

events {
    worker_connections 1024;
}

http {
    server {
        listen 80;

        location /redis {
            proxy_pass http://localhost:6379;
        }

        location /app/ {
            proxy_pass http://localhost:3000$request_uri;
            # proxy_set_header Host \$host;
            # proxy_set_header X-Real-IP \$remote_addr;
        }
    }
}
EOF

nginx -g "daemon off;"
