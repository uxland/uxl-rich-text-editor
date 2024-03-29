import { css, customElement, html, LitElement, property, unsafeCSS } from 'lit-element';
import Quill from 'uxl-quill/dist/quill';
//@ts-ignore
import undo_icon from 'uxl-quill/assets/icons/undo.svg';
//@ts-ignore
import redo_icon from 'uxl-quill/assets/icons/redo.svg';
import styles from './styles.scss';
import { template } from './template';
import { fixSpellCheckerIssue } from './utils';

fixSpellCheckerIssue(Quill);

@customElement('uxl-rich-text-editor')
export class UxlRichTextEditor extends LitElement {
  constructor() {
    super();
  }

  render() {
    return html` ${template(this)} `;
  }

  static get styles() {
    return css`
      ${unsafeCSS(styles)}
    `;
  }

  firstUpdated() {
    let uxlRte = this;
    this.quill = new Quill(uxlRte.shadowRoot.querySelector('#uxl-rte'), this._getOptions());
    (<any>this.quill).on('text-change', function (delta, oldDelta, source) {
      let plainValue = (<any>uxlRte.quill).getText();
      let values = {
        html: (<any>uxlRte).shadowRoot.querySelector('.ql-editor').innerHTML,
        plain: plainValue,
      };

      let textChanged = new CustomEvent('text-changed', { composed: true, text: values });
      (<any>uxlRte).dispatchEvent(textChanged);
    });
  }

  @property()
  quill: any;

  @property()
  options: string;

  @property()
  availableOptions: string[] = [
    'bold',
    'italic',
    'underline',
    'strike',
    'blockquote',
    'code-block',
    'image',
    'video',
    'link',
    'color',
    'background',
    'ol',
    'ul',
    'subindex',
    'superindex',
    'outdent',
    'indent',
    'size',
    'header',
    'font',
    'align',
    'clear',
    'undo',
    'redo',
  ];

  @property()
  availableFormats: string[] = [
    'background',
    'bold',
    'color',
    'font',
    'code',
    'italic',
    'link',
    'size',
    'strike',
    'script',
    'underline',
    'blockquote',
    'header',
    'indent',
    'list',
    'align',
    'direction',
    'code-block',
    'formula',
    'image',
    'video',
  ];

  @property()
  formats: string;

  _getOptions() {
    let toolbarOptions = [];
    let availableOpts = this.availableOptions;
    if (this.options === undefined || this.options.length == 0) {
      toolbarOptions = [
        ['bold', 'italic', 'underline', 'strike'],
        ['blockquote', 'code-block'],
        [{ header: 1 }, { header: 2 }],
        [{ list: 'ordered' }, { list: 'bullet' }],
        [{ script: 'sub' }, { script: 'super' }],
        [{ indent: '-1' }, { indent: '+1' }],
        [{ direction: 'rtl' }],
        [{ size: ['small', false, 'large', 'huge', '20px'] }],
        [{ header: [1, 2, 3, 4, 5, 6, false] }],
        [{ color: [] }, { background: [] }],
        [{ font: [] }],
        [{ align: [] }],
        ['image'],
        ['video'],
        ['clean'],
      ];
    } else {
      toolbarOptions = this.options.split(',');
      toolbarOptions.map(function (option) {
        if (availableOpts.indexOf(option) <= -1) toolbarOptions.splice(toolbarOptions.indexOf(option), 1);
      });
      toolbarOptions = toolbarOptions.map(function (option) {
        if (option == 'color') return { color: [] };
        else if (option == 'ol') return { list: 'ordered' };
        else if (option == 'ul') return { list: 'bullet' };
        else if (option == 'subindex') return { script: 'sub' };
        else if (option == 'superindex') return { script: 'super' };
        else if (option == 'outdent') return { indent: '-1' };
        else if (option == 'indent') return { indent: '+1' };
        else if (option == 'size') return { size: ['small', false, 'large', 'huge'] };
        else if (option == 'header') return { header: [1, 2, 3, 4, 5, 6, false] };
        else if (option == 'background') return { background: [] };
        else if (option == 'font') return { font: [] };
        else if (option == 'align') return { align: [] };
        else if (option == 'undo') return { undo: undo_icon };
        else if (option == 'redo') return { redo: redo_icon };
        else return option;
      });
      if (toolbarOptions.indexOf('clean') < 0) {
        toolbarOptions.push('clean');
      }
    }

    let icons = Quill.import('ui/icons');
    icons['undo'] = undo_icon;
    icons['redo'] = redo_icon;

    let formats = this.availableFormats;
    if (this.formats) {
      formats = this.formats.split(',');
    }

    let options = {
      modules: {
        toolbar: {
          container: toolbarOptions,
          handlers: {
            redo() {
              this.quill.history.redo();
            },
            undo() {
              this.quill.history.undo();
            },
          },
        },
        history: {
          delay: 1000,
          maxStack: 50,
          userOnly: false,
        },
        keyboard: {
          bindings: {
            'list autofill': {
              key: ' ',
              shiftKey: null,
              collapsed: true,
              format: {
                'code-block': false,
                blockquote: false,
                table: false,
              },
              prefix: /^\s*?(\d+\.|-|\*)$/,
              handler(range, context) {
                if (this.quill.scroll.query('list') == null) return true;
                const { length } = context.prefix;
                const [line, offset] = this.quill.getLine(range.index);
                if (offset > length) return true;
                this.quill.insertText(range.index, ' ', Quill.sources.USER);
                this.quill.setSelection(range.index - length, Quill.sources.SILENT);
                return false;
              },
            },
          },
        },
      },
      theme: 'snow',
      formats: formats,
    };
    return options;
  }
}
