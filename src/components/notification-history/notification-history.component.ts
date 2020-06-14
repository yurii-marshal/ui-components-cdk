import {Component, Inject, OnInit} from '@angular/core';
import {NotificationHistoryService} from './notification-history.service';
import {NotificationHistoryModel} from './models/notification-history.model';

declare let EXPLT_ENV_VARS;

@Component({
  selector: 'd-notification-history',
  templateUrl: './notification-history.component.html',
  styleUrls: ['./notification-history.component.scss']
})

export class NotificationHistoryComponent implements OnInit {
  public isNotificationsLoaded: boolean;
  public notifications: NotificationHistoryModel[] = [];
  public services = [];
  public searchParam = '';
  public gridOptions: any;
  private previousTab = 0;
  private activeTab = 0;

  private endpoint = `${window.location.protocol}//${EXPLT_ENV_VARS.XLUI_API_URL}/notifications_api/v2/notifications`;

  constructor(private notificationHistoryService: NotificationHistoryService,
              @Inject('HeaderService') public headerService: any) {
    this.headerService.getServices().then((data) => {
      this.services = data;
    });

    this.gridOptions = {
      columnDefs: [
        {
          headerName: 'Description',
          field: 'body'
        },
        {
          headerName: 'Service',
          field: 'service'
        },
        {
          headerName: 'Received Date',
          field: 'timestamp',
          maxWidth: 200,
          cellClass: 'notification-date'
        }
      ],
      rowData: [],
      rowHeight: 36,
      suppressMovableColumns: true
    };
  }

  ngOnInit(): void {
    this.loadNotifications();
  }

  /**
   * onTabSelect
   * @desc method handles columns of the grid and reload notifications
   */
  public onTabSelect() {
    if (this.previousTab !== this.activeTab) {
      const currentTab = this.services[this.activeTab - 1].service;
      this.setServiceColumnVisible();
      this.previousTab = this.activeTab;
      if (this.activeTab === 0) {
        this.loadNotifications();
        return;
      } else {
        this.loadNotificationsByTopic(currentTab);
        return;
      }
    }
  }

  /**
   * loadNotificationsByTopic
   * @desc method does request to notification with topics API
   * @param{String} topic - selected column name
   */
  loadNotificationsByTopic(topic) {
    this.isNotificationsLoaded = false;
    this.notificationHistoryService.getNotificationsByTopic(this.endpoint, topic)
      .then((notifications: NotificationHistoryModel[]) => {
        this.setNotifications(notifications);
      })
      .catch(err => {
        console.log(`An error has occurred getting messages. Error: ${err.message}`);
        // this.toastrService.error({
        //   title: `An error has occurred getting messages. Error: ${err.message}`,
        //   timeOut: 3000
        // });
      });
  }

  /**
   * loadNotifications
   * @desc method does request to notifications API
   */
  loadNotifications() {
    this.isNotificationsLoaded = false;
    this.notificationHistoryService.getNotifications(this.endpoint)
      .then((notifications: NotificationHistoryModel[]) => {
        console.log(notifications);
        this.setNotifications(notifications);
      })
      .catch(err => {
        console.log(`An error has occurred getting messages. Error: ${err.message}`);
        // this.toastrService.error({
        //   title: `An error has occurred getting messages. Error: ${err.message}`,
        //   timeOut: 3000
        // });
      });
  }

  /**
   * setNotifications
   * @desc method does assign of notifications and defines columns
   */
  setNotifications(notifications: NotificationHistoryModel[]) {
    this.notifications = notifications;

    if (this.gridOptions.api) {
      this.gridOptions.api.setRowData(this.notifications);
      this.gridOptions.api.sizeColumnsToFit();
    }
    this.isNotificationsLoaded = true;
  }

  /**
   * setServiceColumnVisible
   * @desc method sets column with selected index visible
   */
  setServiceColumnVisible() {
    if (this.activeTab !== 0) {
      this.gridOptions.columnApi.setColumnVisible('service', false);
    } else {
      this.gridOptions.columnApi.setColumnVisible('service', true);
    }
  }

  /**
   * searchByField
   * @desc method does request to search notification API with search value param
   */
  searchByField() {
    if (this.activeTab === 0) {
      this.notificationHistoryService.searchByField(this.endpoint, this.searchParam)
        .then((notifications) => {
          this.setNotifications(notifications);
        });
    } else {
      this.notificationHistoryService.searchByField(this.searchParam, this.services[this.activeTab - 1].service)
        .then((notifications) => {
          this.setNotifications(notifications);
        });
    }
    this.isNotificationsLoaded = false;
  }
}
