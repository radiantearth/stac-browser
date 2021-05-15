const { argv } = require("yargs");
const Config = require('../config.js');

module.exports = {
    getVar(name, stringify = true) {
        let value;
        if (typeof argv[name] === 'string' && argv[name].length > 0) {
            value = argv[name];
        }
        else {
            value = Config[name];
        }
        if (stringify) {
            value = JSON.stringify(value);
        }
        return value;
    }
};