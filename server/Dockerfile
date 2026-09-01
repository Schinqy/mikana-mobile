FROM node:20-slim

WORKDIR /app

COPY package*.json ./
RUN npm ci --production

COPY . .

# Auth sessions persist via volume mount on Railway
RUN mkdir -p .auth_sessions

EXPOSE 3005

CMD ["node", "index.js"]
