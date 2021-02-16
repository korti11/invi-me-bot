exports.isFunction = (callback) => {
    return typeof callback === 'function';
}

exports.uniqueToken = () => {
    const buf = require('crypto').randomBytes(32);
    return buf.toString('hex');
}