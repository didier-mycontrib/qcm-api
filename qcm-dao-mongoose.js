import mongoose from 'mongoose';
import qcmDbMongoose from './qcm-db-mongoose.js';
import genericPromiseMongoose from './generic-promise-mongoose.js';
import { readJsonTextFile } from './generic-file-util.js'


//NB: This is for current entity type ("Devise" or "Customer" or "Product" or ...)
//NB: thisSchema and ThisPersistentModel should not be exported (private only in this current module)
var thisSchema;//mongoose Schema (structure of mongo document)
var ThisPersistentModel; //mongoose Model (constructor of persistent ThisPersistentModel)

function setSubSchemaWithoutIdNorVersionKey(schema){
  schema.set('id',false); //no default virtual id alias as string for _id
  schema.set('toJSON', { virtuals: true , 
                        versionKey:false,
                        transform: function (doc, ret) {   delete ret._id;   }
                        });
}

function initMongooseWithSchemaAndModel () {
  mongoose.Connection = qcmDbMongoose.thisDbFn();

/*
Answer (too choose):
=======
txtNum : // 'a' ou 'b' ou ... 
text : texte d'une bonne ou mauvaise reponse
ok : //during edition (upload/post but not download/get)
*/
let answerSchema = new  mongoose.Schema({
    txtNum: String,
    text : String,
    ok : Boolean
  });
setSubSchemaWithoutIdNorVersionKey(answerSchema);

/**
 * @openapi
 * components:
 *   schemas:
 *     Answer:
 *       type: object
 *       properties:
 *         txtNum:
 *           type: string
 *           enum: 
 *             - a
 *             - b
 *             - c
 *             - d
 *             - e
 *             - f 
 *             - g
 *             - h
 *         text:
 *           type: string
 *         ok:
 *           type: boolean
 * 
 *     AnswerArray:
 *       type: array
 *       items:
 *         $ref: "#/components/schemas/Answer"
 *
 */


/*
Question:
=========
num: // 1 or .. 
question: // texte de la question 
image:  null ou chemin image  
nbGoodAnswers : // 1 (exclusif) ou plus 
answers : tableau des réponses (à choisir)
*/
let  questionSchema = new  mongoose.Schema({
    num: Number,
    question : String,
    nbGoodAnswers : Number,
    answers : [ answerSchema ],
  });
setSubSchemaWithoutIdNorVersionKey(questionSchema);

/**
 * @openapi
 * components:
 *   schemas:
 *     Question:
 *       type: object
 *       properties:
 *         num:
 *           type: number
 *           format: int64
 *         question:
 *           type: string
 *         nbGoodAnswers:
 *           type: number
 *           format: int64
 *           default: 1
 *         answers:
 *           type: array
 *           items:
 *             $ref: "#/components/schemas/Answer"
 * 
 *     QuestionArray:
 *       type: array
 *       items:
 *         $ref: "#/components/schemas/Question"
 *
 */

/* Solution :
    ==========
      num : // numero d'une question ( 1 ou plus) 
      goodAnswerNums : // liste des bonnes réponses ['c'] ou ['a' , b']
  */
  let solutionSchema = new  mongoose.Schema({
        num: Number,
        goodAnswerNums : [ String ],
      });
  setSubSchemaWithoutIdNorVersionKey(solutionSchema);

/**
 * @openapi
 * components:
 *   schemas:
 *     Solution:
 *       type: object
 *       properties:
 *         num:
 *           type: number
 *           format: int64
 *         goodAnswerNums:
 *           type: array
 *           items:
 *             type: string
 * 
 *     SolutionArray:
 *       type: array
 *       items:
 *         $ref: "#/components/schemas/Solution"
 *
 */

  /*
    Qcm:
    ====
    purpose  //"training" or "eval" or null/undefined (filter)
    keywords  // categorie ou ...
    visibility //"public" or ...
    ownerId : // ...
    authorId : // null or ...
    ...
  */
    
      thisSchema = new mongoose.Schema({
        /* default mongo _id: { type : String , alias : "id" } ,*/
        title: String,
        keywords : [ String ],
        visibility : String,
        purpose : String,
        ownerId : String,
        authorId : String,
        nbQuestions : Number,
        questions : [ questionSchema ],
        solutions : [ solutionSchema ]
      });
      thisSchema.set('id',true); //virtual id alias as string for _id
      thisSchema.set('toJSON', { virtuals: true , 
                                   versionKey:false,
                                   transform: function (doc, ret) {   delete ret._id; delete ret._v;  }
                                 });                             
      //console.log("mongoose thisSchema : " + JSON.stringify(thisSchema) );
      //"Qcm" model name is "qcms" collection name in mongoDB  database
      ThisPersistentModel = mongoose.model('Qcm', thisSchema);


/**
 * @openapi
 * components:
 *   schemas:
 *     Qcm:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           default: null
 *         title:
 *           type: string
 *         keywords:
 *           type: array
 *           items:
 *             type: string
 *         visibility:
 *           type: string
 *           enum: 
 *             - public
 *             - private
 *           default: public
 *         purpose:
 *           type: string
 *           enum: 
 *             - training
 *             - eval
 *           default: training
 *         ownerId:
 *           type: string
 *           default: null
 *         authorId:
 *           type: string
 *           default: null
 *         nbQuestions:
 *           type: number
 *           format: int64
 *         questions:
 *           type: array
 *           items:
 *             $ref: "#/components/schemas/Question"
 *         solutions:
 *           type: array
 *           items:
 *             $ref: "#/components/schemas/Solution"
 *
 *     QcmArray:
 *       type: array
 *       items: 
 *         $ref: "#/components/schemas/Qcm"
 */

}

