FROM python:3.11-slim

WORKDIR /app

# Instalar utilitários de sistema (ping)
RUN apt-get update && apt-get install -y iputils-ping && rm -rf /var/lib/apt/lists/*

# Instalar dependências
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código-fonte
COPY . .

EXPOSE 8000

# Usamos --reload para facilitar o desenvolvimento.
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
