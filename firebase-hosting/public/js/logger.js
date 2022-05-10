class Logger
{
	LOG_LEVEL = 2;

	DEBUG = 1;
	INFO = 2;
	ERROR = 3;
	FATAL = 4;

	debug(str)
	{
		if (this.LOG_LEVEL <= this.DEBUG)
			this.printLog('DEBUG', str);
	}

	info(str)
	{
		if (this.LOG_LEVEL <= this.DEBUG)
			this.printLog('INFO', str);
	}

	error(str)
	{
		if (this.LOG_LEVEL <= this.DEBUG)
			this.printLog('ERROR', str);
	}

	fatal(str)
	{
		if (this.LOG_LEVEL <= this.DEBUG)
			this.printLog('FATAL', str);
	}

	printLog(logLevelPrefix, str)
	{
		console.log('[' + logLevelPrefix + '][' + getCurrDate()  + ' ' + getCurrTime() + '] ' + str);
	}
}

const logger = new Logger();