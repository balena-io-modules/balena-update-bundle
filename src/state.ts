import type {
	DeviceTargetState,
	DeviceManifest,
	FleetTargetState,
	FleetManifest,
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
): string[] {
	const images = [];

	for (const device of Object.values(targetState)) {
		for (const app of Object.values(device.apps)) {
			for (const release of Object.values(app.releases)) {
				for (const service of Object.values(release.services)) {
					images.push(service.image);
				}
			}
		}
	}

	return images;
}

export async function fetchDevicesTargetStates(
	deviceUUIDs: string[],
	token: string,
): Promise<[DeviceManifest, string[]]> {
	const config: DeviceTargetState[] = [];
	const deduplicatedImages: string[] = [];

	for (const uuid of deviceUUIDs) {
		const state = await fetchSingleDeviceTargetState(uuid, token);

		for (const image of listImagesFromTargetState(state)) {
			if (deduplicatedImages.includes(image)) {
				continue;
			}

			deduplicatedImages.push(image);
		}

		config.push({
			deviceUuid: uuid,
			version: '3',
			state,
		});
	}

	return [
		{
			type: 'Device',
			config,
		},
		deduplicatedImages,
	];
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
): Promise<[FleetManifest, string[]]> {
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

	const config: FleetTargetState = {
		appUuid,
		releaseUuid,
		version: '3',
		state,
	};

	const images = listImagesFromTargetState(state);

	return [
		{
			type: 'Fleet',
			config,
		},
		images,
	];
}
