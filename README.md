# Update Bundle SDK

An Update Bundle is a specialized Resource Bundle used to carry a set of Docker images pulled from an image registry, along with a Balena Supervisor target state (metadata). It contains everything necessary for applying an offline update to a Balena device.

This project is a Typescript SDK for creating and consuming Balena update bundles.

## Installing

```
npm install --save @balena/update-bundle
```

## Usage

### Creating a bundle

Creating an update bundle is straightforward and involves calling the `create` function of the SDK. The first argument can be either a Balena release commit or a Balena device UUID. The second argument is the credentials for accessing the Balena registry and API. The `create` function returns a readable stream, which can be piped to a file or another destination. Internally, the `create` function fetches all image layers and associated metadata needed for performing an offline update.

```typescript
import * as fs from 'node:fs';
import { pipeline } from 'node:stream/promises';

import * as updateBundle from '@balena/update-bundle';

const balenaDeviceId = '11112222333344445555666677778888';

const credentials = {
    username: 'd_aaaabbbbccccddddeeeeffffaaaabbbb',
    password: 'ffffeeeeddddccccbbbbaaaaffffeeee',
};

const updateBundle = await updateBundle.create(
    balenaDeviceId,
    credentials,
);

const target = fs.createWriteStream('balena-update-bundle.tar');

await pipeline(updateBundle, target);
```

### Reading a bundle

The `read` SDK function is used for reading a stream containing an update bundle. It returns a `ReadableUpdateBundle` instance. The `archive` property of this instance is a readable stream in Docker Archive format, which can be used with the `docker load` API.

```typescript
import * as fs from 'node:fs';
import { pipeline } from 'node:stream/promises';

import * as updateBundle from '@balena/update-bundle';

const source = fs.createReadStream('balena-update-bundle.tar');

const bundle = await updateBundle.read(source);

const target = fs.createWriteStream('docker-archive.tar');

await pipeline(bundle.archive, target);
```

## License

This project is distributed under the Apache 2.0 license.

Copyright (c) 2024 Balena Ltd.
