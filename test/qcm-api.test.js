import { app , server } from '../server.js';
import { initMongodbContainer , initMainDataSet , removeMainDataSet,
  classicHttpCrudInnerTestObject } from './generic-chai-http-mocha-test.js';

import { chai , expect ,retreiveMyAppRequester } from './common-app-test.js'


//NB: in script (.sh, .bat , ...) : set/export WITHOUT_AUTH=yes // undefined by default
//WITHOUT THAT , security (auth check) will block private requests (post, ..)
export function qcmClassicSubTestGroup(){


let testContext = {
  chai : chai,
  expect : expect,
  app : app,
  name : "qcm-api-test",
  httpRequesterFn : retreiveMyAppRequester ,
  mainDataSetFilePath : "test/dataset/qcms.json" ,
  entityToAddFilePath : "test/dataset/new_qcm.json" ,
  entityToUpdateFilePath : "test/dataset/update_qcm.json" ,
  mainPrivateURL:"/qcm-api/v1/private/qcms" ,
  mainPublicURL:"/qcm-api/v1/public/qcms" ,
  extractIdFn : (qcm) => qcm.id ,
  setIdFn: (qcm,id) => { qcm.id = id } ,
  testEssentialSameValues: (e1,e2) => {
      expect(e1.title).to.equal(e2.title);
      expect(e1.nbQuestions).to.equal(e2.nbQuestions);
   }
   // .mainEntities may be dynamically added in testContext (for access from specificsubGroupTests
}

const mySpecificSubGroupTests =
()=>{
  /*
  this tests block will be inserted in a sub described part of classicHttpCrudTest
  all inner tests should be written as following :
     * get http requester via requester = testContext.httpRequesterFn();
       with or without .keepOpen() and .close()
     * testContext.expect(res)....
     * can access testContext.mainEntities initialized by classicHttpCrudTest main describe block 
  */

  it("post qcm_choices for first test qcm",async ()=>{
       let firstEntity = testContext.mainEntities[0];
       let idOfFirstEntity = testContext.extractIdFn(firstEntity)
       // firstEntity will be first entry of test/dataset/qcms.json
       //==> qcmChoice1 must have same questions/responses/choices number (ex: 2)
      
      let qcmChoice1 = {qcmId:idOfFirstEntity,
        mode:"training",
        qcmPerformer:{fullName:"",email:"",org:""},
        choices:[{num:1,selectedAnswerNums:["d"]}, {num:2,selectedAnswerNums:["c"]}]
      };
      //console.log("qcmChoice1=" + JSON.stringify(qcmChoice1));

       const requester = testContext.httpRequesterFn()
       const resPostQcmChoice1 = await requester.post('/qcm-api/v1/public/qcm_choices')
                     .send(qcmChoice1);
      // console.log("qcm_choices POST status=" + resPostQcmChoice1.status);
      expect(resPostQcmChoice1).to.have.status(201);
      
      console.log("qcm_choices POST result:="+ JSON.stringify(resPostQcmChoice1.body))
  });
}

return classicHttpCrudInnerTestObject(testContext);

}


