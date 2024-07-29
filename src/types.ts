import type * as stream from 'node:stream';

import { docker } from '@balena/resource-bundle';

export const BALENA_UPDATE_TYPE = 'io.balena.update@1';

export import BasicAuth = docker.BasicAuth;
export import BearerAuth = docker.BearerAuth;
export import Credentials = docker.Credentials;
export import ImageBlob = docker.ImageBlob;
export import ImageManifest = docker.ImageManifest;
export import ImageDescriptor = docker.ImageDescriptor;
export import Image = docker.Image;

export interface UpdateBundleManifest {
	state: any;
	images: Image[];
}

export interface ReadableUpdateBundle {
	readonly state: any;
	readonly images: Image[];
	readonly archive: stream.Readable;
}
