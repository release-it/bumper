# Version read/write plugin for release-it

This plugin reads and/or writes version/manifest files.

```
npm install --save-dev @release-it/bumper
```

In [release-it](https://github.com/release-it/release-it) config:

```json
"plugins": {
  "@release-it/bumper": {
    "in": "composer.json",
    "out": "composer.json",
  }
}
```

- Use only the `in` option to _read_ the version from this file in the release-it process.
- Use only the `out` option to _write_ the version that was determined by release-it to this file.
- Use both to read _and_ write the `version` property from/to this file.

The `version` from the `in` file will take precedence over the latest Git tag (and the `version` from `package.json` if
it exists) in release-it to determine the latest version.

The supported file types are:

| Type | Extension(s)      | Mime-type                           |
| ---- | ----------------- | ----------------------------------- |
| JSON | `.json`           | `application/json`                  |
| YAML | `.yaml` or `.yml` | `text/yaml` or `application-x-yaml` |
| TOML | `.toml`           | `text/toml` or `application/toml`   |
| INI  | `.ini`            | `text/x-properties`                 |
| TEXT | `.txt`            | `text/*`                            |

Explicitly providing the (mime) `type` takes precedence over the file extension.

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

The `path` option (default: `"version"`) can be used to change a different property. The following example will set the
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
