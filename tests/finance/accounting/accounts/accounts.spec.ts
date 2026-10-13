import {test} from '../../../helpers/test';
import {masterDataSuite} from '../../helpers/master-data';
test.describe('Finance / Accounting / Accounts',()=>{
 masterDataSuite({screen:'accounts',api:'accounts',label:'Accounts',prefix:'ACC-E2E',account:true});
});
