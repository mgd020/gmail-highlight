function hashCode(s) {
    return s.split("").reduce(function(a, b) {
        a = ((a<<5)-a)+b.charCodeAt(0);
        return a & a;
    }, 0);
}

function zip() {
    var arrays = [].slice.call(arguments);
    return arrays[0].map(function(_,i){
        return arrays.map(function(array){return array[i]})
    });
}

var extension = globalThis.browser || globalThis.chrome;

function storageGet(defaults) {
    if (globalThis.browser) {
        return globalThis.browser.storage.sync.get(defaults);
    }
    return new Promise(function (resolve, reject) {
        var settled = false;
        function finish(value) {
            if (!settled) {
                settled = true;
                resolve(value);
            }
        }
        try {
            var result = extension.storage.sync.get(defaults, finish);
            if (result && typeof result.then === "function") {
                result.then(finish, reject);
            }
        } catch (error) {
            reject(error);
        }
    });
}

function storageSet(values) {
    if (globalThis.browser) {
        return globalThis.browser.storage.sync.set(values);
    }
    return new Promise(function (resolve, reject) {
        var settled = false;
        function finish() {
            if (!settled) {
                settled = true;
                resolve();
            }
        }
        try {
            var result = extension.storage.sync.set(values, finish);
            if (result && typeof result.then === "function") {
                result.then(finish, reject);
            }
        } catch (error) {
            reject(error);
        }
    });
}
