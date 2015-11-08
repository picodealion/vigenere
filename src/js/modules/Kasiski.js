var _     = require('lodash'),
    utils = require('./utils.js');

module.exports = Kasiski();

function Kasiski() {
    'use strict';

    var cipherText,
        tempCipherText;

    return {
        guessKeyLength: guessKeyLength
    };

    function guessKeyLength(cipher, minLength, maxLength) {
        utils.log('Step 1: Define key length using Kasiski method', true);

        var distances,
            greatestGCDs,
            recurringStrings;

        cipherText = tempCipherText = cipher;

        recurringStrings = getRecurringStrings(minLength, maxLength);
        distances = getDistancesBetweenStrings(recurringStrings);
        greatestGCDs = getGreatestCommonDenominators(distances);

        utils.log('Most probable key lengths: ', true);

        return greatestGCDs;
    }

    function getDistancesBetweenStrings(strings, text) {
        utils.log('Distances between recurring strings: ', true);

        return [40, 12, 16];
    }

    function getGreatestCommonDenominators(numbers) {
        return [4, 8, 12];
    }

    function getRecurringStrings(minLength, maxLength) {
        var recurring = [];

        for(var i = maxLength; i > minLength; i--) {
            recurring = recurring.concat(getRecurringStringsOfLength(i));
        }

        if(recurring.length > 0)
            utils.log("Recurring strings:" + recurring, true);
        else {
            utils.log('No recurring strings found :(. Either the key is too long or the ciphertext is too short to break the code.', true);
            // end program here
        }

        return recurring;
    }

    function getRecurringStringsOfLength(length) {
        utils.log('Finding recurring strings of length ' + length, true);

        var count,
            pos = 0,
            recurring = [],
            regexp,
            string;

        while(pos < tempCipherText.length && pos < 100) {
            string = tempCipherText.substr(pos, length);

            console.log(tempCipherText, length, pos, string);

            if(!string.match(/ /g)) {

                regexp = new RegExp(string, 'g');
                count = tempCipherText.match(regexp).length;

                if(count > 1) {
                    debugger;
                    utils.log(string + ' occurs ' + count + ' times', true);
                    recurring.push(string);
                    tempCipherText = tempCipherText.replace(regexp, ' ');
                }

            }
            pos++;
        }

        return recurring;
    }

}
