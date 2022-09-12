import {initializeApp} from "./firebase/firebase-app.js";
import {get, getConnectStatus, getDatabase, onValue, ref, set} from "./firebase/firebase-database.js";
import DaouofficeClient from "./DaouofficeClient.js";
import Share from "./lib/Share.js";
import Logger from "./lib/Logger.js";

const daouofficeClient = new DaouofficeClient();

class FirebaseApp {
	_firebase;

	worktime_checker = "worktime_checker";
	user_config = "user_config";
	api_log = "api_log";

	constructor() {
		this.firebaseEventAttached = false;
		this.initialize();
		this.checkNetworkConnection();
	}

	checkNetworkConnection() {
		const _this = this;

		let connected = true;
		setInterval(() => {
			const connectStatus = getConnectStatus();
			if (!connectStatus) {
				Logger.println("firebase disconnected");
				connected = false;
			} else {
				if (!connected) {
					connected = true;
					Logger.println("firebase reconnected");
				}
				_this.addEvent(_this.db);
			}
		}, 60*1000);
	}

	initialize = () => {
		const firebaseConfig = {
			apiKey: "AIzaSyBeWHyVqAAk-kXXPtsEg-4IK66P9Xjma4A",
			authDomain: "spectra-groupware.firebaseapp.com",
			databaseURL: "https://spectra-groupware.firebaseio.com",
			projectId: "spectra-groupware",
			storageBucket: "spectra-groupware.appspot.com",
			messagingSenderId: "785900078227"
		};

		this.app = initializeApp(firebaseConfig);
		this.db = getDatabase();
	}

	reconnect = () => {
		this.addEvent(this.db);
	}

	start = () => {
		this.firebaseConnectTest();
		this.addEvent(this.db);
	}

	firebaseConnectTest = () => {
		const _this = this;
		const buildRef = ref(this.db, `build-status`);
		onValue(buildRef, (snapshot) => {
			Logger.info('dummy test callback');
		});
	}

	addEvent = async (db) => {
		if (!this.firebaseEventAttached) {
			this.addEventUserConfigChanged(db);
		}

		this.firebaseEventAttached = true;
	}

	addEventUserConfigChanged = (db) => {
		const userConfigRef = ref(db, `user_config`);
		onValue(userConfigRef, this.userConfigChangedCallback, {
		});
	}

	userConfigChangedCallback = async (snapshot) => {
		const userConfig = await daouofficeClient.getUserConfig();
		if (!userConfig) {
			Logger.error("userConfig not found");
			return;
		}

		const {username} = userConfig; // 2014001

		const userConfigValues = snapshot.val();
		if (userConfigValues[username]) {
			const userConfigValue = userConfigValues[username].value;
			const useFlag = userConfigValue['use-flag']
			userConfig['useFlag'] = useFlag;
			await daouofficeClient.saveUserConfig({
				data: userConfig
			})

			Logger.info('userConfigChangedCallback');
			Logger.info(`[${username}] useFlag changed: ${useFlag}`);
		}
	}

	setUserConfig = async params => {
		const { username, value } = params;
		// username : 2014001
		const db = this.db;
		await set(ref(db, 'user_config/' + username + '/value'), value);
	}

	getUserConfig = async params => {
		const { username } = params;
		// username : 2014001

		const db = this.db;
		const userConfigRef = ref(db, `user_config/` + username + '/value');
		const snapshot = await get(userConfigRef);
		return snapshot.val();
	}

	addWorktimeLog = async params => {
		const { username, type } = params;
		const db = this.db;

		let currTime = Share.getCurrTime();
		const key = `worktime_checker/${Share.getCurrDateToMonth()}/${Share.getCurrDay()}/${username}/${type}`;

		await set(ref(db, key), currTime);
	}

	//writeLog(date, user, key, value)
	set(key, value)
	{
		const db = this.db;
		set(ref(db, key), value);
	}

	accessLog = (path, value) => {
		const db = this.db;
		set(ref(db, 'api_log/' + path), value);
	}
}

export default FirebaseApp;
