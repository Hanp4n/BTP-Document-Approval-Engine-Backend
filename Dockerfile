# 1. Usamos una imagen ligera de Node
FROM node:20-slim

# 2. Instalamos OpenSSL (necesario para que Prisma funcione en Linux)
RUN apt-get update -y && apt-get install -y openssl

# 3. Directorio de trabajo
WORKDIR /app

# 4. Copiamos los archivos de dependencias
COPY package*.json ./
COPY prisma ./prisma/

# 5. Instalamos dependencias y generamos el cliente de Prisma
RUN npm install
RUN npx prisma generate

# 6. Copiamos el resto del código
COPY . .

# 7. Compilamos TypeScript
RUN npm run build

# 8. Exponemos el puerto 3000
EXPOSE 3000

# 9. Comando para arrancar
CMD ["node", "dist/index.js"]