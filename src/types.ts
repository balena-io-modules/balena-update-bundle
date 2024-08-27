import { docker } from '@balena/resource-bundle';

export const BALENA_UPDATE_TYPE = 'io.balena.update@1';

export const REGISTRY_IMAGES_ID = 'registry-images';

export import BasicAuth = docker.BasicAuth;
export import BearerAuth = docker.BearerAuth;
export import Credentials = docker.Credentials;

interface BaseTargetState {
	version: string;
	state: any;
}

export interface DeviceTargetState extends BaseTargetState {
	deviceUuid: string;
}

export interface FleetTargetState extends BaseTargetState {
	appUuid: string;
	releaseUuid?: string;
}

export interface DeviceManifest {
	type: 'Device';
	config: DeviceTargetState[];
}

export interface FleetManifest {
	type: 'Fleet';
	config: FleetTargetState;
}

export type UpdateBundleManifest = DeviceManifest | FleetManifest;
