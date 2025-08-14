import {use} from  'chai';
import chaiHttp  from 'chai-http';
import { app , server } from '../server.js';
import { MongoDBContainer } from '@testcontainers/mongodb'


const chai=use(chaiHttp); //configure chai to use chaiHttp
//NB: run mocha with --exit option for good server exit after test execution

const { expect } = chai;

//ADD qcmA dataSet before begin of all tests
async function initQcmADataSet(){
   let qcmA = {title:"qcmA",purpose:"training",keywords:["js"],visibility:"public",ownerId:null,
    authorId:null,nbQuestions:1,
    questions:[
      {num:1,question:"js is for ...",image:null,nbGoodAnswers:1,
      answers:[{txtNum:"a",text:"javascript",ok:true},
               {txtNum:"b",text:"java",ok:false},
               {txtNum:"c",text:"python",ok:false},
               {txtNum:"d",text:"c",ok:false}]
      }],
      solutions:[]}; //end of qcmA

      const requester = retreiveMyAppRequester();
      const resPostQcmA = await requester.post('/qcm-api/private/qcm')
                     .send(qcmA);
      qcmA.id = resPostQcmA.body.id ;
      //console.log("qcmA added in database/dataset with id="+qcmA.id)
      return qcmA;
}

//REMOVE qcmA dataSet after end of all tests
async function removeQcmADataSet(qcmA){
     const requester = retreiveMyAppRequester();
     const resDeleteQcmA = await requester.delete('/qcm-api/private/qcm/'+qcmA.id)
     console.log("data set remove at end of all tests")
}

describe("rest qcm-api tests", ()=>{
  let mongodbContainer=null;//for integration-test (in jenkins or ...)

  let qcmA =null; //part of data-set

  
	before(async () =>{
     mongodbContainer=initMongodbContainer(); //utile seulement en mode IT (avec jenkins ou ...)
  
     console.log("initialisations before all tests of qcm-api.spec (dataset or ...)");
    //insertion d'un jeu de données via http call:
    qcmA = await initQcmADataSet();
    console.log("qcmA.id="+qcmA.id + " was post");
    
  }).timeout(800000); //grande valeur de timeout car premier démarrage lent (éventuelle téléchargement de l'image docker)

  after(async ()=>{
    console.log("terminaison after all tests of qcm-api.spec ");
    //delete dataset:
    await removeQcmADataSet(qcmA)

     if(process.env.TEST_MODE=="IT"){
      //stop mongodbContainer (in integration test mode):
     await mongodbContainer.stop();
     }
  });
	
 it("/qcm-api/public/qcm , status 200 and at least one qcm", async () =>{
      const requester = retreiveMyAppRequester();
      const res = await requester.get('/qcm-api/public/qcm');
      expect(res).to.have.status(200);
      let jsBody = res.body;//as array of qcm
      //console.log("qcm list"+JSON.stringify(jsBody));
      expect(jsBody.length).to.be.at.least(1);
   });

   it("/qcm-api/private/qcm/idOfqcmA returns status 200 and good values of qcmA", async () =>{
    const requester = retreiveMyAppRequester();
      console.log("get qcmA.id="+qcmA.id);
      const res = await requester.get('/qcm-api/private/qcm/'+qcmA.id);
      expect(res).to.have.status(200);
      let jsBody = res.body;// qcm object
      console.log("reloaded values of qcmA=" +JSON.stringify(jsBody));
      expect(jsBody.title).to.equal("qcmA");
      expect(jsBody.keywords[0]).to.equal("js");
      //...
   });

});

//GENERIC FUNCTIONS (idem for other tests):

function retreiveMyAppRequester(){
    return chai.request.execute(app);//"http://localhost:8230" or ...
    //NB: this code may change in other chai,chaiHttp versions
}

async function initMongodbContainer(){
  let mongodbContainer=null;
     if(process.env.TEST_MODE=="IT"){
        try{
          mongodbContainer = await new MongoDBContainer("mongo:8.0.12").start()
          console.log("mongodbContainer connexion string: "+mongodbContainer.getConnectionString());
          process.env.MONGODB_URL=mongodbContainer.getConnectionString()
        }catch(ex){
          console.log("err start mongodbContainer:"+ex)
        }
      }
     return mongodbContainer;
}