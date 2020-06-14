import {Inject, Injectable} from '@angular/core';
import {HttpClient, HttpHeaders, HttpParams} from '@angular/common/http';
import {CookieService} from 'ngx-cookie-service';
import {NotificationHistoryModel} from './models/notification-history.model';

@Injectable()
export class NotificationHistoryService {

  constructor(
    @Inject('AuthService') private platformAuthService: any,
    private httpClient: HttpClient,
    private cookies: CookieService,
  ) {
  }

  getNotifications(endpoint: string): Promise<NotificationHistoryModel[]> {
    const headers = this.buildHeaders(true);
    const params = new HttpParams();

    return this.httpClient.get(endpoint, {headers, params})
      .toPromise()
      .then((notes: Array<any>) => {
        return notes['data'].map(note => new NotificationHistoryModel(note));
      });
  }

  getNotificationsByTopic(endpoint: string, topicName: string): Promise<NotificationHistoryModel[]> {
    const headers = this.buildHeaders(true);
    const params = new HttpParams();

    params['topic'] = topicName;

    return this.httpClient.get(endpoint, {headers, params})
      .toPromise()
      .then((notes: Array<any>) => {
        return notes['data'].map(note => new NotificationHistoryModel(note));
      });
  }

  searchByField(endpoint, filedValue, topicName?) {
    const url = `${endpoint}?filter=body+con+${filedValue}&logic=or&filter=timestamp+con+${filedValue}`;
    const headers = this.buildHeaders(true);
    const params = new HttpParams();
    params['topic'] = topicName || '';

    return this.httpClient.get(url, {headers, params})
      .toPromise()
      .then((notes: Array<any>) => {
        return notes['data'].map(note => new NotificationHistoryModel(note));
      });
  }

  private buildHeaders(auth: boolean = true) {
    const usersession = this.cookies.get('usersession');
    let headers = new HttpHeaders();
    if (auth) {
      headers = headers.set('Authorization', 'SessionID ' + usersession);
    }

    return headers;
  }

}
