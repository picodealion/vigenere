var IC    = require('./IndexOfCoincidence'),
    utils = require('./Utils');

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
            shiftedText,
            shifted = [];

        for(i = 0; i < 26; i++) {
            shiftedText = shiftText(text, i);
            shifted.push({
                shift: i,
                text: shiftedText,
                chi: getChiSquared(shiftedText)
            });
        }

        console.log(shifted);
        shifted.sort(function(a, b) {
            return a.chi - b    .chi;
        });
        console.log(shifted[0]);

        return String.fromCharCode(shifted[0].shift + 97);
    }

    function getChiSquared(text) {
        var chi = 0,
            count,
            expectedChi = 0,
            expectedCount,
            i,
            letter,
            match,
            regexp;

        for(i = 0; i < 26; i++) {
            letter = String.fromCharCode(i + 97);
            regexp = new RegExp(letter, 'g');
            match  = text.match(regexp);

            if(match) {
                count  = match.length;
                expectedChi += FREQUENCY_ENGLISH[i] * text.length;
                chi += count;
            }

            console.log(letter, regexp, count, chi, expectedChi);

        }

        console.log(chi, expectedChi);

        return (Math.pow(chi - expectedChi, 2) / expectedChi);
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