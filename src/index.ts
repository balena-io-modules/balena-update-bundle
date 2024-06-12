import type * as stream from 'node:stream';

import { create, read, docker } from '@balena/resource-bundle';

export const BALENA_UPDATE_TYPE = 'io.balena.update@1';

export interface UpdateBundleManifest {
	state: any;
	images: docker.Image[];
}

export interface ReadableUpdateBundle {
	readonly state: any;
	readonly images: docker.Image[];
	readonly archive: stream.Readable;
}

export async function createUpdateBundle(
	state: any,
	images: docker.ImageDescriptor[],
	creds?: docker.Credentials,
) {
	const token = await authenticate(images, creds);

	const res = await docker.fetchImages(images, token);

	return create<UpdateBundleManifest>({
		type: BALENA_UPDATE_TYPE,
		manifest: {
			state,
			images: res.images,
		},
		resources: res.blobs,
	});
}

async function authenticate(
	images: docker.ImageDescriptor[],
	creds?: docker.Credentials,
): Promise<string | undefined> {
	const authResult = await docker.discoverAuthenticate(images);

	if (authResult == null) {
		return;
	}

	if (creds == null) {
		throw new Error(
			'Docker registry requires authentication, but credentials were not provided',
		);
	}

	const [auth, scope] = authResult;

	return await docker.authenticate(auth, scope, creds);
}

export async function readUpdateBundle(
	input: stream.Readable,
): Promise<ReadableUpdateBundle> {
	const bundle = await read<UpdateBundleManifest>(input, BALENA_UPDATE_TYPE);

	const { state, images } = bundle.manifest;

	const archive = new docker.DockerArchive(images);

	for (const resource of bundle.resources) {
		if (archive.containsImageBlob(resource)) {
			archive.addImageBlob(resource);
			continue;
		}
		throw new Error(`Found unexpected resource in bundle: ${resource.id}`);
	}

	return { state, images, archive: archive.finalize() };
}
