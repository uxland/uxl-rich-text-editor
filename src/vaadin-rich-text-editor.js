/**
@license
Copyright (c) 2018 Vaadin Ltd.
This program is available under Apache License Version 2.0, available at https://vaadin.com/license/
*/
import { PolymerElement } from '@polymer/polymer/polymer-element.js';

import { timeOut } from '@polymer/polymer/lib/utils/async.js';
import { Debouncer } from '@polymer/polymer/lib/utils/debounce.js';
import { resetMouseCanceller } from '@polymer/polymer/lib/utils/gestures.js';
import { ThemableMixin } from '@vaadin/vaadin-themable-mixin/vaadin-themable-mixin.js';
import '@vaadin/vaadin-button/src/vaadin-button.js';
import '@vaadin/vaadin-confirm-dialog/src/vaadin-confirm-dialog.js';
import '@vaadin/vaadin-text-field/src/vaadin-text-field.js';
import { ElementMixin } from '@vaadin/vaadin-element-mixin/vaadin-element-mixin.js';
import '../vendor/vaadin-quill.js';
import './vaadin-rich-text-editor-styles.js';
import './vaadin-rich-text-editor-toolbar-styles.js';
import { html } from '@polymer/polymer/lib/utils/html-tag.js';
import { useShadow } from '@polymer/polymer/lib/utils/settings.js';

const Quill = window.Quill;

const HANDLERS = [
  'bold',
  'italic',
  'underline',
  'strike',
  'header',
  'script',
  'list',
  'align',
  'blockquote',
  'code-block'
];

const SOURCE = {
  USER: 'user',
  SILENT: 'silent'
};

const STATE = {
  DEFAULT: 0,
  FOCUSED: 1,
  CLICKED: 2
};

const TAB_KEY = 9;

/**
 * `<vaadin-rich-text-editor>` is a Web Component for rich text editing.
 * It provides a set of toolbar controls to apply formatting on the content,
 * which is stored and can be accessed as HTML5 or JSON string.
 *
 * ```
 * <vaadin-rich-text-editor></vaadin-rich-text-editor>
 * ```
 *
 * Vaadin Rich Text Editor focuses on the structure, not the styling of content.
 * Therefore, the semantic HTML5 tags such as <h1>, <strong> and <ul> are used,
 * and CSS usage is limited to most common cases, like horizontal text alignment.
 *
 * ### Styling
 *
 * The following state attributes are available for styling:
 *
 * Attribute    | Description | Part name
 * -------------|-------------|------------
 * `disabled`   | Set to a disabled text editor | :host
 * `readonly`   | Set to a readonly text editor | :host
 * `on`         | Set to a toolbar button applied to the selected text | toolbar-button
 *
 * The following shadow DOM parts are available for styling:
 *
 * Part name                      | Description
 * -------------------------------|----------------
 * `content`                      | The content wrapper
 * `toolbar`                      | The toolbar wrapper
 * `toolbar-group`                | The group for toolbar controls
 * `toolbar-button`               | The toolbar button (applies to all buttons)
 * `toolbar-button-undo`          | The "undo" button
 * `toolbar-button-redo`          | The "redo" button
 * `toolbar-button-bold`          | The "bold" button
 * `toolbar-button-italic`        | The "italic" button
 * `toolbar-button-underline`     | The "underline" button
 * `toolbar-button-strike`        | The "strike-through" button
 * `toolbar-button-h1`            | The "header 1" button
 * `toolbar-button-h2`            | The "header 2" button
 * `toolbar-button-h3`            | The "header 3" button
 * `toolbar-button-subscript`     | The "subscript" button
 * `toolbar-button-superscript`   | The "superscript" button
 * `toolbar-button-list-ordered`  | The "ordered list" button
 * `toolbar-button-list-bullet`   | The "bullet list" button
 * `toolbar-button-align-left`    | The "left align" button
 * `toolbar-button-align-center`  | The "center align" button
 * `toolbar-button-align-right`   | The "right align" button
 * `toolbar-button-image`         | The "image" button
 * `toolbar-button-link`          | The "link" button
 * `toolbar-button-blockquote`    | The "blockquote" button
 * `toolbar-button-code-block`    | The "code block" button
 * `toolbar-button-clean`         | The "clean formatting" button
 *
 * See [ThemableMixin – how to apply styles for shadow parts](https://github.com/vaadin/vaadin-themable-mixin/wiki)
 *
 * @memberof Vaadin
 * @mixes Vaadin.ElementMixin
 * @mixes Vaadin.ThemableMixin
 * @demo demo/index.html
 */
