############################################
# Base dependencies
############################################
FROM node:20-alpine AS base

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .

############################################
# Development stage (for docker-compose.dev)
############################################
FROM base AS dev

ENV NODE_ENV=development
CMD ["npm", "start"]

############################################
# Production build stage
############################################
FROM base AS builder

ARG REACT_APP_API_BASE_URL=""
ENV REACT_APP_API_BASE_URL=${REACT_APP_API_BASE_URL}
ENV NODE_ENV=production
RUN npm run build

############################################
# Static assets runtime
############################################
FROM nginx:1.27-alpine AS runtime

COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

# Use default nginx entrypoint/cmd
