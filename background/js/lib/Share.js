import HttpRequest from './httpRequest.js';

class Share {


    static getCurrDate() {
        var currDate = new Date();
        var year = currDate.getFullYear();
        var month = (currDate.getMonth() + 1);
        if (month < 10)
            month = '0' + month;
        var day = currDate.getDate();
        if (day < 10)
            day = '0' + day;

        return year + '-' + month + '-' + day;
    }

    static getCurrTime() {
        var currDate = new Date();
        var hour = currDate.getHours();
        if (hour < 10)
            hour = '0' + hour;
        var minute = currDate.getMinutes();
        if (minute < 10)
            minute = '0' + minute;
        var second = currDate.getSeconds();
        if (second < 10)
            second = '0' + second;

        return hour + ':' + minute + ':' + second;
    }

    static getCurrYear() {
        var currDate = new Date();
        return currDate.getFullYear();
    }

    static getCurrMonth()
    {
        var currDate = new Date();
        var month = currDate.getMonth() + 1;
        if (month < 10)
            month = '0' + month;

        return month;
    }

    static getCurrDay() {
        var currDate = new Date();
        var day = currDate.getDate();
        if (day < 10)
            day = '0' + day;

        return day;
    }

    static addDays(date, day) {
        date.setTime(date.getTime() + day * 60 * 60 * 24 * 1000);
        return date;
    }

    static addHours(date, hours) {
        date.setTime(date.getTime() + hours * 60 * 60 * 1000);
        return date;
    }

    static addMinutes(date, minutes) {
        date.setTime(date.getTime() + minutes * 60 * 1000);
        return date;
    }

    static showNotify(title, message, requireInteraction = false) {
        if (Notification && Notification.permission !== "granted") {
            Notification.requestPermission(function (status) {
                if (Notification.permission !== status) {
                    Notification.permission = status;
                }
            });
        }
        if (Notification && Notification.permission === "granted") {
            let start = Date.now();
            let id = new Date().getTime() + '';
            let options = {
                type: 'basic',
                iconUrl: '/images/icon.png',
                title: title,
                message: message,
                requireInteraction: requireInteraction
            };

            chrome.notifications.create(options);

            chrome.notifications.onClicked.addListener(function(notificationId, byUser) {
                chrome.notifications.clear(notificationId, function() {});
            });
        }

    }

    /*static saveStorage(jsonValue) {
        chrome.storage.local.set(jsonValue, function () {
            console.log('config updated : ' + JSON.stringify(jsonValue));
        });
    }

    static getStorage(item, callback) {
        chrome.storage.local.get(item, callback);
    }*/

// chrome.storage.sync에 저장된 정보를 promise로 가져온다.
   /* static promiseStorageSync(syncStorageId, userConfigId) {
        return new Promise(function(resolve, reject) {
            chrome.storage.sync.get(syncStorageId, function(items) {
                syncStorage[syncStorageId] = items[syncStorageId];
                if (userConfigId) userConfig[userConfigId] = items[syncStorageId];

                resolve('success')
            });
        })
    }*/

    static randomRange(n1, n2) {
        n1 = parseInt(n1);
        n2 = parseInt(n2);
        return Math.floor( (Math.random() * (n2 - n1 + 1)) + n1 );
    }
/*
    static getChromeStorageSync(item, callback) {
        chrome.storage.sync.get(item, callback);
    }*/

    /*static setCookie(cookie_name, value, days) {
        var exdate = new Date();
        exdate.setDate(exdate.getDate() + days);
        // 설정 일수만큼 현재시간에 만료값으로 지정

        var cookie_value = escape(value) + ((days == null) ? '' : ';    expires=' + exdate.toUTCString());
        document.cookie = cookie_name + '=' + cookie_value;
    }

    static getCookie(cookie_name) {
        var x, y;
        var val = document.cookie.split(';');

        for (var i = 0; i < val.length; i++) {
            x = val[i].substr(0, val[i].indexOf('='));
            y = val[i].substr(val[i].indexOf('=') + 1);
            x = x.replace(/^\s+|\s+$/g, ''); // 앞과 뒤의 공백 제거하기
            if (x == cookie_name) {
                return unescape(y); // unescape로 디코딩 후 값 리턴
            }
        }
    }*/

    static uuid() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
}

export default Share;
