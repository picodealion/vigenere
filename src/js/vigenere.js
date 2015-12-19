var Kasiski  = require('./modules/Kasiski'),
    FrequencyAnalyzer = require('./modules/FrequencyAnalyzer'),
    Friedman = require('./modules/Friedman'),
    utils    = require('./modules/utils');

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
        settings,
        cipherText;

    return {
        init: init
    };

    function init(options) {
        utils.log('Welcome to Vigenere Decipher Engine BETA 0.1');

        settings = utils.settings(defaultSettings, options);

        settings.elements.start.addEventListener('click', start);
    }

    function start() {
        var bestKeyLength,
            key,
            probableKeyLengths;

        utils.log('Starting to decipher');
        cipherText = utils.normalize(settings.elements.input.value);

        utils.log('Step 1: Define probable key lengths using Kasiski method');
        probableKeyLengths = Kasiski.guessKeyLength(cipherText, settings.minLength, settings.maxLength);

        utils.log('Step 2: Check best matching key length using Friedman method');
        bestKeyLength = Friedman.findBestKeyLength(cipherText, probableKeyLengths);

        utils.log('Step 3: Perform frequency analyses to decipher key');
        key = FrequencyAnalyzer.getKey(cipherText, bestKeyLength);

        end(key);
    }

    function end(result) {
        utils.log('Finished all steps.');
        utils.log('Best guess:', result);
    }
}