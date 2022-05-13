function debug(str) {
	chrome.extension.getBackgroundPage().console.log('[popup.js] ' + str);
}

var command = {
	showOptions : function() {
		chrome.tabs.create({'url': '/option/options.html'});
	},

    btnClockIn : function(e) {
		ChromeRuntime.sendMessage({
			action: 'daouofficeClient.clockIn'
		}, response => {
			const { error, message } = response;
			alert(message)
		});
    },

    btnClockOut : function(e) {
		ChromeRuntime.sendMessage({
			action: 'daouofficeClient.clockOut'
		}, response => {
			const { error, message } = response;
			alert(message)
		});
    },
};

(function($) {
    var load = function() {
		$('#showOptions').on('click', command.showOptions);
		$('#btnClockIn').on('click', command.btnClockIn);
        $('#btnClockOut').on('click', command.btnClockOut);
    };

    $(load);
})(jQuery);
