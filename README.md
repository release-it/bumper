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

The supported file types are:

- `*.json` (or explicitly provide the `application/json` type)
- `*.yaml` and `*.yml` (or explicitly provide `text/yaml` or `application-x-yaml` for `type`)
- `*.toml` (or set `application/toml` or `text/toml` for `type`)
- `*.ini` for INI files (or set `text/x-properties` mime `type`)
- `*.txt` for text files (or set any `text/*` mime `type`)

The fallback type is `text` if the file extension and/or `type` is not known (e.g. `index.php`).

```json
"plugins": {
  "@release-it/bumper": {
    "in": {
      "file": "VERSION",
      "type": "text/plain"
    },
    "out": {
      "file": "VERSION",
      "type": "text/plain"
    }
  }
}
```

To replace all occurences of the current version with the new version in any text file:

```json
"plugins": {
  "@release-it/bumper": {
    "out": {
      "file": "file.php",
      "type": "text/php"
    }
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

The `out` option is parsed with [fast-glob](https://github.com/mrmlnc/fast-glob), so glob patterns can be used to match
files to write to:

```json
"plugins": {
  "@release-it/bumper": {
    "out": "dist/*.json"
  }
}
```

The `path` option (default: `"version"`) can be used to change a different property. the following example will set the
`current.version` property to the new version in `manifest.json`:

```json
"plugins": {
  "@release-it/bumper": {
    "out": {
      "file": "manifest.json",
      "path": "current.version"
    }
  }
}
```

Multiple paths can be provided using an array.
