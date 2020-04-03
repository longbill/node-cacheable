const debug = require('debug')('Lock');
const md5 = require('./md5');
const pwait = require('pwait');
const Cache = require('./cache');

class Lock {

	constructor(cacheInstance, options) {
		if (!cacheInstance || !cacheInstance instanceof Cache) throw new Error('Lock need first parameter to be Cache instance');

		this.cache = cacheInstance;

		this.options = Object.assign({
			//prefix for every key
			keyPrefix: 'Lock',

			//the check delay in ms
			checkLockDelay: 50,

			//default timeout
			defaultTimeout: 10000 //10 seconds
		}, options || {});

		debug('new instance with options', this.options);
	}

	getKey(key) {
		if (typeof key !== 'string' && typeof key !== 'number') {
			key = md5(JSON.stringify(key));
		}
		return `${this.options.keyPrefix}:${key}`;
	}

	async getAllLock(lockName, timeout) {
		debug(`getting all lock for ${lockName}`);
		let lockTimeoutValue = 0, delayed = false;
		do {
			lockTimeoutValue = Date.now() + timeout + 1;
			let r = await this.cache.set(this.getKey(lockName) + ':all', lockTimeoutValue, 'PX', timeout, 'NX');
			if (r) break;
			debug(`locked, wait ${this.options.checkLockDelay}ms for ${lockName}`);
			delayed = true;
			await pwait(this.options.checkLockDelay);
		} while (true);
		if (delayed) debug(`unlocked for ${lockName}`);
		return { lockTimeoutValue, delayed };
	}

	async getRaceLock(lockName, timeout, ignore) {
		debug(`getting race lock for ${lockName}`);
		let lockTimeoutValue = 0, delayed = false, ignored = false;
		lockTimeoutValue = Date.now() + timeout + 1;
		let key = this.getKey(lockName) + ':race';

		let r = await this.cache.set(key, lockTimeoutValue, 'PX', timeout, 'NX');

		if (r) {
			debug(`${lockName} not locked`);
			return { lockTimeoutValue, delayed, ignored};
		}

		if (ignore) {
			debug(`ignore race lock for ${lockName}`);
			ignored = true;
			return { lockTimeoutValue, delayed, ignored };
		}

		while (true) {
			debug(`race locked, wait ${this.options.checkLockDelay}ms for ${lockName}`);
			delayed = true;
			await pwait(this.options.checkLockDelay);
			if (await this.cache.get(key) === null) break;
		}

		debug(`race unlocked for ${lockName}`);
		return { lockTimeoutValue, delayed, ignored };
	}

	async all(lockName, timeout, task) {
		if (!lockName) throw new Error('need lockName');
		if (!task && typeof timeout === 'function') {
			task = timeout;
			timeout = this.options.defaultTimeout;
		}
		if (typeof task !== 'function') throw new Error('task should be function returns Promise');

		let { lockTimeoutValue, delayed } = await this.getAllLock(lockName, timeout);
		let err = null, result = undefined;

		debug(`executing task for ${lockName}`);
		try {
			result = await task(delayed);
		} catch (_err) {
			console.error(`Lock: task throws error for ${lockName}: `, _err);
			err = _err;
		}

		debug(`task executed for ${lockName}`);
		if (lockTimeoutValue > Date.now()) {
			debug(`unlocking ${lockName}`);
			await this.cache.del(this.getKey(lockName) + ':all');
		}
		if (err) throw err;
		return result;
	}

	async race(lockName, timeout, task, ignore) {
		if (!lockName) throw new Error('need lockName');
		if (typeof timeout === 'function') {
			ignore = task;
			task = timeout;
			timeout = this.options.defaultTimeout;
		}

		if (typeof task !== 'function') throw new Error('task should be function returns Promise');

		let { lockTimeoutValue, delayed, ignored } = await this.getRaceLock(lockName, timeout, ignore);
		let err = null, result = undefined;
		if (ignored || delayed) {
			return {
				executed: false,
				result: null
			};
		}

		debug(`executing race task for ${lockName}`);
		try {
			result = await task(delayed);
		} catch (_err) {
			if (!_err || !_err.cacheable) console.error(`Lock: task throws error for ${lockName}: `, _err);
			err = _err;
		}
		debug(`task executed for ${lockName}`);
		if (lockTimeoutValue > Date.now()) {
			debug(`unlocking ${lockName}`);
			await this.cache.del(this.getKey(lockName) + ':race');
		}
		if (err) throw err;
		return {
			executed: true,
			result
		};
	}
}


module.exports = Lock;