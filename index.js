const NodeCache = require('node-cache');
const Cache = require('./cache');
const Lock = require('./lock');
const debug = require('debug');
const md5 = require('./md5');

class Cacheable {

	constructor(loader, ttl) {
		if (typeof loader !== 'function') throw new Error('Cacheable need first parameter to be a function');
		if (ttl === undefined) ttl = 30;
		if (typeof ttl !== 'number') throw new Error('Cacheable need second parameter to be a number');
		this.loader = loader;
		this.ttl = ttl || 30;

		this.cache = new Cache(new NodeCache({
			stdTTL: ttl * 2  //default ttl of node-cache
		}));

		this.debug = debug(`cacheable`);
		this.timeouts = {};
		this.lock = new Lock(this.cache);
	}

	/**
	 * generate a cache key used for redis
	 * support object key
	 */
	getKey(key) {
		if (typeof key !== 'string' && typeof key !== 'number') {
			key = md5(JSON.stringify(key));
		}
		return String(key);
	}

	/**
	 * load data from cache or loader
	 */
	async load(origKey, ...args) {
		let key = this.getKey(origKey);

		return new Promise(async (done, reject) => {
			let did = false;
			let v = null;
			this.debug(`try to load ${key} from cache`);

			try {
				v = await this.cache.get(key);
				if (v && v.createTime) {
					this.debug(`got ${key} from cache`);
					done(v.value);
					did = true;
				} else {
					this.debug(`${key} not found in cache`);
				}

				if (!v || (v && v.createTime && Date.now() - v.createTime > this.ttl * 1000)) {
					let { executed } = await this.lock.race(origKey, async () => {
						this.debug(`loading ${key} from loader`);
						try {
							let newData = await this.loader(origKey, ...args);
							this.debug(`set ${key} to cache`);
							await this.prime(origKey, newData);
							if (!did) {
								done(newData);
								did = true;
							}
						} catch (err) {
							if (typeof err === 'object') err.cacheable = 1;
							if (err && err.code) throw err;
							if (typeof err !== 'object') err = new Error(err);
							err.message = `Cacheable ${key} Error: ${err.message}`;
							throw err;
						}
					}, did);

					if (!executed && !did) {
						this.load(origKey).then(done).catch(reject);
					}
				}
			} catch (err) {
				if (!did) {
					reject(err);
				} else {
					if (typeof err !== 'object') err = new Error(err);
					err.message = `Cacheable ${key} Error: ${err.message}`;
					console.error(err);
				}
			}
		});
	}

	//清除缓存
	clear(key) {
		return this.cache.del(this.getKey(key)).then(r => r * 1);
	}

	//设置缓存
	async prime(origKey, value) {
		let key = this.getKey(origKey);
		await this.cache.set(key, {
			createTime: Date.now(),
			value
		}, 'EX', this.ttl * 2);
	}
}


module.exports = Cacheable;

module.exports.cacheable = function(ttl) {
	return function(origFunc) {
		let loader = new Cacheable(origFunc, ttl);
		return function(...args) {
			return loader.load(...args);
		};
	};
};