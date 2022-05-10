class FirebaseConfigChecker
{
	eventAttached = false;

	get(username)
	{
		if (username) {
			logger.debug('FirebaseConfigChecker#get');

			if (!this.eventAttached)
			{
				firebaseApp.get(firebaseApp.user_config + '/' + username, snapshot => {
					if (snapshot.val() == null)
					{
						return;
					}

					let {value} = snapshot.val();

					const jsonValue = {
						'use-flag': value['use-flag']
					}
					chrome.storage.sync.set(jsonValue, function () {
						//logger.debug(JSON.stringify(jsonValue));
						console.log('firebase config updated');
					});
				});

				//this.eventAttached = true;
				//clearTimeout(firebaseConfigTimer);
			}

		} else {
			const userSession = new UserSession();
			userSession.loginAfterGetStorage();
		}
	}
}

const firebaseConfigChecker = new FirebaseConfigChecker();
