var _        = require('lodash'),
    utils    = require('./modules/utils.js'),
    Kasiski  = require('./modules/Kasiski.js'),
    Friedman = require('./modules/Friedman.js');

var log = utils.log;

module.exports = (function Vigenere()
{
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
        settings = _.assign({}, defaultSettings, options);
        console.log(settings, options);

        log('Welcome to Vigenere Decipher Engine BETA 0.1');

        settings.elements.start.addEventListener('click', start);
    }

    function start() {
        log('Starting to decipher', true);

        cipherText = utils.normalize(settings.elements.input.innerHTML);

        defineStepsByEvents();

        Kasiski.guessKeyLength(cipherText, settings.minLength, settings.maxLength);
    }

    // @todo: fuck this shit
    function defineStepsByEvents() {
        $(document).off('KasiskiEnded').on('KasiskiEnded', function($aEvent, $aKeyLenghts){
            log('Finished step 1', true);
            Friedman.confirmKeyLength(cipherText, $aKeyLenghts);
        });

        $(document).off('FriedmanEnded').on('FriedmanEnded', function($aEvent, $aKeyLength){
            log('Finished step 2', true);
            console.log('all done (for now)');
        });
    }
}());



