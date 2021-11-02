import { UxlRichTextEditor } from '../src/uxl-rich-text-editor';
const uxlRichTextEditor = new UxlRichTextEditor();

uxlRichTextEditor.options =
  'bold,italic,underline,strike,color,background,ol,ul,blockquote,code-block,subindex,superindex,outdent,indent,size,header,font,align,image,undo,redo';
uxlRichTextEditor.formats =
  'background,bold,color,font,code,italic,link,size,strike,script,underline,blockquote,header,indent,list,align,direction,code-block,formula,image,video';
document.body.appendChild(uxlRichTextEditor as any);
