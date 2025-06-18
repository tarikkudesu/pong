all: up

up:
	@docker compose $@ --build

down:
	@docker compose $@

restart:
	@docker compose $@

stop:
	@docker compose $@

stats:
	@docker $@

fclean:
	docker system prune -a -f

re: fclean all

.PHONY: up down stop stats restart fclean