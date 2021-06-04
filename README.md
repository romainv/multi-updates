# multi-updates

Update npm dependencies across all packages in a monorepo, with support for
version constraints

multi-updates is a simple CLI tool that uses
[`updates`](https://www.npmjs.com/package/updates) to find new versions of npm
dependencies in multiple packages
([`updates`](https://www.npmjs.com/package/updates) operates on a single
package). The typical use-case is to streamline version management in
monorepos, where having multiple versions of the same dependency across
packages can cause conflicts.

## Install

```bash
# install globally
npm install -g multi-updates

# or install locally as a devDependency
npm install --save-dev multi-updates
```

## Usage

The basic usage is as follow:

```bash
# Check and select available updates, then reinstall modules
multi-updates && npm install
```

You can configure multi-updates by providing the following parameters:

```json
{
  "multiUpdates": {
    "packages": ["./", "packages/*"],
    "exclude": ["packageA", "packageB"],
    "constraints": { "eslint": "^7.11.0", "jest": "26.6.0" }
  }
}
```

where:

- `packages` is a list of [globs](https://www.npmjs.com/package/glob) pointing
  at the packages to check
- `exclude` is a list of dependencies for which updates won't be checked
- `constraints` is a mapping of dependencies to their constrained version,
  in the usual [npm format](https://github.com/npm/node-semver). Those
  dependencies will be set to the supplied version in all the packages,
  regardless of available updates

The configuration can be specified in various ways (by order of precedence):

- any file specified by the `--config` parameter that can be read with node's
  `require` function
- a `multi-updates.config.js` file located at the monorepo's root
- a `multi-updates.config.json` file located at the monorepo's root
- a `multiUpdates` entry specified in the root `package.json` file, as
  pictured above

For an example of an actual configuration file, check
[`multi-updates.config.sample.js`](./multi-updates.config.sample.js).

## License

multi-updates is [MIT licensed](./LICENSE)
