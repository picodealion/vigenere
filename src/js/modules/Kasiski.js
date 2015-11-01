var utils = require('./utils.js'),
    q     = require('q');

module.exports = (function() {

    // 'use strict';

    var $mTempCipher,
        $mAmountOfLengths,
        $mMinLength,
        $mRecurringStrings,
        $mCurrentStringLength,

        $mCipher,
        $mMaxLength,
        $mMinLength;

    return {
        guessKeyLength: init
    };

    function init($aCipher, $aMinLength, $aMaxLength)
    {
        var deferred = q.defer();

        $mCipher = $aCipher;
        $mMinLength = $aMinLength;
        $mMaxLength = $aMaxLength;

        utils.log('Step 1: Define key length using Kasiski method', true);

        $mRecurringStrings = [];
        $mTempCipher       = $mCipher;
        $mAmountOfLengths  = $mMaxLength - $mMinLength;

        utils.fragmentedForAsync(0, $mAmountOfLengths, runInLoops, function() {
            var result = onLoopsEnd();
            deferred.resolve(result);
        });

        return deferred.promise;
    }


    function runInLoops($aCount, $aNextLoop)
    {
        $lCurrentStringLength = $mMaxLength - $aCount;

        findRecurringString($lCurrentStringLength, function($aRecurring){
            $mRecurringStrings = $mRecurringStrings.concat($aRecurring);
            $aNextLoop();
        });
    }


    function findRecurringString($aLength, $aCallback)
    {
        utils.log('Finding recurring strings of length ' + $aLength, true);

        $mCurrentStringLength = $aLength;
        var $lCallback = $aCallback;
        var $lRecurring = [];

        // run through the total ciphertext checking for recurring strings of $aLength length
        // in batches of 10 loops at a time to prevent the browser from freezing
        utils.fragmentedFor(
            50,
            charsLeft, //total runs (as a callback function to stay dynamic, it might change)
            function($aPos) // function to run each loop
            {
                var $lString = $mTempCipher.substr($aPos, $mCurrentStringLength);
                $lRecurring = addRecurring($lString, $lRecurring);
            },
            function() // callback after the total amount of loops have been run
            {
                $lCallback($lRecurring);
            },
            function() // callback after each batch
            {
                utils.log('.');
            }
        );
    }


    function addRecurring($aString, $aRecurring)
    {
        // skip strings with spaces, they had text between them in the original ciphertext
        if($aString.indexOf(' ') > -1) return $aRecurring;

        var $lRegexp = new RegExp($aString, 'g'),
            $lResult = $mTempCipher.match( $lRegexp ),
            $lCount = $lResult.length;

        // @todo: the shorter the string, the more occurrences are needed
        if($lCount > 1) {
            // replace checked string with a space to prevent from checking itself or substrings again
            $mTempCipher = $mTempCipher.replace($lRegexp, ' ');
            $aRecurring.push($aString);
            utils.log($aString + " occurs " + $lCount + " time(s)", true);
        }

        return $aRecurring;
    }


    function onLoopsEnd()
    {
        if($mRecurringStrings.length > 0)
            utils.log("Recurring strings:" + $mRecurringStrings , true);
        else {
            utils.log('No recurring strings found :(. Either the key is too long or the ciphertext is too short to break the code.', true);
            return false;
        }

        utils.log('Distances between recurring strings: ', true);
        var $lDistances = [];

        // determine distance between each instance of the recurring strings
        $.each($mRecurringStrings, function($lKey, $lVal){
            $lDistances = $lDistances.concat( getDistanceBetweenStrings($lVal) );
        });
        utils.log($lDistances);

        var $lKeyLengths = guessKeyLength($lDistances);

        utils.log('Most probable key lengths: ', true);
        utils.log($lKeyLengths);

        return $lKeyLengths;
    }


    function charsLeft()
    {
        return $mTempCipher.length - $mCurrentStringLength;
    }


    function getDistanceBetweenStrings($aString)
    {
        var $lDistances = [],
            $lSplit = $mCipher.split($aString);

        for (var $i = 1; $i < $lSplit.length - 1; $i++) {
            $lDist = $lSplit[$i].length + $aString.length;
            $lDistances.push($lDist);
        }

        return $lDistances;
    }


    function guessKeyLength($aDistances)
    {
        var $lUniqueDistances = [];

        $.each($aDistances, function(i, el){
            if($.inArray(el, $lUniqueDistances) === -1) $lUniqueDistances.push(el);
        });

        var $lGCDs = []; // "Greatest Common Denominator"

        for(var $i = 0; $i < $lUniqueDistances.length - 1; $i++) {
            $lGCDs.push( getEuclideanGCD($lUniqueDistances[$i], $lUniqueDistances[$i + 1]) );
        }

        var $lCountGCDs = countOccurrences($lGCDs),
            $lMostProbable = utils.sortObjectByValue($lCountGCDs, true),
            $lGuess = [];

        $.each($lMostProbable, function($lKey, $lVal){
            $lGuess.push( parseInt($lVal[0]) );
            if($lGuess.length > 2) return false;
        });

        return $lGuess;

    }

    function getEuclideanGCD($aNum1, $aNum2)
    {
        var $lLow  = Math.min($aNum1, $aNum2),
            $lHigh = Math.max($aNum1, $aNum2);

        while($lLow >= $mMinLength) {
            var $lOldLow = $lLow;
            $lLow  = $lHigh % $lLow;
            $lHigh = $lOldLow;
        }

        return $lHigh;
    }

    function countOccurrences($aGCDs)
    {
        var $lCounter = {};

        $.each($aGCDs, function($lKey, $lVal) {
            $lCounter[$lVal] = ($lCounter[$lVal] || 0) + 1;
        });

        return $lCounter;
    }

}());