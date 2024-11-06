![](https://badgen.net/badge/Editor.js/v2.19.2/blue)

# Editorjs List Tool

Multi-leveled lists for the [Editor.js](https://editorjs.io).

Use `Tab` and `Shift+Tab` keys to create or remove sublist with a padding.

![](assets/example.gif)

## Features

- 🤩 Part of [Editor.js](https://editorjs.io/) ecosystem.
- 📂 Nesting.
- 🔥 Ordered and Unordered lists.
- ✅ Checklists.
- 🔢 Customizable start number.
- 🏛️ Customizable counter type (e.g. `lower-roman`).
- 🪜 Max nesting level configuration.
- 📝 Compatible with [List](https://github.com/editor-js/list) and [Checklist](https://github.com/editor-js/checklist).

## Installation

Get the package

```shell
yarn add @editorjs/list
```

Include module at your application

```javascript
import List from '@editorjs/list';
```

Optionally, you can load this tool from CDN [JsDelivr CDN](https://cdn.jsdelivr.net/npm/@editorjs/list@latest)

## Usage

Add the List Tool to the `tools` property of the Editor.js initial config.

```javascript
import EditorJS from '@editorjs/editorjs';
import List from '@editorjs/list';

var editor = EditorJS({
  // ...
  tools: {
    ...
    list: {
      class: List,
      inlineToolbar: true,
      config: {
        defaultStyle: 'unordered'
      },
    },
  },
});
```

## Config Params

| Field        | Type     | Description                                                    |
|--------------|----------|----------------------------------------------------------------|
| defaultStyle | `string` | default list style: `ordered`, `unordered` or `checklist`, default is `unordered` |
| maxLevel     | `number` | maximum level of the list nesting, could be set to `1` to disable nesting, unlimited by default |

## Output data

| Field             | Type      |  Description                                                                                                              | List type                           |
| ----------------- | --------- | ------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| style             | `string`  |  list will be rendered with this style: `ordered`, `unordered` or `checklist`, default is `defaultStyle` from tool config | `ordered`, `unordered`, `checklist` |
| start             | `number`  |  list will start with this number, default is `1`                                                                         | `ordered`                           |
| counterType       | `number`  |  type of the counters: `numeric`, `lower-roman`, `upper-roman`, `lower-alpha`, `upper-alpha`, default is `numeric`        | `ordered`                           |
| items             | `Item[]`  |  the array of list's items                                                                                                | `ordered`, `unordered`, `checklist` |

Object `Item`:

| Field   | Type       | Description                 |
| ------- | ---------- | --------------------------- |
| content | `string`   | item's string content       |
| meta    | `ItemMeta` | meta information about item |
| items   | `Item[]`   | the array of list's items   |

Object `ItemMeta` for Checklist:

| Field   | Type      | Description               |
| ------- | --------- | ------------------------- |
| checked | `boolean` | state of the checkbox     |

Object `ItemMeta` for Ordered and Unordered lists would be empty.


## Example of the content for `Unordered List`
```json
{
  "type" : "list",
  "data" : {
    "style": "unordered",
    "maxLevel": 1,
    "items": [
      {
        "content": "Apples",
        "meta": {},
        "items": [
          {
            "content": "Red",
            "meta": {},
            "items": []
          },
        ]
      },
    ]
  }
},
```

## Example of the content for `Ordered List`
```json
{
  "type" : "list",
  "data" : {
    "style": "ordered",
    "start": 2,
    "counterType": "upper-roman",
    "maxLevel": 4,
    "items" : [
      {
        "content": "Apples",
        "meta": {},
        "items": [
          {
            "content": "Red",
            "meta": {},
            "items": []
          },
        ]
      },
    ]
  }
},
```

## Example of the content for `Checklist`
```json
{
  "type" : "list",
  "data" : {
    "style": "checklist",
    "maxLevel": 4,
    "items" : [
      {
        "content": "Apples",
        "meta": {
          "checked": false
        },
        "items": [
          {
            "content": "Red",
            "meta": {
              "checked": true
            },
            "items": []
          },
        ]
      },
    ]
  }
},
```
