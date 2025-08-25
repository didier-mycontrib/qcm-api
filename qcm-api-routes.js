import express from 'express';
const apiRouter = express.Router();

import qcmDao from './qcm-dao-mongoose.js';
//qcmDao.ThisPersistentModelFn(); //to use only for specific extra request (not in dao)
import { statusCodeFromEx , nullOrEmptyObject , build_api_uris , 
	    addDefaultPrivateReInitRoute ,
	    addDefaultGetByIdRoute ,addDefaultGetByCriteriaRoute ,
	    addDefaultDeleteRoute , addDefaultPostRoute , addDefaultPutRoute} from "./generic-express-util.js";

const api_name="qcm-api"
const api_version="v1"
const main_entities_name="qcms" // main collection (entities name)  

const api_uris = build_api_uris(api_name,api_version,main_entities_name);


/*
Nouvelle convention d'URL :
http://localhost:8xxx/xyz-api/v1/private/xyz en accès private (avec auth nécessaire)
http://localhost:8xxx/xyz-api/v1/public/xyz en accès public (sans auth nécessaire)
*/


/**
 * @openapi
 * components:
 *   responses:
 *     Qcm:
 *       description: Qcm
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/Qcm" 
 *     Qcms:
 *       description: Qcm array
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/QcmArray"   
 */

//exemple URL: .../qcm-api/v1/private/reinit
addDefaultPrivateReInitRoute(apiRouter,qcmDao,api_uris)

//(private version : return qcm with solutions)
//exemple URL: .../qcm-api/v1/public/qcm/6215ef77a8f36f4037eeef0f
// '/qcm-api/v1/private/qcm/:id'
/**
 * @openapi
 * /qcm-api/v1/private/qcms/{id}:
 *   get:
 *     description: qcm (with solutions) by id
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         example: 6215ef77a8f36f4037eeef0d
 *     responses:
 *       200:
 *         description: Returns qcm (with solutions)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Qcm"
 *       404:
 *         description: NOT_FOUND
 */
addDefaultGetByIdRoute(apiRouter,qcmDao,api_uris,"private")


// version public : comme version privée 
//mais retournant qcm avec questions seulement (pas les réponses)
//exemple URL: .../qcm-api/v1/public/qcms/6215ef77a8f36f4037eeef0f
//'/qcm-api/v1/public/qcms/:id'
/**
 * @openapi
 * /qcm-api/v1/public/qcms/{id}:
 *   get:
 *     description: qcm (without solutions) by id
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         example: 6215ef77a8f36f4037eeef0d
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Qcm"
 *         description: Returns qcm (without solutions , questions only)
 *       404:
 *         description: NOT_FOUND
 */
addDefaultGetByIdRoute(apiRouter,qcmDao,api_uris,"public",
	(qcm)=>{qcm.solutions=null}//pour eviter triche via observation directe des req http
)


// private version : return qcm array with all details (solutions )
//exemple URL: .../qcm-api/v1/private/qcms (returning all qcms)
//             .../qcm-api/v1/private/qcms?mode=training
/**
 * @openapi
 * /qcm-api/v1/private/qcms:
 *   get:
 *     description: qcm list (with details) from criteria
 *     parameters:
 *       - name: mode
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *           enum:
 *             - training
 *             - eval
 *         description: "filtering qcm purpose (training or eval)"
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/QcmArray"
 *         description: Returns qcm list (with details)
 */
addDefaultGetByCriteriaRoute(apiRouter,qcmDao,api_uris,"private",
	(req)=>{const mode = req.query.mode; const  criteria=mode?{purpose  : mode}:{}; return criteria }
)


//version public comme version privée mais retournant [] de Qcm sans details
//et avec filtrages : ?mode=training or ?mode=eval
// ?org=orgXyz ?session_code=codeXyz )
//exemple URL: .../qcm-api/public/qcms (returning all qcms)
/**
 * @openapi
 * /qcm-api/v1/public/qcms:
 *   get:
 *     description: qcm list (without details) from criteria
 *     parameters:
 *       - name: mode
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *           enum:
 *             - training
 *             - eval
 *         description: "filtering qcm purpose (training or eval)"
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/QcmArray"
 *         description: Returns qcm list (without details)
 */
