import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import { describe } from 'mocha';

chai.use(chaiAsPromised);
const expect = chai.expect;

describe('common usage', () => {
	it('placeholder test', async () => {
		expect(true).to.eql(true);
	});
});
