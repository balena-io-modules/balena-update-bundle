import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import { describe } from 'mocha';

import { createUpdateBundle } from '../src/create';
import type { UpdateBundleManifest } from '../src/types';
import { read } from '../src/read';

chai.use(chaiAsPromised);
const expect = chai.expect;

describe('common usage', () => {
	it('create bundle with no images and read it', async () => {
		const manifest: UpdateBundleManifest = {
			type: 'Device',
			config: [],
		};

		const update = await createUpdateBundle(manifest, []);
		const readable = await read(update);

		readable.archive.resume();

		expect(readable.manifest).to.eql(manifest);
	});
});
