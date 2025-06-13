FROM node:20-bullseye AS builder

# Set the working directory
WORKDIR /app

# Copy the root package.json and package-lock.json
COPY package*.json ./
COPY tsconfig.base.json ./

# Copy all packages
COPY packages/database/ packages/database/
COPY packages/types/ packages/types/
COPY packages/shared/ packages/shared/
COPY apps/billing-cron/ apps/billing-cron/

# Clean install dependencies
RUN npm ci

# Generate the Prisma client
RUN npm run db:generate

# Build necessary packages
RUN npm run build -w @metallichq/database
RUN npm run build -w @metallichq/types
RUN npm run build -w @metallichq/shared
RUN npm run build -w @metallichq/billing-cron

# Create the final image
FROM node:20-bullseye

# Set the working directory
WORKDIR /app

# Copy the node_modules from the builder stage
COPY --from=builder /app/node_modules ./node_modules

# Copy the built files from the builder stage
COPY --from=builder /app/packages/database ./packages/database
COPY --from=builder /app/packages/types ./packages/types
COPY --from=builder /app/packages/shared ./packages/shared
COPY --from=builder /app/apps/billing-cron ./apps/billing-cron

# Expose the port
EXPOSE 8080

# Command to run application
CMD ["node", "apps/billing-cron/dist/index.js"]
