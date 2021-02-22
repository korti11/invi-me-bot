exports.isFunction = (callback) => {
    return typeof callback === 'function';
}

exports.uniqueToken = () => {
    const buf = require('crypto').randomBytes(32);
    return buf.toString('hex');
}

/**
 * Gets the argument value or returns the defautl value.
 * @param {String[]} args Given arguments.
 * @param {String} short Short argument key.
 * @param {String} long Long argument key.
 * @param {any} def Default value.
 * @returns {any} Found argument value or default value.
 */
exports.getArgumentOrDefault = (args, short, long, def) => {
    let index = args.indexOf(`-${short}`);
    if(index === -1) index = args.indexOf(`--${long}`);
    if(index === -1) return def;
    return args[index + 1];
}