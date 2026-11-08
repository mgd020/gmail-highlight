var state;
var getEmailColors;
var pendingDomains = {};
var pendingGeneratedDomains = {};

function load() {
    reload(() => {
        (new MutationObserver((mutations, observer) => {
            for (let mutation of mutations) {
                for (let node of mutation.addedNodes) {
                    highlightEmails(node);
                }
            }
        })).observe(document, {
            subtree: true,
            childList: true,
        });
    });
}

function reload(cb) {
    storageGet({
        domains: null,
        sat: 100,
        lum: 90,
    }).then(function (items) {
        state = items;
        state.domains = items.domains || {};
        getEmailColors = getSetEmailColors;
        highlightEmails();
        if (cb) cb();
    });
}

function highlightEmails(element) {
    (element ? element : document).querySelectorAll('span[data-hovercard-id]').forEach(span => {
        var email = span.getAttribute('data-hovercard-id');
        var colors = getEmailColors(email);
        span.style.color = colors.fg;
        span.style.backgroundColor = colors.bg;
        if (colors.fg || colors.bg) {
            span.classList.add('email-address');
        } else {
            span.classList.remove('email-address');
        }
    });
}

function getSetEmailColors(email) {
    var emailDomain = email.split('@')[1];
    if (!emailDomain) return getHashEmailColors(email);
    emailDomain = emailDomain.toLowerCase();
    if (state.domains[emailDomain]) return state.domains[emailDomain];
    var colors = getHashEmailColors(email);
    requestThemeColor(emailDomain, colors);
    return colors;
}

function cacheGeneratedColor(domain, colors) {
    if (pendingGeneratedDomains[domain] || state.domains[domain]) {
        return Promise.resolve();
    }
    pendingGeneratedDomains[domain] = true;
    state.domains[domain] = {fg: colors.fg, bg: colors.bg};
    return storageGet({domains: {}}).then(function (items) {
        var domains = items.domains || {};
        if (!domains[domain]) {
            domains[domain] = {fg: colors.fg, bg: colors.bg};
            return storageSet({domains: domains});
        }
    }).finally(function () {
        delete pendingGeneratedDomains[domain];
    });
}

function requestThemeColor(domain, fallback) {
    if (pendingDomains[domain]) return;
    pendingDomains[domain] = true;
    sendMessage({type: "get-theme-color", domain: domain}).then(function (result) {
        if (result && result.colors) {
            state.domains[result.domain] = result.colors;
            state.domains[domain] = result.colors;
            return result.colors;
        }
        var generated = getHashDomainColors(domain);
        return cacheGeneratedColor(domain, generated).then(function () {
            return state.domains[domain];
        });
    }).catch(function () {
        return cacheGeneratedColor(domain, fallback).then(function () {
            return state.domains[domain];
        });
    }).then(function () {
        highlightEmails();
    }).finally(function () {
        delete pendingDomains[domain];
    });
}

function getHashEmailColors(email) {
    return getHashDomainColors(email.split('@')[1]);
}

function getHashDomainColors(domain) {
    var hue = hashCode(domain) % 256;
    return {fg:"black", bg:`hsl(${hue}, ${state.sat}%, ${state.lum}%)`};
}

addEventListener("load", load);
extension.storage.onChanged.addListener(reload);
