micro-service qcm
=======
utilise une base mongoDB "qcm_db".

==========
npm install -s express
npm install -s mongoose

======
en mode dev,
URL = http://localhost:8230/html/index.html
et
http://localhost:8230/qcm-api/public/qcm


================
change from mongoose 6 to mongoose 8 :
MongooseError: Model.find() no longer accepts a callback
MongooseError: Model.deleteMany() no longer accepts a callback
               …
==> impact : changer generic-promise-mongoose avec async/await
             et changer reinit…() dans ...-dao-mongoose avec async/await
====
TEST_MODE=IT pour testcontainers 
