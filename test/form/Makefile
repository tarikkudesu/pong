NAME = nginx:oo
CONTAINER = form
PORT = 8008

all: build
	@docker run -it --name $(CONTAINER) -p $(PORT):80 --rm $(NAME)

build:
	@docker build -t $(NAME) .

stop:
	@docker stop $(CONTAINER)

fclean:
	@docker system prune -a --volumes -f

re: fclean all

.PHONY: build stop fclean
