import { firstLevelTestWithTestContainer } from './generic-chai-http-mocha-test.js';
import { qcmClassicSubTestGroup } from './qcm-api.test.js'


//NB: in script (.sh, .bat , ...) : set/export WITHOUT_AUTH=yes // undefined by default
//WITHOUT THAT , security (auth check) will block private requests (post, ..)

firstLevelTestWithTestContainer(
    [
     qcmClassicSubTestGroup()
    ]);