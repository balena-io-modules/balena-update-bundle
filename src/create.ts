import type * as stream from 'node:stream';

import * as bundle from '@balena/resource-bundle';
import { docker } from '@balena/resource-bundle';
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

export async function create(options: CreateOptions): Promise<stream.Readable> {
	const [manifest, imageNames] = await fetchTargetState(options);

	const [images, token] = await authenticate(imageNames, options.auth);

	return await createUpdateBundle(manifest, images, token, options.sign);
}

async function fetchTargetState(
	options: CreateOptions,
): Promise<[UpdateBundleManifest, string[]]> {
	if (options.type === 'Device') {
		return await fetchDevicesTargetStates(
			options.deviceUuids,
			options.auth.token,
		);
	} else {
		return await fetchFleetTargetState(
			options.appUuid,
			options.auth.token,
			options.releaseUuid,
		);
	}
}

async function authenticate(
	imageNames: string[],
	credentials?: docker.BearerAuth,
): Promise<[docker.ImageDescriptor[], string | undefined]> {
	const { auth, images } = await docker.discoverAuthenticate(imageNames);

	let registryToken = undefined;
	if (auth != null) {
		registryToken = await docker.authenticate(auth, credentials);
	}

	return [images, registryToken];
}

export async function createUpdateBundle(
	manifest: UpdateBundleManifest,
	images: docker.ImageDescriptor[],
	token?: string,
	sign?: SignOptions,
): Promise<stream.Readable> {
	const imageSet = await docker.ImageSet.fromImages(images, token);

	return bundle.create<UpdateBundleManifest>(
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
			sign,
		},
	);
}
