import express from 'express';
const apiRouter = express.Router();

import qcmResultsDao from './qcm-results-dao-mongoose.js';//mainDao
import qcmDao from './qcm-dao-mongoose.js';//secondary dao
//qcmResultsDao.ThisPersistentModelFn(); //to use only for specific extra request (not in dao)

import { statusCodeFromEx , nullOrEmptyObject , build_api_uris , 
	    addDefaultPrivateReInitRoute ,
	    addDefaultGetByIdRoute ,addDefaultGetByCriteriaRoute ,
	    addDefaultDeleteRoute , addDefaultPostRoute , addDefaultPutRoute} from "./generic-express-util.js";

const api_name="qcm-api"
const api_version="v1"
const main_entities_name="qcm_results" // main collection (entities name)  

const api_uris = build_api_uris(api_name,api_version,main_entities_name);

/*
Nouvelle convention d'URL :
http://localhost:8xxx/xyz-api/private/xyz en accès private (avec auth nécessaire)
http://localhost:8xxx/xyz-api/public/xyz en accès public (sans auth nécessaire)
*/

//exemple URL: .../qcm-api/private/reinit-results
apiRouter.route(['/qcm-api/private/reinit-results','/qcm-api/v1/private/reinit-results'])
.get( async function(req , res  , next ) {
	try{
		let doneActionMessage = await qcmResultsDao.reinit_db();
		res.send(doneActionMessage);
    } catch(ex){
	    res.status(statusCodeFromEx(ex)).send(ex);
    } 
});


//exemple URL: .../qcm-api/private/qcm_results/621607cd5adc0f2365d8955c
///qcm-api/v1/private/qcm_results/:id
/**
 * @openapi
 * /qcm-api/v1/private/qcm_results/{id}:
 *   get:
 *     description: qcm_results by id
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         example: 6215ef77a8f36f4037eeef0d
 *     responses:
 *       200:
 *         description: Returns qcm_results
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/QcmResults"
 *       404:
 *         description: NOT_FOUND
 */
addDefaultGetByIdRoute(apiRouter,qcmResultsDao,api_uris,"private")



//exemple URL: .../qcm-api/v1/private/qcm_results (returning all qcmRes)
//             .../qcm-api/v1/private/qcm_results?xyz=xyz
//'/qcm-api/v1/private/qcm_results'
/**
 * @openapi
 * /qcm-api/v1/private/qcm_results:
 *   get:
 *     description: qcm_results list qcm_results (from criteria)
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/QcmResultsArray"
 *         description: Returns qcm_results list 
 */
addDefaultGetByCriteriaRoute(apiRouter,qcmResultsDao,api_uris,"private"
   /* ,(req)=>{const mode = req.query.xyz; const  criteria={}; return criteria } */
)


//POST and PUT : NA (not applicable) on qcm_results

