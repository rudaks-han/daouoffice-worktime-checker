class FirebaseApp
{
	constructor(props) {
		this.firebase = null;
		this.worktime_checker = "worktime_checker";
		this.user_config = "user_config";
	}

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
		this.firebase = firebase.initializeApp(config);
	}

	//writeLog(date, user, key, value)
	set(key, value)
	{
		this.firebase.database().ref(key).set({
			value
		});
	}

	get(key, callback)
	{
		var ref = this.firebase.database().ref(key);
		ref.on('value', function(snapshot) {
			callback(snapshot);
		});
	}
}

