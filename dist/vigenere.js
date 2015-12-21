(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var vigenere = require('./modules/Vigenere');

vigenere.init();
},{"./modules/Vigenere":7}],2:[function(require,module,exports){
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
},{"./IndexOfCoincidence":4,"./Utils":6}],3:[function(require,module,exports){
var utils = require('./Utils');

function GCD() {
    'use strict';

    return {
        getFactors: getFactors,
        getGCDs: getGCDs
    };

    function getFactors(number, min) {
        var factors = [],
            i;

        for(i = min; i < Math.floor(number / 2); i++) {
            if(number % i === 0) {
                factors.push(i);
            }
        }

        return factors;
    }

    function getGCDs(numbers) {
        var factorCount,
            factors,
            GCDs;

        factors = numbers.reduce(function(all, current) {
            return all.concat(getFactors(current, 3));
        }, []);

        factorCount = factors.reduce(function(counted, current) {
            counted[current] = ++counted[current] || 1;
            return counted;
        }, {});

        GCDs = factors.filter(utils.uniqueFilter).sort(function(a, b) {
            return factorCount[b] - factorCount[a];
        });

        return GCDs.slice(0, 3);
    }
}

module.exports = GCD();
},{"./Utils":6}],4:[function(require,module,exports){
var strings = require('./Strings'),
    utils   = require('./Utils');

function IC() {
    'use strict';

    var IC_ENGLISH = 1.73;

    return {
        calculateIC: calculateIC,
        calculateICForKeyLengths: calculateICForKeyLengths,
        getICForKeyLength: getICForKeyLength,
        sortByClosestIC: sortByClosestIC
    };

    /**
     * @public
     *
     * @param {String} text Text to calculate the Index of Coincidence for
     * @returns {Number} IC Index of Coincidence for the supplied text
     *
     * See https://en.wikipedia.org/wiki/Index_of_coincidence#Calculation
     */
    function calculateIC(text) {
        var letterCounts = strings.countLetters(text),
            IC,
            sum;

        sum = letterCounts.reduce(function(total, count) {
            return total + (count / text.length) * ((count - 1) / (text.length - 1));
        }, 0);

        IC = 26 * sum;

        return IC;
    }


    /**
     * @private
     *
     * @param {String} text Text to get the ICs for
     * @param {Array} lengths An array of possible key lengths for the cipher
     * @returns {Array} an array of objects, each containing a key length and its IC
     */
    function calculateICForKeyLengths(text, lengths) {
        return lengths.map(function(keyLength) {
            var IC = getICForKeyLength(text, keyLength);

            return { keyLength: keyLength, IC: IC };
        });
    }

    /**
     * @private
     *
     * @param {String} text Text to check IC for
     * @param {Number} keyLength Key length to check IC for
     * @returns  {Number} IC The IC for the specified text and keylength
     *
     * @description
     * Splits the text into rows of x length and calculates the
     * IC of every column it produces
     */
    function getICForKeyLength(text, keyLength) {
        var columns = strings.splitTextIntoColumns(text, keyLength),
            IC,
            sumColumnICs;

        sumColumnICs = columns.map(calculateIC).reduce(function(total, IC) {
            return total + IC;
        });

        IC = sumColumnICs / columns.length;

        utils.log('IC for key of length', keyLength + ':', IC);

        return IC;
    }

    function sortByClosestIC(a, b) {
        return Math.abs(a.IC - IC_ENGLISH) > Math.abs(b.IC - IC_ENGLISH);
    }
}

module.exports = IC();
},{"./Strings":5,"./Utils":6}],5:[function(require,module,exports){
var utils = require('./Utils');

function Strings() {

    // eewwww
    var tempText;

    return {
        countLetters: countLetters,
        getRecurringStrings: getRecurringStrings,
        replaceWithSpaces: replaceWithSpaces,
        splitTextIntoColumns: splitTextIntoColumns
    };

    /**
     * @public
     *
     * @param {String} text Text to count each letter in
     * @returns {Array} counts Array with the frequency each letter was found in the text
     *
     * @todo: refactor to be more flexible and with more error checking
     */
    function countLetters(text) {
        var counts = [],
            i;

        for(i = 0; i < 26; i++) {
            counts.push(0);
        }

        for(i = 0; i < text.length; i++) {
            var charIndex = text.charCodeAt(i) - 97;
            counts[charIndex]++;
        }

        return counts;
    }

    function getRecurringStrings(text, minLength, maxLength) {
        var recurring = [];

        tempText = text;

        for(var i = maxLength; i >= minLength; i--) {
            recurring = recurring.concat(getRecurringStringsOfLength(i));
        }

        if(recurring.length > 0)
            utils.log("Recurring strings:", recurring.map(function(item) { return item.string; }));
        else {
            utils.log('No recurring strings found :(');
        }

        tempText = null;

        return recurring;
    }

    function getRecurringStringsOfLength(length) {
        utils.log('Finding recurring strings of length', length);

        var count,
            pos = 0,
            recurring = [],
            regexp,
            string;

        while(pos < tempText.length - length) {
            string = tempText.substr(pos, length);
            regexp = new RegExp(string, 'g');
            count = tempText.match(regexp).length;

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

        while((match = regexp.exec(tempText)) !== null) {
            result.positions.push(match.index);

            // replace match with spaces so we don't get overlapping results
            tempText = replaceWithSpaces(tempText, match.index, match.index + string.length);
        }

        return result;
    }

    function replaceWithSpaces(text, start, end) {
        var i,
            spaces = '';

        for(i = 0; i < (end - start); i++) {
            spaces += ' ';
        }

        return text.substring(0, start) + spaces + text.substring(end);
    }

    /**
     * @private
     *
     * @param {String} text The text to split
     * @param {Number} amount Amount of columns to split the text in
     * @returns {Array} columns An array of strings, each consisting of every
     * nth letter in the cipher (where n ranges from 1 to the specified amount)
     *
     * @example
     * Given a text of "abcdefghijk" and an amount of 4 columns, will produce:
     *
     *    a b c d
     *    e f g h
     *    i j k
     *
     * The returned columns are then ['aei', 'bfj', 'cgk', 'dh']
     */
    function splitTextIntoColumns(text, amount) {
        var columns = [];

        for (var offset = 0; offset < amount; offset++) {
            var index = offset,
                column = '';

            while(text[index]) {
                column += text[index];
                index += amount;
            }

            columns.push(column);
        }

        return columns;
    }
}

module.exports = Strings();
},{"./Utils":6}],6:[function(require,module,exports){
function Utils() {

    return {
        applySettings: applySettings,
        getDistances: getDistances,
        log: log,
        normalize: normalize,
        uniqueFilter: uniqueFilter
    };

    function applySettings(defaults, options) {
        var i;

        for(i in options) {
            if(options.hasOwnProperty(i)) {
                defaults[i] = options[i];
            }
        }

        return defaults;
    }

    function getDistances(recurringStrings) {
        var allDistances,
            currentDistances,
            i;

        log('Distances between recurring strings:');

        allDistances = recurringStrings.map(function(item) {
            currentDistances = [];

            for (i = 0; i < item.positions.length - 1; i++) {
                currentDistances.push(item.positions[i + 1] - item.positions[i]);
            }

            return currentDistances;
        }).reduce(function(all, current) {
            return all.concat(current);
        });

        log(allDistances);

        return allDistances;
    }

    function log()
    {
        var logElement = document.getElementById('log'),
            logline = document.createElement('span'),
            output = Array.prototype.slice.call(arguments).join(' ');

        logline.innerText = output;
        logline.className = "logline";

        logElement.appendChild(logline);
        logElement.scrollTop = logElement.scrollHeight;
    }

    function normalize(input)
    {
        return input.toLowerCase().replace(/[^a-z]/g, '');
    }


    function uniqueFilter(item, index, self) {
        return index === self.indexOf(item);
    }
}

module.exports = Utils();
},{}],7:[function(require,module,exports){
var caesar  = require('./CaesarShift'),
    GCD     = require('./GreatestCommonDenominator'),
    IC      = require('./IndexOfCoincidence'),
    strings = require('./Strings'),
    utils   = require('./Utils');

module.exports = Vigenere();

function Vigenere() {
    var defaultSettings = {
            minLength: 3,
            maxLength: 12,
            elements: {
                input: document.getElementById('ciphertext'),
                output: document.getElementById('plaintext'),
                log: document.getElementById('log'),
                start: document.getElementById('decipher')
            }
        },
        settings;

    return {
        init: init
    };

    function init(options) {
        utils.log('Welcome to Vigenere Decipher Engine BETA 0.1');

        settings = utils.applySettings(defaultSettings, options);

        settings.elements.start.addEventListener('click', start);
    }

    function start() {
        var bestKeyLength,
            cipherText,
            key,
            probableKeyLengths;

        utils.log('Starting to decipher');
        cipherText = utils.normalize(settings.elements.input.value);

        utils.log('Step 1: Define probable key lengths using Kasiski method');
        probableKeyLengths = guessKeyLengthsKasiski(cipherText, settings.minLength, settings.maxLength);

        utils.log('Step 2: Check best matching key length using Friedman method');
        bestKeyLength = findBestKeyLengthFriedman(cipherText, probableKeyLengths);

        utils.log('Step 3: Perform frequency analyses to decipher key');
        key = getKeyByFrequencyAnalysis(cipherText, bestKeyLength);

        end(key);
    }

    function end(result) {
        utils.log('Finished all steps.');
        utils.log('Best guess:', result);
    }

    function findBestKeyLengthFriedman(cipherText, lengths) {
        var bestMatch,
            ICs;

        utils.log('Checking most probable key length');

        ICs = IC.calculateICForKeyLengths(cipherText, lengths);
        bestMatch = ICs.sort(IC.sortByClosestIC)[0];

        utils.log('Best guess for key length:', bestMatch.keyLength);

        return bestMatch.keyLength;
    }

    function getKeyByFrequencyAnalysis(cipherText, keyLength) {
        var columns,
            i,
            key = '';

        columns = strings.splitTextIntoColumns(cipherText, keyLength);

        for(i = 0; i < keyLength; i++) {
            utils.log('Finding key letter', i+1, 'of', keyLength);
            key += caesar.findShiftLetter(columns[i]);
        }

        return key;
    }

    function guessKeyLengthsKasiski(cipherText, minLength, maxLength) {
        var distances,
            GCDs,
            recurringStrings;

        recurringStrings = strings.getRecurringStrings(cipherText, minLength, maxLength);
        distances = utils.getDistances(recurringStrings);
        GCDs = GCD.getGCDs(distances);

        utils.log('Most probable key lengths:', GCDs);

        return GCDs;
    }

}
},{"./CaesarShift":2,"./GreatestCommonDenominator":3,"./IndexOfCoincidence":4,"./Strings":5,"./Utils":6}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9TdGVwaGFuL0Rldi92aWdlbmVyZS9ub2RlX21vZHVsZXMvZ3VscC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvU3RlcGhhbi9EZXYvdmlnZW5lcmUvc3JjL2pzL2Zha2VfYTBiOWI3ZDkuanMiLCIvVXNlcnMvU3RlcGhhbi9EZXYvdmlnZW5lcmUvc3JjL2pzL21vZHVsZXMvQ2Flc2FyU2hpZnQuanMiLCIvVXNlcnMvU3RlcGhhbi9EZXYvdmlnZW5lcmUvc3JjL2pzL21vZHVsZXMvR3JlYXRlc3RDb21tb25EZW5vbWluYXRvci5qcyIsIi9Vc2Vycy9TdGVwaGFuL0Rldi92aWdlbmVyZS9zcmMvanMvbW9kdWxlcy9JbmRleE9mQ29pbmNpZGVuY2UuanMiLCIvVXNlcnMvU3RlcGhhbi9EZXYvdmlnZW5lcmUvc3JjL2pzL21vZHVsZXMvU3RyaW5ncy5qcyIsIi9Vc2Vycy9TdGVwaGFuL0Rldi92aWdlbmVyZS9zcmMvanMvbW9kdWxlcy9VdGlscy5qcyIsIi9Vc2Vycy9TdGVwaGFuL0Rldi92aWdlbmVyZS9zcmMvanMvbW9kdWxlcy9WaWdlbmVyZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTs7QUNGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInZhciB2aWdlbmVyZSA9IHJlcXVpcmUoJy4vbW9kdWxlcy9WaWdlbmVyZScpO1xuXG52aWdlbmVyZS5pbml0KCk7IiwidmFyIElDICAgID0gcmVxdWlyZSgnLi9JbmRleE9mQ29pbmNpZGVuY2UnKSxcbiAgICB1dGlscyA9IHJlcXVpcmUoJy4vVXRpbHMnKTtcblxuZnVuY3Rpb24gQ2Flc2FyKCkge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIHZhciBGUkVRVUVOQ1lfRU5HTElTSCA9IFswLjA4MTY3LDAuMDE0OTIsMC4wMjc4MiwwLjA0MjUzLDAuMTI3MDIsMC4wMjIyOCwwLjAyMDE1LDAuMDYwOTQsMC4wNjk2NiwwLjAwMTUzLDAuMDA3NzIsXG4gICAgICAgIDAuMDQwMjUsMC4wMjQwNiwwLjA2NzQ5LDAuMDc1MDcsMC4wMTkyOSwwLjAwMDk1LDAuMDU5ODcsMC4wNjMyNywwLjA5MDU2LDAuMDI3NTgsMC4wMDk3OCxcbiAgICAgICAgMC4wMjM2MCwwLjAwMTUwLDAuMDE5NzQsMC4wMDA3NF07XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBmaW5kU2hpZnRMZXR0ZXI6IGZpbmRTaGlmdExldHRlcixcbiAgICAgICAgc2hpZnRUZXh0OiBzaGlmdFRleHRcbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gZmluZFNoaWZ0TGV0dGVyKHRleHQpIHtcbiAgICAgICAgdmFyIGksXG4gICAgICAgICAgICBzaGlmdGVkVGV4dCxcbiAgICAgICAgICAgIHNoaWZ0ZWQgPSBbXTtcblxuICAgICAgICBmb3IoaSA9IDA7IGkgPCAyNjsgaSsrKSB7XG4gICAgICAgICAgICBzaGlmdGVkVGV4dCA9IHNoaWZ0VGV4dCh0ZXh0LCBpKTtcbiAgICAgICAgICAgIHNoaWZ0ZWQucHVzaCh7XG4gICAgICAgICAgICAgICAgc2hpZnQ6IGksXG4gICAgICAgICAgICAgICAgdGV4dDogc2hpZnRlZFRleHQsXG4gICAgICAgICAgICAgICAgY2hpOiBnZXRDaGlTcXVhcmVkKHNoaWZ0ZWRUZXh0KVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zb2xlLmxvZyhzaGlmdGVkKTtcbiAgICAgICAgc2hpZnRlZC5zb3J0KGZ1bmN0aW9uKGEsIGIpIHtcbiAgICAgICAgICAgIHJldHVybiBhLmNoaSAtIGIgICAgLmNoaTtcbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnNvbGUubG9nKHNoaWZ0ZWRbMF0pO1xuXG4gICAgICAgIHJldHVybiBTdHJpbmcuZnJvbUNoYXJDb2RlKHNoaWZ0ZWRbMF0uc2hpZnQgKyA5Nyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2V0Q2hpU3F1YXJlZCh0ZXh0KSB7XG4gICAgICAgIHZhciBjaGkgPSAwLFxuICAgICAgICAgICAgY291bnQsXG4gICAgICAgICAgICBleHBlY3RlZENoaSA9IDAsXG4gICAgICAgICAgICBleHBlY3RlZENvdW50LFxuICAgICAgICAgICAgaSxcbiAgICAgICAgICAgIGxldHRlcixcbiAgICAgICAgICAgIG1hdGNoLFxuICAgICAgICAgICAgcmVnZXhwO1xuXG4gICAgICAgIGZvcihpID0gMDsgaSA8IDI2OyBpKyspIHtcbiAgICAgICAgICAgIGxldHRlciA9IFN0cmluZy5mcm9tQ2hhckNvZGUoaSArIDk3KTtcbiAgICAgICAgICAgIHJlZ2V4cCA9IG5ldyBSZWdFeHAobGV0dGVyLCAnZycpO1xuICAgICAgICAgICAgbWF0Y2ggID0gdGV4dC5tYXRjaChyZWdleHApO1xuXG4gICAgICAgICAgICBpZihtYXRjaCkge1xuICAgICAgICAgICAgICAgIGNvdW50ICA9IG1hdGNoLmxlbmd0aDtcbiAgICAgICAgICAgICAgICBleHBlY3RlZENoaSArPSBGUkVRVUVOQ1lfRU5HTElTSFtpXSAqIHRleHQubGVuZ3RoO1xuICAgICAgICAgICAgICAgIGNoaSArPSBjb3VudDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc29sZS5sb2cobGV0dGVyLCByZWdleHAsIGNvdW50LCBjaGksIGV4cGVjdGVkQ2hpKTtcblxuICAgICAgICB9XG5cbiAgICAgICAgY29uc29sZS5sb2coY2hpLCBleHBlY3RlZENoaSk7XG5cbiAgICAgICAgcmV0dXJuIChNYXRoLnBvdyhjaGkgLSBleHBlY3RlZENoaSwgMikgLyBleHBlY3RlZENoaSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2hpZnRUZXh0KHRleHQsIHNoaWZ0KSB7XG4gICAgICAgIHJldHVybiB0ZXh0LnNwbGl0KCcnKS5tYXAoZnVuY3Rpb24oY2hhcikge1xuICAgICAgICAgICAgdmFyIGxldHRlckluZGV4ID0gY2hhci5jaGFyQ29kZUF0KCkgLSA5NyxcbiAgICAgICAgICAgICAgICBuZXdMZXR0ZXIgPSAobGV0dGVySW5kZXggKyBzaGlmdCkgJSAyNjtcblxuICAgICAgICAgICAgcmV0dXJuIFN0cmluZy5mcm9tQ2hhckNvZGUobmV3TGV0dGVyICsgOTcpO1xuICAgICAgICB9KS5qb2luKCcnKTtcbiAgICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gQ2Flc2FyKCk7IiwidmFyIHV0aWxzID0gcmVxdWlyZSgnLi9VdGlscycpO1xuXG5mdW5jdGlvbiBHQ0QoKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgZ2V0RmFjdG9yczogZ2V0RmFjdG9ycyxcbiAgICAgICAgZ2V0R0NEczogZ2V0R0NEc1xuICAgIH07XG5cbiAgICBmdW5jdGlvbiBnZXRGYWN0b3JzKG51bWJlciwgbWluKSB7XG4gICAgICAgIHZhciBmYWN0b3JzID0gW10sXG4gICAgICAgICAgICBpO1xuXG4gICAgICAgIGZvcihpID0gbWluOyBpIDwgTWF0aC5mbG9vcihudW1iZXIgLyAyKTsgaSsrKSB7XG4gICAgICAgICAgICBpZihudW1iZXIgJSBpID09PSAwKSB7XG4gICAgICAgICAgICAgICAgZmFjdG9ycy5wdXNoKGkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGZhY3RvcnM7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2V0R0NEcyhudW1iZXJzKSB7XG4gICAgICAgIHZhciBmYWN0b3JDb3VudCxcbiAgICAgICAgICAgIGZhY3RvcnMsXG4gICAgICAgICAgICBHQ0RzO1xuXG4gICAgICAgIGZhY3RvcnMgPSBudW1iZXJzLnJlZHVjZShmdW5jdGlvbihhbGwsIGN1cnJlbnQpIHtcbiAgICAgICAgICAgIHJldHVybiBhbGwuY29uY2F0KGdldEZhY3RvcnMoY3VycmVudCwgMykpO1xuICAgICAgICB9LCBbXSk7XG5cbiAgICAgICAgZmFjdG9yQ291bnQgPSBmYWN0b3JzLnJlZHVjZShmdW5jdGlvbihjb3VudGVkLCBjdXJyZW50KSB7XG4gICAgICAgICAgICBjb3VudGVkW2N1cnJlbnRdID0gKytjb3VudGVkW2N1cnJlbnRdIHx8IDE7XG4gICAgICAgICAgICByZXR1cm4gY291bnRlZDtcbiAgICAgICAgfSwge30pO1xuXG4gICAgICAgIEdDRHMgPSBmYWN0b3JzLmZpbHRlcih1dGlscy51bmlxdWVGaWx0ZXIpLnNvcnQoZnVuY3Rpb24oYSwgYikge1xuICAgICAgICAgICAgcmV0dXJuIGZhY3RvckNvdW50W2JdIC0gZmFjdG9yQ291bnRbYV07XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiBHQ0RzLnNsaWNlKDAsIDMpO1xuICAgIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBHQ0QoKTsiLCJ2YXIgc3RyaW5ncyA9IHJlcXVpcmUoJy4vU3RyaW5ncycpLFxuICAgIHV0aWxzICAgPSByZXF1aXJlKCcuL1V0aWxzJyk7XG5cbmZ1bmN0aW9uIElDKCkge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIHZhciBJQ19FTkdMSVNIID0gMS43MztcblxuICAgIHJldHVybiB7XG4gICAgICAgIGNhbGN1bGF0ZUlDOiBjYWxjdWxhdGVJQyxcbiAgICAgICAgY2FsY3VsYXRlSUNGb3JLZXlMZW5ndGhzOiBjYWxjdWxhdGVJQ0ZvcktleUxlbmd0aHMsXG4gICAgICAgIGdldElDRm9yS2V5TGVuZ3RoOiBnZXRJQ0ZvcktleUxlbmd0aCxcbiAgICAgICAgc29ydEJ5Q2xvc2VzdElDOiBzb3J0QnlDbG9zZXN0SUNcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogQHB1YmxpY1xuICAgICAqXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHRleHQgVGV4dCB0byBjYWxjdWxhdGUgdGhlIEluZGV4IG9mIENvaW5jaWRlbmNlIGZvclxuICAgICAqIEByZXR1cm5zIHtOdW1iZXJ9IElDIEluZGV4IG9mIENvaW5jaWRlbmNlIGZvciB0aGUgc3VwcGxpZWQgdGV4dFxuICAgICAqXG4gICAgICogU2VlIGh0dHBzOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0luZGV4X29mX2NvaW5jaWRlbmNlI0NhbGN1bGF0aW9uXG4gICAgICovXG4gICAgZnVuY3Rpb24gY2FsY3VsYXRlSUModGV4dCkge1xuICAgICAgICB2YXIgbGV0dGVyQ291bnRzID0gc3RyaW5ncy5jb3VudExldHRlcnModGV4dCksXG4gICAgICAgICAgICBJQyxcbiAgICAgICAgICAgIHN1bTtcblxuICAgICAgICBzdW0gPSBsZXR0ZXJDb3VudHMucmVkdWNlKGZ1bmN0aW9uKHRvdGFsLCBjb3VudCkge1xuICAgICAgICAgICAgcmV0dXJuIHRvdGFsICsgKGNvdW50IC8gdGV4dC5sZW5ndGgpICogKChjb3VudCAtIDEpIC8gKHRleHQubGVuZ3RoIC0gMSkpO1xuICAgICAgICB9LCAwKTtcblxuICAgICAgICBJQyA9IDI2ICogc3VtO1xuXG4gICAgICAgIHJldHVybiBJQztcbiAgICB9XG5cblxuICAgIC8qKlxuICAgICAqIEBwcml2YXRlXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gdGV4dCBUZXh0IHRvIGdldCB0aGUgSUNzIGZvclxuICAgICAqIEBwYXJhbSB7QXJyYXl9IGxlbmd0aHMgQW4gYXJyYXkgb2YgcG9zc2libGUga2V5IGxlbmd0aHMgZm9yIHRoZSBjaXBoZXJcbiAgICAgKiBAcmV0dXJucyB7QXJyYXl9IGFuIGFycmF5IG9mIG9iamVjdHMsIGVhY2ggY29udGFpbmluZyBhIGtleSBsZW5ndGggYW5kIGl0cyBJQ1xuICAgICAqL1xuICAgIGZ1bmN0aW9uIGNhbGN1bGF0ZUlDRm9yS2V5TGVuZ3Rocyh0ZXh0LCBsZW5ndGhzKSB7XG4gICAgICAgIHJldHVybiBsZW5ndGhzLm1hcChmdW5jdGlvbihrZXlMZW5ndGgpIHtcbiAgICAgICAgICAgIHZhciBJQyA9IGdldElDRm9yS2V5TGVuZ3RoKHRleHQsIGtleUxlbmd0aCk7XG5cbiAgICAgICAgICAgIHJldHVybiB7IGtleUxlbmd0aDoga2V5TGVuZ3RoLCBJQzogSUMgfTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQHByaXZhdGVcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSB0ZXh0IFRleHQgdG8gY2hlY2sgSUMgZm9yXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IGtleUxlbmd0aCBLZXkgbGVuZ3RoIHRvIGNoZWNrIElDIGZvclxuICAgICAqIEByZXR1cm5zICB7TnVtYmVyfSBJQyBUaGUgSUMgZm9yIHRoZSBzcGVjaWZpZWQgdGV4dCBhbmQga2V5bGVuZ3RoXG4gICAgICpcbiAgICAgKiBAZGVzY3JpcHRpb25cbiAgICAgKiBTcGxpdHMgdGhlIHRleHQgaW50byByb3dzIG9mIHggbGVuZ3RoIGFuZCBjYWxjdWxhdGVzIHRoZVxuICAgICAqIElDIG9mIGV2ZXJ5IGNvbHVtbiBpdCBwcm9kdWNlc1xuICAgICAqL1xuICAgIGZ1bmN0aW9uIGdldElDRm9yS2V5TGVuZ3RoKHRleHQsIGtleUxlbmd0aCkge1xuICAgICAgICB2YXIgY29sdW1ucyA9IHN0cmluZ3Muc3BsaXRUZXh0SW50b0NvbHVtbnModGV4dCwga2V5TGVuZ3RoKSxcbiAgICAgICAgICAgIElDLFxuICAgICAgICAgICAgc3VtQ29sdW1uSUNzO1xuXG4gICAgICAgIHN1bUNvbHVtbklDcyA9IGNvbHVtbnMubWFwKGNhbGN1bGF0ZUlDKS5yZWR1Y2UoZnVuY3Rpb24odG90YWwsIElDKSB7XG4gICAgICAgICAgICByZXR1cm4gdG90YWwgKyBJQztcbiAgICAgICAgfSk7XG5cbiAgICAgICAgSUMgPSBzdW1Db2x1bW5JQ3MgLyBjb2x1bW5zLmxlbmd0aDtcblxuICAgICAgICB1dGlscy5sb2coJ0lDIGZvciBrZXkgb2YgbGVuZ3RoJywga2V5TGVuZ3RoICsgJzonLCBJQyk7XG5cbiAgICAgICAgcmV0dXJuIElDO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHNvcnRCeUNsb3Nlc3RJQyhhLCBiKSB7XG4gICAgICAgIHJldHVybiBNYXRoLmFicyhhLklDIC0gSUNfRU5HTElTSCkgPiBNYXRoLmFicyhiLklDIC0gSUNfRU5HTElTSCk7XG4gICAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IElDKCk7IiwidmFyIHV0aWxzID0gcmVxdWlyZSgnLi9VdGlscycpO1xuXG5mdW5jdGlvbiBTdHJpbmdzKCkge1xuXG4gICAgLy8gZWV3d3d3XG4gICAgdmFyIHRlbXBUZXh0O1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgY291bnRMZXR0ZXJzOiBjb3VudExldHRlcnMsXG4gICAgICAgIGdldFJlY3VycmluZ1N0cmluZ3M6IGdldFJlY3VycmluZ1N0cmluZ3MsXG4gICAgICAgIHJlcGxhY2VXaXRoU3BhY2VzOiByZXBsYWNlV2l0aFNwYWNlcyxcbiAgICAgICAgc3BsaXRUZXh0SW50b0NvbHVtbnM6IHNwbGl0VGV4dEludG9Db2x1bW5zXG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIEBwdWJsaWNcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSB0ZXh0IFRleHQgdG8gY291bnQgZWFjaCBsZXR0ZXIgaW5cbiAgICAgKiBAcmV0dXJucyB7QXJyYXl9IGNvdW50cyBBcnJheSB3aXRoIHRoZSBmcmVxdWVuY3kgZWFjaCBsZXR0ZXIgd2FzIGZvdW5kIGluIHRoZSB0ZXh0XG4gICAgICpcbiAgICAgKiBAdG9kbzogcmVmYWN0b3IgdG8gYmUgbW9yZSBmbGV4aWJsZSBhbmQgd2l0aCBtb3JlIGVycm9yIGNoZWNraW5nXG4gICAgICovXG4gICAgZnVuY3Rpb24gY291bnRMZXR0ZXJzKHRleHQpIHtcbiAgICAgICAgdmFyIGNvdW50cyA9IFtdLFxuICAgICAgICAgICAgaTtcblxuICAgICAgICBmb3IoaSA9IDA7IGkgPCAyNjsgaSsrKSB7XG4gICAgICAgICAgICBjb3VudHMucHVzaCgwKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZvcihpID0gMDsgaSA8IHRleHQubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBjaGFySW5kZXggPSB0ZXh0LmNoYXJDb2RlQXQoaSkgLSA5NztcbiAgICAgICAgICAgIGNvdW50c1tjaGFySW5kZXhdKys7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gY291bnRzO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldFJlY3VycmluZ1N0cmluZ3ModGV4dCwgbWluTGVuZ3RoLCBtYXhMZW5ndGgpIHtcbiAgICAgICAgdmFyIHJlY3VycmluZyA9IFtdO1xuXG4gICAgICAgIHRlbXBUZXh0ID0gdGV4dDtcblxuICAgICAgICBmb3IodmFyIGkgPSBtYXhMZW5ndGg7IGkgPj0gbWluTGVuZ3RoOyBpLS0pIHtcbiAgICAgICAgICAgIHJlY3VycmluZyA9IHJlY3VycmluZy5jb25jYXQoZ2V0UmVjdXJyaW5nU3RyaW5nc09mTGVuZ3RoKGkpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmKHJlY3VycmluZy5sZW5ndGggPiAwKVxuICAgICAgICAgICAgdXRpbHMubG9nKFwiUmVjdXJyaW5nIHN0cmluZ3M6XCIsIHJlY3VycmluZy5tYXAoZnVuY3Rpb24oaXRlbSkgeyByZXR1cm4gaXRlbS5zdHJpbmc7IH0pKTtcbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB1dGlscy5sb2coJ05vIHJlY3VycmluZyBzdHJpbmdzIGZvdW5kIDooJyk7XG4gICAgICAgIH1cblxuICAgICAgICB0ZW1wVGV4dCA9IG51bGw7XG5cbiAgICAgICAgcmV0dXJuIHJlY3VycmluZztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZXRSZWN1cnJpbmdTdHJpbmdzT2ZMZW5ndGgobGVuZ3RoKSB7XG4gICAgICAgIHV0aWxzLmxvZygnRmluZGluZyByZWN1cnJpbmcgc3RyaW5ncyBvZiBsZW5ndGgnLCBsZW5ndGgpO1xuXG4gICAgICAgIHZhciBjb3VudCxcbiAgICAgICAgICAgIHBvcyA9IDAsXG4gICAgICAgICAgICByZWN1cnJpbmcgPSBbXSxcbiAgICAgICAgICAgIHJlZ2V4cCxcbiAgICAgICAgICAgIHN0cmluZztcblxuICAgICAgICB3aGlsZShwb3MgPCB0ZW1wVGV4dC5sZW5ndGggLSBsZW5ndGgpIHtcbiAgICAgICAgICAgIHN0cmluZyA9IHRlbXBUZXh0LnN1YnN0cihwb3MsIGxlbmd0aCk7XG4gICAgICAgICAgICByZWdleHAgPSBuZXcgUmVnRXhwKHN0cmluZywgJ2cnKTtcbiAgICAgICAgICAgIGNvdW50ID0gdGVtcFRleHQubWF0Y2gocmVnZXhwKS5sZW5ndGg7XG5cbiAgICAgICAgICAgIGlmKCFzdHJpbmcubWF0Y2goJyAnKSAmJiBjb3VudCA+IDEpIHtcbiAgICAgICAgICAgICAgICB1dGlscy5sb2coc3RyaW5nLCAnb2NjdXJzJywgY291bnQsICd0aW1lcycpO1xuICAgICAgICAgICAgICAgIHJlY3VycmluZy5wdXNoKGdldFN0cmluZ1Bvc2l0aW9ucyhzdHJpbmcpKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcG9zKys7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmVjdXJyaW5nO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldFN0cmluZ1Bvc2l0aW9ucyhzdHJpbmcpIHtcbiAgICAgICAgdmFyIG1hdGNoLFxuICAgICAgICAgICAgcmVnZXhwID0gbmV3IFJlZ0V4cChzdHJpbmcsICdnJyksXG4gICAgICAgICAgICByZXN1bHQgPSB7IHN0cmluZzogc3RyaW5nLCBwb3NpdGlvbnM6IFtdIH07XG5cbiAgICAgICAgd2hpbGUoKG1hdGNoID0gcmVnZXhwLmV4ZWModGVtcFRleHQpKSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgcmVzdWx0LnBvc2l0aW9ucy5wdXNoKG1hdGNoLmluZGV4KTtcblxuICAgICAgICAgICAgLy8gcmVwbGFjZSBtYXRjaCB3aXRoIHNwYWNlcyBzbyB3ZSBkb24ndCBnZXQgb3ZlcmxhcHBpbmcgcmVzdWx0c1xuICAgICAgICAgICAgdGVtcFRleHQgPSByZXBsYWNlV2l0aFNwYWNlcyh0ZW1wVGV4dCwgbWF0Y2guaW5kZXgsIG1hdGNoLmluZGV4ICsgc3RyaW5nLmxlbmd0aCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHJlcGxhY2VXaXRoU3BhY2VzKHRleHQsIHN0YXJ0LCBlbmQpIHtcbiAgICAgICAgdmFyIGksXG4gICAgICAgICAgICBzcGFjZXMgPSAnJztcblxuICAgICAgICBmb3IoaSA9IDA7IGkgPCAoZW5kIC0gc3RhcnQpOyBpKyspIHtcbiAgICAgICAgICAgIHNwYWNlcyArPSAnICc7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGV4dC5zdWJzdHJpbmcoMCwgc3RhcnQpICsgc3BhY2VzICsgdGV4dC5zdWJzdHJpbmcoZW5kKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHRleHQgVGhlIHRleHQgdG8gc3BsaXRcbiAgICAgKiBAcGFyYW0ge051bWJlcn0gYW1vdW50IEFtb3VudCBvZiBjb2x1bW5zIHRvIHNwbGl0IHRoZSB0ZXh0IGluXG4gICAgICogQHJldHVybnMge0FycmF5fSBjb2x1bW5zIEFuIGFycmF5IG9mIHN0cmluZ3MsIGVhY2ggY29uc2lzdGluZyBvZiBldmVyeVxuICAgICAqIG50aCBsZXR0ZXIgaW4gdGhlIGNpcGhlciAod2hlcmUgbiByYW5nZXMgZnJvbSAxIHRvIHRoZSBzcGVjaWZpZWQgYW1vdW50KVxuICAgICAqXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiBHaXZlbiBhIHRleHQgb2YgXCJhYmNkZWZnaGlqa1wiIGFuZCBhbiBhbW91bnQgb2YgNCBjb2x1bW5zLCB3aWxsIHByb2R1Y2U6XG4gICAgICpcbiAgICAgKiAgICBhIGIgYyBkXG4gICAgICogICAgZSBmIGcgaFxuICAgICAqICAgIGkgaiBrXG4gICAgICpcbiAgICAgKiBUaGUgcmV0dXJuZWQgY29sdW1ucyBhcmUgdGhlbiBbJ2FlaScsICdiZmonLCAnY2drJywgJ2RoJ11cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBzcGxpdFRleHRJbnRvQ29sdW1ucyh0ZXh0LCBhbW91bnQpIHtcbiAgICAgICAgdmFyIGNvbHVtbnMgPSBbXTtcblxuICAgICAgICBmb3IgKHZhciBvZmZzZXQgPSAwOyBvZmZzZXQgPCBhbW91bnQ7IG9mZnNldCsrKSB7XG4gICAgICAgICAgICB2YXIgaW5kZXggPSBvZmZzZXQsXG4gICAgICAgICAgICAgICAgY29sdW1uID0gJyc7XG5cbiAgICAgICAgICAgIHdoaWxlKHRleHRbaW5kZXhdKSB7XG4gICAgICAgICAgICAgICAgY29sdW1uICs9IHRleHRbaW5kZXhdO1xuICAgICAgICAgICAgICAgIGluZGV4ICs9IGFtb3VudDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29sdW1ucy5wdXNoKGNvbHVtbik7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gY29sdW1ucztcbiAgICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gU3RyaW5ncygpOyIsImZ1bmN0aW9uIFV0aWxzKCkge1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgYXBwbHlTZXR0aW5nczogYXBwbHlTZXR0aW5ncyxcbiAgICAgICAgZ2V0RGlzdGFuY2VzOiBnZXREaXN0YW5jZXMsXG4gICAgICAgIGxvZzogbG9nLFxuICAgICAgICBub3JtYWxpemU6IG5vcm1hbGl6ZSxcbiAgICAgICAgdW5pcXVlRmlsdGVyOiB1bmlxdWVGaWx0ZXJcbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gYXBwbHlTZXR0aW5ncyhkZWZhdWx0cywgb3B0aW9ucykge1xuICAgICAgICB2YXIgaTtcblxuICAgICAgICBmb3IoaSBpbiBvcHRpb25zKSB7XG4gICAgICAgICAgICBpZihvcHRpb25zLmhhc093blByb3BlcnR5KGkpKSB7XG4gICAgICAgICAgICAgICAgZGVmYXVsdHNbaV0gPSBvcHRpb25zW2ldO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGRlZmF1bHRzO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldERpc3RhbmNlcyhyZWN1cnJpbmdTdHJpbmdzKSB7XG4gICAgICAgIHZhciBhbGxEaXN0YW5jZXMsXG4gICAgICAgICAgICBjdXJyZW50RGlzdGFuY2VzLFxuICAgICAgICAgICAgaTtcblxuICAgICAgICBsb2coJ0Rpc3RhbmNlcyBiZXR3ZWVuIHJlY3VycmluZyBzdHJpbmdzOicpO1xuXG4gICAgICAgIGFsbERpc3RhbmNlcyA9IHJlY3VycmluZ1N0cmluZ3MubWFwKGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgICAgICAgIGN1cnJlbnREaXN0YW5jZXMgPSBbXTtcblxuICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IGl0ZW0ucG9zaXRpb25zLmxlbmd0aCAtIDE7IGkrKykge1xuICAgICAgICAgICAgICAgIGN1cnJlbnREaXN0YW5jZXMucHVzaChpdGVtLnBvc2l0aW9uc1tpICsgMV0gLSBpdGVtLnBvc2l0aW9uc1tpXSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBjdXJyZW50RGlzdGFuY2VzO1xuICAgICAgICB9KS5yZWR1Y2UoZnVuY3Rpb24oYWxsLCBjdXJyZW50KSB7XG4gICAgICAgICAgICByZXR1cm4gYWxsLmNvbmNhdChjdXJyZW50KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgbG9nKGFsbERpc3RhbmNlcyk7XG5cbiAgICAgICAgcmV0dXJuIGFsbERpc3RhbmNlcztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsb2coKVxuICAgIHtcbiAgICAgICAgdmFyIGxvZ0VsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbG9nJyksXG4gICAgICAgICAgICBsb2dsaW5lID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpLFxuICAgICAgICAgICAgb3V0cHV0ID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKS5qb2luKCcgJyk7XG5cbiAgICAgICAgbG9nbGluZS5pbm5lclRleHQgPSBvdXRwdXQ7XG4gICAgICAgIGxvZ2xpbmUuY2xhc3NOYW1lID0gXCJsb2dsaW5lXCI7XG5cbiAgICAgICAgbG9nRWxlbWVudC5hcHBlbmRDaGlsZChsb2dsaW5lKTtcbiAgICAgICAgbG9nRWxlbWVudC5zY3JvbGxUb3AgPSBsb2dFbGVtZW50LnNjcm9sbEhlaWdodDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBub3JtYWxpemUoaW5wdXQpXG4gICAge1xuICAgICAgICByZXR1cm4gaW5wdXQudG9Mb3dlckNhc2UoKS5yZXBsYWNlKC9bXmEtel0vZywgJycpO1xuICAgIH1cblxuXG4gICAgZnVuY3Rpb24gdW5pcXVlRmlsdGVyKGl0ZW0sIGluZGV4LCBzZWxmKSB7XG4gICAgICAgIHJldHVybiBpbmRleCA9PT0gc2VsZi5pbmRleE9mKGl0ZW0pO1xuICAgIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBVdGlscygpOyIsInZhciBjYWVzYXIgID0gcmVxdWlyZSgnLi9DYWVzYXJTaGlmdCcpLFxuICAgIEdDRCAgICAgPSByZXF1aXJlKCcuL0dyZWF0ZXN0Q29tbW9uRGVub21pbmF0b3InKSxcbiAgICBJQyAgICAgID0gcmVxdWlyZSgnLi9JbmRleE9mQ29pbmNpZGVuY2UnKSxcbiAgICBzdHJpbmdzID0gcmVxdWlyZSgnLi9TdHJpbmdzJyksXG4gICAgdXRpbHMgICA9IHJlcXVpcmUoJy4vVXRpbHMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBWaWdlbmVyZSgpO1xuXG5mdW5jdGlvbiBWaWdlbmVyZSgpIHtcbiAgICB2YXIgZGVmYXVsdFNldHRpbmdzID0ge1xuICAgICAgICAgICAgbWluTGVuZ3RoOiAzLFxuICAgICAgICAgICAgbWF4TGVuZ3RoOiAxMixcbiAgICAgICAgICAgIGVsZW1lbnRzOiB7XG4gICAgICAgICAgICAgICAgaW5wdXQ6IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjaXBoZXJ0ZXh0JyksXG4gICAgICAgICAgICAgICAgb3V0cHV0OiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncGxhaW50ZXh0JyksXG4gICAgICAgICAgICAgICAgbG9nOiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbG9nJyksXG4gICAgICAgICAgICAgICAgc3RhcnQ6IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdkZWNpcGhlcicpXG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHNldHRpbmdzO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgaW5pdDogaW5pdFxuICAgIH07XG5cbiAgICBmdW5jdGlvbiBpbml0KG9wdGlvbnMpIHtcbiAgICAgICAgdXRpbHMubG9nKCdXZWxjb21lIHRvIFZpZ2VuZXJlIERlY2lwaGVyIEVuZ2luZSBCRVRBIDAuMScpO1xuXG4gICAgICAgIHNldHRpbmdzID0gdXRpbHMuYXBwbHlTZXR0aW5ncyhkZWZhdWx0U2V0dGluZ3MsIG9wdGlvbnMpO1xuXG4gICAgICAgIHNldHRpbmdzLmVsZW1lbnRzLnN0YXJ0LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgc3RhcnQpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHN0YXJ0KCkge1xuICAgICAgICB2YXIgYmVzdEtleUxlbmd0aCxcbiAgICAgICAgICAgIGNpcGhlclRleHQsXG4gICAgICAgICAgICBrZXksXG4gICAgICAgICAgICBwcm9iYWJsZUtleUxlbmd0aHM7XG5cbiAgICAgICAgdXRpbHMubG9nKCdTdGFydGluZyB0byBkZWNpcGhlcicpO1xuICAgICAgICBjaXBoZXJUZXh0ID0gdXRpbHMubm9ybWFsaXplKHNldHRpbmdzLmVsZW1lbnRzLmlucHV0LnZhbHVlKTtcblxuICAgICAgICB1dGlscy5sb2coJ1N0ZXAgMTogRGVmaW5lIHByb2JhYmxlIGtleSBsZW5ndGhzIHVzaW5nIEthc2lza2kgbWV0aG9kJyk7XG4gICAgICAgIHByb2JhYmxlS2V5TGVuZ3RocyA9IGd1ZXNzS2V5TGVuZ3Roc0thc2lza2koY2lwaGVyVGV4dCwgc2V0dGluZ3MubWluTGVuZ3RoLCBzZXR0aW5ncy5tYXhMZW5ndGgpO1xuXG4gICAgICAgIHV0aWxzLmxvZygnU3RlcCAyOiBDaGVjayBiZXN0IG1hdGNoaW5nIGtleSBsZW5ndGggdXNpbmcgRnJpZWRtYW4gbWV0aG9kJyk7XG4gICAgICAgIGJlc3RLZXlMZW5ndGggPSBmaW5kQmVzdEtleUxlbmd0aEZyaWVkbWFuKGNpcGhlclRleHQsIHByb2JhYmxlS2V5TGVuZ3Rocyk7XG5cbiAgICAgICAgdXRpbHMubG9nKCdTdGVwIDM6IFBlcmZvcm0gZnJlcXVlbmN5IGFuYWx5c2VzIHRvIGRlY2lwaGVyIGtleScpO1xuICAgICAgICBrZXkgPSBnZXRLZXlCeUZyZXF1ZW5jeUFuYWx5c2lzKGNpcGhlclRleHQsIGJlc3RLZXlMZW5ndGgpO1xuXG4gICAgICAgIGVuZChrZXkpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGVuZChyZXN1bHQpIHtcbiAgICAgICAgdXRpbHMubG9nKCdGaW5pc2hlZCBhbGwgc3RlcHMuJyk7XG4gICAgICAgIHV0aWxzLmxvZygnQmVzdCBndWVzczonLCByZXN1bHQpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGZpbmRCZXN0S2V5TGVuZ3RoRnJpZWRtYW4oY2lwaGVyVGV4dCwgbGVuZ3Rocykge1xuICAgICAgICB2YXIgYmVzdE1hdGNoLFxuICAgICAgICAgICAgSUNzO1xuXG4gICAgICAgIHV0aWxzLmxvZygnQ2hlY2tpbmcgbW9zdCBwcm9iYWJsZSBrZXkgbGVuZ3RoJyk7XG5cbiAgICAgICAgSUNzID0gSUMuY2FsY3VsYXRlSUNGb3JLZXlMZW5ndGhzKGNpcGhlclRleHQsIGxlbmd0aHMpO1xuICAgICAgICBiZXN0TWF0Y2ggPSBJQ3Muc29ydChJQy5zb3J0QnlDbG9zZXN0SUMpWzBdO1xuXG4gICAgICAgIHV0aWxzLmxvZygnQmVzdCBndWVzcyBmb3Iga2V5IGxlbmd0aDonLCBiZXN0TWF0Y2gua2V5TGVuZ3RoKTtcblxuICAgICAgICByZXR1cm4gYmVzdE1hdGNoLmtleUxlbmd0aDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZXRLZXlCeUZyZXF1ZW5jeUFuYWx5c2lzKGNpcGhlclRleHQsIGtleUxlbmd0aCkge1xuICAgICAgICB2YXIgY29sdW1ucyxcbiAgICAgICAgICAgIGksXG4gICAgICAgICAgICBrZXkgPSAnJztcblxuICAgICAgICBjb2x1bW5zID0gc3RyaW5ncy5zcGxpdFRleHRJbnRvQ29sdW1ucyhjaXBoZXJUZXh0LCBrZXlMZW5ndGgpO1xuXG4gICAgICAgIGZvcihpID0gMDsgaSA8IGtleUxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB1dGlscy5sb2coJ0ZpbmRpbmcga2V5IGxldHRlcicsIGkrMSwgJ29mJywga2V5TGVuZ3RoKTtcbiAgICAgICAgICAgIGtleSArPSBjYWVzYXIuZmluZFNoaWZ0TGV0dGVyKGNvbHVtbnNbaV0pO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGtleTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBndWVzc0tleUxlbmd0aHNLYXNpc2tpKGNpcGhlclRleHQsIG1pbkxlbmd0aCwgbWF4TGVuZ3RoKSB7XG4gICAgICAgIHZhciBkaXN0YW5jZXMsXG4gICAgICAgICAgICBHQ0RzLFxuICAgICAgICAgICAgcmVjdXJyaW5nU3RyaW5ncztcblxuICAgICAgICByZWN1cnJpbmdTdHJpbmdzID0gc3RyaW5ncy5nZXRSZWN1cnJpbmdTdHJpbmdzKGNpcGhlclRleHQsIG1pbkxlbmd0aCwgbWF4TGVuZ3RoKTtcbiAgICAgICAgZGlzdGFuY2VzID0gdXRpbHMuZ2V0RGlzdGFuY2VzKHJlY3VycmluZ1N0cmluZ3MpO1xuICAgICAgICBHQ0RzID0gR0NELmdldEdDRHMoZGlzdGFuY2VzKTtcblxuICAgICAgICB1dGlscy5sb2coJ01vc3QgcHJvYmFibGUga2V5IGxlbmd0aHM6JywgR0NEcyk7XG5cbiAgICAgICAgcmV0dXJuIEdDRHM7XG4gICAgfVxuXG59Il19
