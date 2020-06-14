import {OverlayModule} from '@angular/cdk/overlay';
import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {
  DTooltipDirective,
  DTooltipComponent,
} from './tooltip';

@NgModule({
  imports: [
    CommonModule,
    OverlayModule,
  ],
  exports: [DTooltipDirective, DTooltipComponent],
  declarations: [DTooltipDirective, DTooltipComponent],
  entryComponents: [DTooltipComponent]
})
export class TooltipModule {}
