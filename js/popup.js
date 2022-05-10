function debug(str)
{
	chrome.extension.getBackgroundPage().console.log('[popup.js] ' + str);
}

var command =
{
	
	gotoDaouoffice : function(e)
	{
		chrome.runtime.sendMessage({action: "gotoDaouoffice"}, function(response) {});
		window.close();
	},
	
	showOptions : function() 
	{
		chrome.tabs.create({'url': 'options.html'});
	},

    btnClockIn : function(e)
    {
        chrome.runtime.sendMessage({action: "btnClockIn"}, function(response) {});
		//clockIn(true);
    },

    btnClockOut : function(e)
    {
        chrome.runtime.sendMessage({action: "btnClockOut"}, function(response) {});
        //clockOut(true);
    },

	getUserSessionInfo : function(e)
	{
		chrome.runtime.sendMessage({action: "getUserSessionInfo"}, function(response) {});
	}
};

(function($) {

    var load = function()
	{
        $('#gotoDaouoffice').on('click', command.gotoDaouoffice);
		$('#showOptions').on('click', command.showOptions);
		$('#btnClockIn').on('click', command.btnClockIn);
        $('#btnClockOut').on('click', command.btnClockOut);
		$('#btnUserSessionInfo').on('click', command.getUserSessionInfo);
    };

    $(load);

    //#clockUseFlag;

    chrome.storage.sync.get('use-flag', function (items) {

        let useFlag = items['use-flag'];
		if (useFlag == 'Y')
		{
			$('#clockUseFlagText').html('(사용중) <img src="images/rolling-icon.png" style="vertical-align:text-bottom">').css({'color': 'blue'});
		}
		else
		{
            $('#clockUseFlagText').html('(사용안함)').css({'color': 'red'});
		}
			
    });
})(jQuery);
