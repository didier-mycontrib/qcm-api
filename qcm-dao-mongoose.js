import mongoose from 'mongoose';
import qcmDbMongoose from './qcm-db-mongoose.js';
import genericPromiseMongoose from './generic-promise-mongoose.js';
var thisDb = qcmDbMongoose.thisDb;

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
  mongoose.Connection = thisDb;

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
/*
Question:
=========
num: // 1 or .. 
question: // texte de la question 
image  null ou chemin image  
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
}

initMongooseWithSchemaAndModel();

async function reinit_db(){
    try {
      const deleteAllFilter = { }
      await ThisPersistentModel.deleteMany( deleteAllFilter);
      //console.log("old qcms deleted");
      await (new ThisPersistentModel({ _id : "6215ef77a8f36f4037eeef0d" ,
                title : "qcm1" , keywords : [ "js" ] , visibility : "public" , purpose : "training",
                ownerId: null , authorId : null ,nbQuestions : 2 , 
                questions : [{ num : 1 , question : "let or var or ... for local?",
                              nbGoodAnswers : 1 , answers : [
                                {txtNum:"a",text :"let"},
                                {txtNum:"b",text :"var"},
                                {txtNum:"c",text :"const"},
                                {txtNum:"d",text :"local"},
                              ]},
                              { num : 2 , question : "await in wich type of function?",
                              nbGoodAnswers : 1 , answers : [
                                {txtNum:"a",text :"void"},
                                {txtNum:"b",text :"global"},
                                {txtNum:"c",text :"async"},
                                {txtNum:"d",text :"then"},
                              ]}] ,
                solutions : [ {num:1 ,goodAnswerNums : ['a'] } ,
                              {num:2 ,goodAnswerNums : ['c'] }
                            ]}
         )).save();
         //console.log("qcm1 saved")
         await (new ThisPersistentModel({ _id : "6215ef77a8f36f4037eeef0f" ,
          title : "qcm2" , keywords : [ "java" ] , visibility : "public" , purpose : "eval",
          ownerId: null , authorId : null ,nbQuestions : 2 , 
          questions : [{ num : 1 , question : "keyword for inheritance ?",
                        nbGoodAnswers : 1 , answers : [
                          {txtNum:"a",text :"is"},
                          {txtNum:"b",text :"kindOf"},
                          {txtNum:"c",text :"extends"},
                          {txtNum:"d",text :"inherit"},
                        ]},
                        { num : 2 , question : "keyword beetween class and interface?",
                        nbGoodAnswers : 1 , answers : [
                          {txtNum:"a",text :"inherit"},
                          {txtNum:"b",text :"kindOf"},
                          {txtNum:"c",text :"class"},
                          {txtNum:"d",text :"implements"},
                        ]}] ,
          solutions : [ {num:1 ,goodAnswerNums : ['c'] } ,
                        {num:2 ,goodAnswerNums : ['d'] }
                      ]}
   )).save();
    //console.log("qcm2 saved")
    return {action:"qcms collection in database re-initialized"}; //as Promise
  } catch(ex){
     console.log(JSON.stringify(ex));
     throw ex;
  }
}

function findById(id) {
  return genericPromiseMongoose.findByIdWithModel(id,ThisPersistentModel);
}

//exemple of criteria : {} or { unitPrice: { $gte: 25 } } or ...
function findByCriteria(criteria) {
  return genericPromiseMongoose.findByCriteriaWithModel(criteria,ThisPersistentModel);
}

function save(entity) {
  return genericPromiseMongoose.saveWithModel(entity,ThisPersistentModel);
}

function updateOne(newValueOfEntityToUpdate) {
  return genericPromiseMongoose.updateOneWithModel(newValueOfEntityToUpdate,newValueOfEntityToUpdate.id,ThisPersistentModel);
}

function deleteOne(idOfEntityToDelete) {
  return genericPromiseMongoose.deleteOneWithModel(idOfEntityToDelete,ThisPersistentModel);
}


export default { ThisPersistentModel ,  reinit_db ,
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