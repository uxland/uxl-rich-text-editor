import { css, customElement, html, LitElement, property, unsafeCSS } from 'lit-element';
import Quill from 'uxl-quill/dist/quill';
import styles from './styles.scss';
import { template } from './template';

let quill = '';
@customElement('uxl-rich-text-editor')
export class UxlRichTextEditor extends LitElement {
  constructor() {
    super();
  }

  render() {
    return html`
      ${template(this)}
    `;
  }

  static get styles() {
    return css`
      ${unsafeCSS(styles)}
    `;
  }

  firstUpdated() {
    let uxlRte = this;
    quill = new Quill(uxlRte.shadowRoot.querySelector('#uxl-rte'), this._getOptions());
    (<any>quill).on('text-change', function(delta, oldDelta, source) {
      let values = {
        html: (<any>uxlRte).shadowRoot.querySelector('.ql-editor').innerHTML,
        plain: (<any>quill).getText()
      };
      let textChanged = new CustomEvent('text-changed', { composed: true, text: values });
      (<any>uxlRte).dispatchEvent(textChanged);
    });
  }

  @property()
  quill: object;

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
    'clear'
  ];

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
        ['clean']
      ];
    } else {
      toolbarOptions = this.options.split(',');
      toolbarOptions.map(function(option) {
        if (availableOpts.indexOf(option) <= -1) toolbarOptions.splice(toolbarOptions.indexOf(option), 1);
      });
      toolbarOptions = toolbarOptions.map(function(option) {
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
        else return option;
      });
      if (toolbarOptions.indexOf('clean') < 0) {
        toolbarOptions.push('clean');
      }
    }

    let options = {
      modules: {
        toolbar: toolbarOptions,
        history: {
          delay: 1000,
          maxStack: 50,
          userOnly: false
        }
      },
      theme: 'snow'
    };
    return options;
  }
}
