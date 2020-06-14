import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {RadioButtonComponent, RadioGroupDirective} from './radio.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule
  ],
  declarations: [
    RadioGroupDirective,
    RadioButtonComponent
  ],
  exports: [
    RadioGroupDirective,
    RadioButtonComponent
  ]
})

export class RadioModule {
}
