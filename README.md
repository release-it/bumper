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

The default `type` is `application/json`, but `text/plain` is also supported.
In that case the whole file is used to read and/or write the version.

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
