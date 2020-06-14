import {Component, ViewEncapsulation} from '@angular/core';

@Component({
  selector: 'd-card',
  exportAs: 'dCard',
  template: `
    <div class="d-card">
      <ng-content></ng-content>
    </div>
  `,
  styleUrls: ['./card.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class DCardComponent {}
