FROM node:22.15-slim

RUN apt-get update -y && apt-get upgrade -y && apt-get install -y curl git vim zsh sqlite3
RUN sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"

WORKDIR /app

CMD ["npm", "run", "dev"]