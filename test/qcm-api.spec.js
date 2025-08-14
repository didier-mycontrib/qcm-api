import {use} from  'chai';
import chaiHttp  from 'chai-http';
import { app , server } from '../server.js';
import { MongoDBContainer } from '@testcontainers/mongodb'


const chai=use(chaiHttp); //configure chai to use chaiHttp
//NB: run mocha with --exit option for good server exit after test execution

const { expect } = chai;

function retreiveMyAppRequester(){
    return chai.request.execute(app);//"http://localhost:8230" or ...
    //NB: this code may change in other chai,chaiHttp versions
}

describe("rest qcm-api tests", ()=>{

  
  let qcmA =null; //part of data-set

  let mongodbContainer=null;//for integration-test (in jenkins or ...)


	before(async () =>{

mongodbContainer = new MongoDBContainer("mongo:8.0.12").start()
        .then((mongodbContainer)=>{ console.log("mdb:"+mongodbContainer.getConnectionString());})
        .catch((err)=>console.log(err))

     console.log("initialisations before all tests of qcm-api.spec (dataset or ...)");
    //insertion d'un jeu de données via http call:
	
    qcmA = {title:"qcmA",purpose:"training",keywords:"js",visibility:"public",ownerId:null,
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
      console.log("qcmA added in database/dataset with id="+qcmA.id)
  });

  after(async ()=>{
    const requester = retreiveMyAppRequester();
    console.log("terminaison after all tests of qcm-api.spec ");
    //delete dataset
     const resDeleteQcmA = await requester.delete('/qcm-api/private/qcm/'+qcmA.id)
  });
	
it("/qcm-api/public/qcm , status 200 and at least one qcm", async () =>{
      const requester = retreiveMyAppRequester();
      const res = await requester.get('/qcm-api/public/qcm');
      expect(res).to.have.status(200);
      let jsBody = res.body;//as array of qcm
      console.log(JSON.stringify(jsBody));
      expect(jsBody.length).to.be.at.least(1);
   });

   it("returns status 200 and ...", async () =>{
    console.log(`temp ok 2`);
   });

});