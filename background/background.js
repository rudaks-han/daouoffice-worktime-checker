import DaouofficeClient from "./js/DaouofficeClient.js";
import WorkHourTimer from "./js/WorkHourTimer.js";

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

const requestFn = async (request) => {
    const requestArr = request.action.split('.');
    const requestClass = requestArr[0];
    const requestFn = requestArr[1];
    const params = request.params;

    const client = clientModule[requestClass];
    let response = null;

    console.log('requestClass: ' + requestClass)
    console.log('requestFn: ' + requestFn)
    console.log('params: ' + JSON.stringify(params))
    try {
        response = await client[requestFn].apply(client, [params]);
    } catch (e) {
        throw e
    }

    return response;
}

chrome.runtime.onMessage.addListener(receiveMessage);

function initialize() {
    /*firebaseConfigTimer = setInterval(() => {
        firebaseConfigChecker.get(userInfo.username)
    }, firebaseConfigCheckerInterval); // 세션정보 5분마다 가져온다.

    // 사용여부 체크
    getChromeStorageSync('use-flag', (items) => {
        let useFlag = items['use-flag'];

        if (useFlag !== 'Y')
        {
            logger.info('>>> 출퇴근 체크가 사용하지 않음으로 설정되어 있습니다.');
        }

        check();
    });*/
}

const workHourTimer = new WorkHourTimer();
workHourTimer.start();


