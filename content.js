var state;
var getEmailColors;

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
    chrome.storage.sync.get({
        domains: null,
        sat: 100,
        lum: 90,
    }, function (items) {
        state = items;
        domains = items.domains;
        if (domains && Object.keys(domains).length) {
            getEmailColors = getSetEmailColors;
        } else {
            getEmailColors = getHashEmailColors;
        }
        highlightEmails();
        if (cb) {
            cb();
        }
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
    return state.domains[emailDomain] || getHashEmailColors(email);
}

function getHashEmailColors(email) {
    var emailDomain = email.split('@')[1];
    var hue = hashCode(emailDomain) % 256;
    return {fg:"black", bg:`hsl(${hue}, ${state.sat}%, ${state.lum}%)`};
}

addEventListener("load", load);
chrome.storage.onChanged.addListener(reload);
