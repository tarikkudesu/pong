NETWORKS		=	$$(docker network ls -q)
IMAGES			=	$$(docker image ls -q)
VOLUMES			=	$$(docker volume ls -q)
CONTAINERS		=	$$(docker ps -aq)
CONTAINER_NAME	=	pong
CONTAINER_TAG	=	oo

all: build run

build :
	docker $@ -t $(CONTAINER_NAME):$(CONTAINER_TAG) .

run :
	@docker $@ --init -it --name pong --rm -v ./:/app -p 3000:3000 $(CONTAINER_NAME):$(CONTAINER_TAG)

exec :
	@docker $@ -it $(CONTAINER_NAME) zsh

stop :
	@docker $@ $(CONTAINERS) > /dev/null 2>&1 || true

top:
	@docker $@ $(CONTAINER_NAME)

stats:
	@docker $@ $(CONTAINER_NAME)

rmcontainers: stop
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

.PHONY: build run exec top stop rmcontainers rmimages rmnetworks rmvolumes prune