class RichTextEditorElement extends ElementMixin(ThemableMixin(PolymerElement)) {
  static get template() {
    return html`
    <style include="vaadin-rich-text-editor-styles">
      :host {
        display: flex;
        flex-direction: column;
        box-sizing: border-box;
        overflow: hidden;
      }

      :host([hidden]) {
        display: none !important;
      }

      .announcer {
        position: fixed;
        clip: rect(0, 0, 0, 0);
      }

      input[type="file"] {
        display: none;
      }

      .vaadin-rich-text-editor-container {
        display: flex;
        flex-direction: column;
        min-height: inherit;
        max-height: inherit;
        flex: auto;
      }

      /* FIXME (Yuriy): workaround for auto-grow feature in flex layout for IE11 */
      @media all and (-ms-high-contrast: none) {
        .ql-editor {
          flex: auto;
        }
      }
    </style>

    <div class="vaadin-rich-text-editor-container">
      <div part="toolbar">
        <span part="toolbar-group">
          <button type="button" part="toolbar-button toolbar-button-undo" on-click="_undo" title\$="[[i18n.undo]]"></button>
          <button type="button" part="toolbar-button toolbar-button-redo" on-click="_redo" title\$="[[i18n.redo]]"></button>
        </span>
        <span part="toolbar-group">
          <button class="ql-bold" part="toolbar-button toolbar-button-bold" title\$="[[i18n.bold]]"></button>
          <button class="ql-italic" part="toolbar-button toolbar-button-italic" title\$="[[i18n.italic]]"></button>
          <button class="ql-underline" part="toolbar-button toolbar-button-underline" title\$="[[i18n.underline]]"></button>
        </span>
        <span part="toolbar-group">
          <button type="button" class="ql-list" value="ordered" part="toolbar-button toolbar-button-list-ordered" title\$="[[i18n.listOrdered]]"></button>
          <button type="button" class="ql-list" value="bullet" part="toolbar-button toolbar-button-list-bullet" title\$="[[i18n.listBullet]]"></button>
        </span>
        <span part="toolbar-group">
          <button type="button" class="ql-align" value="" part="toolbar-button toolbar-button-align-left" title\$="[[i18n.alignLeft]]"></button>
          <button type="button" class="ql-align" value="center" part="toolbar-button toolbar-button-align-center" title\$="[[i18n.alignCenter]]"></button>
          <button type="button" class="ql-align" value="right" part="toolbar-button toolbar-button-align-right" title\$="[[i18n.alignRight]]"></button>
        </span>
        <span part="toolbar-group">
          <button type="button" class="ql-clean" part="toolbar-button toolbar-button-clean" title\$="[[i18n.clean]]"></button>
        </span>
      </div>

      <div part="content"></div>

      <div class="announcer" aria-live="polite"></div>

    </div>
`;
  }

  static get is() {
    return 'vaadin-rich-text-editor';
  }

  static get version() {
    return '1.0.0-alpha6';
  }

