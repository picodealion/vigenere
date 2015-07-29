function confirmKeyLengthFriedman($aCipher, $aKeyLengths) 
{
	var $mEnglishIC = 0.067; // "Index of Coincidence"


	var init = function()
	{
		log('Step 2: Test possible keylengths using Friedman method', true);
		var $lDeltaBarICs = {};

		$.each($aKeyLengths, function($lKey, $lVal) {
			log('Checking Index of Coincidence for keylength ' + $lVal, true);
			var $lColumns = splitTextIntoColumns($lVal);
			$lDeltaBarICs[$lKey] = [$lVal, getDeltaBarIC($lColumns)];
		});

		var $lBestKeyLength = getClosestKeyLength($lDeltaBarICs);
		log('Best guess for keylength: ' + $lBestKeyLength, true);
	}


	var splitTextIntoColumns = function($aColumnCount)
	{
		var $lColumns = [],
			$lCount = $aColumnCount;

		for (var $lCol = 0; $lCol < $lCount; $lCol++) {
			var $lPos = $lCol;
			$lColumns[$lCol] = '';

			while ($aCipher[$lPos]) {
				$lColumns[$lCol] += $aCipher[$lPos];
				$lPos += $lCount;
			}
		}

		return $lColumns;
	}


	var getDeltaBarIC = function($aColumns)
	{
		var $lICs = [];
		$.each($aColumns, function($lKey, $lVal){
			$lICs[$lKey] = getIC($lVal);
		});
		
		var $lSum = 0;
		$.each($lICs, function($lKey, $lVal){
			$lSum += $lVal;
		});

		$lDeltaBar = $lSum / $lICs.length;

		log(': ' + $lDeltaBar);
		return $lDeltaBar;
	}


	var getIC = function($aString) 
	{
	    var $lCharCounts = [],
	     	$lTotalChars = 0,
	     	$lSum = 0;

	    for (var $i = 0; $i < 26; $i++) {
	    	$lCharCounts[$i] = 0;		    	
	    }

	    for (var $lPos = 0; $lPos < $aString.length; $lPos++){
	        $lCharCounts[$aString.charCodeAt($lPos) - 97]++;
	        $lTotalChars++;
	    }

	    for (var $i = 0; $i < 26; $i++) {
	    	$lSum += $lCharCounts[$i] * ($lCharCounts[$i] - 1);
	    }

	  	var $lIC = $lSum / ($lTotalChars*($lTotalChars-1));

	    return $lIC;
	}


	var getClosestKeyLength = function($aICs)
	{
		var $lDeltas = {};
		$.each($aICs, function($lKey, $lVal){
			$lDeltas[$lVal[0]] = Math.abs($lVal[1] - $mEnglishIC);
		});

		var $lPrunedDeltas = pruneMultiplesOfKeyLength($lDeltas);
		var $lSorted = sortObjectByValue($lPrunedDeltas, false);

		return $lSorted[0][0];
	}


	var pruneMultiplesOfKeyLength = function($aDeltas) {
		// just for looping easier, we prune from $aDeltas
		var $lDeltasArray = objectToArray($aDeltas);

		// if a keylength is a multiple of a smaller keylength and the difference is less than 10%
		// and the smaller keylength occurred more times in Kasiski
		// the smallest keylength is probably correct
		for(var $i = 1; $i < $lDeltasArray.length; $i++) {
			for(var $c = 0; $c < $i; $c++) {
				var $lHigh = $lDeltasArray[$i],
					$lLow  = $lDeltasArray[$c],
					$lIsMultiple = ( $lHigh[0] % $lLow[0] === 0 ),
					$lDifference = Math.abs( ($lHigh[1] / $lLow[1]) - 1 );

				if( $lIsMultiple && $lDifference < .1 ) {
					delete $aDeltas[$lHigh[0]];
				}
			}
		}
		return $aDeltas;
	}

	var exitEvent = function($aKeyLength, $aLanguage)
	{
		log('Key length: ' + $aKeyLength, true);
		log('Language: ' + $aLanguage, true);

		$(document).trigger('FriedmanEnded', [ $aKeyLength, $aLanguage ]);
	}


	init();
}