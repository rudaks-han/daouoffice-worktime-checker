import DaouofficeClient from "./DaouofficeClient.js";
import Share from "./lib/Share.js";
import Logger from "./lib/Logger.js";
import StorageUtil from "./lib/storageUtil.js";
import FirebaseApp from "./FirebaseApp.js";

const daouofficeClient = new DaouofficeClient();
const firebaseApp = new FirebaseApp();

export default class WorkHourChecker {

	constructor() {
	}

	check = async params => {
		Logger.debug("WorkHourChecker check");
		// 주말인지 여부 체크
		if (this.isWeekend(params)) {
			return;
		}

		// 공휴일인지 여부 체크
		if (this.isHoliday(params)) {
			return;
		}

		// 연차 여부 체크
		if (this.isUserDayOff(params)) {
			return;
		}

		// 반차여부 로깅
		this.isUserDayHalfOff(params.currDate, params.dayOffList, params.username);

		const isAlreadyClockIn = await this.isMarkedClockInAlready();
		if (!isAlreadyClockIn) {
			await this.markAsClockIn(params);
		}

		const isAlreadyClockOut = await this.isMarkedClockOutAlready();
		if (!isAlreadyClockOut) {
			await this.markAsClockOut(params);
		}
	}

	isWeekend = params => {
		const logPrefix = '[주말여부 체크] > ';
		const { currDate } = params;
		const date = new Date(currDate + 'T12:00:00');
		if (date.getDay() == 0 || date.getDay() == 6) { // 토, 일 제외
			Logger.debug(`${logPrefix} 오늘은 주말입니다. ${currDate}`);
			return true;
		} else {
			Logger.debug(`${logPrefix} 오늘은 평일입니다. ${currDate}`);
			return false;
		}
	}

	isHoliday = params => {
		const logPrefix = '[공휴일 여부 체크] > ';
		const { currDate, holidayList } = params;
		if (holidayList[currDate]) {
			Logger.debug(`${logPrefix} 오늘은 공휴일입니다. ${currDate}`);
			return true;
		} else {
			Logger.debug(`${logPrefix} 오늘은 평일입니다. ${currDate}`);
			return false;
		}
	}

	isUserDayOff = params => {
		const logPrefix = '[개인 연차 여부 체크] > ';
		const { username, currDate, dayOffList } = params;
		const todayDayOffList = dayOffList[currDate];
		if (todayDayOffList) {
			todayDayOffList.forEach(item => {
				if (item.indexOf(username) > -1 || item.indexOf('보상휴가') > -1) {
					let dayOff = false;
					if ((item.indexOf('연차') > -1 || item.indexOf('보상') > -1)
						&& item.indexOf('오전') == -1 && item.indexOf('오후') == -1 && item.indexOf('반차') == -1) {
						dayOff = true;
					}

					if (dayOff) { // 연차
						Logger.println(`${logPrefix} 오늘은 연차입니다.`);
						return true;
					}
				}
			});
		}
		Logger.debug(`${logPrefix} 오늘은 연차가 아닙니다.`);
		return false;
	}

	isMarkedClockInAlready = async () => {
		const logPrefix = '[출근도장 표시되었는지 체크] > ';
		const clockInDate = await StorageUtil.get('clockInDateStorageKey')

		if (clockInDate === Share.getCurrDate()) {
			Logger.debug(`${logPrefix} 이미 출근도장이 찍혀져 있습니다.`);
			return true;
		} else {
			Logger.debug(`${logPrefix} X`);
			return false;
		}
	}

	isMarkedClockOutAlready = async () => {
		const logPrefix = '[퇴근도장 표시되었는지 체크] > ';
		const clockOutDate = await StorageUtil.get('clockOutDateStorageKey')

		if (clockOutDate === Share.getCurrDate()) {
			Logger.debug(`${logPrefix} 이미 퇴근도장이 찍혀져 있습니다.`);
			return true;
		} else {
			Logger.debug(`${logPrefix} X`);
			return false;
		}
	}

