import {
	docker,
	create as createResourceBundle,
} from '@balena/resource-bundle';

import { fetchDevicesTargetStates, fetchFleetTargetState } from './state';

import type {
	ImageDescriptor,
	UpdateCreateOptions,
	UpdateBundleManifest,
	FetchTargetStateResult,
	BearerAuth,
} from './types';
import { BALENA_UPDATE_TYPE } from './types';

export async function create(options: UpdateCreateOptions) {
	let targetStateRes: FetchTargetStateResult;
	if (options.type === 'Devices') {
		targetStateRes = await fetchDevicesTargetStates(
			options.deviceUuids,
			options.auth.token,
		);
	} else {
		targetStateRes = await fetchFleetTargetState(
			options.appUuid,
			options.auth.token,
			options.releaseUuid,
		);
	}

	const registryToken = await authenticate(targetStateRes.images, options.auth);

	const imagesRes = await docker.fetchImages(
		targetStateRes.images,
		registryToken,
	);

	let manifest: UpdateBundleManifest;
	if (targetStateRes.type === 'Devices') {
		manifest = {
			type: 'Devices',
			config: targetStateRes.config,
			images: imagesRes.images,
		};
	} else {
		manifest = {
			type: 'Fleet',
			config: targetStateRes.config,
			images: imagesRes.images,
		};
	}

	return createResourceBundle<UpdateBundleManifest>({
		type: BALENA_UPDATE_TYPE,
		manifest: manifest,
		resources: imagesRes.blobs,
		sign: options.sign,
	});
}

async function authenticate(
	images: ImageDescriptor[],
	credentials: BearerAuth,
): Promise<string | undefined> {
	const authResult = await docker.discoverAuthenticate(images);

	if (authResult == null) {
		return;
	}

	const [auth, scope] = authResult;

	return await docker.authenticate(auth, scope, credentials);
}
