# verifier-svc/Dockerfile

# Use an official Node.js image. Alpine is small and works on M1.
FROM node:18-alpine

# Create and set the working directory.
WORKDIR /app

# Copy the package.json and package-lock.json files first.
COPY package*.json ./

# Install the dependencies.
RUN npm install

# Copy the rest of the application code, including the keys directory.
COPY . .

# Expose the port the app runs on.
EXPOSE 8081

# The command to run the application.
CMD [ "node", "index.js" ]