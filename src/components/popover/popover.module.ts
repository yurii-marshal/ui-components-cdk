import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {OverlayModule} from '@angular/cdk/overlay';
import {DPopoverComponent} from './popover.component';
import {PopoverAnchorDirective} from './popover-anchor.directive';
import {ObserversModule} from '@angular/cdk/observers';
import {DPopoverAnchoringService} from './popover-anchoring.service';

@NgModule({
  imports: [
    CommonModule,
    OverlayModule,
    ObserversModule,
  ],
  declarations: [
    DPopoverComponent,
    PopoverAnchorDirective,
  ],
  exports: [
    DPopoverComponent,
    PopoverAnchorDirective,
  ],
  providers: [
    DPopoverAnchoringService
  ]
})
export class DPopoverModule {
}
