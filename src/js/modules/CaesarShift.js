var IC      = require('./IndexOfCoincidence'),
    strings = require('./Strings'),
    utils   = require('./Utils');

function Caesar() {
    'use strict';

    var FREQUENCY_ENGLISH = [0.08167,0.01492,0.02782,0.04253,0.12702,0.02228,0.02015,0.06094,0.06966,0.00153,0.00772,
        0.04025,0.02406,0.06749,0.07507,0.01929,0.00095,0.05987,0.06327,0.09056,0.02758,0.00978,
        0.02360,0.00150,0.01974,0.00074];

    return {
        findShiftLetter: findShiftLetter,
        shiftText: shiftText
    };

    function findShiftLetter(text) {
        var i,
            letter,
            shiftedText,
            shifted = [];

        utils.log('Shifting text to find the text that resembles English most');

        for(i = 0; i < 26; i++) {
            shiftedText = shiftText(text, i);
            shifted.push({
                shift: i,
                text: shiftedText,
                chi: getChiSquared(shiftedText)
            });
        }

        shifted.sort(function(a, b) {
            return a.chi - b.chi;
        });

        letter = String.fromCharCode(shifted[0].shift + 97);

        utils.log("Lowest chi-squared occurs with letter:", letter, "(" + shifted[0].chi + ")");

        return letter;
    }

    function getChiSquared(text) {
        var chiSquared = 0,
            counts = strings.countLetters(text),
            expectedCount,
            i;

            for(i = 0; i < 26; i++) {
                expectedCount =  text.length * FREQUENCY_ENGLISH[i];
                chiSquared += Math.pow((counts[i] - expectedCount), 2) / (expectedCount);
            }

        return chiSquared;
    }

    function shiftText(text, shift) {
        var i,
            newText = '',
            newLetter;

        for(i = 0; i < text.length; i++) {
            newLetter = ((text.charCodeAt(i) - 97) + (26 - shift)) % 26;

            newText += String.fromCharCode(newLetter + 97);
        }

        return newText;
    }
}

module.exports = Caesar();