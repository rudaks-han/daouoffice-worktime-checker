import DaouofficeClient from "./DaouofficeClient.js";
import Share from "./lib/Share.js";
import StorageUtil from "./lib/storageUtil.js";

const daouofficeClient = new DaouofficeClient();

export default class WorkHourChecker {

	constructor() {
	}

	check = async params => {
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
		console.log('[주말여부 체크]')
		const { currDate } = params;
		const date = new Date(currDate + 'T12:00:00');
		if (date.getDay() == 0 || date.getDay() == 6) { // 토, 일 제외
			console.log('[' + currDate + '] 오늘은 주말입니다.');
			return true;
		} else {
			return false;
		}
	}

	isHoliday = params => {
		console.log('[공휴일 여부 체크]')
		const { currDate, holidayList } = params;
		if (holidayList[currDate]) {
			console.log('[' + currDate + '] 오늘은 공휴일입니다.');
			return true;
		} else {
			return false;
		}
	}

	isUserDayOff = params => {
		console.log('[개인 연차 여부 체크]')
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
						console.log('>>> 오늘은 연차입니다.');
						return true;
					}
				}
			});
		}
		return false;
	}

	isMarkedClockInAlready = async () => {
		console.log('[출근도장 표시되었는지 체크]')
		const clockInDate = await StorageUtil.get('clockInDate')

		if (clockInDate === Share.getCurrDate()) {
			console.log('>>> 이미 출근도장이 찍혀져 있습니다.')
			return true;
		} else {
			return false;
		}
	}

	isMarkedClockOutAlready = async () => {
		console.log('[퇴근도장 표시되었는지 체크]')
		const clockOutDate = await StorageUtil.get('clockOutDate')

		if (clockOutDate === Share.getCurrDate()) {
			console.log('>>> 이미 퇴근도장이 찍혀져 있습니다.')
			return true;
		} else {
			return false;
		}
	}

	markAsClockIn = async params => {
		const { userConfig, currDate, dayOffList, username } = params;
		const {
			clockInBeforeMinute,
			clockInCheckType,
			clockInHour,
			clockInMinute,
			clockInRandomFromMinute,
			clockInRandomToMinute
		} = userConfig;
		const startWorkTimeDate = this.toCurrDate(clockInHour, clockInMinute);

		if (clockInCheckType === 'TIME') {
			if (this.isInRangeClockIn(startWorkTimeDate, parseInt(clockInBeforeMinute), currDate, dayOffList, username)) {
				this.requestClockIn();
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

			if (this.isInRangeClockIn(startWorkTimeDate, parseInt(beforeMinute), currDate, dayOffList, username)) {
				this.requestClockIn();
			}
		}
	}

	markAsClockOut = async params => {
		const { userConfig, currDate, dayOffList, username } = params;
		const {
			clockOutBeforeMinute,
			clockOutCheckType,
			clockOutHour,
			clockOutMinute,
			clockOutRandomFromMinute,
			clockOutRandomToMinute
		} = userConfig;

		const endWorkTimeDate = this.toCurrDate(clockOutHour, clockOutMinute);

		if (clockOutCheckType === 'TIME') {
			if (this.isInRangeClockOut(endWorkTimeDate, parseInt(clockOutBeforeMinute), currDate, dayOffList, username)) {
				this.requestClockOut();
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

			if (this.isInRangeClockOut(endWorkTimeDate, parseInt(afterMinute), currDate, dayOffList, username)) {
				this.requestClockOut();
			}
		}
	}

	toCurrDate = (hour, minute) => {
		return this.getCurrentDateWithTime(hour, minute, 0);
	}

	getCurrentDateWithTime = (hour, minute, second) => {
		const date = new Date();
		return new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour, minute, second);
	}

	isInRangeClockIn = (startWorkTimeDate, minuteBeforeClockIn, currDate, dayOffList, username) => {
		console.log('[출근도장 범위내 여부 체크]')

		const date = new Date();
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

		let validTime = Share.addMinutes(startWorkTimeDate, 60); // 기준시간 09:00

		if (date >= clockInMarkingTime) {
			if (date > validTime) {
				console.log('>>> 출근도장 찍을 유효시간(1시간) 초과됨');
				return false;
			} else {
				return true;
			}
		} else {
			console.log('>>> 출근도장 찍을 시간 아님 (' + clockInMarkingTime + ')');
			return false;
		}
	}

	// 퇴근시간 후 5분후 부터 1시간 까지
	isInRangeClockOut = (endWorkTimeDate, minuteAfterClockOut, currDate, dayOffList, username) => {
		console.log('[퇴근도장 범위내 여부 체크]')

		const date = new Date();
		// 퇴근도장 찍을 시간
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

		let outTime = Share.addMinutes(endWorkTimeDate, 60); // 기준시간 18:00 (17:00 + 01:00)
		if (date >= clockOutMarkingTime) {
			if (date > outTime) {
				console.log('>>> 퇴근도장 찍을 유효시간(1시간) 초과됨');
				return false
			} else {
				return true;
			}
		} else {
			console.log('>>> 퇴근도장 찍을 시간 아님 (' + clockOutMarkingTime + ')');
			return false;
		}
	}

	isUserDayHalfOff = (currDate, dayOffList, username) => {
		console.log('[개인 반차 여부 체크]')
		let todayDayOffList = dayOffList[currDate];
		if (todayDayOffList) {
			todayDayOffList.forEach(item => {
				if (item.indexOf(username) > -1) {
					if (item.indexOf('오전') > -1 && item.indexOf('반반차') > -1) {
						return '오전반반차';
					} else if (item.indexOf('오후') > -1 && item.indexOf('반반차') > -1) {
						return '오후반반차';
					} else if (item.indexOf('오전') > -1) {
						return '오전반차';
					} else if (item.indexOf('오후') > -1) {
						return '오후반차';
					} else if (item.indexOf('반차') > -1) {
						console.log('>>> 오늘은 반차입니다. (오전/오후 알수 없음) ');
						return '오전';
					}
				}
			});
		}

		return '';
	}

	requestClockIn = () => {
		console.error('requestClockIn()')
	}

	requestClockOut = () => {
		console.error('requestClockOut()')
	}
}
