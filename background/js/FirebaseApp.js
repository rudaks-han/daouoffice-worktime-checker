import {initializeApp} from "./firebase/firebase-app.js";
import {getDatabase, onDisconnect, onValue, set, ref, update, getConnectStatus} from "./firebase/firebase-database.js";

class FirebaseApp {
	_firebase;

	worktime_checker = "worktime_checker";
	user_config = "user_config";
	api_log = "api_log";

	constructor() {
		this.firebaseEventAttached = false;
		this.initialize();
		this.checkNetworkConnection();
		this.networkConnected = false;
	}

	/*init()
	{
		const config = {
			apiKey: "AIzaSyBeWHyVqAAk-kXXPtsEg-4IK66P9Xjma4A",
			authDomain: "spectra-groupware.firebaseapp.com",
			databaseURL: "https://spectra-groupware.firebaseio.com",
			projectId: "spectra-groupware",
			storageBucket: "spectra-groupware.appspot.com",
			messagingSenderId: "785900078227"
		};
		//this._firebase = firebase.initializeApp(config);
		this.app = initializeApp(firebaseConfig);
		this.db = getDatabase();
	}*/

	checkNetworkConnection() {
		const _this = this;

		let connected = true;
		setInterval(() => {
			const connectStatus = getConnectStatus();
			if (!connectStatus) {
				_this.printLog("firebase disconnected");
				connected = false;
			} else {
				if (!connected) {
					connected = true;
					_this.printLog("firebase reconnected");
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
		const buildRef = ref(this.db, `build-status/dummy`);
		onValue(buildRef, (snapshot) => {
			_this.printLog(`dummy test callback`);
		});
	}

	addEvent = async (db) => {
		const _this = this;
		if (!this.firebaseEventAttached) {
			const accessLogRef = ref(db, `access_logs`);
			onValue(accessLogRef, (snapshot) => {
				_this.printLog('firebaseEvent attached');
			}, {
				onlyOnce: true
			});
		}

		this.firebaseEventAttached = true;
	}

	//writeLog(date, user, key, value)
	set(key, value)
	{
		logger.trace('firebase set');
		logger.trace('key: ' + key);
		logger.trace('value: ' + value);

		this._firebase.database().ref(key).set({
			value
		});
	}

	get(key, callback)
	{
		let ref = this._firebase.database().ref(key);
		ref.on('value', function(snapshot) {
			callback(snapshot);
		});
	}

	log(itemId, value)
	{
		const key = `${this.api_log}/${getCurrDate()}/${itemId}/${getCurrTime()}`;

		this.set(key, value);
	}
}

export default FirebaseApp;
