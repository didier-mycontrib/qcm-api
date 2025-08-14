import mongoose from 'mongoose';
import qcmDbMongoose from './qcm-db-mongoose.js';
import genericPromiseMongoose from './generic-promise-mongoose.js';

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
responseChoice:
=======
num :  // numero d'une question ( 1 ou plus) 
selectedAnswerNums :// liste des réponses sélectionnées ['c'] ou ['a' , b']
*/
let responseChoiceSchema = new  mongoose.Schema({
    num: Number,
    selectedAnswerNums : [String],
  });
setSubSchemaWithoutIdNorVersionKey(responseChoiceSchema);
/*
QcmPerformer:
=========
fullName : string;
email:string;
org:string;
*/
let  qcmPerformerSchema = new  mongoose.Schema({
  fullName: String,
  email : String,
  org : String,
  });
setSubSchemaWithoutIdNorVersionKey(qcmPerformerSchema);

/* QcmGlobalResults :
    ==========
    percentageScore : number;
    nbGoodResponses : number;
  */
  let qcmGlobalResultsSchema = new  mongoose.Schema({
    percentageScore: Number,
    nbGoodResponses : Number,
      });
  setSubSchemaWithoutIdNorVersionKey(qcmGlobalResultsSchema);

  /*
    QcmResults:
    ====
   _id : string ;  
  performer : QcmPerformer;
  qcmId : string;
  choices : ResponseChoices[];
  globalResults : QcmGlobalResults;
    ...peut etre ajouter qcmTitre ou qcmSumUp plus parlant que qcmId
  */
    
      thisSchema = new mongoose.Schema({
        /* default mongo _id: { type : String , alias : "id" } ,*/
        performer: qcmPerformerSchema,
        qcmId :  String ,
        choices : [ responseChoiceSchema ],
        globalResults : qcmGlobalResultsSchema
      });
      thisSchema.set('id',true); //virtual id alias as string for _id
      thisSchema.set('toJSON', { virtuals: true , 
                                   versionKey:false,
                                   transform: function (doc, ret) {   delete ret._id; delete ret._v;  }
                                 });                             
      //console.log("mongoose thisSchema : " + JSON.stringify(thisSchema) );
      //"QcmResults" model name is "qcmResults" collection name in mongoDB  database
      ThisPersistentModel = mongoose.model('QcmResults', thisSchema);
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
      await (new ThisPersistentModelFn()({ _id : "621607cd5adc0f2365d8955c" , 
                qcmId : "6215ef77a8f36f4037eeef0d" ,
                performer : { fullName : "jean Bon" , 
                              email : "jean.Bon@xyz.com",
                              org : "xyz" } ,
                choices : [ {num:1 ,selectedAnswerNums : ['a'] } ,
                              {num:2 ,selectedAnswerNums : ['b'] }
                            ],
               globalResults : { percentageScore : 50 ,nbGoodResponses : 1}
              }
         )).save();
        return {action:"qcmResults collection in database re-initialized"}
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
