class FirebaseApp
{
	_firebase;

	worktime_checker = "worktime_checker";
	user_config = "user_config";
	api_log = "api_log";

	init()
	{
		const config = {
			apiKey: "AIzaSyBeWHyVqAAk-kXXPtsEg-4IK66P9Xjma4A",
			authDomain: "spectra-groupware.firebaseapp.com",
			databaseURL: "https://spectra-groupware.firebaseio.com",
			projectId: "spectra-groupware",
			storageBucket: "spectra-groupware.appspot.com",
			messagingSenderId: "785900078227"
		};
		this._firebase = firebase.initializeApp(config);
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

const firebaseApp = new FirebaseApp();
firebaseApp.init();