	markAsClockIn = async params => {
		const { userConfig, currDate, dayOffList, username, now, userSession } = params;
		if (!userSession || !userSession.data || !userSession.data.id) {
			console.error('[markAsClockIn] userSession not authorized: ')
			return;
		}
		const userId = userSession.data.id;
		const {
			clockInBeforeMinute,
			clockInCheckType,
			clockInHour,
			clockInMinute,
			clockInRandomFromMinute,
			clockInRandomToMinute
		} = userConfig;
		const startWorkTimeDate = this.getCurrentDateWithTime(currDate, clockInHour, clockInMinute, 0);

		if (clockInCheckType === 'TIME') {
			if (this.isInRangeClockIn(startWorkTimeDate, parseInt(clockInBeforeMinute), currDate, now, dayOffList, username)) {
				await this.requestClockIn(userId, username);
			}
		} else if (clockInCheckType === 'RANDOM') {
			let randomMinuteStorageValue = await StorageUtil.get('beforeRandomMinute')
			let beforeMinute;
			if (!randomMinuteStorageValue || !randomMinuteStorageValue[currDate]) {
				const value = Share.randomRange(clockInRandomFromMinute, clockInRandomToMinute);
				const beforeRandomMinute = {};
				beforeRandomMinute[currDate] = value;

				await StorageUtil.set({
					beforeRandomMinute: beforeRandomMinute
				});

				beforeMinute = value;
			} else {
				beforeMinute = randomMinuteStorageValue[currDate];
			}

			if (this.isInRangeClockIn(startWorkTimeDate, parseInt(beforeMinute), currDate, now, dayOffList, username)) {
				await this.requestClockIn(userId, username);
			}
		}
	}

	markAsClockOut = async params => {
		const { userConfig, currDate, dayOffList, username, now, userSession } = params;
		if (!userSession || !userSession.data || !userSession.data.id) {
			console.error('[markAsClockOut] userSession not authorized: ')
			return;
		}
		const userId = userSession.data.id;
		const {
			clockOutBeforeMinute,
			clockOutCheckType,
			clockOutHour,
			clockOutMinute,
			clockOutRandomFromMinute,
			clockOutRandomToMinute
		} = userConfig;

		const endWorkTimeDate = this.getCurrentDateWithTime(currDate, clockOutHour, clockOutMinute, 0);

		if (clockOutCheckType === 'TIME') {
			if (this.isInRangeClockOut(endWorkTimeDate, parseInt(clockOutBeforeMinute), currDate, now, dayOffList, username)) {
				await this.requestClockOut(userId, username);
			}
		} else if (clockOutCheckType === 'RANDOM') {
			let randomMinuteStorageValue = await StorageUtil.get('afterRandomMinute')
			let afterMinute;
			if (!randomMinuteStorageValue || !randomMinuteStorageValue[currDate]) {
				const value = Share.randomRange(clockOutRandomFromMinute, clockOutRandomToMinute);
				const afterRandomMinute = {};
				afterRandomMinute[currDate] = value;

				await StorageUtil.set({
					afterRandomMinute: afterRandomMinute
				});

				afterMinute = value;
			} else {
				afterMinute = randomMinuteStorageValue[currDate];
			}

			if (this.isInRangeClockOut(endWorkTimeDate, parseInt(afterMinute), currDate, now, dayOffList, username)) {
				await this.requestClockOut(userId, username);
			}
		}
	}


	getCurrentDateWithTime = (currDate, hour, minute, second) => {
		const arrDate = currDate.split('-');
		const year = parseInt(arrDate[0]);
		const month = parseInt(arrDate[1]) - 1;
		const day = parseInt(arrDate[2]);
		return new Date(year, month, day, hour, minute, second);
	}

