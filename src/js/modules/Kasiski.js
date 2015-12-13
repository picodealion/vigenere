var _     = require('lodash'),
    utils = require('./utils.js');

module.exports = Kasiski();

function Kasiski() {
    'use strict';

    var cipherText;

    return {
        guessKeyLength: guessKeyLength
    };

    function guessKeyLength(cipher, minLength, maxLength) {
        var distances,
            greatestGCDs,
            recurringStrings;

        utils.log('Step 1: Define key length using Kasiski method', true);

        cipherText = cipher;

        recurringStrings = getRecurringStrings(minLength, maxLength);
        distances = getDistancesBetweenStrings(recurringStrings);
        greatestGCDs = getGreatestCommonDenominators(distances);

        utils.log('Most probable key lengths: ' + greatestGCDs, true);

        return greatestGCDs;
    }

    function getDistancesBetweenStrings(strings) {
        utils.log('Distances between recurring strings: ', true);

        return [40, 12, 16];
    }

    function getGreatestCommonDenominators(numbers) {
        return [4, 8, 12];
    }

    function getRecurringStrings(minLength, maxLength) {
        var recurring = [],
            result;

        for(var i = maxLength; i > minLength; i--) {
            recurring = recurring.concat(getRecurringStringsOfLength(i));
        }

        // transform results to a little more useful format
        result = recurring.reduce(function(result, current) {
            result.strings.push(current.string);
            result.positions = result.positions.concat(current.positions);

            return result;
        }, { strings: [], positions: []});

        if(recurring.length > 0)
            utils.log("Recurring strings:" + result.strings, true);
        else {
            utils.log('No recurring strings found :(. Either the key is too long or the ciphertext is too short to break the code.', true);
        }

        return recurring;
    }

    function getRecurringStringPositions(string) {
        var match,
            regexp = new RegExp(string, 'g'),
            result = { string: string, positions: [] };

        while((match = regexp.exec(cipherText)) !== null) {
            result.positions.push(match.index);

            // replace match with spaces so we don't get overlapping results
            cipherText = replaceWithSpaces(cipherText, match.index, match.index + string.length);
        }

        return result;
    }

    function getRecurringStringsOfLength(length) {
        utils.log('Finding recurring strings of length ' + length, true);

        var count,
            pos = 0,
            recurring = [],
            regexp,
            string;

        while(pos < cipherText.length - length) {
            string = cipherText.substr(pos, length);
            regexp = new RegExp(string, 'g');
            count = cipherText.match(regexp).length;

            if(!string.match(' ') && count > 1) {
                utils.log(string + ' occurs ' + count + ' times', true);
                recurring.push(getRecurringStringPositions(string));
            }

            pos++;
        }

        return recurring;
    }

    function replaceWithSpaces(text, start, end) {
        var i,
            spaces = '';

        for(i = 0; i < (end - start); i++) {
            spaces += ' ';
        }

        return text.substring(0, start) + spaces + text.substring(end);
    }

}
