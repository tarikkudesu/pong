NETWORKS		=	$$(docker network ls -q)
IMAGES			=	$$(docker image ls -q)
VOLUMES			=	$$(docker volume ls -q)
CONTAINERS		=	$$(docker ps -aq)

all: build up exec

build :
	docker $@ -t pong:oo .

run:
	@docker $@ -it -d --name pong --rm -v ./:/app -p 3000:3000 pong:oo

exec:
	@docker $@ -it pong zsh

rmcontainers:
	@docker stop $(CONTAINERS) > /dev/null 2>&1 || true
	@docker rm $(CONTAINERS) > /dev/null 2>&1 || true

rmimages:
	@docker image rm $(IMAGES) > /dev/null 2>&1 || true

rmnetworks:
	@docker network rm $(NETWORKS)  > /dev/null 2>&1 || true 

rmvolumes:
	@docker volume rm $(VOLUMES)  > /dev/null 2>&1 || true

prune:
	docker system prune -a -f

clean: rmcontainers rmnetworks

fclean: clean rmimages

re: fclean all

.PHONY: build run exec rmcontainers rmimages rmnetworks rmvolumes prune
