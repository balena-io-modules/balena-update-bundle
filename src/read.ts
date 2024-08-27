import type * as stream from 'node:stream';

import { docker, open } from '@balena/resource-bundle';

import type { UpdateBundleManifest } from './types';
import { BALENA_UPDATE_TYPE, REGISTRY_IMAGES_ID } from './types';

export interface ReadableUpdateBundle {
	readonly manifest: UpdateBundleManifest;
	readonly archive: stream.Readable;
}

export async function read(
	input: stream.Readable,
	publicKey?: string,
): Promise<ReadableUpdateBundle> {
	const update = await open<UpdateBundleManifest>(input, BALENA_UPDATE_TYPE, {
		publicKey,
	});

	const manifest = update.manifest;

	const descriptor = update.resources.find((desc) => {
		if (desc.id !== REGISTRY_IMAGES_ID) {
			throw new Error(`Unexpected descriptor ID found in bundle: ${desc.id}`);
		}

		return desc;
	});

	if (descriptor == null) {
		throw new Error('Registry images not found in bundle');
	}

	const resource = update.readMultipart<docker.ImageSetManifest>(descriptor);
	const imageSet = docker.ImageSet.fromBundle(resource);
	const archive = imageSet.pack();

	return { manifest, archive };
}
