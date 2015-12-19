var IC    = require('./IndexOfCoincidence'),
    utils = require('./Utils');

function Caesar() {
    'use strict';

    return {
        findShiftLetter: findShiftLetter,
        shiftText: shiftText
    };

    function findShiftLetter(text) {
        var i,
            shifted = [];

        for(i = 0; i < 26; i++) {
            shifted.push({
                shift: i,
                text: shiftText(text, i),
                ic: IC.calculateIC(text)
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

module.exports = Caesar();