import HttpRequest from "./lib/httpRequest.js";
import StorageUtil from "./lib/storageUtil.js";
import Share from "./lib/Share.js";
import Logger from "./lib/Logger.js";

export default class DaouofficeClient {
	BASE_URL = 'https://spectra.daouoffice.com';

	requestOptions() {
		return {
			headers: {
				'Content-Type': 'application/json',
				'TimeZoneOffset': 540
			}
		};
	}

	async saveUserConfig(params) {
		await StorageUtil.set({
			'userConfig': params.data
		});
	}

	async getUserConfig() {
		return await StorageUtil.get('userConfig');
	}

	async getUserInfo() {
		return await StorageUtil.get('userInfo');
	}

	async getStorage(params) {
		return await StorageUtil.get(params.key);
	}

	async setStorage(params) {
		await StorageUtil.set(params.data);
	}

	async clearAllStorage() {
		return await StorageUtil.clearAll();
	}

	async login(params) {
		const { username, password } = params;
		let data = {
			captcha: "",
			username: username,
			password: password,
			returnUrl: ""
		};
		const options = {
			method: 'POST',
			headers: this.requestOptions().headers,
			body: JSON.stringify(data)
		};

		const url = `${this.BASE_URL}/api/login`;

		return await HttpRequest.request(url, options);
	}

	async getSession() {
		const options = {
			method: 'GET',
			headers: this.requestOptions().headers
		};

		const url = `${this.BASE_URL}/api/user/session`;
		const response = await HttpRequest.request(url, options);

		if (response && response.code === '200') {
			const {id, name, employeeNumber} = response.data;
			const userInfo = {
				id,
				name,
				employeeNumber
			}
			await StorageUtil.set({
				userInfo
			});
		} else {
			Logger.println('사용자 세션정보 요청 실패');
			await this.loginByUserConfig();
		}

		return response;
	}

	async loginByUserConfig() {
		const userConfig = await this.getUserConfig();
		Logger.println('#loginByUserConfig')
		const params = {
			username: userConfig.username,
			password: userConfig.password
		}
		await this.login(params);
	}


	// 해당 달의 달력정보를 가져온다.
	async getCalendar() {
		const options = {
			method: 'GET',
			headers: this.requestOptions().headers
		};

		const url = `${this.BASE_URL}/api/calendar/user/me/event/daily?year=${Share.getCurrYear()}&month=${Share.getCurrMonth()}`;

		return await HttpRequest.request(url, options);
	}

	async clockIn() {
		const response = await this.getSession();
		if (response && response.data && response.data.id) {
			const userSession = response.data;
			const userId = userSession.id;
			const result = await this.requestClockIn(userId);;
			const { code, message } = result;
			if (code === '200') {
				return {
					error: false,
					message: '출근체크 되었습니다'
				}
			} else {
				return {
					error: true,
					message
				}
			}
		} else {
			return {
				error: true,
				message: 'daouoffice session not exists'
			}
		}
	}

	async clockOut() {
		const response = await this.getSession();
		if (response && response.data && response.data.id) {
			const userSession = response.data;
			const userId = userSession.id;
			const result = await this.requestClockOut(userId);;
			const { code, message } = result;
			if (code === '200') {
				return {
					error: false,
					message: '퇴근체크 되었습니다'
				}
			} else {
				return {
					error: true,
					message
				}
			}
		} else {
			return {
				error: true,
				message: 'daouoffice session not exists'
			}
		}
	}

	async requestClockIn(userId) {
		const currDate = Share.getCurrDate();
		const currTime = Share.getCurrTime();

		const url = `${this.BASE_URL}/api/ehr/timeline/status/clockIn?userId=${userId}&baseDate=${currDate}`;
		const data = {
			"checkTime":`${currDate}T${currTime}.000Z`,
			"timelineStatus": {},
			"isNightWork": false,
			"workingDay":`${currDate}`
		};

		const options = {
			method: 'POST',
			headers: this.requestOptions().headers,
			body: JSON.stringify(data),
		};

		return await HttpRequest.request(url, options);
	}

	async requestClockOut(userId) {
		const currDate = Share.getCurrDate();
		const currTime = Share.getCurrTime();

		const url = `${this.BASE_URL}/api/ehr/timeline/status/clockOut?userId=${userId}&baseDate=${currDate}`;
		const data = {
			"checkTime":`${currDate}T${currTime}.000Z`,
			"timelineStatus": {},
			"isNightWork": false,
			"workingDay":`${currDate}`
		};

		const options = {
			method: 'POST',
			headers: this.requestOptions().headers,
			body: JSON.stringify(data),
		};

		return await HttpRequest.request(url, options);
	}
}

