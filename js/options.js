let sessionUserId = '';
let sessionUserName = '';

function init()
{
	//var backgroundPage = chrome.extension.getBackgroundPage();

	chrome.storage.sync.get('use-flag', function(items) {

		let useFlag = items['use-flag'];

		useFlag = useFlag || 'N';

		if (useFlag == 'Y') {
			setUseFlagChecked(true);
		} else {
			setUseFlagChecked(false);
		}

		if (useFlag == 'N')
		{
			disableUserSetting(true);
		}
		else if (useFlag == 'Y')
		{
			disableUserSetting(false);
		}
	});

	setInputValue('username', '');
	setInputValue('password', '');
	setInputValue('clock-in-hour', '09');
	setInputValue('clock-in-minute', '00');
	setInputValue('clock-out-hour', '18');
	setInputValue('clock-out-minute', '00');
	setRadioValue('clock-in-check-type', 'TIME');
	setInputValue('clock-in-before-minute', '5');
	setInputValue('clock-in-random-from-minute', '10');
	setInputValue('clock-in-random-to-minute', '5');
	setRadioValue('clock-out-check-type', 'TIME');
	setInputValue('clock-out-after-minute', '1');
	setInputValue('clock-out-random-from-minute', '5');
	setInputValue('clock-out-random-to-minute', '10');

	chrome.storage.sync.get('username', function(items) {
		let username = items['username'];
		if (username) {
			onUpdateFirebaseConfig(username);
		}
	});
}

function setUseFlagChecked(flag) {
	if (flag)
		$('.ui.toggle.checkbox.use-flag').checkbox('set checked');
	else
		$('.ui.toggle.checkbox.use-flag').checkbox('set unchecked');
}

function getOptionTime(toMinute, suffix)
{
	let str = '';
	for (let i=1; i<=parseInt(toMinute); i++)
		str += '<option value="' + i + '">' + i + (suffix ? suffix : '') +'</option>\n';

	return str;
}

function setInputValue(id, defaultValue)
{
	chrome.storage.sync.get(id, function(items) {

		if (typeof items[id] != 'undefined')
		{
			$('#' + id).val(items[id]);
		}
		else
		{
			$('#' + id).val(defaultValue); // 9시
		}
	});
}

function setRadioValue(name, defaultValue)
{
	chrome.storage.sync.get(name, function(items) {
		if (typeof items[name] != 'undefined')
		{
			$('input:radio[name=' + name + ']:input[value=' + items[name] + ']').attr('checked', true);
		}
		else
		{
			$('input:radio[name=' + name + ']:input[value=' + defaultValue + ']').attr('checked', true);
		}
	});
}

function disableUserSetting(flag)
{
	$('[id^="clock-"]').prop('disabled', flag);
	$('input[name^="clock-"]').prop('disabled', flag);
}

function checkUsernameAndPassword()
{
	let username = $('#username').val();
	let password = $('#password').val();

	const userSession = new UserSession();
	userSession.login(username, password, function(res) {
		console.log(res)
		if (res.code == '200')
		{
			userSession.getSession();
			showNotify('사원번호/비밀번호 확인', '사원정보가 정상적으로 확인되었습니다.');
		}
		else
		{
			showNotify('사원번호/비밀번호 확인', '사원번호 혹은 비밀번호가 맞지 않습니다.');
		}
	});
}

function reset()
{
	chrome.storage.sync.clear();
	location.reload();
}

function notification()
{
	//showNotify('Test Notification', 'notified.', true);
	//firebaseApp.writeLog("2019-01-01", 'bbb', '출근', '1111')
	const key = firebaseApp.worktime_checker + '/' + "2019-01-01" + '/' + '한경만' + '/' + '_출근시간';
	const value = '09:00:00'
	firebaseApp.set(key, value);

}

function onUpdateFirebaseConfig(username) {
	const firebaseKey = firebaseApp.user_config + '/' + username;
	firebaseApp.get(firebaseApp.user_config + '/' + username, snapshot => {

		if (snapshot.val() == null)
		{
			return;
		}

		let {value} = snapshot.val();

		const jsonValue = {
			'use-flag': value['use-flag']
		};
		chrome.storage.sync.set(jsonValue, function () {
			//logger.debug(JSON.stringify(jsonValue));
			console.log('config updated : ' + JSON.stringify(jsonValue));

			if (value['use-flag'] == 'Y')
				setUseFlagChecked(true);
			else
				setUseFlagChecked(false);
		});
	});
}

