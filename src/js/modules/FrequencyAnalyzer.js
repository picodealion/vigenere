var utils = require('./utils.js');

function FrequencyAnalyzer() {
    'use strict';

    var cipherText;

    return {
        getKey: getKey
    };

    function getKey(cipher, keyLength) {
        cipherText = cipher;

        return cipherText.substr(0, keyLength);
    }

}

module.exports = FrequencyAnalyzer();