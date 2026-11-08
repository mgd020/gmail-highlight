var rowTemplate;
var table;
var tableBody;

var defaultValue = {
    domains: {},
    sat: 100,
    lum: 90
};

function load() {
    table = document.querySelector("table");
    tableBody = document.querySelector("#domain-rows");
    rowTemplate = document.querySelector("#row").text;
    storageGet(defaultValue).then(render);
}

function save() {
    var domains = {};
    var formData = new FormData(document.querySelector('form'));
    zip(formData.getAll("domain"), formData.getAll("fg"), formData.getAll("bg")).forEach(function(v) {
        domains[v[0]] = {fg: storedColor(v[1]), bg: storedColor(v[2])}
    });
    storageSet({
        domains: domains,
        sat: document.querySelector('#sat').value,
        lum: document.querySelector('#lum').value
    }).then(function() {
        alert("Options saved");
    });
}

function copy() {
    storageGet(defaultValue).then(async function (items) {
        await navigator.clipboard.writeText(JSON.stringify(items));
        window.alert('Copied to clipboard')
    });
}

function paste() {
    navigator.clipboard.readText().then(function (value) {
        render(JSON.parse(value));
    }).catch(function (error) {
        window.alert(error);
    });
}

function render(items) {
    table = document.querySelector("table");
    tableBody = document.querySelector("#domain-rows");
    rowTemplate = document.querySelector("#row").text;
    table.querySelectorAll('tr.domain').forEach(function (tr) {
        tr.remove();
    });
    Object.keys(items.domains).sort(function (a, b) {
        return a.localeCompare(b, undefined, {sensitivity: "base"});
    }).forEach(function (domain) {
        var colors = items.domains[domain];
        addRow({domain:domain, fg:colors.fg, bg:colors.bg});
    });
    document.querySelector('#sat').value = items.sat;
    document.querySelector('#lum').value = items.lum;
}

function addRow(values) {
    values = values || {};
    var rowHTML = rowTemplate.replace(/__domain__|__fg__|__bg__/g, function(match) {
        var key = match.slice(2, -2);
        var value = values[key] || "";
        return key === "fg" || key === "bg" ? displayColorValue(value) : value;
    });
    tableBody.insertAdjacentHTML("beforeend", rowHTML);
    var row = tableBody.lastElementChild;
    row.querySelector(".remove").addEventListener("click", function(e) {
        e.preventDefault();
        row.remove();
        return false;
    });
    row.querySelectorAll('input.preview').forEach(function (e) {
        e.value = displayColorValue(e.value);
        function syncPicker() {
            e.value = e.value.replace(/[^0-9a-f]/gi, '').slice(0, 6).toLowerCase();
            var picker = row.querySelector('.color-picker[data-color="' + e.name + '"]');
            if (picker && isHexColor(e.value)) {
                var pickerHex = expandHex(e.value);
                picker.value = '#' + pickerHex;
                picker.setAttribute('value', '#' + pickerHex);
            }
            updatePreview(row);
        }
        e.addEventListener("input", syncPicker);
        e.addEventListener("change", syncPicker);
        e.addEventListener("blur", syncPicker);
    });
    row.querySelectorAll('input.color-picker').forEach(function (picker) {
        var text = row.querySelector('input[name="' + picker.dataset.color + '"]');
        var hex = isHexColor(text.value) ? '#' + expandHex(text.value) : cssColorToHex(text.value);
        if (hex) picker.value = hex;
        function syncText() {
            text.value = picker.value.slice(1);
            updatePreview(row);
        }
        picker.addEventListener("input", syncText);
        picker.addEventListener("change", syncText);
    });
    updatePreview(row);
    return row;
}

function cssColorToHex(value) {
    var probe = document.createElement('span');
    probe.style.color = value;
    if (!probe.style.color) return null;
    document.body.appendChild(probe);
    var computed = getComputedStyle(probe).color;
    probe.remove();
    var match = computed.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    if (!match) return null;
    return '#' + [match[1], match[2], match[3]].map(function (channel) {
        return Number(channel).toString(16).padStart(2, '0');
    }).join('');
}

function isHexColor(value) {
    return /^(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(value);
}

function expandHex(value) {
    return value.length === 3 ? value.split('').map(function (part) {
        return part + part;
    }).join('') : value;
}

function displayColorValue(value) {
    var withoutHash = value.trim().replace(/^#/, '');
    if (isHexColor(withoutHash)) return withoutHash.toLowerCase();
    var hex = cssColorToHex(value);
    return hex ? hex.slice(1) : withoutHash;
}

function storedColor(value) {
    value = value.trim();
    return isHexColor(value) ? '#' + value.toLowerCase() : value;
}

function updatePreview(row) {
    var preview = row.querySelector('.email-address');
    var foreground = row.querySelector('input[name="fg"]').value;
    var background = row.querySelector('input[name="bg"]').value;
    preview.style.color = storedColor(foreground);
    preview.style.backgroundColor = storedColor(background);
}

document.addEventListener("DOMContentLoaded", load);
document.querySelector("#save").addEventListener("click", save);
document.querySelector("#add").addEventListener("click", addRow);
document.querySelector("#copy").addEventListener("click", copy);
document.querySelector("#paste").addEventListener("click", paste);