  static get properties() {
    return {
      /**
       * Value is a list of the operations which describe change to the document.
       * Each of those operations describe the change at the current index.
       * They can be an `insert`, `delete` or `retain`. The format is as follows:
       *
       * ```js
       *  [
       *    { insert: 'Hello World' },
       *    { insert: '!', attributes: { bold: true }}
       *  ]
       * ```
       *
       * See also https://github.com/quilljs/delta for detailed documentation.
       */
      value: {
        type: String,
        notify: true,
        value: ''
      },

      /**
       * HTML representation of the rich text editor content.
       */
      htmlValue: {
        type: String,
        notify: true,
        readOnly: true
      },

      /**
       * When true, the user can not modify, nor copy the editor content.
       */
      disabled: {
        type: Boolean,
        value: false,
        reflectToAttribute: true
      },

      /**
       * When true, the user can not modify the editor content, but can copy it.
       */
      readonly: {
        type: Boolean,
        value: false,
        reflectToAttribute: true
      },

      /**
       * An object used to localize this component. The properties are used
       * e.g. as the tooltips for the editor toolbar buttons.
       *
       * @default {English/US}
       */
      i18n: {
        type: Array,
        value: () => {
          return {
            undo: 'undo',
            redo: 'redo',
            bold: 'bold',
            italic: 'italic',
            underline: 'underline',
            strike: 'strike',
            h1: 'h1',
            h2: 'h2',
            h3: 'h3',
            subscript: 'subscript',
            superscript: 'superscript',
            listOrdered: 'list ordered',
            listBullet: 'list bullet',
            alignLeft: 'align left',
            alignCenter: 'align center',
            alignRight: 'align right',
            image: 'image',
            link: 'link',
            blockquote: 'blockquote',
            codeBlock: 'code block',
            clean: 'clean',
            linkDialogTitle: 'Link address',
            ok: 'OK',
            cancel: 'Cancel',
            remove: 'Remove'
          };
        }
      },

      _editor: {
        type: Object
      },

      /**
       * Stores old value
       */
      __oldValue: String,

      __lastCommittedChange: {
        type: String,
        value: ''
      },

      _linkEditing: {
        type: Boolean
      },

      _linkRange: {
        type: Object,
        value: null
      },

      _linkIndex: {
        type: Number,
        value: null
      },

      _linkUrl: {
        type: String,
        value: ''
      }
    };
  }

  static get observers() {
    return [
      '_valueChanged(value, _editor)',
      '_disabledChanged(disabled, readonly, _editor)'
    ];
  }

  ready() {
    super.ready();

    const editor = this.shadowRoot.querySelector('[part="content"]');
    const toolbarConfig = this._prepareToolbar();
    this._toolbar = toolbarConfig.container;

    this._addToolbarListeners();

    this._editor = new Quill(editor, {
      modules: {
        toolbar: toolbarConfig
      }
    });

    this.__patchToolbar();
    this.__patchKeyboard();

    /* istanbul ignore if */
    if (navigator.userAgent.toLowerCase().indexOf('firefox') > -1 && useShadow) {
      this.__patchFirefoxFocus();
    }

    this.$.linkDialog.$.dialog.$.overlay.addEventListener('vaadin-overlay-open', () => {
      this.$.linkUrl.focus();
    });

    const editorContent = editor.querySelector('.ql-editor');

    editorContent.setAttribute('role', 'textbox');
    editorContent.setAttribute('aria-multiline', 'true');

    this._editor.on('text-change', (delta, oldDelta, source) => {
      const timeout = 200;
      this.__debounceSetValue = Debouncer.debounce(
        this.__debounceSetValue,
        timeOut.after(timeout),
        () => {
          this.value = JSON.stringify(this._editor.getContents().ops);
        }
      );
    });

    editorContent.addEventListener('focusout', e => {
      if (this._toolbarState === STATE.FOCUSED) {
        this._cleanToolbarState();
      } else {
        this.__emitChangeEvent();
      }
    });

    editorContent.addEventListener('focus', e => {
      // format changed, but no value changed happened
      if (this._toolbarState === STATE.CLICKED) {
        this._cleanToolbarState();
      }
    });

    this._editor.on('selection-change', this.__announceFormatting.bind(this));
  }

  _prepareToolbar() {
    const clean = Quill.imports['modules/toolbar'].DEFAULTS.handlers.clean;
    const self = this;

    const toolbar = {
      container: this.shadowRoot.querySelector('[part="toolbar"]'),
      handlers: {
        clean: function() {
          self._markToolbarClicked();
          clean.call(this);
        }
      }
    };

    HANDLERS.forEach(handler => {
      toolbar.handlers[handler] = value => {
        this._markToolbarClicked();
        this._editor.format(handler, value, SOURCE.USER);
      };
    });

    return toolbar;
  }

