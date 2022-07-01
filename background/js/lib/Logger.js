import Share from "./Share.js";

export default class Logger {

    static println(str, showPrefix = true) {
        if (showPrefix) {
            const caller = this.getCaller();
            let callerLog = ``;
            if (caller.length > 0) {
                callerLog = ` --> called in ${caller}`
            }
            console.log(`[${Share.getFullCurrDate()}] ${str}${callerLog}`);
        } else {
            console.log(str);
        }
    }

    static error(str) {
        console.error(str);
    }

    static getCaller() {
        const stackTrace = (new Error()).stack.split('\n'); // Only tested in latest FF and Chrome

        let caller
        try {
            const log = stackTrace[4];
            caller = log.substring(log.indexOf('at') + 3, log.indexOf(" ("));
        } catch {
            caller = ''
        }

        return caller;
    }
}
