import {html} from '@polymer/lit-element/lit-element';
import {TemplateResult} from 'lit-html';

const innerTemplate = (props) => html`
    <div class="container">
        <div id="uxl-rte">
        </div>
    </div>
`;
export const template: (props: any) => TemplateResult = innerTemplate;
