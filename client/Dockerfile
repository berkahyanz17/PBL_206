FROM node:20-alpine AS builder
WORKDIR /app
RUN apk upgrade --no-cache
COPY package*.json ./
RUN npm install
COPY . .
ARG VITE_HCAPTCHA_SITEKEY
ENV VITE_HCAPTCHA_SITEKEY=$VITE_HCAPTCHA_SITEKEY
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
RUN apk upgrade --no-cache
