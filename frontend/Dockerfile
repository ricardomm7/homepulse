FROM node:20-alpine

WORKDIR /app

# Copiar ficheiros de dependências primeiro para aproveitar o cache do Docker
COPY package.json package-lock.json* ./

# Instalar as dependências
RUN npm ci

# Copiar o restante código
COPY . .

ENV PORT 9264
EXPOSE 9264

# Iniciar em modo de desenvolvimento (com hot-reload)
CMD ["npm", "run", "dev"]
