class WorkHourMarker
{
	BASE_URL = 'https://spectra.daouoffice.com';

	// 출근하기
	requestClockIn()
	{
		logger.debug("WorkHourMarker#requestClockIn");

		let currDate = getCurrDate();
		let currTime = getCurrTime();

		//let userId = userInfo.userId;
		let userId = getLocalStorage("userId");
		let url = `${this.BASE_URL}/api/ehr/timeline/status/clockIn?userId=${userId}&baseDate=${currDate}`;
		let param = `{"checkTime":"${currDate}T${currTime}.000Z","timelineStatus":{},"isNightWork":false,"workingDay":"${currDate}"}`;

		let options = {
			method: 'post',
			url: url,
			headers: {'TimeZoneOffset': '540'},
			param: param,
			success : (res) => {
				let msg = '';
				if (res.code == 200)
				{
					// 출근도장 OK
					msg = `${sessionUserName}님, ${currDate} ${currTime}에 출근시간으로 표시되었습니다.`;
					showBgNotification('출근도장', msg, true);
					saveLocalStorage('CLOCK_IN_DATE', currDate);

					const firebaseKey = `${firebaseApp.worktime_checker}/${getCurrDateToMonth()}/${getCurrDay()}/${sessionUserName}/출근시간`;
					const firebaseValue = currTime;

					firebaseApp.set(firebaseKey, firebaseValue);
					logger.info('>>> [' + currDate + '] 출근도장 OK.')
				}
				else
				{
					// 실패
					msg = `${sessionUserName}님, 출근시간 등록 실패!!!. ==> ${res.message}`;
					showBgNotification('출근도장', msg);
					logger.info('>>> [' + currDate + '] 출근도장 Fail.')
				}

				firebaseApp.log(sessionUserName, msg);
			},
			error : (xhr, e) => {
				console.error(e);
				let responseText = JSON.parse(xhr.responseText);

				this.handleError(responseText);

				firebaseApp.log(sessionUserName, responseText);
			},
			complete : function(res) {
			}
		};

		requestAjax(options);
	}

	// 퇴근하기
	requestClockOut()
	{
		logger.debug("WorkHourMarker#requestClockOut");

		let currDate = getCurrDate();
		let currTime = getCurrTime();

		//let userId = userInfo.userId;
		let userId = getLocalStorage("userId");
		let url = `${this.BASE_URL}/api/ehr/timeline/status/clockOut?userId=${userId}&baseDate=${currDate}`;
		let param = `{"checkTime":"${currDate}T${currTime}.000Z","timelineStatus":{},"isNightWork":false,"workingDay":"${currDate}"}`;

		let options = {
			method: 'post',
			url: url,
			headers: {'TimeZoneOffset': '540'},
			param: param,
			success : (res) => {
				let msg = '';
				if (res.code == 200)
				{
					// 퇴근도장 OK
					msg = `${sessionUserName}님, ${currDate} ${currTime}에 퇴근시간 체크되었습니다. 즐퇴하세요~`;
					showBgNotification('퇴근도장', msg, true);
					saveLocalStorage('CLOCK_OUT_DATE', currDate);

					const firebaseKey = `${firebaseApp.worktime_checker}/${getCurrDateToMonth()}/${getCurrDay()}/${sessionUserName}/퇴근시간`;
					const firebaseValue = currTime;

					firebaseApp.set(firebaseKey, firebaseValue);

					logger.info('>>> [' + currDate + '] 퇴근도장 OK.')
				}
				else
				{
					// 실패
					msg = `${sessionUserName}님, 퇴근시간 등록 실패!!!.`;
					showBgNotification('퇴근도장', msg);
					logger.info('>>> [' + currDate + '] 퇴근도장 Fail.')
				}

				firebaseApp.log(sessionUserName, msg);
			},
			error : (xhr) => {
				let responseText = JSON.parse(xhr.responseText);

				this.handleError(responseText);

				firebaseApp.log(sessionUserName, responseText);
			},
			complete : function(res) {
			}
		};

		requestAjax(options);

	}

	handleError(responseText)
	{
		//console.log('responseText : ' + JSON.stringify(responseText))
		if (responseText.name === 'common.unauthenticated')
		{
			showBgNotification('출근도장', "스펙트라 그룹웨어에 로그인 되지 않았습니다. 브라우저에서 로그인 해주시기 바랍니다.");
			logger.info('스펙트라 그룹웨어에 로그인 되지 않았습니다. 브라우저에서 로그인 해주시기 바랍니다.');
		}
		else if (responseText.name === 'timeline.clockin.duplication')
		{
			showBgNotification('출근도장', `${sessionUserName}님, 출근시간 등록 실패!!!. ==> ${responseText.message}`);
			logger.info(`${sessionUserName}님, 출근시간 등록 실패!!!. ==> ${responseText.message}`);

			saveLocalStorage('CLOCK_IN_DATE', getCurrDate());
		}
		else if (responseText.name === 'timeline.clockout.duplication')
		{
			showBgNotification('퇴근도장', `${sessionUserName}님, 퇴근도장 등록 실패!!!. ==> ${responseText.message}`);
			logger.info(`${sessionUserName}님, 퇴근도장 등록 실패!!!. ==> ${responseText.message}`);
			saveLocalStorage('CLOCK_OUT_DATE', getCurrDate());
		}
		else
		{
			showBgNotification('Error', `${sessionUserName}님, WorkHourMarker Error. ==> ${responseText.message}`);
			logger.info(`${sessionUserName}님, WorkHourMarker Error. ==> ${responseText.message}`);
		}
	}
}