import express from 'express';
const apiRouter = express.Router();

import qcmDao from './qcm-dao-mongoose.js';
var PersistentSessionModel = qcmDao.ThisPersistentModel; //to use only for specific extra request (not in dao)


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

//exemple URL: .../qcm-api/private/reinit
apiRouter.route('/qcm-api/private/reinit')
.get( async function(req , res  , next ) {
	try{
		let doneActionMessage = await qcmDao.reinit_db();
		res.send(doneActionMessage);
    } catch(ex){
	    res.status(statusCodeFromEx(ex)).send(ex);
    } 
});

//(private version : return qcm with solutions)
//exemple URL: .../qcm-api/public/qcm/6215ef77a8f36f4037eeef0f
apiRouter.route('/qcm-api/private/qcm/:id')
.get( async function(req , res  , next ) {
	var idRes = req.params.id;
	try{
		let qcm = await qcmDao.findById( idRes);
		res.send(qcm);
    } catch(ex){
	    res.status(statusCodeFromEx(ex)).send(ex);
    } 
});

// version public : comme version privée 
//mais retournant qcm avec questions seulement (pas les réponses)
//exemple URL: .../qcm-api/public/qcm/6215ef77a8f36f4037eeef0f
apiRouter.route('/qcm-api/public/qcm/:id')
.get( async function(req , res  , next ) {
	var idRes = req.params.id;
	try{
		let qcm = await qcmDao.findById( idRes);
		qcm.solutions=null; //pour eviter triche via observation directe des req http
		res.send(qcm);
    } catch(ex){
	    res.status(statusCodeFromEx(ex)).send(ex);
    } 
});

// private version : return qcm array with all details (solutions )
//exemple URL: .../qcm-api/private/qcm (returning all qcms)
//             .../qcm-api/private/qcm?mode=training
apiRouter.route('/qcm-api/private/qcm')
.get( async function(req , res  , next ) {
	let  mode = req.query.mode;
	var criteria=mode?{purpose  : mode}:{};
	try{
		let qcms = await qcmDao.findByCriteria(criteria);
		res.send(qcms);
    } catch(ex){
	    res.status(statusCodeFromEx(ex)).send(ex);
    } 
});

//version public comme version privée mais retournant [] de Qcm sans details
//et avec filtrages : ?mode=training or ?mode=eval
// ?org=orgXyz ?session_code=codeXyz )
//exemple URL: .../qcm-api/public/qcm (returning all qcms)
apiRouter.route('/qcm-api/public/qcm')
.get( async function(req , res  , next ) {
	let  mode = req.query.mode; //may be null/undefined
    //let  org = req.query.org; //may be null/undefined
    //let  session_code = req.query.session_code; //may be null/undefined
	var criteria=mode?{purpose  : mode}:{};
	try{
		let qcms = await qcmDao.findByCriteria(criteria);
		qcms.forEach((qcm)=>{qcm.questions=null; qcm.solutions=null;});
		res.send(qcms);
    } catch(ex){
	    res.status(statusCodeFromEx(ex)).send(ex);
    } 
});

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


// .../qcm-api/private/qcm en mode post
apiRouter.route('/qcm-api/private/qcm')
.post(async function(req , res  , next ) {
	var qcm = req.body;
    console.log("posting  qcm :" +JSON.stringify(qcm));
	try{
		ajustSolutionsInQcm(qcm);
		let savedqcm = await qcmDao.save(qcm);
		res.send(savedqcm);
    } catch(ex){
	    res.status(statusCodeFromEx(ex)).send(ex);
    }
});

// .../qcm-api/private/qcm en mode put
apiRouter.route('/qcm-api/private/qcm/:id')
.put(async function(req , res  , next ) {
	var idRes = req.params.id;
	var qcm = req.body;
	qcm.id = idRes;
    console.log("update  qcm of id=" +idRes + ":" +JSON.stringify(qcm));
	try{
		ajustSolutionsInQcm(qcm);
		let updatedqcm = await qcmDao.updateOne(qcm);
		res.send(updatedqcm);
    } catch(ex){
		console.log("ex:"+ex);
	    res.status(statusCodeFromEx(ex)).send(ex);
    }
});



//exemple URL: .../qcm-api/private/qcm/6213be90e247ac2221112840 en mode DELETE
apiRouter.route('/qcm-api/private/qcm/:id')
.delete( async function(req , res  , next ) {
	var idRes = req.params.id;
	console.log("DELETE,idRes="+idRes);
	try{
		let deleteActionMessage = await qcmDao.deleteOne(idRes);
		res.send(deleteActionMessage);
    } catch(ex){
	    res.status(statusCodeFromEx(ex)).send(ex);
    }
});


export  default { apiRouter };