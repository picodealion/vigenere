
function confirmKeyLengthFriedman($aCipher, $aKeyLengths)
{
	var IC_ENGLISH = 0.067, // "Index of Coincidence"
		$mICs = [],
		$mCipher = $aCipher,
		$mKeyLengths = $aKeyLengths;

	var	$mBestGuessKeyLength;


	var init = function()
	{
		log('Step 2: Test possible keylengths using Friedman method', true);

		calculateICForEachKeylength();
		calculateBestGuessKeyLength();

		exitEvent();
	};


	var calculateICForEachKeylength = function()
	{
		$.each($mKeyLengths, function($lKey, $lKeyLength) {
			log('Checking Index of Coincidence for key with length ' + $lKeyLength, true);			
			var $lIC = getICForKeyLength($lKeyLength);
			addToICs($lKeyLength, $lIC);
		});
	};


	var getICForKeyLength = function($aKeyLength)
	{
		var $lColumns = splitTextIntoColumns($aKeyLength);
		return getDeltaBarIC($lColumns);
	};


	var splitTextIntoColumns = function($aAmountOfColumns)
	{
		
		var $lColumns = [];

		for (var $Count = 0; $Count < $aAmountOfColumns; $Count++) {
			var $lColumn = getEachNthCharacterFromCipher($aAmountOfColumns, $Count);
			$lColumns.push( $lColumn );
		}

		return $lColumns;
	};


	var getEachNthCharacterFromCipher = function($N, $aOffset)
	{
		var $lPos = $aOffset,
			$lString = '';

		while ($mCipher[$lPos]) {
			$lString += $mCipher[$lPos];
			$lPos += $N;
		}

		return $lString;
	};


	var getDeltaBarIC = function($aColumns)
	{
		console.log('getDeltaBarIC ', $aColumns);

		var $lICs = [];
		$.each($aColumns, function($lKey, $lColumn){
			$lICs[$lKey] = getIC($lColumn);
		});
		
		$lDeltaBar = getAverageIC($lICs);

		log(': ' + $lDeltaBar);
		return $lDeltaBar;
	};


	//@TODO: refactor
	var getIC = function($aString) 
	{
	    var $lTotalChars = 0,
	     	$lSum = 0;

	    var $lCharCounts = getArrayOfZeroes(26);

	    for (var $lPos = 0; $lPos < $aString.length; $lPos++){
	        $lCharCounts[$aString.charCodeAt($lPos) - 97]++;
	        $lTotalChars++;
	    }

	    for (var $i = 0; $i < 26; $i++) {
	    	$lSum += $lCharCounts[$i] * ($lCharCounts[$i] - 1);
	    }

	  	var $lIC = $lSum / ($lTotalChars*($lTotalChars-1));

	    return $lIC;
	};


	var getArrayOfZeroes = function($aAmount)
	{
		var $lArray = [];
		for (var $i = 0; $i < $aAmount; $i++) {
	    	$lArray[$i] = 0;		    	
	    }
	    return $lArray;
	};


	var getAverageIC = function($aICs)
	{
		var $lSum = 0;
		$.each($aICs, function($lKey, $lVal){
			$lSum += $lVal;
		});

		return $lSum / $aICs.length;
	};


	var addToICs = function($aKeyLength, $aIC)
	{
		$mICs.push( [$aKeyLength, $aIC] );
	};

	var calculateBestGuessKeyLength = function()
	{
		var $lDeltas = {};
		$.each($mICs, function($lKey, $lArray){
			$lDeltas[$lArray[0]] = Math.abs($lArray[1] - IC_ENGLISH);
		});

		var $lPrunedDeltas = pruneMultiplesOfKeyLength($lDeltas);
		var $lSorted = sortObjectByValue($lPrunedDeltas, false);

		$mBestGuessKeyLength = $lSorted[0][0];
	};


	//@TODO: refactor
	var pruneMultiplesOfKeyLength = function($aDeltas) {
		// just for looping easier, we prune from $aDeltas
		var $lDeltasArray = objectToArray($aDeltas);

		// if a keylength is a multiple of a smaller keylength and the difference is less than 10%
		// and the smaller keylength occurred more times in Kasiski
		// then the smallest keylength is probably correct
		for(var $i = 1; $i < $lDeltasArray.length; $i++) {
			for(var $c = 0; $c < $i; $c++) {
				var $lHigh = $lDeltasArray[$i],
					$lLow  = $lDeltasArray[$c],
					$lIsMultiple = ( $lHigh[0] % $lLow[0] === 0 ),
					$lDifference = Math.abs( ($lHigh[1] / $lLow[1]) - 1 );

				if( $lIsMultiple && $lDifference < 0.1 ) {
					delete $aDeltas[$lHigh[0]];
				}
			}
		}
		return $aDeltas;
	};


	var exitEvent = function($aKeyLength, $aLanguage)
	{
		log('Best guess for keylength: ' + $mBestGuessKeyLength, true);

		$(document).trigger('FriedmanEnded', $mBestGuessKeyLength);
	};


	init();
}