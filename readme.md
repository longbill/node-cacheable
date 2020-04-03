node-cacheable
==========

in memory cache wrapper with refresh lock.

## Basic Usage

`new Cacheable(loadFunction, ttl = 30)`

where `ttl` is in seconds

example: 

```javascript
const Cacheable = require('node-cacheable');
const dataloader = new Cacheable((user_id) => {
	return db.getUser(user_id);
}, 30);

//...

router.get('/getUser', async ctx => {
	ctx.body = dataloader.load(ctx.query.user_id);
});

//...

```

## Advanced Usage

Cacheable class provides two methods to manipulate the cache.

clear cache: `instance.clear(key)`

set cache manually: `instance.prime(key, value)`


## cacheable decorator

`require('node-cacheable').cacheable(ttl)(loadFunction)`

example: 

```javascript
const { cacheable } = require('node-cacheable');

async function getName(id) {
	console.log('real getting name: ' + id);
	// await db.query ....
	return 'foo' + id;
}
getName = cacheable(3)(getName);

getName(1).then(console.log);
getName(1).then(console.log);
```



