import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import { describe } from 'mocha';

import * as bundle from '../src';

chai.use(chaiAsPromised);
const expect = chai.expect;

describe('common usage', () => {
	it('create bundle with no images and read it', async () => {
		const updateStream = await bundle.create({ hello: 'world' }, []);
		updateStream.resume();

		const readableBundle = await bundle.read(updateStream);

		readableBundle.archive.resume();

		expect(readableBundle.state).to.eql({ hello: 'world' });
		expect(readableBundle.images).to.eql([]);
	});
});