function saveConfig()
{
	const username = $('#username').val();
	const password = $('#password').val();
	const useFlag = $('#use-flag').is(':checked') ? 'Y' : 'N';
	const clockInHour = $('#clock-in-hour').val();
	const clockInMinute = $('#clock-in-minute').val();
	const clockOutHour = $('#clock-out-hour').val();
	const clockOutMinute = $('#clock-out-minute').val();
	const clockInCheckType = $('input[name=clock-in-check-type]:checked').val();
	const clockInBeforeMinute = $('#clock-in-before-minute').val();
	const clockInRandomFromMinute = $('#clock-in-random-from-minute').val();
	const clockInRandomToMinute = $('#clock-in-random-to-minute').val();
	const clockOutCheckType = $('input[name=clock-out-check-type]:checked').val();
	const clockOutAfterMinute = $('#clock-out-after-minute').val();
	const clockOutRandomFromMinute = $('#clock-out-random-from-minute').val();
	const clockOutRandomToMinute = $('#clock-out-random-to-minute').val();

	if (parseInt(clockInRandomFromMinute) < parseInt(clockInRandomToMinute))
	{
		alert('시작시간이 종료시간 보다 이전이어야 합니다.');
		$('#clock-in-random-from-minute').focus();
		//$('#clock-in-random-from-minute').val(clockInRandomToMinute);
		return;
	}

	if (parseInt(clockOutRandomFromMinute) > parseInt(clockOutRandomToMinute))
	{
		alert('종료시간이 시작시간 보다 이전이어야 합니다.');
		$('#clock-out-random-from-minute').focus();
		//$('#clock-in-random-from-minute').val(clockOutRandomToMinute);
		return;
	}

	if (!sessionUserName) {
		alert('사원번호/비밀번호 확인이 필요합니다. 사원번호/비밀번호를 입력 후 확인버튼을 눌러주세요.');
		$('#username').focus();
		return;
	}

	const jsonValue = {
		'sessionUserName': sessionUserName,
		'username' : username,
		'password' : password,
		'use-flag' : useFlag,
		'clock-in-hour' : clockInHour,
		'clock-in-minute' : clockInMinute,
		'clock-out-hour' : clockOutHour,
		'clock-out-minute' : clockOutMinute,
		'clock-in-check-type' : clockInCheckType,
		'clock-in-before-minute' : clockInBeforeMinute,
		'clock-in-random-from-minute' : clockInRandomFromMinute,
		'clock-in-random-to-minute' : clockInRandomToMinute,
		'clock-out-check-type' : clockOutCheckType,
		'clock-out-after-minute' : clockOutAfterMinute,
		'clock-out-random-from-minute' : clockOutRandomFromMinute,
		'clock-out-random-to-minute' : clockOutRandomToMinute
	};

	chrome.storage.sync.set(jsonValue, function() {
		logger.debug('Settings saved');
		//logger.debug(JSON.stringify(jsonValue));
		console.log(jsonValue);

		showNotify('설정', '설정정보가 저장되었습니다.');

		const firebaseKey = firebaseApp.user_config + '/' + username;
		//const firebaseValue = {'use-flag' : useFlag};
		delete jsonValue['password'];

		firebaseApp.set(firebaseKey, jsonValue);
	});
};

$(() => {
	$('select.dropdown').dropdown();

	const btnUseFlag = $('.ui.toggle.checkbox.use-flag');
	btnUseFlag.checkbox({
		onChecked:  () => {
			btnUseFlag.find('label').html('사용중');
			disableUserSetting(false);
		},
		onUnchecked: () => {
			btnUseFlag.find('label').html('사용안함');
			disableUserSetting(true);
		}
	});

	$('#clock-in-before-minute').append(getOptionTime(60, "분 전"));
	$('#clock-out-after-minute').append(getOptionTime(60, "분 후"));

	$('#clock-in-random-from-minute').append(getOptionTime(60, "분 전"));
	$('#clock-in-random-to-minute').append(getOptionTime(60, "분 전"));

	$('#clock-out-random-from-minute').append(getOptionTime(60, "분 후"));
	$('#clock-out-random-to-minute').append(getOptionTime(60, "분 후"));

	$('#btnCheckUsernameAndPassword').on('click', checkUsernameAndPassword);
	$('#btnSave').on('click', saveConfig);
	$('#btnReset').on('click', reset);
	$('#btnNotification').on('click', notification);

	init();

});

