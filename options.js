var rowTemplate;
var table;

var defaultValue = {
    domains: {},
    sat: 100,
    lum: 90
};

function load() {
    table = document.querySelector("table");
    rowTemplate = document.querySelector("#row").text;
    storageGet(defaultValue).then(render);
}

function save() {
    var domains = {};
    var formData = new FormData(document.querySelector('form'));
    zip(formData.getAll("domain"), formData.getAll("fg"), formData.getAll("bg")).forEach(function(v) {
        domains[v[0]] = {fg: v[1], bg: v[2]}
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
    rowTemplate = document.querySelector("#row").text;
    table.querySelectorAll('tr.domain').forEach(function (tr) {
        tr.remove();
    });
    for (var domain in items.domains) {
        var colors = items.domains[domain];
        addRow({domain:domain, fg:colors.fg, bg:colors.bg});
    }
    document.querySelector('#sat').value = items.sat;
    document.querySelector('#lum').value = items.lum;
}

function addRow(values) {
    values = values || {};
    var rowHTML = rowTemplate.replace(/__domain__|__fg__|__bg__/g, function(match) {
        return values[match.slice(2, -2)] || "";
    });
    table.insertAdjacentHTML("beforeend", rowHTML);
    var row = table.querySelector('tr.domain:last-of-type');
    row.querySelector(".remove").addEventListener("click", function(e) {
        e.preventDefault();
        table.removeChild(row);
        return false;
    });
    row.querySelectorAll('input.preview').forEach(function (e) {
        e.addEventListener("change", function() {
            updatePreview(row);
        });
    });
    updatePreview(row);
    return row;
}

function updatePreview(row) {
    var preview = row.querySelectorAll('.preview');
    preview[2].style.color = preview[0].value;
    preview[2].style.background = preview[1].value;
}

document.addEventListener("DOMContentLoaded", load);
document.querySelector("#save").addEventListener("click", save);
document.querySelector("#add").addEventListener("click", addRow);
document.querySelector("#copy").addEventListener("click", copy);
document.querySelector("#paste").addEventListener("click", paste);
