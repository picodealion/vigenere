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
                key: document.getElementById('key'),
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
            probableKeyLengths,
            solution;

        utils.log('Starting to decipher');
        cipherText = utils.normalize(settings.elements.input.value);

        utils.log('Step 1: Define probable key lengths using Kasiski method');
        probableKeyLengths = guessKeyLengthsKasiski(cipherText, settings.minLength, settings.maxLength);

        utils.log('Step 2: Check best matching key length using Friedman method');
        bestKeyLength = findBestKeyLengthFriedman(cipherText, probableKeyLengths);

        utils.log('Step 3: Perform frequency analyses to decipher key');
        key = getKeyByFrequencyAnalysis(cipherText, bestKeyLength);
        settings.elements.key.innerText = key;

        utils.log('Step 4: Deciphering the cipher text');
        solution = decipherText(cipherText, key);

        end(solution);
    }

    function end(solution) {
        settings.elements.output.innerText = solution;
        utils.log('Finished all steps.');
    }

    function decipherText(text, key) {
        var columns = strings.splitTextIntoColumns(text, key.length),
            i;

        for(i = 0; i < columns.length; i++) {
            columns[i] = caesar.shiftText(columns[i], key.charCodeAt(i) - 97);
        }

        return strings.mergeColumns(columns);
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

        key = strings.reduceRepeatedWord(key);

        utils.log('\nBest guess for the key:', key, "\n\n");

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