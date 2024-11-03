function jsonStringifyWithSortedKeys(value) {
    const replacer = (key, value) => value instanceof Object && !(value instanceof Array) ? Object.keys(value)
        .sort()
        .reduce((sorted, key) => {
            sorted[key] = value[key];
            return sorted;
        }, {}) : value;
    return JSON.stringify(value, replacer, 2);
}

// Remove any anti-CSRF prefixes (e.g., "for(;;);" or ")]}'") to make it valid JSON
function removeAntiCsrfPrefixes(data) {
    return data.replace(/^\)\]\}'\s*/, '').replace(/^for\s*\(\s*;\s*;\s*\)\s*;\s*/, '');
}

module.exports = {
    jsonStringifyWithSortedKeys, removeAntiCsrfPrefixes,
};