  _addToolbarListeners() {
    const buttons = this._toolbarButtons;
    const toolbar = this._toolbar;

    // Disable tabbing to all buttons but the first one
    buttons.forEach((button, index) => index > 0 && button.setAttribute('tabindex', '-1'));

    toolbar.addEventListener('keydown', e => {
      // Use roving tab-index for the toolbar buttons
      if ([37, 39].indexOf(e.keyCode) > -1) {
        e.preventDefault();
        let index = buttons.indexOf(e.target);
        buttons[index].setAttribute('tabindex', '-1');
        if (e.keyCode === 39 && ++index === buttons.length) {
          index = 0;
        } else if (e.keyCode === 37 && --index === -1) {
          index = buttons.length - 1;
        }
        buttons[index].removeAttribute('tabindex');
        buttons[index].focus();
      }
      // Esc and Tab focuses the content
      if (e.keyCode === 27 || (e.keyCode === TAB_KEY && !e.shiftKey)) {
        e.preventDefault();
        this._editor.focus();
      }
    });

    // mousedown happens before editor focusout
    toolbar.addEventListener('mousedown', e => {
      if (buttons.indexOf(e.composedPath()[0]) > -1) {
        this._markToolbarFocused();
      }
    });
  }

  _markToolbarClicked() {
    this._toolbarState = STATE.CLICKED;
  }

  _markToolbarFocused() {
    this._toolbarState = STATE.FOCUSED;
  }

  _cleanToolbarState() {
    this._toolbarState = STATE.DEFAULT;
  }

  __createFakeFocusTarget() {
    const isRTL = document.documentElement.getAttribute('dir') == 'rtl';
    const elem = document.createElement('textarea');
    // Reset box model
    elem.style.border = '0';
    elem.style.padding = '0';
    elem.style.margin = '0';
    // Move element out of screen horizontally
    elem.style.position = 'absolute';
    elem.style[isRTL ? 'right' : 'left'] = '-9999px';
    // Move element to the same position vertically
    const yPosition = window.pageYOffset || document.documentElement.scrollTop;
    elem.style.top = `${yPosition}px`;
    return elem;
  }

  __patchFirefoxFocus() {
    // in Firefox 63 with native Shadow DOM, when moving focus out of
    // contenteditable and back again within same shadow root, cursor
    // disappears. See https://jsfiddle.net/webpadawan/g6vku9L3/
    const editorContent = this.shadowRoot.querySelector('.ql-editor');
    let isFake = false;

    const focusFake = () => {
      isFake = true;
      this.__fakeTarget = this.__createFakeFocusTarget();
      document.body.appendChild(this.__fakeTarget);
      // let the focus step out of shadow root!
      this.__fakeTarget.focus();
      return new Promise(resolve => setTimeout(resolve));
    };

    const focusBack = (offsetNode, offset) => {
      this._editor.focus();
      if (offsetNode) {
        this._editor.selection.setNativeRange(offsetNode, offset);
      }
      document.body.removeChild(this.__fakeTarget);
      delete this.__fakeTarget;
      isFake = false;
    };

    editorContent.addEventListener('mousedown', e => {
      if (!this._editor.hasFocus()) {
        const {x, y} = e;
        const {offset, offsetNode} = document.caretPositionFromPoint(x, y);
        focusFake().then(() => {
          focusBack(offsetNode, offset);
        });
      }
    });

    editorContent.addEventListener('focusin', e => {
      if (isFake === false) {
        focusFake().then(() => focusBack());
      }
    });
  }

  __patchToolbar() {
    const toolbar = this._editor.getModule('toolbar');
    const update = toolbar.update;

    // add custom link button to toggle state attribute
    toolbar.controls.push(['link', this.shadowRoot.querySelector('[part~="toolbar-button-link"]')]);

    toolbar.update = function(range) {
      update.call(toolbar, range);

      toolbar.controls.forEach(pair => {
        const input = pair[1];
        if (input.classList.contains('ql-active')) {
          input.setAttribute('on', '');
        } else {
          input.removeAttribute('on');
        }
      });
    };
  }

  __patchKeyboard() {
    const focusToolbar = () => {
      this._markToolbarFocused();
      this._toolbar.querySelector('button:not([tabindex])').focus();
    };

    const keyboard = this._editor.getModule('keyboard');
    const bindings = keyboard.bindings[TAB_KEY];

    // exclude Quill shift-tab bindings, except for code block,
    // as some of those are breaking when on a newline in the list
    // https://github.com/vaadin/vaadin-rich-text-editor/issues/67
    const originalBindings = bindings.filter(b => !b.shiftKey || b.format && b.format['code-block']);
    const moveFocusBinding = {key: TAB_KEY, shiftKey: true, handler: focusToolbar};

    keyboard.bindings[TAB_KEY] = [...originalBindings, moveFocusBinding];

    // alt-f10 focuses a toolbar button
    keyboard.addBinding({key: 121, altKey: true, handler: focusToolbar});
  }