//exemple URL: .../qcm-api/private/qcm_results/621607cd5adc0f2365d8955c en mode DELETE
//'/qcm-api/v1/private/qcm_results/:id')
/**
 * @openapi
 * /qcm-api/v1/private/qcm_results/{id}:
 *   delete:
 *     description: delete qcm_results  by id
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
addDefaultDeleteRoute(apiRouter,qcmResultsDao,api_uris)


//-----------------------------

function htmlTextForQcmResult(qcmResults) {
    var htmlTexte="<h2>resultats du qcm</h2>"
    + "<p> organisation = "+  qcmResults.performer.org +"</p>"
    + "<p> nom = <b>"+  qcmResults.performer.fullName +"</b></p>"
    + "<p> nb bonnes réponses = <b>"+  qcmResults.globalResults.nbGoodResponses +"</b></p>"
    + "<p> score = <b>"+  qcmResults.globalResults.percentageScore +" %</b></p>"
    + "<p> détails = <i>"+  JSON.stringify(qcmResults.choices) +"</i></p>"
    return htmlTexte;
}

function buildResults(qcm, choices){
    let qcmResults = { percentageScore : 0 ,nbGoodResponses : 0};
    for(let index in qcm.questions){
       let  respChoices  = choices[index];
       let  solutionsQuestion  = qcm.solutions[index];
       if(respChoices.num!=solutionsQuestion.num){
           throw "index exception in buildResults()";
       }else{
           let ok = true ; //by default (before verif)
           for(let goodResp of solutionsQuestion.goodAnswerNums){
                if(!respChoices.selectedAnswerNums.includes(goodResp)){
                    ok=false; break;
                }
           }
           //ok est encore à true si toutes les bonnes réponses ont été sélectionnées
           //tester si pas trop de sélections (et donc mauvaises réponses en trop):
           if(respChoices.selectedAnswerNums.length != solutionsQuestion.goodAnswerNums.length){
               ok=false;
           }
           if(ok)
              qcmResults.nbGoodResponses++;
       }
       qcmResults.percentageScore=(qcmResults.nbGoodResponses*100)/qcm.nbQuestions;
    }
    return qcmResults;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     PostChoicesRequest:
 *       type: object
 *       properties:
 *         qcmPerformer: 
 *           $ref: "#/components/schemas/QcmPerformer"
 *         qcmId:
 *           type: string
 *         choices:
 *           type: array
 *           items:
 *             $ref: "#/components/schemas/ResponseChoice"
 *
 *     PostChoicesResponse:
 *       type: object
 *       properties:
 *         globalResults: 
 *           $ref: "#/components/schemas/QcmGlobalResults"
 *         qcmResultsId:
 *           type: string
 *         choices:
 *           type: array
 *           items:
 *             $ref: "#/components/schemas/ResponseChoice"
 *         qcm:
 *           $ref: "#/components/schemas/Qcm"
 * 
 */

//POST qcm_choices to get results
/**
 * @openapi
 * /qcm-api/v1/public/qcm_choices:
 *   post:
 *     description: post postChoicesRrequest (DTO) for a qcm
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/PostChoicesRequest"
 *     responses:
 *       201:
 *         description: specific postChoicesResponse (DTO)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/PostChoicesResponse"
 *       500:
 *         description: INTERNAL_SERVER_ERROR
 */
apiRouter.route('/qcm-api/v1/public/qcm_choices')
.post(async function(req , res  , next ) {
	var postChoicesRequest = req.body;
    console.log("postChoicesRequest :" +JSON.stringify(postChoicesRequest));
    if(nullOrEmptyObject(postChoicesRequest)) { res.status(400).send(); return; } //BAD REQUEST
  try{
	let qcmGlobalResult = null;
    let email = postChoicesRequest.qcmPerformer.email;
    postChoicesRequest.qcmPerformer.email="not registered (confidential)";
    //load qcm with solutions:
    let qcm = await qcmDao.findById(postChoicesRequest.qcmId);
    //building globalresults:
    qcmGlobalResult = buildResults(qcm,postChoicesRequest.choices);
    //storing results only if mode=eval:
    let PersistentQcmResultsModel =qcmResultsDao.ThisPersistentModelFn();
    let qcmResults = new  PersistentQcmResultsModel( { _id  : null,
		                                  performer : postChoicesRequest.qcmPerformer,
                                          qcmId : postChoicesRequest.qcmId,
                                          choices : postChoicesRequest.choices,
                                          globalResults : qcmGlobalResult });
    let savedQcmResults =qcmResults;
    if(postChoicesRequest.mode=='eval'){
        savedQcmResults = await qcmResultsDao.save(qcmResults);
		/*
        if(email!=null && mySmtpUtil.isInitialized()){
            mySmtpUtil.sendSimpleEmail(email,
                                      "qcm results",
                                      htmlTextForQcmResult(savedQcmResults),true);
        }
        */
    }
    //returning results & solutions:
    let  postChoicesResponse  = {
    	globalResults: savedQcmResults.globalResults,
    	qcmResultsId: savedQcmResults._id,
    	choices: postChoicesRequest.choices,
    	qcm: qcm/*with details/solutions and copy of choices*/
	}
	res.status(201).send(postChoicesResponse);
   } catch(ex){
        console.log("exception in post /qcm-api/v1/public/qcm_choices" + ex)
	    res.status(statusCodeFromEx(ex)).send(ex);
   }
});

export  default { apiRouter };