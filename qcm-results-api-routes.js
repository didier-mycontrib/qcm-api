import express from 'express';
const apiRouter = express.Router();

import qcmResultsDao from './qcm-results-dao-mongoose.js';//mainDao
import qcmDao from './qcm-dao-mongoose.js';//secondary dao
var PersistentQcmResultsModel = qcmResultsDao.ThisPersistentModel; //to use only for specific extra request (not in dao)


function statusCodeFromEx(ex){
	let status = 500;
	if(ex== null || ex.error == null ) return status;
	switch(ex.error){
		case "BAD_REQUEST" : status = 400; break;
		case "NOT_FOUND" : status = 404; break;
		//...
		case "CONFLICT" : status = 409; break;
		default: status = 500;
	}
	return status;
}

/*
Nouvelle convention d'URL :
http://localhost:8xxx/xyz-api/private/xyz en accès private (avec auth nécessaire)
http://localhost:8xxx/xyz-api/public/xyz en accès public (sans auth nécessaire)
*/

//exemple URL: .../qcm-api/private/reinit-results
apiRouter.route('/qcm-api/private/reinit-results')
.get( async function(req , res  , next ) {
	try{
		let doneActionMessage = await qcmResultsDao.reinit_db();
		res.send(doneActionMessage);
    } catch(ex){
	    res.status(statusCodeFromEx(ex)).send(ex);
    } 
});


//exemple URL: .../qcm-api/private/qcm_results/621607cd5adc0f2365d8955c
apiRouter.route('/qcm-api/private/qcm_results/:id')
.get( async function(req , res  , next ) {
	var idRes = req.params.id;
	try{
		let qcmRes = await qcmResultsDao.findById( idRes);
		res.send(qcmRes);
    } catch(ex){
	    res.status(statusCodeFromEx(ex)).send(ex);
    } 
});



//exemple URL: .../qcm-api/private/qcm_results (returning all qcmRes)
//             .../qcm-api/private/qcm_results?xyz=xyz
apiRouter.route('/qcm-api/private/qcm_results')
.get( async function(req , res  , next ) {
	let  xyz = req.query.xyz;
	var criteria=xyz?{xyz  : xyz}:{};
	try{
		let qcmResArray = await qcmResultsDao.findByCriteria(criteria);
		res.send(qcmResArray);
    } catch(ex){
	    res.status(statusCodeFromEx(ex)).send(ex);
    } 
});

//POST and PUT : NA (not applicable) on qcm_results

//exemple URL: .../qcm-api/private/qcm_results/621607cd5adc0f2365d8955c en mode DELETE
apiRouter.route('/qcm-api/private/qcm_results/:id')
.delete( async function(req , res  , next ) {
	var idRes = req.params.id;
	console.log("DELETE,idRes="+idRes);
	try{
		let deleteActionMessage = await qcmResultsDao.deleteOne(idRes);
		res.send(deleteActionMessage);
    } catch(ex){
	    res.status(statusCodeFromEx(ex)).send(ex);
    }
});

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

//POST qcm_choices to get results
apiRouter.route('/qcm-api/public/qcm_choices')
.post(async function(req , res  , next ) {
	var postChoicesRequest = req.body;
    console.log("postChoicesRequest :" +JSON.stringify(postChoicesRequest));
  try{
	let qcmGlobalResult = null;
    let email = postChoicesRequest.qcmPerformer.email;
    postChoicesRequest.qcmPerformer.email="not registered (confidential)";
    //load qcm with solutions:
    let qcm = await qcmDao.findById(postChoicesRequest.qcmId);
    //building globalresults:
    qcmGlobalResult = buildResults(qcm,postChoicesRequest.choices);
    //storing results only if mode=eval:
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
	res.send(postChoicesResponse);
   } catch(ex){
	    res.status(statusCodeFromEx(ex)).send(ex);
   }
});

export  default { apiRouter };