	isInRangeClockIn = (startWorkTimeDate, minuteBeforeClockIn, currDate, now, dayOffList, username) => {
		const logPrefix = '[출근도장 범위내 여부 체크] > ';

		let clockInMarkingTime;
		// 반차일 경우 시간 조정
		let userDayHalfOff = this.isUserDayHalfOff(currDate, dayOffList, username);
		if (userDayHalfOff === '오전반반차') {
			clockInMarkingTime = Share.addMinutes(startWorkTimeDate, 2 * 60 - minuteBeforeClockIn); // 기준시간 12:55
		} else if (userDayHalfOff === '오전반차') {
			// 8시 이전 출근이라면 +4를 하고 8시 출근 이후라면 +5를 한다.
			let addHour = 5; // 점심시간 포함
			if (startWorkTimeDate.getHours() < 8) {
				addHour = 4; // 점심시간 이전 출근
			}
			clockInMarkingTime = Share.addMinutes(startWorkTimeDate, addHour * 60 - minuteBeforeClockIn); // 기준시간 12:55
		} else if (userDayHalfOff === '오후반반차'){
			clockInMarkingTime = Share.addMinutes(startWorkTimeDate, -minuteBeforeClockIn); // 기준시간 07:55
		} else if (userDayHalfOff === '오후반차'){
			clockInMarkingTime = Share.addMinutes(startWorkTimeDate, -minuteBeforeClockIn); // 기준시간 07:55
		} else {
			clockInMarkingTime = Share.addMinutes(startWorkTimeDate, -minuteBeforeClockIn); // 기준시간 07:55
		}

		if (now >= clockInMarkingTime) {
			let validTime = Share.addMinutes(startWorkTimeDate, 60); // 기준시간 09:00
			if (now > validTime) {
				Logger.debug(`${logPrefix} 1시간 초과됨`);
				return false;
			} else {
				Logger.debug(`${logPrefix} 출근도장 찍을 시간`);
				return true;
			}
		} else {
			Logger.println(`${logPrefix} 출근도장 찍을 시간 아님. 출근도장 찍을 시간: ${Share.getTimeFormat(clockInMarkingTime)}`);
			return false;
		}
	}

	// 퇴근시간 후 5분후 부터 1시간 까지
	isInRangeClockOut = (endWorkTimeDate, minuteAfterClockOut, currDate, now, dayOffList, username) => {
		const logPrefix = '[퇴근도장 범위내 여부 체크] > ';

		let clockOutMarkingTime;

		// 반차일 경우 시간 조정
		let userDayHalfOff = this.isUserDayHalfOff(currDate, dayOffList, username);
		if (userDayHalfOff === '오전반반차') {
			clockOutMarkingTime = Share.addMinutes(endWorkTimeDate, minuteAfterClockOut); // 기준시간 15:05
		} else if (userDayHalfOff === '오전반차') {
			clockOutMarkingTime = Share.addMinutes(endWorkTimeDate, minuteAfterClockOut); // 기준시간 15:05
		} else if (userDayHalfOff === '오후반반차') {
			clockOutMarkingTime = Share.addMinutes(endWorkTimeDate, -2 * 60 + minuteAfterClockOut); // 기준시간 13:05
		} else if (userDayHalfOff === '오후반차') {
			let addHour = 4;
			if (endWorkTimeDate.getHours() < 17)
				addHour = 5;
			clockOutMarkingTime = Share.addMinutes(endWorkTimeDate, -addHour * 60 + minuteAfterClockOut); // 기준시간 13:05
		} else {
			clockOutMarkingTime = Share.addMinutes(endWorkTimeDate, minuteAfterClockOut);
		}

		if (now >= clockOutMarkingTime) {
			let validTime = Share.addMinutes(endWorkTimeDate, 60); // 기준시간 18:00 (17:00 + 01:00)
			if (now > validTime) {
				Logger.debug(`${logPrefix} 퇴근도장 찍을 유효시간(1시간) 초과됨`);
				return false
			} else {
				Logger.debug(`${logPrefix} 퇴근도장 찍을 시간`);
				return true;
			}
		} else {
			Logger.println(`${logPrefix} 퇴근도장 찍을 시간 아님, 퇴근시간 찍을 시간: ${Share.getTimeFormat(clockOutMarkingTime)}`);
			return false;
		}
	}

