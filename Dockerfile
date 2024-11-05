# -----------------------------------------
# Stage 0 - Dependencies setup
# This stage handles all the package installation steps, creating a base we can
# use for the final production image. Using a multi-stage build helps to make
# the final image smaller and more efficient.
# -----------------------------------------

# The FROM instruction specifies the base image that our Docker image will build upon, in this case it will be node.js
# specific version for node can be selected in this way. We will use this node image as our starting point for 
# dependencies
FROM node:20.17.0 AS dependencies

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
RUN npm install && npm cache clean --force


# -----------------------------------------
# Stage 1 - Final production build
# In this stage, we copy only the necessary parts from the first stage,
# making the image smaller and removing unnecessary dependencies.
# -----------------------------------------

# Using a slimmer Node.js version (20.17.0-slim) as our base, which takes up less space.
FROM node:20.17.0-slim AS production

# Set the same working directory as before so Docker knows where to find files
WORKDIR /app

# Copying everything from the previous "dependencies" stage to this final stage.
# This includes all the installed dependencies, but only the essential parts.
COPY --from=dependencies /app /app

# Copy src to /app/src/
COPY ./src ./src

# Copy our HTPASSWD file
COPY ./tests/.htpasswd ./tests/.htpasswd

# We run our service on port 8080
EXPOSE 8080

# Start the container by running our server
CMD ["npm", "start"]