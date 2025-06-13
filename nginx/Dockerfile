FROM debian:stable-slim

RUN apt update -y && \
    apt install -y nginx

COPY tools/setup.sh /setup.sh

RUN chmod +x /setup.sh

ENTRYPOINT [ "/setup.sh" ]
