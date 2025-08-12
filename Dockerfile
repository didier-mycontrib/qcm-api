FROM node:22
# this new image will be create from parent image = node:22 (stable)

# Create app directory inside docker image
WORKDIR /usr/src/app

# Install app dependencies
COPY  package*.json  ./

RUN npm install


# Bundle app source (src, dist, ...)
COPY .   .

#setting ENV-VARIABLE
ENV PORT=8230
ENV MONGODB_URL=mongodb://root:root@mongoDB.host:27017

EXPOSE 8230
CMD [ "npm", "start" ]

