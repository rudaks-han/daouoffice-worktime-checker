import DaouofficeClient from "./DaouofficeClient.js";
import WorkHourChecker  from "./WorkHourChecker.js";
import Share from "./lib/Share.js";
import Logger from "./lib/Logger.js";

const daouofficeClient = new DaouofficeClient();
const workHourChecker = new WorkHourChecker();

export default class WorkHourTimer {

	constructor() {
		//this.userSessionIntervalTime = 5 * 60 * 1000; // 5분 마다
		this.calendarIntervalTime = 60 * 60 * 1000; // 1시간 마다
		this.intervalTime = 60 * 1000; // 1분마다
		this.holidayList = {};
		this.dayOffList = {};
		this.userSession = {};
	}

	start = async () => {
		const _this = this;
		setInterval(() => {
			// 세션정보
			_this.checkUserSession();
		}, this.intervalTime);

		setInterval(() => {
			// 달력정보
			_this.checkCalendar();
		}, this.calendarIntervalTime);

		setInterval(() => {
			// 출근체크
			_this.checkWorkHour();
		}, this.intervalTime);

		await _this.checkUserSession();
		await _this.checkCalendar();
		await _this.checkWorkHour();
	}

	getUserConfig = async () => {
		return await daouofficeClient.getUserConfig();
	}

	checkUserSession = async () => {
		const userSession = await daouofficeClient.getSession();
		Logger.println('[checkUserSession] userSession');
		Logger.println(userSession, false);
		this.userSession = userSession;
	}

	checkCalendar = async () => {
		const response = await daouofficeClient.getCalendar();
		this.parseCalendar(response);
	}

	parseCalendar = (response) => {
		if (!response.data) {
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
		/*const username = '백명구';
		const currDate = '2022-06-02';
		const now = new Date('2022-06-02T06:50:00');*/

		const params = {
			username,
			currDate,
			userConfig,
			userSession: this.userSession,
			holidayList: this.holidayList,
			dayOffList: this.dayOffList,
			now
		}

		Logger.println('start...');

		if (params.userSession.code == "401") {
			// 인증되지 않았습니다.
			Logger.println("인증되지 않았음. try login.. ");
			await daouofficeClient.loginByUserConfig();
			const userSession = await daouofficeClient.getSession();

			params.userSession = userSession;
		}


		await workHourChecker.check(params);
	}
}
