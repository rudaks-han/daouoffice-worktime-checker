class Logger
{
	LOG_LEVEL = 1;

	TRACE = 0;
	DEBUG = 1;
	INFO = 2;
	ERROR = 3;
	FATAL = 4;

	trace(str)
	{
		if (this.LOG_LEVEL <= this.TRACE)
			this.printLog('TRACE', str);
	}

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
			this.printError('ERROR', str);
	}

	fatal(str)
	{
		if (this.LOG_LEVEL <= this.DEBUG)
			this.printError('FATAL', str);
	}

	printLog(logLevelPrefix, str)
	{
		console.log('[' + logLevelPrefix + '][' + getCurrDate()  + ' ' + getCurrTime() + '] ' + str);
	}

	printError(logLevelPrefix, str)
	{
		console.error('[' + logLevelPrefix + '][' + getCurrDate()  + ' ' + getCurrTime() + '] ' + str);
	}
}

const logger = new Logger();