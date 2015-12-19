var utils = require('./utils.js');

function Kasiski() {
    'use strict';

    var cipherText;

    return {
        guessKeyLength: guessKeyLength
    };

    function guessKeyLength(cipher, minLength, maxLength) {
        var distances,
            GCDs,
            recurringStrings;

        cipherText = cipher;

        recurringStrings = getRecurringStrings(minLength, maxLength);
        distances = getDistances(recurringStrings);
        GCDs = getGreatestCommonDenominators(distances);

        utils.log('Most probable key lengths:', GCDs);

        return GCDs;
    }

    function getDistances(recurringStrings) {
        var allDistances,
            currentDistances,
            i;

        utils.log('Distances between recurring strings:');

        allDistances = recurringStrings.map(function(item) {
            currentDistances = [];

            for (i = 0; i < item.positions.length - 1; i++) {
                currentDistances.push(item.positions[i + 1] - item.positions[i]);
            }

            return currentDistances;
        }).reduce(function(all, current) {
            return all.concat(current);
        });

        utils.log(allDistances);

        return allDistances;
    }

    function getGreatestCommonDenominators(numbers) {
        var factorCount,
            factors,
            GCDs;

        factors = numbers.reduce(function(all, current) {
            return all.concat(utils.getFactors(current, 3));
        }, []);

        factorCount = factors.reduce(function(counted, current) {
            counted[current] = ++counted[current] || 1;
            return counted;
        }, {});

        GCDs = factors.filter(utils.unique).sort(function(a, b) {
            return factorCount[b] - factorCount[a];
        });

        return GCDs.slice(0, 3);
    }

    function getRecurringStrings(minLength, maxLength) {
        var recurring = [];

        for(var i = maxLength; i >= minLength; i--) {
            recurring = recurring.concat(getRecurringStringsOfLength(i));
        }

        if(recurring.length > 0)
            utils.log("Recurring strings:", recurring.map(function(item) { return item.string; }));
        else {
            utils.log('No recurring strings found :(. Either the key is too long or the ciphertext is too short to break the code.');
        }

        return recurring;
    }

    function getRecurringStringsOfLength(length) {
        utils.log('Finding recurring strings of length', length);

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
                utils.log(string, 'occurs', count, 'times');
                recurring.push(getStringPositions(string));
            }

            pos++;
        }

        return recurring;
    }

    function getStringPositions(string) {
        var match,
            regexp = new RegExp(string, 'g'),
            result = { string: string, positions: [] };

        while((match = regexp.exec(cipherText)) !== null) {
            result.positions.push(match.index);

            // replace match with spaces so we don't get overlapping results
            cipherText = utils.replaceWithSpaces(cipherText, match.index, match.index + string.length);
        }

        return result;
    }
}

module.exports = Kasiski();