	isUserDayHalfOff = (currDate, dayOffList, username) => {
		const logPrefix = '[개인 반차 여부 체크] > ';
		let todayDayOffList = dayOffList[currDate];
		let dayHalfOffString = '';
		if (todayDayOffList) {
			todayDayOffList.forEach(item => {
				if (item.indexOf(username) > -1) {
					if (item.indexOf('오전') > -1 && item.indexOf('반반차') > -1) {
						Logger.println(`${logPrefix} 오전반반차`);
						dayHalfOffString = '오전반반차';
						return false;
					} else if (item.indexOf('오후') > -1 && item.indexOf('반반차') > -1) {
						Logger.println(`${logPrefix} 오후반반차`);
						dayHalfOffString = '오후반반차';
						return false;
					} else if (item.indexOf('오전') > -1) {
						Logger.println(`${logPrefix} 오전반차`);
						dayHalfOffString = '오전반차';
						return false;
					} else if (item.indexOf('오후') > -1) {
						Logger.println(`${logPrefix} 오후반차`);
						dayHalfOffString = '오후반차';
						return false;
					} else if (item.indexOf('반차') > -1) {
						Logger.println(`${logPrefix} 오늘은 반차입니다. (오전/오후 알수 없음)`);
						dayHalfOffString = '오후반반차';
						return false;
					}
				}
			});
		}

		return dayHalfOffString;
	}

	requestClockIn = async (userId, username) => {
		Logger.error(' ======> 출근시간 체크 시도');
		Logger.println("userId: " + userId)
		Logger.println("username: " + username)
		Logger.println("requestClockIn", false);
		const response = await daouofficeClient.requestClockIn(userId);
		const { code, message, name } = response;
		const currDate = Share.getCurrDate();
		const currTime = Share.getCurrTime();

		if (code === '200') {
			const msg = `${username}님, ${currDate} ${currTime}에 출근시간으로 표시되었습니다.`;
			Logger.error(' ======> ' + msg);
			await StorageUtil.set({
				clockInDateStorageKey: currDate
			});
			await firebaseApp.addWorktimeLog({
				username,
				type: '출근시간'
			});

			Share.showNotify('출근도장', msg, true);
		} else {
			if (name === 'timeline.clockin.duplication') { // 출근이 중복하여 존재합니다.
				Share.showNotify('출근도장', message, true);
				await StorageUtil.set({
					clockInDateStorageKey: currDate
				});
			} else {
				Logger.error(' ======> 출근시간 체크 에러 ');
				console.error(response);
			}
		}
	}

	requestClockOut = async (userId, username) => {
		Logger.error(' ======> 퇴근시간 체크 시도');
		Logger.println("userId: " + userId)
		Logger.println("username: " + username)
		const response = await daouofficeClient.requestClockOut(userId);
		const { code, message, name } = response;
		const currDate = Share.getCurrDate();
		const currTime = Share.getCurrTime();

		if (code === '200') {
			const msg = `${username}님, ${currDate} ${currTime}에 퇴근시간으로 표시되었습니다.`;
			Logger.error(' ======> ' + msg);
			await StorageUtil.set({
				clockOutDateStorageKey: currDate
			});
			await firebaseApp.addWorktimeLog({
				username,
				type: '퇴근시간'
			});

			Share.showNotify('퇴근도장', msg, true);
		} else {
			if (name === 'timeline.clockout.duplacation') { // 퇴근이 중복하여 존재합니다.
				Share.showNotify('퇴근도장', message, true);
				await StorageUtil.set({
					clockOutDateStorageKey: currDate
				});
			} else {
				Logger.error(' ======> 퇴근시간 체크 에러 ');
				console.error(response);
			}
		}
	}
}
