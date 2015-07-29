$(document).ready(function(){
	$('#decipher').click(function(){
		$solve = new Decipher();
	});
});


function Decipher() 
{
	var MINLENGTH = 3,
		MAXLENGTH = 12,
		$mCipher,
		$mKeyLength;

	var init = function() 
	{
		$('#log').html('');

		$mCipher = normalize( $('#ciphertext').val() );

		defineStepsByEvents();

		startDeciphering();
	};


	var defineStepsByEvents = function() 
	{
		$(document).off('KasiskiEnded').on('KasiskiEnded', function($aEvent, $aKeyLenghts){
			log('Finished step 1', true);
			confirmKeyLengthFriedman($mCipher, $aKeyLenghts);
		});

		$(document).off('FriedmanEnded').on('FriedmanEnded', function($aEvent, $aKeyLength){
			log('Finished step 2', true);
			console.log('all done (for now)');
		});
	};


	var startDeciphering = function()
	{
		log('Starting to decipher'); 
		defineKeyLengthKasiski($mCipher, MINLENGTH, MAXLENGTH);
	};


	init();
}


/* I still have the feeling I'm doing something horribly wrong */
var fragmentedFor = function($aFragmentLength, $aTotal, $aFunction, $aCallback) 
{
	var $lStart = 0; 
	var getTotal = function()
	{
		return (typeof($aTotal) === 'function') ? $aTotal() : $aTotal;
	};
	getTotal(); // @TODO: find out why forLoop() bugs out if I don't launch getTotal() here first

	// simulate a for loop, but in fragments to prevent the browser from freezing
	(function forLoop ($aStart)
	{
		// run x loops at a time
		var $lEnd = $lStart + $aFragmentLength;

		for(var $i = $lStart; $i < Math.min($lEnd, getTotal()); $i++) {
			$aFunction( $i );
		}

		$lStart += $aFragmentLength;

		if($lStart < getTotal()) {
			setTimeout(forLoop, 1);
		} else { 
			$aCallback();
		}
	})();
};


// shell function to run an asynchronous for-loop, to make sure fragmentedFor does not run ahead of itself when nested
function fragmentedForAsync($aFrom, $aTo, $aFunction, $aCallback) {
    (function loop() {
        if ($aFrom < $aTo)
            $aFunction($aFrom++, loop); // pass itself as callback
        else
            $aCallback();
    })();
}


/*** Generic functions ***/

var log = function($aOutput, $aNewLine) 
{
	var $lOutput = ( ($aNewLine) ? "\r\n" : '') + $aOutput;
	$('#log').append($lOutput).delay(1);
	scrollDownLog();
};


var output = function($aText)
{
	$('#plaintext').html($aText);
};

var normalize = function($aText)
{
	$lText = $aText.toLowerCase();
	$lText = $lText.replace(/[^a-z]/gi, '');

	return $lText;
};

var scrollDownLog = function($aEvent)
{
	$lElm = $('#log');
	$lElm.scrollTop( $lElm.prop("scrollHeight") - $lElm.height() );
};


function objectToArray($aObject) 
{
	var $lArray = [];
	$.each($aObject, function($lKey, $lVal){
		if(parseInt($lKey) == $lKey) 
			$lKey = parseInt($lKey);

		$lArray.push([$lKey, $lVal]);
	});
	return $lArray;
}


function arrayToObject($aArray) 
{
	var $lObject = {};
	$.each($aArray, function($lKey, $lVal){
		$lObject[$lVal[0]] = $lVal[1];
	});
	return $lObject;
}


var sortObjectByValue = function($aObject, $aSortDesc)
{
	var $lSortDesc = !!$aSortDesc;
	var $lArray = [];

	$.each($aObject, function($lKey, $lVal){
	    $lArray.push([$lKey, $lVal]);
	});

	$lArray.sort(function(a, b) {
		return ($lSortDesc) ? b[1] - a[1] : a[1] - b[1];
	});

	return $lArray;
};
