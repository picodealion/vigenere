var utils = require('./utils.js');

function FrequencyAnalyzer() {
    'use strict';

    return {
        getKey: getKey
    };

    function getKey(cipherText, keyLength) {
        var columns,
            i,
            key = '';

        columns = utils.splitTextIntoColumns(cipherText, keyLength);

        for(i = 0; i < keyLength; i++) {
            utils.log('Finding key letter', i+1, 'of', keyLength);
            key += findShiftLetter(columns[i]);
        }

        return cipherText.substr(0, keyLength);
    }

    function findShiftLetter(text) {
        var i,
            shifted = [];

        for(i = 0; i < 26; i++) {
            shifted.push({
                shift: i,
                text: shiftText(text, i),
                ic: utils.calculateIC(text)
            });
        }
    }

    function shiftText(text, shift) {
        return text.split('').map(function(char) {
            var letterIndex = char.charCodeAt() - 97,
                newLetter = (letterIndex + shift) % 26;

            return String.fromCharCode(newLetter + 97);
        }).join('');
    }
}

module.exports = FrequencyAnalyzer();