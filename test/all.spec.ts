import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import { describe } from 'mocha';

import * as bundle from '../src';

chai.use(chaiAsPromised);
const expect = chai.expect;

describe('common usage', () => {
	it('inspect balena update type', async () => {
		expect(bundle.BALENA_UPDATE_TYPE).to.eql('io.balena.update@1');
	});
});
