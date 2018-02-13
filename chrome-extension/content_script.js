/**
* @functionName ContentScript
*
* @functionOverview
*   
* 
* 
*
* @param 
* @api none
*/

var createScriptTag = function(url, callback) {
    if (!callback) callback = function() {};
    var addScript = document.createElement('script');
    addScript.type = "text/javascript";
    addScript.onload = callback;
    addScript.src = url;
    document.body.appendChild(addScript);
};

var createScriptWithCode = function(code) {
	var s = document.createElement('script');
	s.type = 'text/javascript';
	try {
		s.appendChild(document.createTextNode(code));
		document.body.appendChild(s);
	} catch (e) {
		s.text = code;
		document.body.appendChild(s);
	}
}


var assistantURL = "//10.10.3.143:4443/js/assistant.js"

var code = 'var API_ACCESS_TOKEN = "2bd3aba284d343a4823687d989bef5a6";var assistantOptions = {"cssDirUrl" : "//10.10.3.143:4443/css/",' +
	'"jsDirUrl" : "//10.10.3.143:4443/js/", "imageDirUrl" : "//10.10.3.143:4443/images/" };';

createScriptWithCode(code);
createScriptTag(assistantURL);

