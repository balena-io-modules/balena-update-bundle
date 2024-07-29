import type { SignOptions } from '@balena/resource-bundle';
import {
	docker,
	create as createResourceBundle,
} from '@balena/resource-bundle';

import type {
	ImageDescriptor,
	Credentials,
	UpdateBundleManifest,
} from './types';
import { BALENA_UPDATE_TYPE } from './types';

export async function create(
	state: any,
	images: ImageDescriptor[],
	creds?: Credentials,
	sign?: SignOptions,
) {
	const token = await authenticate(images, creds);

	const res = await docker.fetchImages(images, token);

	return createResourceBundle<UpdateBundleManifest>({
		type: BALENA_UPDATE_TYPE,
		manifest: {
			state,
			images: res.images,
		},
		resources: res.blobs,
		sign,
	});
}

async function authenticate(
	images: ImageDescriptor[],
	creds?: Credentials,
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
