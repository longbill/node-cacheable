const crypto = require('crypto');

module.exports = function(s) {
	if (typeof s !== 'string') s = String(s);
	if (!s) s = 'default';
	return crypto.createHash('md5').update(s).digest('base64').replace(/[\=]+$/, '').replace(/\+/g, 'A').replace(/\//g, 'Z');
};