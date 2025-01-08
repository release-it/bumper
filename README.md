# Version read/write plugin for release-it

This plugin reads and/or writes version/manifest files.

```sh
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

Note that using `package.json` as `out` file may conflict with the npm plugin in release-it. Remove it from the `out`
file(s), or use
[`--npm.allowSameVersion`](https://github.com/release-it/release-it/blob/master/docs/npm.md#extra-arguments).

The supported file types are:

| Type | Extension(s)      | Mime-type                                                 |
| ---- | ----------------- | --------------------------------------------------------- |
| JSON | `.json`           | `application/json`                                        |
| YAML | `.yaml` or `.yml` | `text/yaml` or `application-x-yaml` or `application/yaml` |
| TOML | `.toml`           | `text/toml` or `application/toml`                         |
| INI  | `.ini`            | `text/x-properties`                                       |
| XML  | `.xml`            | `text/xml` or `application/xml`                           |
| HTML | `.html`           | `text/html` or `application/xhtml+xml`                    |
| TEXT | `.txt`            | `text/*`                                                  |

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

:warning: the operation is a search-and-replace; if the current version is not found in the file, the new version cannot be written out.

To instead always consume the entire file, that is, the whole and only content of the file is the version number, set `consumeWholeFile: true` for the `out` option:

```json
"plugins": {
  "@release-it/bumper": {
    "out": {
      "file": "VERSION",
      "type": "text/plain",
      "consumeWholeFile": true
    }
  }
}
```

The version number is then written to the output file, overwriting it completely instead of a search-and-replace.

:bulb: Setting `consumeWholeFile: true` precludes the use of prefixes, such as `v1.0.1` in the output file.

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

> For the `xml` type, the `path` option must be in the form of a unique [css selector](https://www.w3.org/TR/selectors-4/#overview). The following example will set the
`project > version` property to the new version in `pom.xml`:

```json
"plugins": {
  "@release-it/bumper": {
    "out": {
      "file": "pom.xml",
      "path": "project > version",
      "type": "application/xml"
    }
  }
}
```

> For the `html` type, the `path` option must be in the form of a unique [css selector](https://www.w3.org/TR/selectors-4/#overview). The following example will set the
element text content with the css attribute `#version` to the new version in `foo.html`:

```json
"plugins": {
  "@release-it/bumper": {
    "out": {
      "file": "foo.html",
      "path": "#version",
      "type": "text/html"
    }
  }
}
```

Multiple paths can be provided using an array.

The `versionPrefix` option (default: `''`) can be used in cases where you'd like to maintain a specific prefix for your version number (for example, in `package.json` where you might want versions like `^1.0.0`). This will prepend the specified prefix to the bumped version:

``` json
"plugins": {
  "@release-it/bumper": {
    "out": {
      "file": "package.json",
      "path": "version",
      "prefix": "^"
    }
  }
}
```

With the above configuration, if release-it determines the new version to be `1.0.0`, it'll be saved as `^1.0.0` in the targeted file.

## Command-line

Options for this plugin can be set from the command line. Some examples:

```
release-it --plugins.@release-it/bumper.in=composer.json
release-it --plugins.@release-it/bumper.out=composer.json --plugins.@release-it/bumper.out=manifest.json
```

- Keys are separated by dots.
- Values can be negated by prefixing the key with `no-`.
- Arguments may need to be single-quoted (`'`) such as `--'deep.key=value'` or `'--deep.key=value'`

Depending on your shell or OS this may differ.
