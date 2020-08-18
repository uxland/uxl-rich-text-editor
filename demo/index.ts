import { UxlRichTextEditor } from '../src/uxl-rich-text-editor';
const uxlRichTextEditor = new UxlRichTextEditor();
uxlRichTextEditor.options =
  'bold,italic,underline,strike,color,background,ol,ul,blockquote,code-block,subindex,superindex,outdent,indent,size,header,font,align,image,undo,redo';
document.body.appendChild(uxlRichTextEditor as any);
