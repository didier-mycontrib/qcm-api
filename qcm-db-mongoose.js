import mongoose from 'mongoose';
import { MongoDBContainer } from '@testcontainers/mongodb'

var mongodbContainer=null;//for integration-test (in jenkins or ...)

   
/*
       //stop mongodbContainer (in integration test mode):
     await mongodbContainer.stop();
*/
var mongoDbUrl = process.env.MONGODB_URL || "mongodb://127.0.0.1:27017"; //by default


console.log("mongoDbUrl="+mongoDbUrl);
mongoose.connect(mongoDbUrl, { dbName : 'qcm_db'});
var thisDb  = mongoose.connection;

thisDb.on('error' , function() { 
      console.log("mongoDb connection error = " + " for dbUrl=" + mongoDbUrl )
      //second chance:
      //start mongodbContainer (in integration test mode):
      if(mongodbContainer==null){
        mongodbContainer = new MongoDBContainer("mongo:8.0.12").start()
        .then((mongodbContainer)=>{ console.log("mdb:"+mongodbContainer.getConnectionString());})
        .catch((err)=>console.log(err))
        if(mongodbContainer!=null){
           mongoose.connect(mongodbContainer.getConnectionString(), { dbName : 'qcm_db'});
           thisDb  = mongoose.connection;
        }
      }
    });

thisDb.once('open', function() {
      // we're connected!
      console.log("Connected correctly to mongodb database" );
    });

export default { thisDb } ;

