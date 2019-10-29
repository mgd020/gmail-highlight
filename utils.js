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
