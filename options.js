var rowTemplate;
var table;

function load() {
    table = document.querySelector("table");
    rowTemplate = document.querySelector("#row").text;
    chrome.storage.sync.get({
        domains: {},
        sat: 100,
        lum: 90,
    }, function (items) {
        for (var domain in items.domains) {
            var colors = items.domains[domain];
            addRow({domain:domain, fg:colors.fg, bg:colors.bg});
        }
        document.querySelector('#sat').value = items.sat;
        document.querySelector('#lum').value = items.lum;
    });
}

function save() {
    var domains = {};
    var formData = new FormData(document.querySelector('form'));
    zip(formData.getAll("domain"), formData.getAll("fg"), formData.getAll("bg")).forEach(function(v) {
        domains[v[0]] = {fg: v[1], bg: v[2]}
    });
    chrome.storage.sync.set({
        domains: domains,
        sat: document.querySelector('#sat').value,
        lum: document.querySelector('#lum').value
    }, function() {
        alert("Options saved");
    });
}

function addRow(values) {
    values = values || {};
    var rowHTML = rowTemplate.replace(/__domain__|__fg__|__bg__/g, function(match) {
        return values[match.slice(2, -2)] || "";
    });
    table.insertAdjacentHTML("beforeend", rowHTML);
    var row = table.lastChild;
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
    console.log('updatePreview');
    var preview = row.querySelectorAll('.preview');
    preview[2].style.color = preview[0].value;
    preview[2].style.background = preview[1].value;
}

document.addEventListener("DOMContentLoaded", load);
document.querySelector("#save").addEventListener("click", save);
document.querySelector("#add").addEventListener("click", addRow);
