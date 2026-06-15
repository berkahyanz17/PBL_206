FROM node:20-alpine

WORKDIR /app

# Install dependencies as root, then drop privileges
COPY package*.json ./

# -- RUN npm ci --omit=dev && \
RUN npm install && \
    npm cache clean --force

COPY . .

# Create uploads dir and set ownership before switching user
RUN mkdir -p /app/uploads && \
    chown -R node:node /app

USER node

EXPOSE 3001

CMD ["node", "index.js"]
