import DaouofficeClient from "./DaouofficeClient.js";
import WorkHourChecker  from "./WorkHourChecker.js";
import Share from "./lib/Share.js";
import Logger from "./lib/Logger.js";
import StorageUtil from "./lib/storageUtil.js";

const daouofficeClient = new DaouofficeClient();
const workHourChecker = new WorkHourChecker();

export default class WorkHourTimer {

	constructor() {
		this.holidayList = {};
		this.dayOffList = {};
		this.userSession = {};
	}

	initialize = async () => {
		const _this = this;
		await _this.checkUserSession();
		await _this.checkCalendar();
	}

	getUserConfig = async () => {
		return await daouofficeClient.getUserConfig();
	}

	checkUserSession = async () => {
		Logger.println("WorkHourTimer#checkUserSession ==> 인증되지 않았음. try login.. ");
		let userSession = await daouofficeClient.getSession();
		if (!(userSession && userSession.code === '200')) {
			Logger.println("재로그인 후 getSession 요청");
			userSession = await daouofficeClient.getSession();
		}

		this.userSession = userSession;
	}

	checkCalendar = async () => {
		const response = await daouofficeClient.getCalendar();
		await this.parseCalendar(response);
	}

	parseCalendar = (response) => {
		if (response == null || !response.data) {
			console.error('[parseCalendar] response.data is undefined');
			return;
		}
		const list = response.data.list;
		list.forEach(item => {
			const datetime = item.datetime;
			const eventList = item.eventList;
			const date = datetime.substring(0, 10);

			eventList.forEach(event => {
				let type = event.type; // holiday: 휴일, company: 연차/공가)
				let summary = event.summary; // 연차 : 서형태, 반차: 이승엽(오후), 공가 : 유민(오후)

				if (this.isHoliday(type)) {
					this.holidayList[date] = type;
				} else if (this.isDayOff(type, summary)) {
					if (!this.dayOffList[date])
						this.dayOffList[date] = [];

					this.dayOffList[date].push(summary); // summary => 연차 : 한경만
				}
			})
		});
	}

	isHoliday = type => {
		return type === 'holiday' || type === 'anniversary';
	}

	isDayOff = (type, summary) => {
		return type === 'company'
			&& (
				summary.indexOf('휴가') > -1
				|| summary.indexOf('연차') > -1
				|| summary.indexOf('공가') > -1
				|| summary.indexOf('위로') > -1
				|| summary.indexOf('반차') > -1
			);
	}

	checkWorkHour = async () => {
		const userConfig = await this.getUserConfig();
		if (!userConfig || userConfig.useFlag != 'Y') {
			Logger.println('>>> 출퇴근 체크가 사용하지 않음으로 설정되어 있습니다.');
			return;
		}

		const username = userConfig.sessionUserName;
		const currDate = Share.getCurrDate();
		const now = new Date();
		/*const username = '한경만';
		const currDate = '2022-11-08';
		const currTime = '16:05:00';
		const now = new Date(`${currDate}T${currTime}`);
		await StorageUtil.set({
			'clockOutDateStorageKey': '222222'
		});*/

		const params = {
			username,
			currDate,
			userConfig,
			userSession: this.userSession,
			holidayList: this.holidayList,
			dayOffList: this.dayOffList,
			now
		}

		if (this.isNotAuthenticated(params)) {
			// 인증되지 않았습니다.
			Logger.println("WorkHourTimer#userSession ==> 인증되지 않았음. try login.. ");
			let userSession = await daouofficeClient.getSession();
			if (!(userSession && userSession.code === '200')) {
				Logger.println("재로그인 후 getSession 요청");
				userSession = await daouofficeClient.getSession();
			}

			params.userSession = userSession;
		}

		await workHourChecker.check(params);
	}

	isNotAuthenticated = params => {
		return !params.userSession || params.userSession.code == "401" || Object.entries(params.userSession).length === 0;
	}
}
