export class NotificationHistoryModel {
  public body: number;
  public timestamp: number;
  public service: number;

  constructor(data) {
    this.body = data.body;
    this.timestamp = data.timestamp;
    this.service = data.service;
  }
}
