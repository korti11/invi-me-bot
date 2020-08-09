FROM node:lts

WORKDIR /home/invi

# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

# Bundle app source
COPY . .

# Install app dependencies
RUN npm ci --production

# Add invi user and set as owner of the current directory
RUN groupadd -r invi && useradd -r -g invi invi \
    && chown -R invi:invi .

# Run everything after as non-privileged user
USER invi

# Start the bot
CMD [ "npm", "run", "start" ]