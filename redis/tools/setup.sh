#!/bin/sh


echo "maxmemory 128mb\n" >> /etc/redis/redis.conf
echo "maxmemory-policy allkeys-lfu\n" >> /etc/redis/redis.conf

sed -i 's/bind 127.0.0.1/bind 0.0.0.0/g' /etc/redis/redis.conf

redis-server --protected-mode no
