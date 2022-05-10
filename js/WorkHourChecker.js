class WorkHourChecker
{
	BASE_URL = 'https://spectra.daouoffice.com';

	// 사용자의 개인설정 정보를 가져온다.
	getUserConfig()
	{
		logger.debug("WorkHourChecker#getUserConfig")

		promiseStorageSync('clock-in-hour')
			.then(() => promiseStorageSync('clock-in-minute'))
			.then(() => {
				return new Promise(function(resolve, reject) {
					setTimeout(function() {
						userConfig['startWorkTime'] = syncStorage['clock-in-hour'] + ':' + syncStorage['clock-in-minute']; // 출근시간
						resolve('success');
					}, 10);
				});
			})
			.then(() => promiseStorageSync('clock-out-hour'))
			.then(() => promiseStorageSync('clock-out-minute'))
			.then(() => {
				return new Promise(function(resolve, reject) {
					setTimeout(function() {
						userConfig['endWorkTime'] = syncStorage['clock-out-hour'] + ':' + syncStorage['clock-out-minute']; // 출근시간
						resolve('success');
					}, 10);
				})
			})
			.then(() => promiseStorageSync('clock-in-check-type', 'clockInCheckType'))
			.then(() => promiseStorageSync('clock-in-before-minute', 'minuteBeforeClockIn'))
			.then(() => promiseStorageSync('clock-in-random-from-minute', 'clockInRandomFromMinute'))
			.then(() => promiseStorageSync('clock-in-random-to-minute', 'clockInRandomToMinute'))

			.then(() => promiseStorageSync('clock-out-check-type', 'clockOutCheckType'))
			.then(() => promiseStorageSync('clock-out-after-minute', 'minuteAfterClockOut'))
			.then(() => promiseStorageSync('clock-out-random-from-minute', 'clockOutRandomFromMinute'))
			.then(() => promiseStorageSync('clock-out-random-to-minute', 'clockOutRandomToMinute'))

			.then(() => {
				return new Promise(function(resolve, reject) {
					setTimeout(function() {
						resolve('success');
					}, 10);
				})
			});
	}

	// 해당 달의 달력정보를 가져온다.
	requestCalendar()
	{
		logger.debug("WorkHourChecker#requestCalendar")

		let url = `${this.BASE_URL}/api/calendar/user/me/event/daily?year=${getCurrYear()}&month=${getCurrMonth()}`;

		let options = {
			method: 'get',
			url: url,
			success : (response) => this.requestCalendarCallback(response)
		};

		requestAjax(options);
	}

	// requestCalendar에 대한 Callback
	requestCalendarCallback(response)
	{
		logger.debug("WorkHourChecker#requestCalendarCallback")

		let list = response.data.list;
		for (let i = 0; i < list.length; i++) {
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
		}
	}

	// 출/퇴근시간 체크 시작
	checkStartWorkTime()
	{
		logger.debug("WorkHourChecker#checkStartWorkTime -> " + sessionUserName);

		// 주말인지 여부 체크
		if (this.isWeekend())
			return;

		// 공휴일인지 여부 체크
		if (this.isHoliday())
			return;

		// 연차 여부 체크
		if (this.isUserDayOff())
			return;

		if (!this.isMarkedClockInAlready())
		{
			this.markAsClockIn();
		}

		if (!this.isMarkedClockOutAlready())
		{
			this.markAsClockOut();
		}
	}

	// 이미 출근도장 찍음
	isMarkedClockInAlready()
	{
		logger.trace('[출근도장 표시되었는지 체크]')
		let storageClockInDate = getLocalStorage('CLOCK_IN_DATE');

		if (storageClockInDate == getCurrDate()) {
			logger.trace('>>> 이미 출근도장이 찍혀져 있습니다.')
			return true;
		} else {
			return false;
		}
	}

	// 이미 퇴근도장 찍음
	isMarkedClockOutAlready()
	{
		logger.trace('[퇴근도장 표시되었는지 체크]')
		let storageClockOutDate = getLocalStorage('CLOCK_OUT_DATE');

		if (storageClockOutDate == getCurrDate()) {
			logger.trace('>>> 이미 퇴근도장이 찍혀져 있습니다.')
			return true;
		} else {
			return false;
		}
	}

	// 주말인지 체크
	isWeekend()
	{
		logger.trace('[주말여부 체크]')
		let currDate = new Date();
		if (currDate.getDay() == 0 || currDate.getDay() == 6) // 토, 일 제외
		{
			logger.trace('[' + getCurrDate() + '] 오늘은 주말입니다.');
			return true;
		} else {
			return false;
		}
	}

	// 공휴일인지 체크
	isHoliday()
	{
		logger.trace('[공휴일 여부 체크]')
		let currDate = getCurrDate();
		if (holidayList[currDate]) {
			logger.trace('>>> [' + getCurrDate() + '] 오늘은 공휴일입니다.');
			return true;
		} else {
			return false;
		}
	}

	// 연차인지 체크
	isUserDayOff()
	{
		logger.trace('[개인 연차 여부 체크]')
		let currDate = getCurrDate();
		//console.error(currDate)
		//currDate = '2020-07-01'

		let todayDayOffList = dayOffList[currDate];
		if (todayDayOffList)
		{
			for (let i = 0; i < todayDayOffList.length; i++) {
				let item = todayDayOffList[i];
				if (item.indexOf(sessionUserName) > -1 || item.indexOf('보상휴가') > -1) {
					let dayOff = false;
					if ((item.indexOf('연차') > -1 || item.indexOf('보상') > -1)
						&& item.indexOf('오전') == -1 && item.indexOf('오후') == -1 && item.indexOf('반차') == -1) {
						dayOff = true;
					}

					if (dayOff) {
						// 연차
						logger.trace('>>> 오늘은 연차입니다.');
						return true;
					}
					/*if (!(item.indexOf('오전') > -1 || item.indexOf('오후') > -1 || item.indexOf('반차') > -1)) {
						// 연차
						logger.trace('>>> 오늘은 연차입니다.');
						return true;
					}*/
				}
			}
		}
		return false;
	}

	markAsClockIn()
	{
		let minuteBeforeClockIn = parseInt(userConfig['minuteBeforeClockIn']);
		let startWorkTimeDate = this.getStartWorkTimeDate();

		if (userConfig['clockInCheckType'] === 'TIME')
		{
			if (this.isInRangeClockIn(startWorkTimeDate, minuteBeforeClockIn))
			{
				const workHourChecker = new WorkHourMarker();
				workHourChecker.requestClockIn();
			}
		}
		else if (userConfig['clockInCheckType'] === 'RANDOM')
		{
			let currDate = getCurrDate();
			let beforeTime = clockInRandomTime[currDate];
			if (!beforeTime)
			{
				const clockInRandomFromMinute = userConfig['clockInRandomFromMinute'];
				const clockInRandomToMinute = userConfig['clockInRandomToMinute'];

				beforeTime = randomRange(clockInRandomFromMinute, clockInRandomToMinute);
				logger.trace('clockIn randomTime: ' + beforeTime)

				clockInRandomTime[currDate] = beforeTime;
			}

			if (this.isInRangeClockIn(startWorkTimeDate, beforeTime))
			{
				const workHourChecker = new WorkHourMarker();
				workHourChecker.requestClockIn();
			}
		}
	}

	markAsClockOut()
	{
		let minuteAfterClockOut = parseInt(userConfig['minuteAfterClockOut']);
		let endWorkTimeDate = this.getEndWorkTimeDate();

		if (userConfig['clockOutCheckType'] === 'TIME')
		{
			if (this.isInRangeClockOut(endWorkTimeDate, minuteAfterClockOut))
			{
				const workHourChecker = new WorkHourMarker();
				workHourChecker.requestClockOut();
			}
		}
		else if (userConfig['clockOutCheckType'] === 'RANDOM')
		{
			let currDate = getCurrDate();
			let afterTime = clockOutRandomTime[currDate];
			if (!afterTime)
			{
				const clockOutRandomFromMinute = userConfig['clockOutRandomFromMinute'];
				const clockOutRandomToMinute = userConfig['clockOutRandomToMinute'];

				afterTime = randomRange(clockOutRandomFromMinute, clockOutRandomToMinute);
				logger.trace('clockOut randomTime: ' + afterTime)

				clockOutRandomTime[currDate] = afterTime;
			}

			if (this.isInRangeClockOut(endWorkTimeDate, afterTime))
			{
				const workHourChecker = new WorkHourMarker();
				workHourChecker.requestClockOut();
			}
		}
	}

	// 반차인지 체크
	isUserDayHalfOff()
	{
		logger.trace('[개인 반차 여부 체크]')
		let currDate = getCurrDate();
		let todayDayOffList = dayOffList[currDate];

		if (todayDayOffList)
		{
			for (let i = 0; i < todayDayOffList.length; i++) {
				let item = todayDayOffList[i];
				if (item.indexOf(sessionUserName) > -1) {
					if (item.indexOf('오전') > -1 && item.indexOf('반반차') > -1) {
						return '오전반반차';
					} else if (item.indexOf('오후') > -1 && item.indexOf('반반차') > -1) {
						return '오후반반차';
					} else if (item.indexOf('오전') > -1) {
						return '오전반차';
					} else if (item.indexOf('오후') > -1) {
						return '오후반차';
					} else if (item.indexOf('반차') > -1) {
						logger.trace('>>> 오늘은 반차입니다. (오전/오후 알수 없음) ');
						return '오전';
					}
				}
			}
		}

		return false;
	}

	getStartWorkTimeDate()
	{
		// 출근시간 설정값
		let arStartWorkTime = userConfig['startWorkTime'].split(':');
		let startWorkTimeHour = arStartWorkTime[0];
		let startWorkTimeMinute = arStartWorkTime[1];

		return this.getCurrentDateWithTime(startWorkTimeHour, startWorkTimeMinute, 0);
	}

	getEndWorkTimeDate()
	{
		// 퇴근시간 설정값
		let arEndWorkTime = userConfig['endWorkTime'].split(':');
		let endWorkTimeHour = arEndWorkTime[0];
		let endWorkTimeMinute = arEndWorkTime[1];

		return this.getCurrentDateWithTime(endWorkTimeHour, endWorkTimeMinute, 0);
	}

	// 출근시간 전 5분전 부터 출근시간 후 1시간 까지
	isInRangeClockIn(startWorkTimeDate, minuteBeforeClockIn)
	{
		logger.trace('[출근도장 범위내 여부 체크]')

		let date = new Date();
		let clockInMarkingTime = null;

		// 반차일 경우 시간 조정
		let userDayHalfOff = this.isUserDayHalfOff();
		if (userDayHalfOff == '오전반반차') {
			clockInMarkingTime = startWorkTimeDate.addMinutes(2 * 60 - minuteBeforeClockIn); // 기준시간 12:55
		} else if (userDayHalfOff == '오전반차') {
			// 8시 이전 출근이라면 +4를 하고 8시 출근 이후라면 +5를 한다.
			let addHour = 5; // 점심시간 포함
			if (startWorkTimeDate.getHours() < 8) {
				addHour = 4; // 점심시간 이전 출근
			}
			clockInMarkingTime = startWorkTimeDate.addMinutes(addHour * 60 - minuteBeforeClockIn); // 기준시간 12:55
		} else if (userDayHalfOff == '오후반반차'){
			clockInMarkingTime = startWorkTimeDate.addMinutes(-minuteBeforeClockIn); // 기준시간 07:55
		} else if (userDayHalfOff == '오후반차'){
			clockInMarkingTime = startWorkTimeDate.addMinutes(-minuteBeforeClockIn); // 기준시간 07:55
		} else {
			clockInMarkingTime = startWorkTimeDate.addMinutes(-minuteBeforeClockIn); // 기준시간 07:55
		}

		let outTime = startWorkTimeDate.addMinutes(60); // 기준시간 09:00

		if (date >= clockInMarkingTime) {
			if (date > outTime) {
				logger.trace('>>> 출근도장 찍을 유효시간(1시간) 초과됨');
				return false
			} else {
				return true;
			}
		} else {
			logger.trace('>>> 출근도장 찍을 시간 아님 (' + clockInMarkingTime + ')');
			return false;
		}
	}

	// 퇴근시간 후 5분후 부터 1시간 까지
	isInRangeClockOut(endWorkTimeDate, minuteAfterClockOut)
	{
		logger.trace('[퇴근도장 범위내 여부 체크]')

		let currDate = new Date();
		// 퇴근도장 찍을 시간
		let clockOutMarkingTime = null;

		// 반차일 경우 시간 조정
		let userDayHalfOff = this.isUserDayHalfOff();
		if (userDayHalfOff == '오전반반차') {
			clockOutMarkingTime = endWorkTimeDate.addMinutes(minuteAfterClockOut); // 기준시간 15:05
		} else if (userDayHalfOff == '오전반차') {
			clockOutMarkingTime = endWorkTimeDate.addMinutes(minuteAfterClockOut); // 기준시간 15:05
		} else if (userDayHalfOff == '오후반반차') {
			clockOutMarkingTime = endWorkTimeDate.addMinutes(-2 * 60 + minuteAfterClockOut); // 기준시간 13:05
		} else if (userDayHalfOff == '오후반차') {
			let addHour = 4;
			if (endWorkTimeDate.getHours() < 17)
				addHour = 5;
			clockOutMarkingTime = endWorkTimeDate.addMinutes(-addHour * 60 + minuteAfterClockOut); // 기준시간 13:05
		} else {
			clockOutMarkingTime = endWorkTimeDate.addMinutes(minuteAfterClockOut);
		}

		let outTime = endWorkTimeDate.addMinutes(60); // 기준시간 18:00 (17:00 + 01:00)

		if (currDate >= clockOutMarkingTime) {
			if (currDate > outTime) {
				logger.trace('>>> 퇴근도장 찍을 유효시간(1시간) 초과됨');
				return false
			} else {
				return true;
			}
		} else {
			logger.trace('>>> 퇴근도장 찍을 시간 아님 (' + clockOutMarkingTime + ')');
			return false;
		}
	}

	getCurrentDateWithTime(hour, minute, second)
	{
		let date = new Date();
		return new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour, minute, second);
	}
}