function ThisPersistentModelFn(){
  if(ThisPersistentModel==null)
      initMongooseWithSchemaAndModel();
  return ThisPersistentModel;
}


async function reinit_db(){
    try {
      const deleteAllFilter = { }
      await ThisPersistentModelFn().deleteMany( deleteAllFilter);
      //console.log("old qcms deleted");
     let entitiesFromFileDataSet = await readJsonTextFile("dataset/default_qcms.json");
      for(let e of entitiesFromFileDataSet){
		   if(e.id) { e._id = e.id; delete e.id}
        await  (new ThisPersistentModelFn()(e)).save();
      }
    return {action:"qcms collection in database re-initialized"}; //as Promise
  } catch(ex){
     console.log(JSON.stringify(ex));
     throw ex;
  }
}

function findById(id) {
  return genericPromiseMongoose.findByIdWithModel(id,ThisPersistentModelFn());
}

//exemple of criteria : {} or { unitPrice: { $gte: 25 } } or ...
function findByCriteria(criteria) {
  return genericPromiseMongoose.findByCriteriaWithModel(criteria,ThisPersistentModelFn());
}

function save(entity) {
  return genericPromiseMongoose.saveWithModel(entity,ThisPersistentModelFn());
}

function updateOne(newValueOfEntityToUpdate) {
  return genericPromiseMongoose.updateOneWithModel(newValueOfEntityToUpdate,newValueOfEntityToUpdate.id,ThisPersistentModelFn());
}

function deleteOne(idOfEntityToDelete) {
  return genericPromiseMongoose.deleteOneWithModel(idOfEntityToDelete,ThisPersistentModelFn());
}

//old static ThisPersistentModel now replaced by dynamic ThisPersistentModelFn() 
export default { ThisPersistentModelFn ,  reinit_db ,
   findById , findByCriteria , save , updateOne ,  deleteOne};

   /*
{
_id:1,
title : 'qcm a',
keywords : 'java or js or ...',
visibility : 'public' ,
owner-id : '?com.xx.yy' ou bien 'didier@d-defrance.fr'
author-id : null or 'jean.Bon?com.xx.yy',
nbQuestions : 2 ,
questions : [
  { num: 1 , question: 'quel est le plus grand ?' , image : null , nbGoodAnswers : 1,
    answers : [
	  { txtNum : 'a' , text : '12' }, { txtNum : 'b' , text : '12.01' }, 
      { txtNum : 'c' , text : '12.1' }, { txtNum : 'd' , text : '12.001' }, 	  
    ]
  },
   { num: 2 , question: 'qui est bleu ?' , image : null , nbGoodAnswers : 2,
    answers : [
	  { txtNum : 'a' , text : 'ciel' }, { txtNum : 'b' , text : 'arbre' }, 
      { txtNum : 'c' , text : 'stroumpf' }, { txtNum : 'd' , text : 'soleil' }, 	  
    ]
  }
],
solutions : [ 
  { num : 1 , goodAnswerNums : ['c'] } , { num : 2 , goodAnswerNums : ['a','c'] } 
]
}
*/