  __emitChangeEvent() {
    this.__debounceSetValue && this.__debounceSetValue.flush();

    if (this.__lastCommittedChange !== this.value) {
      this.dispatchEvent(new CustomEvent('change', {bubbles: true, cancelable: false}));
      this.__lastCommittedChange = this.value;
    }
  }

  _onLinkClick() {
    const range = this._editor.getSelection();
    if (range) {
      const LinkBlot = Quill.imports['formats/link'];
      const [link, offset] = this._editor.scroll.descendant(LinkBlot, range.index);
      if (link != null) {
        // existing link
        this._linkRange = {index: range.index - offset, length: link.length()};
        this._linkUrl = LinkBlot.formats(link.domNode);
      } else if (range.length === 0) {
        this._linkIndex = range.index;
      }
      this._linkEditing = true;
    }
  }

  _applyLink(link) {
    if (link) {
      this._markToolbarClicked();
      this._editor.format('link', link, SOURCE.USER);
      this._editor.getModule('toolbar').update(this._editor.selection.savedRange);
    }
    this._closeLinkDialog();
  }

  _insertLink(link, position) {
    if (link) {
      this._markToolbarClicked();
      this._editor.insertText(position, link, {link});
      this._editor.setSelection(position, link.length);
    }
    this._closeLinkDialog();
  }

  _updateLink(link, range) {
    this._markToolbarClicked();
    this._editor.formatText(range, 'link', link, SOURCE.USER);
    this._closeLinkDialog();
  }

  _removeLink() {
    this._markToolbarClicked();
    if (this._linkRange != null) {
      this._editor.formatText(this._linkRange, {link: false, color: false}, SOURCE.USER);
    }
    this._closeLinkDialog();
  }

  _closeLinkDialog() {
    this._linkEditing = false;
    this._linkUrl = '';
    this._linkIndex = null;
    this._linkRange = null;
  }

  _onLinkEditConfirm() {
    if (this._linkIndex != null) {
      this._insertLink(this._linkUrl, this._linkIndex);
    } else if (this._linkRange) {
      this._updateLink(this._linkUrl, this._linkRange);
    } else {
      this._applyLink(this._linkUrl);
    }
  }

  _onLinkEditCancel() {
    this._closeLinkDialog();
    this._editor.focus();
  }

  _onLinkEditRemove() {
    this._removeLink();
    this._closeLinkDialog();
  }

  _onLinkKeydown(e) {
    if (e.keyCode === 13) {
      e.preventDefault();
      e.stopPropagation();
      this.$.confirmLink.click();
    }
  }

  __updateHtmlValue() {
    const className = 'ql-editor';
    const editor = this.shadowRoot.querySelector(`.${className}`);
    let content = editor.innerHTML;

    // Remove style-scoped classes that are appended when ShadyDOM is enabled
    Array.from(editor.classList).forEach(c => content = content.replace(new RegExp('\\s*' + c, 'g'), ''));

    // Remove Quill classes, e.g. ql-syntax, except for align
    content = content.replace(/\s*ql-(?!align)[\w\-]*\s*/g, '');

    // Replace Quill align classes with inline styles
    ['right', 'center', 'justify'].forEach(align => {
      content = content.replace(new RegExp(` class=[\\\\]?"\\s?ql-align-${align}[\\\\]?"`, 'g'), ` style="text-align: ${align}"`);
    });

    content = content.replace(/ class=""/g, '');

    this._setHtmlValue(content);
  }

  __announceFormatting() {
    const timeout = 200;

    const announcer = this.shadowRoot.querySelector('.announcer');
    announcer.textContent = '';

    this.__debounceAnnounceFormatting = Debouncer.debounce(
      this.__debounceAnnounceFormatting,
      timeOut.after(timeout),
      () => {
        const formatting = Array.from(this.shadowRoot.querySelectorAll('[part="toolbar"] .ql-active'))
          .map(button => button.getAttribute('title'))
          .join(', ');
        announcer.textContent = formatting;
      }
    );
  }

