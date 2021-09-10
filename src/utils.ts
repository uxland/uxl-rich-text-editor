//Hay una issue detectada en el component quilljs que borra algunas palabras/parrafos al corregir palabras con el corrector del navegador
//Sólo pasa cuando el texto se ha copiado y enganchado de una fuente externa y contiene estilos(negritas, colores, etc).
//https://github.com/quilljs/quill/issues/2096
//Este fix corrige este comportamiento.
export const fixSpellCheckerIssue = (Quill) => {
  const Inline = Quill.import('blots/inline');

  class CustomAttributes extends Inline {
    constructor(domNode, value) {
      super(domNode, value);

      const span = this.replaceWith(new Inline(Inline.create()));

      span.children.forEach((child) => {
        if (child.attributes) child.attributes.copy(span);
        if (child.unwrap) child.unwrap();
      });

      // here we apply every attribute from <font> tag to span as a style
      Object.keys(domNode.attributes).forEach(function (key) {
        if (domNode.attributes[key].name != 'style') {
          var value = domNode.attributes[key].value;
          var name = domNode.attributes[key].name;
          if (name == 'face') name = 'font-family';
          span.format(name, value);
        }
      });

      this.remove();

      return span;
    }
  }

  CustomAttributes.blotName = 'customAttributes';
  CustomAttributes.tagName = 'FONT';

  Quill.register(CustomAttributes, true);
};
