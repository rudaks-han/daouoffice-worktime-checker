import DaouofficeClient from "./js/DaouofficeClient.js";
import WorkHourTimer from "./js/WorkHourTimer.js";
import FirebaseApp from "./js/FirebaseApp.js";
import Logger from "./js/lib/Logger.js";

const receiveMessage = (request, sender, sendResponse) => {
    requestFn(request)
        .then((response) => {
            sendResponse(response);
        }).catch(e => {
        sendResponse('error');
    });

    return true;
}

const clientModule = {};
clientModule['daouofficeClient'] = new DaouofficeClient();
clientModule['firebaseApp'] = new FirebaseApp();

const requestFn = async (request) => {
    const requestArr = request.action.split('.');
    const requestClass = requestArr[0];
    const requestFn = requestArr[1];
    const params = request.params;

    const client = clientModule[requestClass];
    let response = null;

    try {
        response = await client[requestFn].apply(client, [params]);
    } catch (e) {
        throw e
    }

    return response;
}

chrome.runtime.onMessage.addListener(receiveMessage);

const firebaseApp = new FirebaseApp();
firebaseApp.start();

const workHourTimer = new WorkHourTimer();
workHourTimer.initialize();

chrome.alarms.create('checkUserSession', { when:Date.now(), periodInMinutes: 5}); // 5분
chrome.alarms.create('checkCalendar', {when:Date.now(), periodInMinutes: 60}); // 60분
chrome.alarms.create('checkWorkHour', {when:Date.now(), periodInMinutes: 1}); // 1분

chrome.alarms.onAlarm.addListener(alarm => {
    const { name, periodInMinutes, scheduledTime } = alarm;
    switch (name) {
        case 'checkUserSession':
            workHourTimer.checkUserSession();
            break;
        case 'checkCalendar':
            workHourTimer.checkCalendar();
        case 'checkWorkHour':
            workHourTimer.checkWorkHour();
        default:
    }

});

//workHourTimer.start();