  get _toolbarButtons() {
    return Array.from(this.shadowRoot.querySelectorAll('[part="toolbar"] button')).filter(btn => {
      return btn.clientHeight > 0;
    });
  }

  _clear() {
    this._editor.deleteText(0, this._editor.getLength(), SOURCE.SILENT);
    this.__updateHtmlValue();
  }

  _undo(e) {
    e.preventDefault();
    this._editor.history.undo();
    this._editor.focus();
  }

  _redo(e) {
    e.preventDefault();
    this._editor.history.redo();
    this._editor.focus();
  }

  _toggleToolbarDisabled(disable) {
    const buttons = this._toolbarButtons;
    if (disable) {
      buttons.forEach(btn => btn.setAttribute('disabled', 'true'));
    } else {
      buttons.forEach(btn => btn.removeAttribute('disabled'));
    }
  }

  _onImageTouchEnd(e) {
    // Cancel the event to avoid the following click event
    e.preventDefault();
    // FIXME(platosha): workaround for Polymer Gestures mouseCanceller
    // cancelling the following synthetic click. See also:
    // https://github.com/Polymer/polymer/issues/5289
    this.__resetMouseCanceller();
    this._onImageClick();
  }

  __resetMouseCanceller() {
    resetMouseCanceller();
  }

  _onImageClick() {
    this.$.fileInput.value = '';
    this.$.fileInput.click();
  }

  _uploadImage(e) {
    const fileInput = e.target;
    // NOTE: copied from https://github.com/quilljs/quill/blob/1.3.6/themes/base.js#L128
    // needs to be updated in case of switching to Quill 2.0.0
    if (fileInput.files != null && fileInput.files[0] != null) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const image = e.target.result;
        const range = this._editor.getSelection(true);
        this._editor.updateContents(new Quill.imports.delta()
          .retain(range.index)
          .delete(range.length)
          .insert({image})
        , SOURCE.USER);
        this._markToolbarClicked();
        this._editor.setSelection(range.index + 1, SOURCE.SILENT);
        fileInput.value = '';
      };
      reader.readAsDataURL(fileInput.files[0]);
    }
  }

  _disabledChanged(disabled, readonly, editor) {
    if (disabled === undefined || readonly === undefined || editor === undefined) {
      return;
    }

    if (disabled || readonly) {
      editor.enable(false);

      if (disabled) {
        this._toggleToolbarDisabled(true);
      }
    } else {
      editor.enable();

      if (this.__oldDisabled) {
        this._toggleToolbarDisabled(false);
      }
    }

    this.__oldDisabled = disabled;
  }

  _valueChanged(value, editor) {
    if (editor === undefined) {
      return;
    }

    if (value == null || value == '[{"insert":"\\n"}]') {
      this.value = '';
      return;
    }

    if (value === '') {
      this._clear();
      return;
    }

    let parsedValue;
    try {
      parsedValue = JSON.parse(value);
      if (Array.isArray(parsedValue)) {
        this.__oldValue = value;
      } else {
        throw new Error('expected JSON string with array of objects, got: ' + value);
      }
    } catch (err) {
      // Use old value in case new one is not suitable
      this.value = this.__oldValue;
      console.error('Invalid value set to rich-text-editor:', err);
      return;
    }
    const delta = new Quill.imports.delta(parsedValue);
    // suppress text-change event to prevent infinite loop
    if (JSON.stringify(editor.getContents()) !== JSON.stringify(delta)) {
      editor.setContents(delta, SOURCE.SILENT);
    }
    this.__updateHtmlValue();

    if (this._toolbarState === STATE.CLICKED) {
      this._cleanToolbarState();
      this.__emitChangeEvent();
    } else if (!this._editor.hasFocus()) {
      // value changed from outside
      this.__lastCommittedChange = this.value;
    }
  }

  /**
   * Fired when the user commits a value change.
   *
   * @event change
   */
}

customElements.define(RichTextEditorElement.is, RichTextEditorElement);

export { RichTextEditorElement };

// const devModeCallback = window.Vaadin.developmentModeCallback;
// const licenseChecker = devModeCallback && devModeCallback['vaadin-license-checker'];
// if (typeof licenseChecker === 'function') {
//   licenseChecker(RichTextEditorElement);
// }
