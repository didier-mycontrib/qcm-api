import mongoose from 'mongoose';

function thisDbFn(){

   let mongoDbUrl = process.env.MONGODB_URL || "mongodb://127.0.0.1:27017"; //by default
   let cnxOptions = {}
   if(process.env.TEST_MODE=="IT"){
      cnxOptions = { directConnection: true , dbName : 'qcm_db' }
    }
    else{
      cnxOptions = { dbName : 'qcm_db'}
    }

   console.log("mongoDbUrl="+mongoDbUrl);
   mongoose.connect(mongoDbUrl, cnxOptions);
   var thisDb  = mongoose.connection;

    thisDb.on('error' , function() { 
      console.log("mongoDb connection error = " + " for dbUrl=" + mongoDbUrl )
    });

    thisDb.once('open', function() {
      // we're connected!
      console.log("Connected correctly to mongodb database" );
    });

    return thisDb;

}
//export default { thisDb } ; //old static version
export default { thisDbFn } ; //new dynamic version (must be called)

