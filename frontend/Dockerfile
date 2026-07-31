FROM node:20-alpine

WORKDIR /app

# Copiar ficheiros de dependências primeiro para aproveitar o cache do Docker
COPY package.json package-lock.json* ./

# Instalar as dependências
RUN npm ci

# Copiar o restante código
COPY . .

# Construir a aplicação para produção
RUN npm run build

ENV PORT 9264
EXPOSE 9264

# Iniciar em modo de produção
CMD ["npm", "run", "start"]
