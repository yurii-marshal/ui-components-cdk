### **`<d-notification-history>`**

##### Description

This component provides table with notification history.

##### APIs

The component uses notification API for requests:

* Get all notifications
``` sh
GET: `http://[baseUrl]/notifications_api/v2/notifications`
```
* Get notifications by topic
``` sh
GET: `http://[baseUrl]/notifications_api/v2/notifications?topic=<topic>`
```
* Search
``` sh
GET: `http://[baseUrl]/?filter=body+con+<filedValue>&logic=or&filter=timestamp+con+<filedValue>&topic=<topic>`
```

###### Example usage:
 ```
 <d-notification-history></d-notification-history>
 ```
