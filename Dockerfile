# Use Node 20
FROM node:20

# Create app directory
WORKDIR /app

# Copy everything
COPY . .

# Install dependencies
RUN npm install

# Run directly (TypeScript file or JS, your choice)
CMD ["npx", "tsx", "server/index.production.ts"]