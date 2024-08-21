import type * as stream from 'node:stream';

import type { SignOptions } from '@balena/resource-bundle';
import { docker } from '@balena/resource-bundle';

export const BALENA_UPDATE_TYPE = 'io.balena.update@1';

export import BasicAuth = docker.BasicAuth;
export import BearerAuth = docker.BearerAuth;
export import Credentials = docker.Credentials;
export import ImageBlob = docker.ImageBlob;
export import ImageManifest = docker.ImageManifest;
export import ImageDescriptor = docker.ImageDescriptor;
export import Image = docker.Image;

interface BaseManifest {
	type: string;
	config: any;
	images: Image[];
}

interface BaseTargetState {
	version: string;
	state: any;
}

export interface DeviceConfig extends BaseTargetState {
	deviceUuid: string;
}

export interface FleetConfig extends BaseTargetState {
	appUuid: string;
	releaseUuid?: string;
}

export interface DevicesUpdateManifest extends BaseManifest {
	type: 'Devices';
	config: DeviceConfig[];
}

export interface FleetUpdateManifest extends BaseManifest {
	type: 'Fleet';
	config: FleetConfig;
}

export type UpdateBundleManifest = DevicesUpdateManifest | FleetUpdateManifest;

interface BaseCreateOptions {
	type: string;
	auth: BearerAuth;
	sign?: SignOptions;
}

export interface DevicesUpdateCreateOptions extends BaseCreateOptions {
	type: 'Devices';
	deviceUuids: string[];
}

export interface FleetUpdateCreateOptions extends BaseCreateOptions {
	type: 'Fleet';
	appUuid: string;
	releaseUuid?: string;
}

export type UpdateCreateOptions =
	| DevicesUpdateCreateOptions
	| FleetUpdateCreateOptions;

interface BaseTargetStateResult {
	type: string;
	config: any;
	images: ImageDescriptor[];
}

export interface DevicesFetchTargetStateResult extends BaseTargetStateResult {
	type: 'Devices';
	config: DeviceConfig[];
}

export interface FleetFetchTargetStateResult extends BaseTargetStateResult {
	type: 'Fleet';
	config: FleetConfig;
}

export type FetchTargetStateResult =
	| DevicesFetchTargetStateResult
	| FleetFetchTargetStateResult;

export interface ReadableUpdateBundle {
	readonly manifest: UpdateBundleManifest;
	readonly archive: stream.Readable;
}
