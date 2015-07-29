function defineKeyLengthKasiski($aCipher, $aMinLength, $aMaxLength)
{
	var	$mTempCipher,
		$mAmountOfLengths,
		$mMinLength,
		$mRecurringStrings,
		$mCurrentStringLength;


	var init = function() 
	{
		log('Step 1: Define key length using Kasiski method', true);

		$mRecurringStrings = [];
		$mTempCipher       = $aCipher;
		$mMinLength        = $aMinLength;
		$mAmountOfLengths  = $aMaxLength - $mMinLength;

// temp 
// var $lKeyLengths = guessKeyLength([582,1026,297,297,213,1431,63,99,351,174,318,183,582,180,438,213,81,1458,420,384,273,363,126,1131,102,1602,702,534,198,300,243,75,291,669,132,117,516,1059,126,1434,717,330,522,225,1314,204,138,591,246,399,138,120,642,66,132,378,48,105]);
// exitEvent($lKeyLengths);
// return;

		fragmentedForAsync(0, $mAmountOfLengths, runInLoops, onLoopsEnd);
	}


	var runInLoops = function($aCount, $aNextLoop)
	{
		$lCurrentStringLength = $aMaxLength - $aCount;

		findRecurringString($lCurrentStringLength, function($aRecurring){
			$mRecurringStrings = $mRecurringStrings.concat($aRecurring);
			$aNextLoop();
		});
	}


	var findRecurringString = function($aLength, $aCallback)
	{
		log('Finding recurring strings of length ' + $aLength, true)

		$mCurrentStringLength = $aLength;
		var $lCallback = $aCallback;		
		var $lRecurring = [];

		// run through the total ciphertext checking for recurring strings of $aLength length
		// in batches of 10 loops at a time to prevent the browser from freezing
		fragmentedFor(
			10,
			charsLeft, //total runs (as a callback function to stay dynamic, it might change)
			function($aPos) // function to run each loop
			{
				var $lString = $mTempCipher.substr($aPos, $mCurrentStringLength);
				$lRecurring = addRecurring($lString, $lRecurring);
				log('.');
			}, 
			function() // callback after the total amount of loops have been run
			{ 
				$lCallback($lRecurring);
			}
		);
	}


	var addRecurring = function($aString, $aRecurring)
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
			log($aString + " occurs " + $lCount + " time(s)", true);
		}

		return $aRecurring;
	}


	var	onLoopsEnd = function()
	{
		if($mRecurringStrings.length > 0)
			log("Recurring strings:" + $mRecurringStrings , true);
		else {
			log('No recurring strings found :(. Either the key is too long or the ciphertext is too short to break the code.', true);
			return false;
		}

		log('Distances between recurring strings: ', true);
		var $lDistances = [];

		// determine distance between each instance of the recurring strings
		$.each($mRecurringStrings, function($lKey, $lVal){
			$lDistances = $lDistances.concat( getDistanceBetweenStrings($lVal) );
		});
		log($lDistances);

		var $lKeyLengths = guessKeyLength($lDistances); 
		exitEvent($lKeyLengths);
	}


	var charsLeft = function()
	{
		return $mTempCipher.length - $mCurrentStringLength;
	}


	var getDistanceBetweenStrings = function($aString) 
	{
		var $lDistances = [],
			$lSplit = $aCipher.split($aString);

		for (var $i = 1; $i < $lSplit.length - 1; $i++) {
			$lDist = $lSplit[$i].length + $aString.length;
			$lDistances.push($lDist);
		} 

		return $lDistances;
	}


	var guessKeyLength = function($aDistances)
	{
		console.log($aDistances);
		var $lUniqueDistances = [];

		$.each($aDistances, function(i, el){
		    if($.inArray(el, $lUniqueDistances) === -1) $lUniqueDistances.push(el);
		});

		var $lGCDs = []; // "Greatest Common Denominator"

		for(var $i = 0; $i < $lUniqueDistances.length - 1; $i++) {
			$lGCDs.push( getEuclideanGCD($lUniqueDistances[$i], $lUniqueDistances[$i + 1]) );
		}

		var $lCountGCDs = countOccurrences($lGCDs),
			$lMostProbable = sortObjectByValue($lCountGCDs, true),
			$lGuess = [];

		$.each($lMostProbable, function($lKey, $lVal){
			$lGuess.push( parseInt($lVal[0]) );
			if($lGuess.length > 2) return false;
		});

		return $lGuess;

	}

	var getEuclideanGCD = function($aNum1, $aNum2) 
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


	var countOccurrences = function($aGCDs) 
	{
		var $lCounter = {};

		$.each($aGCDs, function($lKey, $lVal) {
			$lCounter[$lVal] = ($lCounter[$lVal] || 0) + 1;
		});

		return $lCounter;
	}


	var exitEvent = function($aKeyLengths)
	{
		log('Most probable key lengths: ', true);
		log($aKeyLengths);

		$(document).trigger('KasiskiEnded', [ $aKeyLengths ]);
	}


	init();
}