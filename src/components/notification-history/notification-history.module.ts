import {NgModule} from '@angular/core';
import {NotificationHistoryComponent} from './notification-history.component';
import {FormsModule} from '@angular/forms';
import {CommonModule} from '@angular/common';
import {TabsModule} from 'ngx-bootstrap';
import {SpinnerModule} from '../spinner/spinner.module';
import {IconModule} from '../icon/icon.module';
import {GridModule} from '../grid/grid.module';
import {NotificationHistoryService} from './notification-history.service';
import {AgGridModule} from 'ag-grid-angular';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    TabsModule.forRoot(),
    SpinnerModule,
    IconModule,
    GridModule,
    AgGridModule
  ],
  exports: [NotificationHistoryComponent],
  declarations: [NotificationHistoryComponent],
  providers: [NotificationHistoryService]
})

export class NotificationHistoryModule {
}
