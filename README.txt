micro-service qcm
=======
utilise une base mongoDB "qcm_db".

==========
npm install -s express
npm install -s mongoose
npm install -s axios
npm install -s passport passport-keycloak-bearer 
npm install -s swagger-ui-express
npm install -s swagger-jsdoc
====
npm install --save-dev mocha chai chai-http @testcontainers/mongodb

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
TEST_MODE=IT pour test avec mongodb fonctionnant avec testcontainers dans un env ic (ex: jenkins)

https://medium.com/@anna.burlyaeva/integration-tests-for-node-js-apps-with-mysql-and-mongodb-using-testcontainers-2b132c6ff179
https://testcontainers.com/modules/mongodb/?language=nodejs
https://testcontainers.com/guides/getting-started-with-testcontainers-for-nodejs/

//NB: le fichier www-d-defrance-fr-chain.pem à la racine du projet est nécessaire 
//pour une bonne communication avec keycloak 
//et ce fichier doit être réactualisé tous les ans (après réactualisation du certificat ssl)

