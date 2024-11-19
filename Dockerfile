# -----------------------------------------
# Stage 0 - Dependencies setup
# This stage handles all the package installation steps, creating a base we can
# use for the final production image. Using a multi-stage build helps to make
# the final image smaller and more efficient.
# -----------------------------------------

# The FROM instruction specifies the base image that our Docker image will build upon, in this case it will be node.js
# specific version for node can be selected in this way. We will use Node.js version 20.18.0 with Alpine 3.19 for a lightweight base.
FROM node:20.18.0-alpine3.19@sha256:96a83b49de736e7563315eebacc711cc9b35ac50715363d089da7b0d1e093111 AS dependencies

# Use the LABEL instruction to add metadata like maintainer name, email, and the image's purpose.
LABEL maintainer="Sukhmanpreet Kaur <skaur255@myseneca.ca>"
LABEL description="Fragments node.js microservice"

# Starting env variables to set globally
#We default to use port 8080 in our service
# cpm_config_loglevel= warn - Reduce npm spam when installing within Docker
# https://docs.npmjs.com/cli/v8/using-npm/config#loglevel
# ENV NPM_CONFIG_COLOR=false - Disable colour when run inside Docker
# https://docs.npmjs.com/cli/v8/using-npm/config#color
ENV PORT=8080 \
    NPM_CONFIG_LOGLEVEL=warn \
    NPM_CONFIG_COLOR=false

# Use /app as our working directory
WORKDIR /app

# Option 1: explicit path - Copy the package.json and package-lock.json
# files into /app. NOTE: the trailing `/` on `/app/`, which tells Docker
# that `app` is a directory and not a file.
COPY package*.json /app/

# Install node dependencies defined in package-lock.json
#Combining npm install and npm cache clean in a single RUN command makes caching more efficient,
# so Docker will only re-run this step if the package.json files change.
RUN npm install --no-optional && npm cache clean --force


# -----------------------------------------
# Stage 1 - Final production build
# In this stage, we copy only the necessary parts from the first stage,
# making the image smaller and removing unnecessary dependencies.
# -----------------------------------------

# Using a Node.js version (20.17.0-alpine3.19) as our base, being the lieghtest version.
FROM node:20.18.0-alpine3.19@sha256:96a83b49de736e7563315eebacc711cc9b35ac50715363d089da7b0d1e093111 AS production

# Add non-root user for better security.
USER node

# Set the same working directory as before so Docker knows where to find files
WORKDIR /app

# Copying everything from the previous "dependencies" stage to this final stage.
# This includes all the installed dependencies, but only the essential parts.
# `--no-optional`: Avoid installing unnecessary optional dependencies.
COPY --from=dependencies /app /app

# Copy src to /app/src/
COPY ./src ./src

# Copy our HTPASSWD file
COPY ./tests/.htpasswd ./tests/.htpasswd

# We run our service on port 8080
EXPOSE 8080

# Add a health check for better container orchestration
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080 || exit 1

# Switch to root to install system-level packages.
USER root

# Install tini for better process management (e.g., signal handling) and remove the unused files
RUN apk add --no-cache tini=v3.20.3-334-g4d791ea3de5 && \
    rm -rf /var/cache/apk/* /tmp/*

# Switch back to a non-root user for running the application.
USER node

# Use tini as the init system to handle PID 1.
ENTRYPOINT ["/sbin/tini", "--"]

# Start the container by running our server
CMD ["npm", "start"]