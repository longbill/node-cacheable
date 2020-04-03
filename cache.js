const debug = require('debug');


/**
 * node-cache的缓存类, 参数模仿ioredis
 * 只支持 get set del 方法
 */
class Cache {

	constructor(instance) {
		this.type = 'node';
		this.instance = instance;
		this.debug = debug(`Cache:${this.type}`);
		this.debug('new instance');
	}

	//perform get, returns saved data or null
	get(key) {
		this.debug('get', key);
		return Promise.resolve(this.instance.get(key)).then(r => r === undefined ? null : r);
	}

	//perform set, returns bool
	//supports NX
	set(key, val, PXEX, expires, NXXX) {
		this.debug('set', key, val, PXEX || '', expires || '', NXXX || '');

		if (PXEX === 'NX' || PXEX === 'XX') {
			NXXX = PXEX;
			PXEX = null;
			expires = 0;
		}

		let expireSeconds = 0;
		if (PXEX === 'EX') expireSeconds = expires;
		if (PXEX === 'PX') expireSeconds = expires / 1000;

		this.debug('nodecache.set', key, val, PXEX, `${expires}(seconds=${expireSeconds})`, NXXX);
		if (NXXX === 'NX') {
			let old = this.instance.get(key);
			if (old) return Promise.resolve(false);
			return Promise.resolve(!!this.instance.set(key, val, expireSeconds));
		} else if (NXXX === 'XX') {
			let old = this.instance.get(key);
			if (old === undefined) return Promise.resolve(false);
			return Promise.resolve(!!this.instance.set(key, val, expireSeconds));
		} else {
			return Promise.resolve(!!this.instance.set(key, val, expireSeconds));
		}
	}

	//perform delelete, returns bool
	del(key) {
		this.debug('del', key);
		return Promise.resolve(!!this.instance.del(key));
	}

}

module.exports = Cache;