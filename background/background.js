import DaouofficeClient from "./js/DaouofficeClient.js";
import WorkHourTimer from "./js/WorkHourTimer.js";
import FirebaseApp from "./js/FirebaseApp.js";

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


const workHourTimer = new WorkHourTimer();
workHourTimer.start();

const firebaseApp = new FirebaseApp();
firebaseApp.start();


