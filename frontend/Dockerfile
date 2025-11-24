FROM node:20-alpine AS base

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .
RUN chmod +x docker-entrypoint.sh

FROM base AS dev

ENV NODE_ENV=development
ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["npm", "start"]

FROM base AS builder

ARG REACT_APP_API_BASE_URL=""
ENV REACT_APP_API_BASE_URL=${REACT_APP_API_BASE_URL}
ENV NODE_ENV=production
RUN npm run build

FROM nginx:1.27-alpine AS runtime

COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

