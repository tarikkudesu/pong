FROM debian:stable-slim

RUN apt update -y && \
    apt install -y redis-server \
    && rm -rf /var/lib/apt/lists/*

COPY ./tools/setup.sh /setup.sh

RUN chmod +x /setup.sh

ENTRYPOINT [ "/setup.sh" ]
