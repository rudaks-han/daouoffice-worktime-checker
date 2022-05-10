
function saveLocalStorage(key, value)
{
    localStorage[key] = value;
}

function getLocalStorage(key)
{
    return localStorage[key];
}

function requestAjax(options)
{
    logger.trace('======= Ajax Request ======');
    logger.trace('[url] ' + options.url);
    logger.trace('[method] ' + options.method);
    if (options.headers)
        logger.trace('[headers] ' + (options.headers ? JSON.stringify(options.headers) : options.headers));
    if (options.data)
        logger.trace('[data] ' + options.data);
    logger.trace('=========================');

    return $.ajax({
        type: options.method,
        url: options.url,
        headers: options.headers,
        data: options.param,
        dataType: "json",
        contentType: "application/json", // request payload로 전송됨
        success : options.success,
        error : options.error,
        complete : options.complete
    });
}

function getCurrDate()
{
    return getCurrYear() + '-' + getCurrMonth() + '-' + getCurrDay();
}

function getCurrDateToMonth() {
    return getCurrYear() + '-' + getCurrMonth();
}

function getCurrTime()
{
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

function getCurrYear()
{
    var currDate = new Date();
    return currDate.getFullYear();
}

function getCurrMonth()
{
    var currDate = new Date();
    var month = currDate.getMonth() + 1;
    if (month < 10)
        month = '0' + month;

    return month;
}

function getCurrDay()
{
    var currDate = new Date();
    var day = currDate.getDate();
    if (day < 10)
        day = '0' + day;

    return day;
}

Date.prototype.addDays = function(days)
{
    var dat = new Date(this.valueOf());
    dat.setDate(dat.getDate() + days);
    return dat;
}

Date.prototype.addMinutes = function(minutes)
{
    var dat = new Date(this.valueOf());
    dat.setTime(dat.getTime() + minutes * 60 * 1000);
    return dat;
}

Date.prototype.addHours = function(hours)
{
    var dat = new Date(this.valueOf());
    dat.setTime(dat.getTime() + hours * 60 * 60 * 1000);
    return dat;
}

function showNotify(title, message, requireInteraction = false) {

    chrome.runtime.sendMessage({
        action: "notification",
        title: title,
        message: message,
        requireInteraction: requireInteraction
    }, function(response) {
        logger.debug("showNotify Response: ", response);
    });

}

// chrome.storage.sync에 저장된 정보를 promise로 가져온다.
function promiseStorageSync(syncStorageId, userConfigId)
{
    return new Promise(function(resolve, reject) {
        chrome.storage.sync.get(syncStorageId, function(items) {
            syncStorage[syncStorageId] = items[syncStorageId];
            if (userConfigId) userConfig[userConfigId] = items[syncStorageId];

            resolve('success')
        });
    })
}

function randomRange(n1, n2) {
    n1 = parseInt(n1);
    n2 = parseInt(n2);
    return Math.floor( (Math.random() * (n2 - n1 + 1)) + n1 );
}

function getChromeStorageSync(item, callback)
{
    chrome.storage.sync.get(item, callback);
}