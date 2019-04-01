const fs = require('fs');
var path = require('path');
var basename = path.basename(module.filename);
var policies = {};
fs
    .readdirSync(__dirname)
    .filter(file => {
        return (file.indexOf('.') !== 0) && (file !== basename);
    })
    .for_each(file => {
        var policy = require(path.join(__dirname, file));
        policies[file.slice(0, file.length - 3)] = policy;
    });

module.exports = policies;