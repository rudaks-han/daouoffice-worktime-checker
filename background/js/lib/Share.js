import Logger from "./Logger.js";

class Share {

    static getFullCurrDate() {
        return this.getCurrDate() + ' ' + this.getCurrTime();
    }

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
        const currDate = new Date();
        return this.getTimeFormat(currDate);
    }

    static getCurrYear() {
        var currDate = new Date();
        return currDate.getFullYear();
    }

    static getCurrMonth() {
        var currDate = new Date();
        var month = currDate.getMonth() + 1;
        if (month < 10)
            month = '0' + month;

        return month;
    }

    static getCurrDateToMonth() {
        return Share.getCurrYear() + '-' + Share.getCurrMonth();
    }

    static getCurrDay() {
        var currDate = new Date();
        var day = currDate.getDate();
        if (day < 10)
            day = '0' + day;

        return day;
    }

    static getTimeFormat(date) {
        var hour = date.getHours();
        if (hour < 10)
            hour = '0' + hour;
        var minute = date.getMinutes();
        if (minute < 10)
            minute = '0' + minute;
        var second = date.getSeconds();
        if (second < 10)
            second = '0' + second;

        return hour + ':' + minute + ':' + second;
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
            Logger.error('showNotify error');
            Logger.error(Notification);
            Notification.requestPermission(function (status) {
                if (Notification.permission !== status) {
                    Notification.permission = status;
                }
            });
        }
        if (Notification && Notification.permission === "granted") {
            let options = {
                type: 'basic',
                iconUrl: '/images/icon.png',
                title: title,
                message: message,
                priority: 2,
                eventTime: Date.now(),
                requireInteraction: requireInteraction
            };

            chrome.notifications.create(options);

            chrome.notifications.onClicked.addListener(function(notificationId, byUser) {
                chrome.notifications.clear(notificationId, function() {});
            });

            Logger.println('chrome notification가 실행되었습니다.');
            Logger.println(`title: ${title}, message: ${message}`);
        } else {
            Logger.error(`[showNotify] Notification 권한이 없습니다.`);
            Logger.error(Notification);
        }

    }

    static randomRange(n1, n2) {
        n1 = parseInt(n1);
        n2 = parseInt(n2);
        return Math.floor( (Math.random() * (n2 - n1 + 1)) + n1 );
    }

    static uuid() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
}

export default Share;
