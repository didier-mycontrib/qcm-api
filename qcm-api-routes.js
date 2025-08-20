import express from 'express';
const apiRouter = express.Router();

import qcmDao from './qcm-dao-mongoose.js';
//qcmDao.ThisPersistentModelFn(); //to use only for specific extra request (not in dao)
import { statusCodeFromEx , nullOrEmptyObject } from "./generic-express-util.js";


/*
Nouvelle convention d'URL :
http://localhost:8xxx/xyz-api/v1/private/xyz en accès private (avec auth nécessaire)
http://localhost:8xxx/xyz-api/v1/public/xyz en accès public (sans auth nécessaire)
*/

//exemple URL: .../qcm-api/v1/private/reinit
apiRouter.route('/qcm-api/v1/private/reinit')
.get( async function(req , res  , next ) {
	try{
		let doneActionMessage = await qcmDao.reinit_db();
		res.send(doneActionMessage);
    } catch(ex){
		console.log("ex:"+ex)
	    res.status(statusCodeFromEx(ex)).send(ex);
    } 
});

//(private version : return qcm with solutions)
//exemple URL: .../qcm-api/v1/public/qcm/6215ef77a8f36f4037eeef0f
apiRouter.route('/qcm-api/v1/private/qcm/:id')
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
//exemple URL: .../qcm-api/v1/public/qcm/6215ef77a8f36f4037eeef0f
apiRouter.route('/qcm-api/v1/public/qcm/:id')
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
//exemple URL: .../qcm-api/v1/private/qcm (returning all qcms)
//             .../qcm-api/v1/private/qcm?mode=training
apiRouter.route('/qcm-api/v1/private/qcm')
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
/**
 * @openapi
 * /qcm-api/v1/public/qcm:
 *   get:
 *     description: qcm list from criteria
 *     responses:
 *       200:
 *         description: Returns qcm list
 */
apiRouter.route('/qcm-api/v1/public/qcm')
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
		console.log("ex="+ex)
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


// .../qcm-api/v1/private/qcm en mode post
/**
 * @openapi
 * /qcm-api/v1/private/qcm:
 *   post:
 *     description: post a new qcm
 *     responses:
 *       201:
 *         description: saved qcm with id
 */
apiRouter.route('/qcm-api/v1/private/qcm')
.post(async function(req , res  , next ) {
	var qcm = req.body;
    console.log("posting  qcm :" +JSON.stringify(qcm));
	if(nullOrEmptyObject(qcm)) { res.status(400).send(); return; } //BAD REQUEST
	try{
		ajustSolutionsInQcm(qcm);
		let savedqcm = await qcmDao.save(qcm);
		let id = savedqcm.id ; 
		res.location('/qcm/' + id).status(201).send(savedqcm);//201: successfully created
    } catch(ex){
	    res.status(statusCodeFromEx(ex)).send(ex);
    }
});

// .../qcm-api/v1/private/qcm en mode put
apiRouter.route('/qcm-api/v1/private/qcm/:id')
.put(async function(req , res  , next ) {
	var idRes = req.params.id;
	var qcm = req.body;
	if(nullOrEmptyObject(qcm)) { res.status(400).send(); return; } //BAD REQUEST
	qcm.id = idRes;
    console.log("update  qcm of id=" +idRes + ":" +JSON.stringify(qcm));
	let verbose = req.query.v=="true"; //verbose mode ?v=true (default as false)
	try{
		ajustSolutionsInQcm(qcm);
		let updatedqcm = await qcmDao.updateOne(qcm);
		if(verbose)
		  res.send(updatedqcm); //200:OK with updated entity as Json response body
		else
		  res.status(204).send();//NO_CONTENT
    } catch(ex){
		console.log("ex:"+ex);
	    res.status(statusCodeFromEx(ex)).send(ex);
    }
});



//exemple URL: .../qcm-api/v1/private/qcm/6213be90e247ac2221112840 en mode DELETE
apiRouter.route('/qcm-api/v1/private/qcm/:id' )
.delete( async function(req , res  , next ) {
	var idRes = req.params.id;
	console.log("DELETE,idRes="+idRes);
	let verbose = req.query.v=="true"; //verbose mode (default as false)
	try{
		let deleteActionMessage = await qcmDao.deleteOne(idRes);
		if(verbose)
		    res.send(deleteActionMessage);
		else
			res.status(204).send();//NO_CONTENT
    } catch(ex){
	    res.status(statusCodeFromEx(ex)).send(ex);
    }
});


export  default { apiRouter };