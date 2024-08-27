import {
	docker,
	create as createResourceBundle,
} from '@balena/resource-bundle';
import type { SignOptions } from '@balena/resource-bundle';

import { fetchDevicesTargetStates, fetchFleetTargetState } from './state';

import type { UpdateBundleManifest, BearerAuth } from './types';
import { BALENA_UPDATE_TYPE, REGISTRY_IMAGES_ID } from './types';

interface BaseCreateOptions {
	auth: BearerAuth;
	sign?: SignOptions;
}

export interface DeviceCreateOptions extends BaseCreateOptions {
	type: 'Device';
	deviceUuids: string[];
}

export interface FleetCreateOptions extends BaseCreateOptions {
	type: 'Fleet';
	appUuid: string;
	releaseUuid?: string;
}

export type CreateOptions = DeviceCreateOptions | FleetCreateOptions;

export async function create(options: CreateOptions) {
	let targetState;
	let imageNames;
	if (options.type === 'Device') {
		[targetState, imageNames] = await fetchDevicesTargetStates(
			options.deviceUuids,
			options.auth.token,
		);
	} else {
		[targetState, imageNames] = await fetchFleetTargetState(
			options.appUuid,
			options.auth.token,
			options.releaseUuid,
		);
	}

	const { auth, images } = await docker.discoverAuthenticate(imageNames);

	let registryToken = undefined;
	if (auth != null) {
		registryToken = await docker.authenticate(auth, options.auth);
	}

	const imageSet = await docker.ImageSet.fromImages(images, registryToken);

	let manifest: UpdateBundleManifest;
	if (targetState.type === 'Device') {
		manifest = {
			type: 'Device',
			config: targetState.config,
		};
	} else {
		manifest = {
			type: 'Fleet',
			config: targetState.config,
		};
	}

	return createResourceBundle<UpdateBundleManifest>(
		{
			type: BALENA_UPDATE_TYPE,
			manifest,
			resources: [
				{
					id: REGISTRY_IMAGES_ID,
					contents: imageSet.contents,
				},
			],
		},
		{
			sign: options.sign,
		},
	);
}
