import {test} from '../../../helpers/test';
import {masterDataSuite} from '../../helpers/master-data';
test.describe('Finance / Accounting / Cost Centers',()=>{
 masterDataSuite({screen:'cost-centers',api:'cost_centers',label:'Cost Centers',prefix:'CC-E2E',account:false});
});
