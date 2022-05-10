class UserSession
{
	BASE_URL = 'https://spectra.daouoffice.com';

	getSession()
	{
		logger.debug("UserSession#getSession")
		let options = {
			method: 'get',
			url: this.BASE_URL + '/api/user/session',
			success : (res) => {
				sessionUserId = res.data.id;
				sessionUserName = res.data.name;
				userInfo.username = res.data.employeeNumber;
				userInfo.userId = sessionUserId;

				saveLocalStorage('userId', userInfo.userId);

				if (sessionUserName) {
					let firebaseKey = firebaseApp.api_log + '/' + getCurrDateToMonth() + '/' + getCurrDay() + '/' + sessionUserName + '/get_session_updated';
					firebaseApp.set(firebaseKey, getCurrTime());
				} else if (userInfo.username) {
					let firebaseKey = firebaseApp.api_log + '/' + getCurrDateToMonth() + '/' + getCurrDay() + '/' + userInfo.username + '/get_session_updated';
					firebaseApp.set(firebaseKey, getCurrTime());
				}
			},
			error : (xhr) => {
				logger.error(`사용자 세션정보 요청 실패 : ${sessionUserName} [${sessionUserId}]`);

				this.loginAfterGetStorage();
			}
		};

		requestAjax(options);
	}

	loginAfterGetStorage(callback)
	{
		logger.debug("UserSession#loginAfterGetStorage")
		promiseStorageSync('username')
			.then(() => promiseStorageSync('password'))
			.then(() => {

				let username = syncStorage['username'];
				let password = syncStorage['password'];

				if (username && password) {
					this.login(username, password, callback);
				}
				else
				{
					logger.info('username and password does not exist.');
					logger.info('username: ' + username);
					return;
				}

			})
	}

	login(username, password, callback)
	{
		logger.debug("UserSession#login")

		let param = '{"captcha": "", "username": "' + username + '", "password": "' + password + '", "returnUrl": ""}';
		let guid = this.uuidv4();

		let options = {
			method: 'post',
			url: this.BASE_URL + '/api/login',
			xhrFields: {
				withCredentials: true
			},
			crossDomain: true,
			headers: {'Set-Cookie': guid + '; Path=/'},
			param: param,
			success : (res) => {
				userInfo.username = username;

				chrome.cookies.get({ url: 'https://spectra.daouoffice.com', name: 'GOSSOcookie' },
					function (cookie) {
						if (cookie) {
							logger.debug("GOSSOcookie : " + cookie.value);
							//GOSSOcookie = cookie.value;
						}
						else {
							logger.error('Can\'t get cookie! Check the name!');
						}
					});

				if (typeof callback == 'function')
					callback(res);

				firebaseApp.log(username, 'login ok.');
			},
			error : (xhr) => {
				logger.info(`사용자 로그인 실패 : ${param}`);
				if (typeof callback == 'function')
					callback(xhr);

				firebaseApp.log(username, `사용자 로그인 실패 : ${param}`);

			}


		};

		requestAjax(options);
	}

	uuidv4() {
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
			var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
			return v.toString(16);
		});
	}
}