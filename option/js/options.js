
let sessionUserName = '';

function init() {
	//var backgroundPage = chrome.extension.getBackgroundPage();
	ChromeRuntime.sendMessage({
		action: 'daouofficeClient.getUserConfig'
	}, response => {
		const userInfo = response || {} ;
		let username = userInfo.username || '';
		if (username) {
			onUpdateFirebaseConfig(username);
		}

		let useFlag = userInfo.useFlag;
		useFlag = useFlag || 'N';

		if (useFlag == 'Y') {
			setUseFlagChecked(true);
		} else {
			setUseFlagChecked(false);
		}

		if (useFlag == 'N') {
			disableUserSetting(true);
		} else if (useFlag == 'Y') {
			disableUserSetting(false);
		}

		setInputValue(userInfo)
	});
}

function setInputValue(response) {
	const username = response.username || '';
	const password = response.password || '';
	const clockInHour = response.clockInHour || '09';
	const clockInMinute = response.clockInMinute || '00';
	const clockOutHour = response.clockOutHour || '18';
	const clockOutMinute = response.clockOutMinute || '00';
	const clockInCheckType = response.clockInCheckType || 'TIME';
	const clockInBeforeMinute = response.clockInBeforeMinute || '5';
	const clockInRandomFromMinute = response.clockInRandomFromMinute || '10';
	const clockInRandomToMinute = response.clockInRandomToMinute || '5';
	const clockOutCheckType = response.clockOutCheckType || 'TIME';
	const clockOutAfterMinute = response.clockOutAfterMinute || '1';
	const clockOutRandomFromMinute = response.clockOutRandomFromMinute || '5';
	const clockOutRandomToMinute = response.clockOutRandomToMinute || '10';

	console.log('clockInHour : ' + clockInHour)
	$('#username').val(username);
	$('#password').val(password);
	$('#clock-in-hour').val(clockInHour);
	$('#clock-in-minute').val(clockInMinute);
	$('#clock-out-hour').val(clockOutHour);
	$('#clock-out-minute').val(clockOutMinute);
	$('input:radio[name=clock-in-check-type]:input[value=' + clockInCheckType + ']').attr('checked', true);
	$('#clock-in-before-minute').val(clockInBeforeMinute);
	$('#clock-in-random-from-minute').val(clockInRandomFromMinute);
	$('#clock-in-random-to-minute').val(clockInRandomToMinute);
	$('input:radio[name=clock-out-check-type]:input[value=' + clockOutCheckType + ']').attr('checked', true);
	$('#clock-out-after-minute').val(clockOutAfterMinute);
	$('#clock-out-random-from-minute').val(clockOutRandomFromMinute);
	$('#clock-out-random-to-minute').val(clockOutRandomToMinute);
}

function setUseFlagChecked(flag) {
	if (flag)
		$('.ui.toggle.checkbox.use-flag').checkbox('set checked');
	else
		$('.ui.toggle.checkbox.use-flag').checkbox('set unchecked');
}

function getOptionTime(toMinute, suffix) {
	let str = '';
	for (let i=1; i<=parseInt(toMinute); i++)
		str += '<option value="' + i + '">' + i + (suffix ? suffix : '') +'</option>\n';

	return str;
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

	ChromeRuntime.sendMessage({
		action: 'daouofficeClient.login',
		params: {
			username,
			password
		}
	}, response => {
		if (response.code == '200') {
			ChromeRuntime.sendMessage({
				action: 'daouofficeClient.getSession'
			}, response => {
				sessionUserName = response.data.name;
			});

			alert('사원정보가 정상적으로 확인되었습니다.');
		}
		else {
			alert('사원번호 혹은 비밀번호가 맞지 않습니다.');
		}
	});
}

function reset()
{
	ChromeRuntime.sendMessage({
		action: 'daouofficeClient.clearAllStorage'
	}, response => {
		location.reload();
	});
}

function onUpdateFirebaseConfig(username) {
	/*const firebaseKey = firebaseApp.user_config + '/' + username;
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
	});*/
}

function saveConfig() {

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
		sessionUserName,
		username,
		password,
		useFlag,
		clockInHour,
		clockInMinute,
		clockOutHour,
		clockOutMinute,
		clockInCheckType,
		clockInBeforeMinute,
		clockInRandomFromMinute,
		clockInRandomToMinute,
		clockOutCheckType,
		clockOutAfterMinute,
		clockOutRandomFromMinute,
		clockOutRandomToMinute
	};

	console.log('jsonValue')
	console.log(jsonValue)

	ChromeRuntime.sendMessage({
		action: 'daouofficeClient.saveUserConfig',
		params: {
			data: jsonValue
		}
	}, response => {
		/*const firebaseKey = firebaseApp.user_config + '/' + username;
		const firebaseValue = {'use-flag' : useFlag};
		delete jsonValue['password'];

		firebaseApp.set(firebaseKey, jsonValue);*/

		alert('설정정보가 저장되었습니다.');
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

	init();

});

