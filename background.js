var extension = globalThis.browser || globalThis.chrome;
var pendingThemeColors = {};

function storageGet(defaults) {
    if (globalThis.browser) return globalThis.browser.storage.sync.get(defaults);
    return new Promise(function (resolve) { extension.storage.sync.get(defaults, resolve); });
}

function storageSet(values) {
    if (globalThis.browser) return globalThis.browser.storage.sync.set(values);
    return new Promise(function (resolve) { extension.storage.sync.set(values, resolve); });
}

function domainCandidates(domain) {
    var labels = domain.split(".");
    return labels.map(function (_, index) {
        return labels.slice(index).join(".");
    });
}

function validDomain(domain) {
    return typeof domain === "string" &&
        /^(?=.{1,253}$)[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i.test(domain);
}

function parseColor(value) {
    var match, r, g, b;
    value = value.trim().toLowerCase();
    if ((match = value.match(/^#([0-9a-f]{3}|[0-9a-f]{4})$/i))) {
        r = parseInt(match[1][0] + match[1][0], 16); g = parseInt(match[1][1] + match[1][1], 16); b = parseInt(match[1][2] + match[1][2], 16);
    } else if ((match = value.match(/^#([0-9a-f]{6}|[0-9a-f]{8})$/i))) {
        r = parseInt(match[1].slice(0, 2), 16); g = parseInt(match[1].slice(2, 4), 16); b = parseInt(match[1].slice(4, 6), 16);
    } else if ((match = value.match(/^rgba?\(\s*([\d.]+)%?\s*,\s*([\d.]+)%?\s*,\s*([\d.]+)%?/))) {
        r = Number(match[1]); g = Number(match[2]); b = Number(match[3]);
        if (value.indexOf("%") !== -1) { r *= 2.55; g *= 2.55; b *= 2.55; }
    } else { return null; }
    return [r, g, b];
}

function contrastText(rgb) {
    var luminance = rgb.reduce(function (total, channel, index) {
        var value = channel / 255;
        value = value <= 0.03928 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
        return total + value * [0.2126, 0.7152, 0.0722][index];
    }, 0);
    return (luminance + 0.05) / 0.05 >= 1.05 / (luminance + 0.05) ? "black" : "white";
}

function findThemeColor(html) {
    var tags = html.match(/<meta\b[^>]*>/gi) || [];
    for (var i = 0; i < tags.length; i++) {
        var name = tags[i].match(/\bname\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
        var content = tags[i].match(/\bcontent\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
        var nameValue = name && (name[1] || name[2] || name[3]);
        var contentValue = content && (content[1] || content[2] || content[3]);
        if (nameValue && contentValue && nameValue.toLowerCase() === "theme-color") {
            var rgb = parseColor(contentValue);
            if (rgb) return {fg: contrastText(rgb), bg: contentValue.trim()};
        }
    }
    return null;
}

async function fetchThemeColor(domain) {
    for (var protocol of ["https:", "http:"]) {
        try {
            var response = await fetch(protocol + "//" + domain + "/", {redirect: "follow"});
            if (!response.ok) continue;
            var colors = findThemeColor((await response.text()).slice(0, 1024 * 1024));
            if (colors) return colors;
        } catch (error) { /* Try HTTP if HTTPS is unavailable. */ }
    }
    return null;
}

async function getThemeColor(domain) {
    domain = domain.toLowerCase().replace(/\.$/, "");
    if (!validDomain(domain)) return null;
    if (pendingThemeColors[domain]) return pendingThemeColors[domain];
    pendingThemeColors[domain] = storageGet({domains: {}}).then(async function (items) {
        var domains = items.domains || {};
        for (var candidate of domainCandidates(domain)) {
            if (domains[candidate]) return {domain: candidate, colors: domains[candidate]};
        }
        var colors = await fetchThemeColor(domain);
        if (colors) {
            domains[domain] = {fg: colors.fg, bg: colors.bg};
            await storageSet({domains: domains});
            return {domain: domain, colors: domains[domain]};
        }
        return {domain: domain, colors: null};
    }).finally(function () { delete pendingThemeColors[domain]; });
    return pendingThemeColors[domain];
}

extension.runtime.onMessage.addListener(function (message) {
    if (!message || message.type !== "get-theme-color") return;
    var response = getThemeColor(message.domain);
    return response;
});
