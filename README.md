# Version read/write plugin for release-it

This plugin reads and/or writes version/manifest files.

```
npm install --save-dev @release-it/bumper
```

In [release-it](https://github.com/release-it/release-it) config:

```json
"plugins": {
  "@release-it/bumper": {
    "out": "manifest.json"
  }
}
```

In case the `in` option is used, the version from this file will take precedence over the `version` from `package.json`
or the latest Git tag (which release-it uses by default).

The default `type` is `application/json`, but `text/plain` and `text/yaml` or `application-x-yaml` are also supported.

```json
"plugins": {
  "@release-it/bumper": {
    "in": { "file": "VERSION", "type": "text/plain" },
    "out": { "file": "VERSION", "type": "text/plain" }
  }
}
```

The `out` option can also be an array of files:

```json
"plugins": {
  "@release-it/bumper": {
    "out": ["manifest.json", "bower.json"]
  }
}
```

## JSON and YAML

The `path` option (default: `"version"`) can be used to change a different property. the following example will set the
`current.version` property to the new version in `manifest.json` and `info.yml`:

```json
"plugins": {
  "@release-it/bumper": {
    "out": { "file": "manifest.json", "path": "current.version" },
    "out": { "file": "info.yml", "path": "current.version" }
  }
}
```

## text/plain

Two modes are supported :

### Whole file

In that case the whole file is used to read and/or write the version.

It's the default and the only option for `in` files.

```json
"plugins": {
  "@release-it/bumper": {
    "in": { "file": "VERSION", "type": "text/plain" },
    "out": { "file": "VERSION", "type": "text/plain" }
  }
}
```

### Replacements

Using the special path `replace` for `text/plain` files, the last version number is replaced by the new one.

Only `out` files are supported.

```json
"plugins": {
  "@release-it/bumper": {
    "in": "package.json",
    "out": { "file": "README.md", "type": "text/plain", "path": "replace" }
  }
}
```
