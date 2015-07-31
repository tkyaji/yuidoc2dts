var yuidoc2dts = require('./yuidoc2dts.js');

if (process.argv.length < 3) {
    console.log('Usage: node run.js inputfile [outputfile]');
    return;
}

var input = process.argv[2];
var output = process.argv[3];

var fs = require('fs');
var path = require("path");

var abspath = path.resolve(path.join(input));
var dataJson = require(abspath);

var dts = yuidoc2dts.todts(dataJson);

if (output) {
    fs.writeFileSync(output, dts, 'utf-8');
} else {
    console.log(dts);
}
