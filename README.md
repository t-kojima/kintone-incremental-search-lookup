# kintone-incremental-search-lookup

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Description

- Kintone plugin for mobile
- Lookup field for incremental search
- Overwrite existing lookup field

## Download

Please download zip archive

## Usage

### CustomEvents

```js
kintone.events.on('mobile.app.record.create.show', event => {
  const [element] = document.getElementsByClassName('<lookup field code>')

  // handle 'open-modal' event
  element.addEventListener('open-modal', ({ detail: { addQuery } }) => {
    // can filtering target app records
    addQuery('<kintone query>')
  })

  // handle 'select-item' event
  element.addEventListener('select-item', ({ detail: { record } }) => {
    console.log(record)
  })
})
```

## License

MIT License.
