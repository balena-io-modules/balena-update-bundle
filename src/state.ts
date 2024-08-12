import { docker } from '@balena/resource-bundle';

import type {
	ImageDescriptor,
	DeviceConfig,
	FleetConfig,
	FetchTargetStateResult,
} from './types';

const BALENA_API = 'https://api.balena-cloud.com';

function getAPIHeaders(token: string) {
	return {
		'Content-Type': 'application/json',
		Authorization: `Bearer ${token}`,
		'Accept-Encoding': 'gzip',
	};
}

export interface DeviceStateV3 {
	[deviceUuid: string]: {
		name?: string;
		config: {
			[key: string]: string;
		};
		apps: {
			[appUuid: string]: {
				release_uuid?: string;
				releases: {
					[releaseUuid: string]: {
						services: {
							[serviceName: string]: {
								image: string;
							};
						};
					};
				};
			};
		};
	};
}

export function listImagesFromTargetState(
	targetState: DeviceStateV3,
): ImageDescriptor[] {
	const images = [];

	for (const device of Object.values(targetState)) {
		for (const app of Object.values(device.apps)) {
			for (const release of Object.values(app.releases)) {
				for (const service of Object.values(release.services)) {
					images.push(docker.parseImageName(service.image));
				}
			}
		}
	}

	return images;
}

function addImage(
	image: ImageDescriptor,
	deduplicatedImages: ImageDescriptor[],
) {
	for (const existingImage of deduplicatedImages) {
		if (
			image.reference === existingImage.reference &&
			image.registry === existingImage.registry &&
			image.repository === existingImage.repository
		) {
			return;
		}
	}

	deduplicatedImages.push(image);
}

export async function fetchDevicesTargetStates(
	deviceUUIDs: string[],
	token: string,
): Promise<FetchTargetStateResult> {
	const config: DeviceConfig[] = [];
	const deduplicatedImages: ImageDescriptor[] = [];

	for (const uuid of deviceUUIDs) {
		const state = await fetchSingleDeviceTargetState(uuid, token);

		for (const image of listImagesFromTargetState(state)) {
			addImage(image, deduplicatedImages);
		}

		config.push({
			deviceUuid: uuid,
			version: '3',
			state,
		});
	}

	return {
		type: 'Devices',
		config,
		images: deduplicatedImages,
	};
}

async function fetchSingleDeviceTargetState(
	device: string,
	token: string,
): Promise<DeviceStateV3> {
	const url = `${BALENA_API}/device/v3/${device}/state`;

	const response = await fetch(url, {
		method: 'GET',
		headers: getAPIHeaders(token),
	});

	if (response.body == null) {
		throw new Error(`Empty device target state for ${device}`);
	}

	return await response.json();
}

export async function fetchFleetTargetState(
	appUuid: string,
	token: string,
	releaseUuid?: string,
): Promise<FetchTargetStateResult> {
	let releaseParam: string;
	if (releaseUuid == null) {
		releaseParam = '';
	} else {
		releaseParam = releaseUuid;
	}

	const url = `${BALENA_API}/device/v3/fleet/${appUuid}/state/?releaseUuid=${releaseParam}`;

	const response = await fetch(url, {
		method: 'GET',
		headers: getAPIHeaders(token),
	});

	if (response.body == null) {
		throw new Error(
			`Empty application target state for ${appUuid} and ${releaseUuid}`,
		);
	}

	const state = await response.json();

	const config: FleetConfig = {
		appUuid,
		releaseUuid,
		version: '3',
		state,
	};

	const images = listImagesFromTargetState(state);

	return {
		type: 'Fleet',
		config,
		images,
	};
}
