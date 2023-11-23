![](https://badgen.net/badge/Editor.js/v2.0/blue)

# List Tool for Editor.js

This Tool for the [Editor.js](https://editorjs.io) allows you to add ordered or unordered (bulleted) lists to your article.

![](assets/example.gif)

## Installation

Get the package

```shell
yarn add @editorjs/list
```

Include module at your application

```javascript
import List from "@editorjs/list";
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
      }
    },
  },
});
```

## Config Params

| Field        | Type     | Description                                                    |
| ------------ | -------- | -------------------------------------------------------------- |
| defaultStyle | `string` | type of a list: `ordered` or `unordered`, default is `ordered` |

## Tool's settings

![](assets/68747470733a2f2f636170656c6c612e706963732f62663561343265342d313335302d343939642d613732382d3439336230666361656461342e6a7067.jpeg)

You can choose list`s type.

## Output data

| Field | Type       | Description                              |
| ----- | ---------- | ---------------------------------------- |
| style | `string`   | type of a list: `ordered` or `unordered` |
| items | `string[]` | the array of list's items                |

```json
{
    "type" : "list",
    "data" : {
        "style" : "unordered",
        "items" : [
            "This is a block-styled editor",
            "Clean output data",
            "Simple and powerful API"
        ]
    }
},
```

## I18n support

This tool supports the [i18n api](https://editorjs.io/i18n-api).
To localize UI labels, put this object to your i18n dictionary under the `tools` section:

```json
"list": {
  "Ordered": "Нумерованный",
  "Unordered": "Маркированный"
}
```

See more instructions about Editor.js internationalization here: [https://editorjs.io/internationalization](https://editorjs.io/internationalization)
