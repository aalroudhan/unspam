FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
# Data files read at runtime relative to __dirname in dist/
COPY --from=builder /app/src/database/data ./dist/database/data
COPY --from=builder /app/src/reports/data ./dist/reports/data
EXPOSE 3000
CMD ["sh", "-c", "node dist/database/seed.js && node dist/main"]