addDefaultGetByCriteriaRoute(apiRouter,qcmDao,api_uris,"public",
	(req)=>{const mode = req.query.mode; const  criteria=mode?{purpose  : mode}:{}; return criteria },
	(qcms)=>{ qcms.forEach((qcm)=>{qcm.questions=null; qcm.solutions=null;}); }
)

var tabResNumFromIndex  = [ 'a' , 'b' , 'c' , 'd' , 'e' , 'f' ,'g' , 'h'];

class SolutionObject {
	constructor(num,goodAnswerNums ){
		this.num=num;
		this.goodAnswerNums=goodAnswerNums;
	}
}

function ajustSolutionsInQcm(qcm){
    qcm.solutions=[];
    for(let i=0;i<qcm.nbQuestions;i++){
        qcm.solutions[i]=new SolutionObject(qcm.questions[i].num,[]);
        for(let j=0;j<qcm.questions[i].answers.length;j++){
            if(qcm.questions[i].answers[j].ok!=null){
               if(qcm.questions[i].answers[j].ok==true){
                  qcm.solutions[i].goodAnswerNums.push(tabResNumFromIndex[j]) ;
               }
               Reflect.deleteProperty(qcm.questions[i].answers[j],"ok");
            }
        }
    }
}

/*
Rappels des paramétrages openapi sur propriétés:
   type : number ou string ou ...
   format : double ou int64 ou autre 
   default : defaultValue
   description : descriptionQuiVaBien
*/



// .../qcm-api/v1/private/qcm en mode post
//'/qcm-api/v1/private/qcms'
/**
 * @openapi
 * /qcm-api/v1/private/qcms:
 *   post:
 *     description: post a new qcm
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/Qcm"
 *     responses:
 *       201:
 *         description: saved qcm with id
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Qcm"
 *       500:
 *         description: INTERNAL_SERVER_ERROR
 */
addDefaultPostRoute(apiRouter,qcmDao,api_uris,
     (savedQcm)=>savedQcm.id , 
	 (qcmToSave) => { ajustSolutionsInQcm(qcmToSave); }
)


// .../qcm-api/v1/private/qcms en mode put
//'/qcm-api/v1/private/qcms/:id'

/**
 * @openapi
 * /qcm-api/v1/private/qcms/{id}:
 *   put:
 *     description: update qcm with existing id
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         example: 6215ef77a8f36f4037eeef0d
 *       - name: v
 *         in: query
 *         required: false
 *         schema:
 *           type: boolean
 *         description: "verbose: to ask 200/updatedQcm (not 204/NO_CONTENT)"
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/Qcm"
 *     responses:
 *       200:
 *         description: updated qcm
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Qcm"
 *       204:
 *         description: NO_CONTENT (OK)
 *       404:
 *         description: NOT_FOUND
 */
addDefaultPutRoute(apiRouter,qcmDao,api_uris,
	 (idRes,qcmToUpdate) => { qcmToUpdate.id = idRes; ajustSolutionsInQcm(qcmToUpdate); }
)


//exemple URL: .../qcm-api/v1/private/qcms/6213be90e247ac2221112840 en mode DELETE
// '/qcm-api/v1/private/qcms/:id' 
/**
 * @openapi
 * /qcm-api/v1/private/qcms/{id}:
 *   delete:
 *     description: delete qcm  by id
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         example: 6215ef77a8f36f4037eeef0d
 *       - name: v
 *         in: query
 *         required: false
 *         schema:
 *           type: boolean
 *         description: "verbose: to ask 200/message (not 204/NO_CONTENT)"
 *     responses:
 *       200:
 *         description : delete action json message with deletedId
 *       204:
 *         description: NO_CONTENT (OK)
 *       404:
 *         description: NOT_FOUND
 */
addDefaultDeleteRoute(apiRouter,qcmDao,api_uris)


export  default { apiRouter };