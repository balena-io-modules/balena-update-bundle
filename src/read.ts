import type * as stream from 'node:stream';

import { docker, read as readResourceBundle } from '@balena/resource-bundle';

import type { ReadableUpdateBundle, UpdateBundleManifest } from './types';
import { BALENA_UPDATE_TYPE } from './types';

export async function read(
	input: stream.Readable,
): Promise<ReadableUpdateBundle> {
	const update = await readResourceBundle<UpdateBundleManifest>(
		input,
		BALENA_UPDATE_TYPE,
	);

	const { state, images } = update.manifest;

	const archive = new docker.DockerArchive(images);

	for (const resource of update.resources) {
		if (archive.containsImageBlob(resource)) {
			archive.addImageBlob(resource);
			continue;
		}
		throw new Error(`Found unexpected resource in bundle: ${resource.id}`);
	}

	return { state, images, archive: archive.finalize() };
}
