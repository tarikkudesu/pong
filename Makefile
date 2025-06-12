NETWORKS		=	$$(docker network ls -q)
IMAGES			=	$$(docker image ls -q)
VOLUMES			=	$$(docker volume ls -q)
CONTAINERS		=	$$(docker ps -aq)
CONTAINER_NAME	=	pong
CONTAINER_TAG	=	oo
PWD				=	C:\Users\otman\Desktop\study\pong

all: build run exec

build :
	docker $@ -t $(CONTAINER_NAME):$(CONTAINER_TAG) .

run :
	@docker run --init -it --name pong --rm -v $(PWD)/app:/app -p 3000:3000 -d $(CONTAINER_NAME):$(CONTAINER_TAG)

exec :
	@docker $@ -it $(CONTAINER_NAME) zsh

stop :
	@docker $@ $(CONTAINER_NAME)

top:
	@docker $@ $(CONTAINER_NAME)

stats:
	@docker $@ $(CONTAINER_NAME)

rmc: stop
	@docker rm $(CONTAINER_NAME)

rmi:
	@docker image rm $(IMAGES)

rmnetworks:
	@docker network rm $(NETWORKS)  

rmv:
	@docker volume rm $(VOLUMES) 

prune:
	docker system prune -a -f

clean: rmcontainers rmnetworks

fclean: clean rmimages

re: fclean all

.PHONY: build run exec top stop rmcontainers rmimages rmnetworks rmvolumes prune
