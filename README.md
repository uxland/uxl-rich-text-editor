# UXL Rich Text Editor
A customizable rich text editor for Polymer 3
```html
<uxl-rich-text-editor options="...">
  ...
</uxl-rich-text-editor>
```

## Installation
Run the following command in your project console
```
$ npm i @uxland-admin/uxl-rich-text-editor
```

## Description
`<uxl-rich-text-editor>` is a component that provides a material design based rich text editor for your project

### Usage
The component provides a default toolbar but it can be customizable through the `option` variable:
```
<uxl-rich-text-editor options="bold,italic, ..."><
```
### Available `<uxl-rich-text-editor>` options:
`bold`: Adds the bold button

`italic`: Adds the italic button

`underline`: Adds the underline button

`strike`: Adds the strike button

`blockquote`: Adds the block quote button

`code-block`: Adds the code block button

`image`: Adds upload image button

`video`: Adds upload video button

`formula`: Adds upload formula button

`link`: Adds upload link button

`color`: Adds a dropdown list with available font colors 

`background`: Adds a dropdown list with available background colors

`ol`: Adds the ordened list button

`ul`: Adds the unordened list button

`subindex`: Adds the subindex button

`superindex`: Adds the superindex button

`outdent`: Adds the outdent button

`indent`: Adds the indent button

`size`: Adds a dropdown list with the available font sizes

`header`: Adds a dropdown list with the header sizes

`font`: Adds a dropdown list with the available fonts

`align`: Adds the align button