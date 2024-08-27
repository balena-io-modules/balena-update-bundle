export { create, CreateOptions as UpdateCreateOptions } from './create';
export { read, ReadableUpdateBundle } from './read';

// TODO: Exctract functionality from create to add tests

// TODO: BALENA_API should be configurable (pass as argument)

// TODO: read should not depend on balena-resource-bundle
// and should repeat ImageSet.fromBundle usage
// TODO: readable update bundle should implement BundleConvertible
