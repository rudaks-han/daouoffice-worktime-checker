import DaouofficeClient from "./DaouofficeClient.js";
import WorkHourChecker  from "./WorkHourChecker.js";

const daouofficeClient = new DaouofficeClient();
const workHourChecker = new WorkHourChecker();

export default class WorkHourTimer {

	constructor() {
		this.userSessionIntervalTime = 5 * 60 * 1000; // 5분 마다
		this.calendarIntervalTime = 60 * 60 * 1000; // 1시간 마다
		this.intervalTime = 60 * 1000;
		this.holidayList = {};
		this.dayOffList = {};
	}


	start = async () => {
		const _this = this;
		setInterval(() => {
			// 세션정보
			_this.checkUserSession();
		}, this.userSessionIntervalTime);

		setInterval(() => {
			// 달력정보
			_this.checkCalendar();
		}, this.calendarIntervalTime);

		setInterval(() => {
			// 출근체크
			_this.checkWorkHour();
		}, this.intervalTime);

		//_this.checkUserSession();
		_this.checkCalendar();
		//_this.checkWorkHour();
	}

	isUseFlag = async () => {
		const userConfig = await daouofficeClient.getUserConfig();
		return userConfig.useFlag;
	}

	checkUserSession = async () => {
		console.log('checkUserSession')
		await daouofficeClient.getSession();
	}

	checkCalendar = async () => {
		const response = await daouofficeClient.getCalendar();

		this.parseCalendar(response);
	}

	parseCalendar = (response) => {
		const list = response.data.list;
		//console.log(list)
		list.forEach(item => {
			const datetime = item.datetime;
			const eventList = item.eventList;
			const date = datetime.substring(0, 10);

			eventList.forEach(event => {
				let type = event.type; // holiday: 휴일, company: 연차/공가)
				let summary = event.summary; // 연차 : 서형태, 반차: 이승엽(오후), 공가 : 유민(오후)

				if (type === 'holiday' || type === 'anniversary') { // anniversary : 근로자의 날
					//holidayList[date] = type;
					this.holidayList[date] = type;
				}
				else if (type === 'company' || summary.indexOf('보상휴가') > -1) { // 보상휴가는 type=normal
					if (!this.dayOffList[date])
						this.dayOffList[date] = [];

					this.dayOffList[date].push(summary); // summary => 연차 : 한경만
				}
			})

			/*if (eventList.length > 0) {
				for (let j = 0; j < eventList.length; j++) {
					let type = eventList[j].type; // holiday: 휴일, company: 연차/공가)
					let summary = eventList[j].summary; // 연차 : 서형태, 반차: 이승엽(오후), 공가 : 유민(오후)

					//console.error('date : ' + date + ', type : ' + type + ', summary : ' + summary);

					if (type == 'holiday' || type == 'anniversary') // anniversary : 근로자의 날
					{
						holidayList[date] = type;
					}
					else if (type == 'company' || summary.indexOf('보상휴가') > -1) // 보상휴가는 type=normal
					{
						if (!dayOffList[date])
							dayOffList[date] = [];

						dayOffList[date].push(summary); // summary => 연차 : 한경만
					}

				}
			}*/
		})

		console.log('this.holidayList')
		console.log(this.holidayList)
		console.log('this.dayOffList')
		console.log(this.dayOffList)
		/*for (let i = 0; i < list.length; i++) {
			let datetime = list[i].datetime;
			let eventList = list[i].eventList;

			let date = datetime.substring(0, 10);

			if (eventList.length > 0) {
				for (let j = 0; j < eventList.length; j++) {
					let type = eventList[j].type; // holiday: 휴일, company: 연차/공가)
					let summary = eventList[j].summary; // 연차 : 서형태, 반차: 이승엽(오후), 공가 : 유민(오후)

					//console.error('date : ' + date + ', type : ' + type + ', summary : ' + summary);

					if (type == 'holiday' || type == 'anniversary') // anniversary : 근로자의 날
					{
						holidayList[date] = type;
					}
					else if (type == 'company' || summary.indexOf('보상휴가') > -1) // 보상휴가는 type=normal
					{
						if (!dayOffList[date])
							dayOffList[date] = [];

						dayOffList[date].push(summary); // summary => 연차 : 한경만
					}

				}
			}
		}*/
	}



	checkWorkHour = async () => {
		console.log('checkWorkHour')
		const useFlag = await this.isUseFlag();
		if (useFlag != 'Y') {
			console.log('>>> 출퇴근 체크가 사용하지 않음으로 설정되어 있습니다.');
			return;
		}

		workHourChecker.check();
	}
}
