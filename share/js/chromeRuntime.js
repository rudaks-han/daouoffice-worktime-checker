
class ChromeRuntime {
    static sendMessage = (payload, callback) => {
        chrome.runtime.sendMessage(payload, response => {
            if (typeof callback === 'function') {
                callback(response);
            }
        });
    };
}
