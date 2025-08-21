import express from 'express';
export const app = express();
import swaggerUi from 'swagger-ui-express';
import swaggerJsdocPkg from 'swagger-jsdoc';
const  swaggerJSDoc  = swaggerJsdocPkg;

import fileUpload  from 'express-fileupload';

import { dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));
import qcmApiRoutes from './qcm-api-routes.js';
import qcmResultsApiRoutes from './qcm-results-api-routes.js';

import verifAuth from './verif-auth-oauth2.js'; //for  oauth2/iodc/keycloak 

//support parsing of JSON post data
var jsonParser = express.json({  extended: true}); 
app.use(jsonParser);

//support for fileUpload:
app.use(fileUpload({
  limits: { fileSize: 5 * 1024 * 1024 },
}));

// CORS enabled with express/node-js :

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    //ou avec "www.xyz.com" à la place de "*" en production
    res.header("Access-Control-Allow-Methods",
               "POST, GET, PUT, DELETE, OPTIONS"); 
    //default: GET 
    res.header("Access-Control-Allow-Headers",
               "Origin, X-Requested-With, Content-Type, Accept");
    next();
});


//les routes en /html/... seront gérées par express par
//de simples renvois des fichiers statiques
//du répertoire "./html"
app.use('/html', express.static(__dirname+"/html"));
app.get('/', function(req , res ) {
  res.redirect('/html/index.html');
});

let withoutAuth = process.env.WITHOUT_AUTH ;

if(withoutAuth!="yes"){
  //verif auth beared token in request for private api/path:
  verifAuth.tryInitRemoteOAuth2OidcKeycloakMode(); 
  app.use(verifAuth.verifTokenInHeadersForPrivatePath); // with OAuth2 autorization server 
  app.use(verifAuth.checkScopeForPrivatePath); //with OAuth2 autorization server 
}

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'qcm-api',
      version: '1.0.0',
    },
  },
  apis: ['*-routes.js','*dao-mongoose.js'], // files containing annotations with @openapi
};
const swaggerSpec = swaggerJSDoc(options);

app.use('/qcm-api/v1/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(qcmApiRoutes.apiRouter);// delegate REST API routes to apiRouter(s)
app.use(qcmResultsApiRoutes.apiRouter);

let backendPort = process.env.PORT || 8230; 
export const server = app.listen(backendPort , function () {
  console.log("http://localhost:"+backendPort);
});
