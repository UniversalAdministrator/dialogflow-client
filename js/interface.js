/**
 * @description Functions Related to bring Abby Avatar in the screen.Script tag's Query Parameters and their values:
 * 1.autoPlay - true/false. Default false.
 * 2.preLoad - true/false. Default false.
 * 3.autoStartAbby - Auto start abby after loading page. Values true/false. Default false.
 * 4.autoStartAbbyTimer - value in seconds. Default 30sec.
 * 5.positionType - abby position type relative or absolute to the screen. Default relative position
 * 6.width - Default 300.
 * 7.baseURL - Abby's base url.
 * 8.alignTextboxandMicwithVideo - Need to align Text box with video
 * 9.useAdvancedAbbyNLP - true/false. 
 * 10.nlpUrl - Url for nlp interaction.
 * 11.videoDirectoryUrl - Url for the directory where videos are present.
 * 12.company_id - Company id
 * 13.campaign_id - Capaign id
 * 14.abbyTheme - Theme name to be used. Default theme-1.css
 * 15.abbyBgColors - Background colors to be used. Default colorset-1.css
 * 16.userID - Logged in User ID.
 * 17.positionX - X position of the abby window. Default 100 (right side of the screen)
 * 18.positionY - Y position of the abby window. Default 100 (bottom of the screen)
 * 19.introQuestion - Introduction Question text. Default empty string
 * 20.hideonMobile - Show abby in mobile devices. Value true/false. Default false
 * 21.useItneractionParms - true/false
 * 22.cssDirectoryUrl - Url for the directory where CSS files are present. Default css/
 * 23.jsDirectoryUrl - Url for the directory where JS are present. Default js/
 * 24.imageDirectoryUrl - Url for the directory where Images are present. Default images/
 * 25.minimizeAfterResponse - Minimize Timer, abby will be minimized after playing answer video
 *
 * @function {Window Object's function}
 * @name onload 
 */

if(typeof ENV != "undefined" && ENV == "dev") {
	window.abbyStartup = function () {};
}

(function () {

	if(window.abbyStartup) {
		window.abbyStartup = abbyStartup;
	}
	//------------------------------------------------------------------------------------------------------------------------
	// Load Abby chat panel on Window load
	//------------------------------------------------------------------------------------------------------------------------

	function addEvent(element, eventName, fn) {
		if (element.addEventListener)
			element.addEventListener(eventName, fn, false);
		else if (element.attachEvent)
			element.attachEvent('on' + eventName, fn);
	}

	var abbyChatWindow;
	// Prevent overwrite of the window.load function
	addEvent(window, 'load', function () {
		abbyChatWindow = new abbyStartup();
	});

	

	//------------------------------------------------------------------------------------------------------------------------
	//
	//	Abby IVA Functionality. Requires jQuery library
	//
	//------------------------------------------------------------------------------------------------------------------------
	
function abbyStartup() {
	// Local variables
	var needAutoPlay = "";
	var autoStartAbby = false;
	var AbbyInterval;
	var timeInterval = 30000;
	var abbyPosition = "right";
	var isTop = false;
	var isCenter = false;
	var abbyWidth = "300px";
	var abbyHeight = "400px";
	var alignTextboxandMicwithVideo = true;
	var isAdvancedabby = true;
	var imageDirectoryUrl;
	var baseURL;
	var interactionId = null;
	var abbyTheme = "theme-1";
	var hideonMobile = false;
	var imageDirectory = "images";
	var cssDirectoryUrl = "css";
	var jsDirectoryUrl = "js";
	var useItneractionParms = "";
	var introQuestion = "";
	var abbyBgColors = "colorset-1";
	var userID = null;
	var abbyMinimizedFlag = false;

	// mandatory fields
	var company_id;
	var campaign_id;
	var nlpUrl;
	var videoDirectoryUrl;

	// Default - Right Bottom Corner
	var positionType = "relative";
	var positionX = 100;
	var positionY = 100;

	var minimizeAfterResponse = null;
	var minimizeAfterResponseTimer = null;

	var localRedirectUrls = {};
	var userQuery = '';
	var IDLE_VIDEO = 'SSP_Idle';
	// var avatar;

	var abbyWelcomeBackVideos = ["Abby_Intro2_Return", "Abby_Intro3_Return", "Abby_Intro4_Return"];
	var abbyUserIdSelector = "ctl00_hdnAbbyUserId";

	var console = { log : function() {} };
	abbyIVALogSettings = { 
		log : true,
		stacktrace : false
	};

	var selectors = {};
	var elements = {};

	// Customer answer text Versions
	var USER_ANSWER = {
				YES : ["yes", "yea", "yep", "yup", "sure", "affirmative", "i do", "yes i do", "yea i do", "yep i do", "yup i do"],
				NO : ["no", "nah", "nuh uh", "nope", "negative", "nada", "no i don’t", "no i do not", "i don’t", "i do not"],
				OPERATOR : ["operator", "agent", "rep", "representative", "technical assistance", "tech support", "human"]
			};

	var QUESTION_CODES = [
		"SSP_Intro",
		"SSP_Email",
		"SSP_Success",
		"SSP_Transfer",
		"SSP_NA1"
	];

	var PASSWD_RESET_FLOW_QUESTIONS = ["SSP_Intro", "SSP_Email"];
	var DID_NOT_UNDERSTAND_QUESTIONS = ["SSP_NA1"];

	var PASSWD_RESET_FLOW = {
		"SSP_Intro" : {
					yes : 1,
					no : 3
				},
		"SSP_Email" : {
						yes : 2,
						no : 3
					},
		"operator" : {
					yes : 3
				},
		"SSP_Success" : {
			caption : "Reset Your Password"			
		},
		"SSP_Transfer" : {
			caption : "Live Chat Now"
		}
	};

	/**
	 * @description Function used to bring Abby in the page where Abby's script tag is placed.
	 * @function
	 * @name executeAbby
	 */

	var executeAbby = function () {
		//Finding whether the operating device is mobile or not
		var mobile = (/Android|iPhone|iPad|iPod|BlackBerry|Windows Phone/i).test(navigator.userAgent || navigator.vendor || window.opera);
		var isAndroid = navigator.userAgent.toLowerCase().indexOf("android") > -1;
		//Finding wheter the brower is Chrome or not
		var isChrome = navigator.userAgent.toLowerCase().indexOf('chrome') > -1;
		var Opera = (navigator.userAgent.match(/Opera|OPR\//) ? true : false);
		var Edge = '-ms-scroll-limit' in document.documentElement.style && '-ms-ime-align' in document.documentElement.style && !window.navigator.msPointerEnabled;

		//Setting the video directory url
		var videoDirectory = videoDirectoryUrl + "/";

		//Setting the image Directory url
		imageDirectory = (imageDirectoryUrl ? imageDirectoryUrl : imageDirectory) + "/";

		//Setting the poster value based on the device
		var posterValue;
		if (mobile || isAndroid)
			posterValue = imageDirectory + "mobile_still_abby.png";
		else
			posterValue = imageDirectory + "still_abby.png";

		var minimizeIcon = imageDirectory + "minimize.png";

		//Setting the mic button image based on Chrome browser
		var micBtn;
		if (isChrome)
			micBtn = imageDirectory + 'mic.gif';
		else
			micBtn = imageDirectory + 'send.png';

		//Appending Abby Contents into the Document
		//PARENT DIV - NEED HELP - Minimized Abby
		var abbychatHelp = $('<div class="abby chatHelp">' +
							'<div class="chatHelpspan text-center" id="chatHelpbutton">' +
							'Password Reset Help</div></div>');

		//END PARENT DIV - NEED HELP

		//PARENT DIV - Abby - Maximized Abby
		var AbbyContainerbox = $('<div></div>').addClass('AbbyContainer box');

		var container_div = $('<div></div>').addClass('container_div')
        	.append('<div class="chatHelpContainer"><div class="chatHelpspan" id="abbyMinimize">' +
                '<span>Password Reset Help</span>' +
                '<button type="button" id="chatHelpbutton2" class="minimizeButton">-</button></div></div></div>');

        AbbyContainerbox.append(container_div);

		//start avatar divs
		avatar = $('<div class="avatar"></div>');
		container_div.append(avatar);

		var avatar_container = $('<div class="avatar-container"></div>');
		avatar.append(avatar_container);

		var avatar_inner = $('<div class="avatar-inner"></div>');
		avatar_container.append(avatar_inner);

		var avatar_video = $('<div></div>').addClass('avatar-video')
			.append('<video class="video-player" ' + needAutoPlay + ' poster="' + posterValue +
			'"><source id="mp4src" src="' + videoDirectory + 'SSP_Idle.mp4" type="video/mp4"><source id="ogvsrc" src="' + videoDirectory +
			'SSP_Idle.ogv" type="video/ogg"><source id="webmsrc" src="' + videoDirectory +
			'SSP_Idle.webm" type="video/webm">Your browser does not support the video tag</video>');
		avatar_inner.append(avatar_video);

		// Video Poster
		avatar_video.append('<div class="poster" style="display: none; background-image: url(' + posterValue + ');"></div>');

		avatar_video.append('<img class="replay-answer hidden" src="' + imageDirectory + 'replay.png" title="replay last answer"/>')

		var slidingContainer = $('<div class="slidingContainer"></div>');
		avatar_video.append(slidingContainer);

		// sideMenu for Answered Questions
		avatar_video.append('<div class="sideMenu" style="display: none;">Link</div>');

		var cc = $('<div class="cc" style="display: none;"><img class="cc-close" id="cc_close" src="' + imageDirectory + 'gfx-icon-close.png" width="16" height="16">'+
    				'<div class="cc-content"></div></div>');
		avatar_video.append(cc);

		var controls = $('<div class="controls" style="display: block;"><img id="slider" style="display: none;" class="cc-icon" src="' + imageDirectory + 
			'navicon.png" width="30" height="23"><img id="ccButton" class="cc-icon" src="' + imageDirectory + 
			'gfx-cc.png" width="30" height="23"></div>');
		avatar_video.append(controls);

		var avatar_form_set = $('<div class="avatar-form-set">' +
					'<div></div><div class="inputContainer" style="position: relative;">' +
					'<div class="textBoxContainer">' +
					'<input type="text" class="rounded" placeholder="How can I help?" id="questionText">' +
					'</div><div class="ask-button-wrapper">' +
					'<div id="askBtn" class="button-outer">' +
					'<button class="inner-btn">' +
					'<span class="avatar-no-microphone mic"></span><img src="' + micBtn + '"></img></button>' +
					'</div><div class="clear"></div></div></div>');

		avatar_inner.append(avatar_form_set);

		var avatarSlidePanel = '<div class="avatar-slide-panel"></div>';
		avatar_form_set.append(avatarSlidePanel);

		var metaTagForSafari = $('<meta name="viewport" content="initial-scale=1.0, maximum-scale=1.0, user-scalable=no, width=device-width">');
		$("head").append(metaTagForSafari);

		// END PARENT - Abbycontainer
		
		//------------------------------------------------------------------------------------------------------------------------
		// 
		// Add Abby Window to the Body of the page
		// 
		//------------------------------------------------------------------------------------------------------------------------

		if (mobile) {
			if (!hideonMobile) {
				$('body').append(abbychatHelp).append(AbbyContainerbox);
			}
		} else {
			$('body').append(abbychatHelp).append(AbbyContainerbox);
		}

		// Adding Place holders for Missed Questions and Answers
		slidingContainer.html('<div id="flip_content" class="shadow"><div class="front face question-list"><div class="slide-content"></div>' +
			'</div><div class="back face center answer-container"><div class="answer-text">Changing Answer</div><div class="btn-container"></div></div></div></div>');

		$(".question-list").append('<img class="close" id="sliding_container_close" src="' + imageDirectory + 'gfx-icon-close.png" width="16" height="16">');

		$(".btn-container", slidingContainer).append('<button class="btn back-btn">Close</button>').append('<button class="btn print-btn">Print</button>');



		selectors = {
			'questionText' : '#questionText',
			'AbbyContainer' : '.AbbyContainer',
			'slidingContainer' : slidingContainer,
			'questionList' : '.question-list',
			'slideContent' : '.slide-content',
			'replayAnswer' : '.replay-answer',
			'askBtn'	: '#askBtn',
			'avatarSlidePanel' : '.avatar-slide-panel'
		};

		for(var sel in selectors) {
			elements[sel] = $(selectors[sel]);
		}


		//------------------------------------------------------------------------------------------------------------------------
		//
		// AJAX Functions for calling APIs. Common Functions for AJAX Calls.
		//
		//------------------------------------------------------------------------------------------------------------------------
		
		var ajaxFunctions = (function () {
			var serverURL = baseURL;
			$.support.cors = true;
			return {
				apiQueue: {},
				submitObjectToServer: function (url, object, callback, errorCallback) {
					if (isAdvancedabby) {
						var url = nlpUrl + "?responseIndex=-1&useItneractionParms=" + useItneractionParms + "&requestType=interview&question=" +
							object.questionText + "&interaction_id=" + interactionId + "&cmn_id=" + object.oldAbbyNlpCmnId + "&c_id=" +
							object.oldAbbyNlpCId + "&nl_id=" + object.nl_id + "&category=" + object.category + "&subCategory=" +
							object.subCategory + "&user_id=" + interactionId + (userQuery ? userQuery : "");

						var req = {};
						req.type = "GET";
						req.url = url;

						req.callback = callback;
						req.errorCallback = errorCallback;
						ajaxFunctions.callAPI(req);
					} else {
						var nlpURL = nlpUrl;
						if (typeof url != 'undefined' && url != '' && url != 'webFlow/nlp/ask') {
							var url = serverURL + "/" + url;
						} else if (typeof url != 'undefined' && url != '' && url == 'webFlow/nlp/ask') {
							var url = nlpURL + "/" + url;
						} else {
							return null;
						}
						var headers = {
							"Accept": "application/json",
							"Content-Type": "application/json"
						};

						var req = {};
						req.type = "POST";
						req.url = url;

						req.headers = headers;
						req.data = JSON.stringify(object);
						req.callback = callback;
						req.errorCallback = errorCallback;
						ajaxFunctions.callAPI(req);
					}

				},
				getInteractionUrl: function () {
					// Check do we have interaction ID in cookie. Otherwise call API
					var intId = getCookie("interactionId");
					if (intId != null) {
						interactionId = intId;
						return;
					}
					var url = nlpUrl + "?requestType=createInteraction&cmn_id=" + avatar.oldAbbyNlpCmnId + "&c_id=" + avatar.oldAbbyNlpCId

					var req = {};
					req.type = "GET";
					req.url = url;

					req.callback = function (data) {
						interactionId = $(data).find('interaction_id').text();
						// Store the interaction ID in the cookie
						createCookie("interactionId", interactionId);
					};
					req.errorCallback = function (xhr) {
						console.log("Interaction API Error");
						// setTimeout(function() {
						// 	ajaxFunctions.getInteractionUrl(); // On API failure retry to get Interaction ID
						// }, 100);
					};
					ajaxFunctions.callAPI(req);
				},
				getObjectFromServer: function (url, params, callback, errorCallback, dataTypeOverride) {
					var dataType = "json";
					if (dataTypeOverride != null && dataTypeOverride != undefined) {
						dataType = dataTypeOverride;
					}
					if (typeof url != 'undefined' && url != '') {
						if (typeof params != 'undefined' && params != '' && !jQuery.isEmptyObject(params)) {
							var i = 0;
							for (var prop in params) {
								if (i == 0) {
									url += "?" + prop + "=" + params[prop];
								} else {
									url += "&" + prop + "=" + params[prop];
								}
								i++;
							};
						};
					} else {
						return null;
					}

					var req = {};
					req.type = "GET";
					req.url = baseURL + "/" + url;

					req.dataType = dataType;

					req.callback = callback;
					req.errorCallback = errorCallback;
					ajaxFunctions.callAPI(req);
				},
				displayError: function (xhr) {
					console.log("status code = " + xhr.status);
					console.log("status text = " + xhr.statusText);
				},
				callAPI: (function () {
					if (window.XDomainRequest) {
						return function (reqObject) {

							var protocol = window.location.protocol;
							if (!protocol)
								protocol = "https:";
							if (reqObject.url.indexOf(protocol) == -1) {
								console.log("Abort request : " + reqObject.url);
								return;
							}
							// AJAX call for IE9
							// Use Microsoft XDR
							var xdr = new XDomainRequest();
							xdr.timeout = 0;

							xdr.onload = function () {
								var data = null;
								try {
									data = $.parseJSON(xdr.responseText);
								} catch (e) {
									data = xdr.responseText;
								}
								reqObject.callback(data);
							};

							// else if (window.XMLHttpRequest)
							// xmlhttp=new XMLHttpRequest();

							xdr.onerror = function () {
								console.log("API request error : " + reqObject.url);
								console.log(xdr.responseText);
								reqObject.errorCallback(xdr.responseText);
							}
							xdr.ontimeout = function () {
								console.log("API request timeout : " + reqObject.url);
							};
							// this also needs to be set
							xdr.onprogress = function () {
								console.log("API request in progress : " + reqObject.url);
							};

							xdr.open(reqObject.type, reqObject.url, true);

							setTimeout(function () {
								if (reqObject.data) {
									xdr.send(reqObject.data);
								} else {
									xdr.send();
								}
							}, 1000);
						};
					} else {
						return function (reqObject) {
							// AJAX call for FF, chrome
							$.ajax({
									type: reqObject.type,
									url: reqObject.url,
									crossDomain: true,
									beforeSend: function (xhr) {
										// Set Reuqest header
										if (reqObject.headers)
											for (var headerName in reqObject.headers)
												xhr.setRequestHeader(headerName, reqObject.headers[headerName]);

										if (reqObject.dataType)
											xhr.setRequestHeader("Accept", reqObject.dataType);
									}
								})
								.done(function (data) {
									if (reqObject.callback) {
										try {
											data = $.parseJSON(data);
										} catch (e) {}
										reqObject.callback(data, function () {});
									}
								})
								.fail(function (xhr) {
									ajaxFunctions.displayError(xhr);
									if (reqObject.errorCallback) {
										reqObject.errorCallback(xhr, function () {});
									}
								});
						};
					}
				})()
			};
		})();

		//------------------------------------------------------------------------------------------------------------------------
		//
		// END AJAX Functions
		//
		//------------------------------------------------------------------------------------------------------------------------

		//Avatar action related function
		avatar = (function () {
			var recognition;
			var inputSpeechText = '';
			var microphoneAllowed = true;
			var microphoneQuestion = false;

			try {
				recognition = new webkitSpeechRecognition();
			} catch (e) {
				recognition = {};
				microphoneAllowed = false;
				recognition.start = function () {
					console.log("This browser does not support accessing the microphone.");
					//alert("This browser does not support accessing the microphone.");
				};
			}

			if (microphoneAllowed) {
				$(".avatar-form-set .mic").removeClass("avatar-no-microphone");
				$(".avatar-form-set .mic").addClass("avatar-microphone");
			} else {
				$(".avatar-form-set .button-outer img").addClass("send");
			}

			recognition.continuous = false;
			recognition.interimResults = false;

			recognition.onresult = function (event) {
				if (event.results.length > 0) {
					inputSpeechText += event.results[0][0].transcript;
					console.log("Speech Detected Text : " + inputSpeechText);
				}
			};

			recognition.onend = function (event) {
				$(".avatar-form-set .inner-btn").removeClass("recognizing");
				$(".avatar-form-set").addClass("recognition-onend");
				$(".avatar-form-set").removeClass("recognition-onstart");

				if (inputSpeechText != '') {
					avatar.clearOTB = false;
					microphoneQuestion = true;
					elements.questionText.val(inputSpeechText);
					elements.askBtn.triggerHandler("click");
				} else {
					$(".avatar-form-set .mic").removeClass("started");
					$(".video-player").get(0).play();
				}

				inputSpeechText = '';
			};

			recognition.onstart = function (event) {
				// Clear auto minimize timer, if the user is using speech recognizer
				// clearTimeout(minimizeAfterResponseTimer);

				//$('.button-outer div').css("width",$('.set-mic-image').width());
				//$('.button-outer div').css("height",$('.set-mic-image').height());
				$(".avatar-form-set").removeClass("recognition-onend");
				$(".avatar-form-set").addClass("recognition-onstart");

				if (!avatar.idle) {
					$(".video-player").get(0).pause();
				}
			};

			return {
				videoContainer: ".video-player",
				poster: ".poster",
				posterImageFile: mobile ? imageDirectory + "mobile_still_abby.jpg" : imageDirectory + "still_abby.jpg",
				questionInput: elements.questionText,
				videoAdded: false,
				idle: false,
				videoCurr: "",
				microphone: ".mic",
				clearOTB: true,
				mediaDirectory: videoDirectory,
				oldAbbyNlpCmnId: company_id,
				oldAbbyNlpCId: campaign_id,
				nl_id: "",
				category: "",
				subCategory: "",
				askedQuestion : false,
				lastQuestion : "",

				clickCCButton: function () {
					$('.avatar-video .controls').fadeOut();
					$('.avatar-video .cc').fadeIn();
				},

				clickCloseCCButton: function () {
					$('.avatar-video .controls').fadeIn();
					$('.avatar-video .cc').fadeOut();
				},
				clickCloseSlidingContainerButton: function (showSideMenuFlag) {
					avatar.toggleFAQ(); // Show slide Sliding window
					if (showSideMenuFlag == true)
						avatar.showSideMenu();
				},
				showSideMenu: function () {
					var sideMenu = $(".sideMenu");
					if (abbyPosition == 'left')
						sideMenu.css({
							"left": elements.AbbyContainer.width() + 3 - (sideMenu.width() / 2),
							"right": ""
						}).addClass("right").removeClass("left");
					else
						sideMenu.css({
							"right": elements.AbbyContainer.width() + 3 - (sideMenu.width() / 2),
							"left": ""
						}).addClass("left").removeClass("right");

					sideMenu.show();
				},
				hideSideMenu: function () {
					$(".sideMenu").hide();
				},
				showChat: function () {
					createCookie("AbbyMaximized", "true");
					$('.chatHelp').hide();
					elements.AbbyContainer.show();
					//					if(needAutoPlay == "autoplay='true'")
					//					{
					//						if(mobile || isAndroid)
					//						{
					//							avatar.avatarClickEvent();
					//						}
					//					}
					elements.questionText.val("");
					avatar.avatarClickEvent();

					if (introQuestion) {
						//ask the intro question and wipe it
						elements.questionText.val(introQuestion);
						elements.askBtn.click();
					}
				},
				hideChat: function () {
					createCookie("AbbyMaximized", "false");
					$('.chatHelp').show();
					elements.AbbyContainer.hide();
					try {
						$($videoContainer).get(0).pause();
					} catch (err) {

					}

				},
				toggleFAQ: function (showFlag) {
					// Toggle sliding window
					var slidingPanel = elements.slidingContainer;
					if (abbyPosition == 'left')
						slidingPanel.css({
							"left": elements.AbbyContainer.width(),
							"right": ""
						}).addClass("right").removeClass("left");
					else
						slidingPanel.css({
							"right": elements.AbbyContainer.width(),
							"left": ""
						}).addClass("left").removeClass("right");

					// https://api.jqueryui.com/slide-effect/

					if (showFlag == true) {
						if (slidingPanel.css("display") == "none")
							showFlag = null;
					} else {
						if (slidingPanel.css("display") != "none")
							showFlag = null;
					}

					if (showFlag == null)
						slidingPanel.toggle("slide", {
							direction: abbyPosition
						});
				},
				toggleSlidePanel: function (showFlag) {
					// Toggle sliding window
					var slidingPanel = elements.avatarSlidePanel;
					if (abbyPosition == 'left')
						slidingPanel.css({
							"left": elements.AbbyContainer.width(),
							"right": ""
						}).addClass("right").removeClass("left");
					else
						slidingPanel.css({
							"right": elements.AbbyContainer.width(),
							"left": ""
						}).addClass("left").removeClass("right");

					// https://api.jqueryui.com/slide-effect/

					if (showFlag == true) {
						if (slidingPanel.css("display") == "none")
							showFlag = null;
					} else {
						if (slidingPanel.css("display") != "none")
							showFlag = null;
					}

					if (showFlag == null)
						slidingPanel.toggle("slide", {
							direction: abbyPosition
						});
				},
				playVideo: function (videoContainer, videoUrl) {
					// Play the specified video in the specified video container
					$(videoContainer).unbind('ended');
					avatar.updateVideoPlayer({
						videoFile: videoUrl
					});
				},
				createListOfAnsweredQuestions: function (questionList) {
					// Add the list of questions to the sliding container

					var ql = $("<ul></ul>");
					$(".question-list").append(ql);

					for (var i = 0; i < questionList.length; i++)
						ql.append("<li data-id='" + questionList[i].id + "'>" + questionList[i].question_text + "</li>");
				},
				showQuestionList: function () {
					// In sliding container, show the question list when clicking on back button
					$(".question-list [data-clicked]").remove(); // Remove already clicked question
					$("#flip_content").removeClass("flip-animation");
					var hideDelay = $.support.cssProperty("transition") == true ? 650 : 0;
					setTimeout(function () {
						$("#flip_content .question-list").removeClass('hidden');
					}, hideDelay);
					setTimeout(function () {
						$("#flip_content .answer-text").empty(); // Clear answer text
					}, 1000);

					var questionCount = $(".question-list li").length;
					if (questionCount < 1) {
						// If all the questions are viewed by user, auto close the sliding container
						avatar.clickCloseSlidingContainerButton();
					}
				},
				showFlipcontentAnswer: function () {
					// Show answer for the selected question in sliding container with animation
					$("#flip_content").addClass("flip-animation");
					setTimeout(function () {
						$("#flip_content .question-list").addClass('hidden');
					}, 800);
				},
				printContent: function (elementCSSSelector) {
					// Open a popup window and show print preview of the seleted element
					var data = $(elementCSSSelector).html();
					var mywindow = window.open('', 'Title', 'height=600, width=800');
					mywindow.document.write('<html><head><title>my div</title>');
					/*optional stylesheet*/ //mywindow.document.write('<link rel="stylesheet" href="main.css" type="text/css" />');
					mywindow.document.write('</head><body >');
					mywindow.document.write(data);
					mywindow.document.write('</body></html>');

					mywindow.document.close(); // necessary for IE >= 10
					mywindow.focus(); // necessary for IE >= 10

					mywindow.print();
					mywindow.close();

					return true;
				},
				addIdle: function ($videoContainer) {
					$($videoContainer).unbind('ended');
					avatar.updateVideoPlayer({
						videoFile: IDLE_VIDEO
					});
				},
				addReplay: function ($videoContainer) {
					$($videoContainer).unbind('pause');
				},
				updateVideoPlayer: function (args, prompt, localArgs) {

					if (args['redirectUrl'] != null) {
						var l_url = args['redirectUrl'];
						delete args['redirectUrl'];
						// Set flag in cookie to play the answer video on redirected page load
						// Set 1 minute expiry for cookie
						createCookie("pageRedirected", "true", 1);
						createCookie("lastAskedQuestion", JSON.stringify(args), 1);
						// Redirect the page If we have redirect URL
						window.location.href = l_url;

						return;
					}

					if ($(".avatar-form-set .mic").hasClass("started")) {
						return;
					}
					var $videoFile = args.videoFile;

					$videoContainer = args.videoContainer ? args.videoContainer : avatar.videoContainer;

					var $poster = args.poster ? args.poster : avatar.poster;

					if (localArgs) {
						if (localArgs.videoFile) {
							$videoFile = localArgs.videoFile;
						}
						if (localArgs.videoContainer) {
							$videoContainer = localArgs.videoContainer;
						}
						if (localArgs.poster) {
							$poster = localArgs.poster;
						}
					}

					if (avatar.videoAdded && avatar.idle == false) {
						$($videoContainer).get(0).pause();
					}

					if (args[$videoFile + "_text"]) {
						$('.avatar-video .cc-content').html(args[$videoFile + "_text"]);
						var flipAns = $("#flip_content .answer-text");
						var questionCount = $(".question-list [data-clicked]").length;

						if (args['answer_text'] != null) {

							var l_obj = PASSWD_RESET_FLOW[avatar.systemQuestion] || {};

							var linktag = "<span class='link-tag'><a class='margin-5' href='" + args.answer_text + "'>" + (l_obj.caption ? l_obj.caption : args.answer_text) + "</a></span>";

							elements.avatarSlidePanel.html(linktag);
							avatar.toggleSlidePanel(true);
						} else {
							flipAns.html(args[$videoFile + "_text"]); // Set cc text in sliding container
							// If questions avalilable, show answer panel
							if (questionCount > 0)
								avatar.showFlipcontentAnswer(); // Flip animation in sliding container
						}
					}

					$($poster)
						.fadeIn(
							250,
							function () {
								var videoTag = $($videoContainer);
								if ($videoFile == IDLE_VIDEO) {
									avatar.idle = true;
									videoTag.attr("loop", "loop");
								} else {
									avatar.idle = false;
									avatar.videoPrev = $videoFile;
									videoTag.removeAttr("loop");
								}
								avatar.videoCurr = $videoFile;
								var video = avatar.videoCurr;
								console.log("Playing Video : " + video);
								// Change the src url of the source tag
								var videoSrc = avatar.mediaDirectory + video;
								$("#mp4src", videoTag).attr("src", videoSrc + ".mp4");
								$("#ogvsrc", videoTag).attr("src", videoSrc + ".ogv");
								$("#webmsrc", videoTag).attr("src", videoSrc + ".webm");

								videoTag.load();
								avatar.videoAdded = true;

								$($videoContainer).bind(
									'canplay',
									function (e) {
										avatar.hideLoader($videoContainer,
											$poster);
										$($videoContainer)
											.unbind('canplay');
									});
							});
				},

				hideLoader: function ($videoContainer, $poster) {
					$($videoContainer).unbind('ended');
					$($videoContainer).unbind('pause');
					$($videoContainer).get(0).play();
					$($videoContainer).bind('ended', function (event) {
						avatar.videoOnEnded();
					});
					$($videoContainer).bind('pause', function (event) {
						avatar.addReplay($videoContainer);
					});

					$($videoContainer).bind('timeupdate', function (e) {
						if (this.currentTime >= .1) {
							$($poster).fadeOut(250);
							$($videoContainer).unbind('timeupdate');
						}
					});

					if (mobile) {
						$(".poster").triggerHandler("click");
					}
				},

				avatarOTBClickEvent: function (args, prompt) {
					if (elements.questionText.is(':focus') == true && avatar.clearOTB == true) {
						elements.questionText.val('');
						avatar.clearOTB = false;
					}
				},

				avatarClickEvent: function (args, prompt) {
					var $videoContainer = avatar.videoContainer;
					var $questionInput = avatar.questionInput;
					var $poster = avatar.poster;

					if (args) {
						if (args.videoContainer) {
							$videoContainer = args.videoContainer;
						}
						if (args.questionInput) {
							$questionInput = args.questionInput;
						}
						if (args.poster) {
							$poster = args.poster;
						}
					}

					if ($questionInput.is(':focus') == true && avatar.clearOTB == true) {
						$questionInput.val('');
						avatar.clearOTB = false;
					}
					if (avatar.idle == true && $questionInput.is(':focus') == true) {
						$($videoContainer).get(0).pause();
					} else if (avatar.idle == true) {
						if ($($poster).css('display') == 'block')
							$($poster).fadeOut(250);
						avatar.updateVideoPlayer({
							videoFile: IDLE_VIDEO
						});
					} else if ($($videoContainer).get(0).paused == true && $questionInput.is(':focus') == false) {
						if (microphoneQuestion) {
							microphoneQuestion = false;
						} else {
							$($videoContainer).get(0).play();
						}

						$($videoContainer).bind('timeupdate', function (e) {
							if (this.currentTime >= .1) {
								if ($($poster).css('display') == 'block')
									$($poster).fadeOut(250);
								$($videoContainer).unbind('timeupdate');
							}
						});
					} else {
						$($videoContainer).get(0).pause();
					}
				},

				fetchAnsweredQuestions: function () {
					return;
					// On user login, download answered question list from the server.
					// Maximize abby chat, show sliding container and show list of questions.
					if (userID == null) // No user ID is set in abbyVars
						return;
					// Using same callbacks for success and error
					var callBack = function (response) {
						// response = {};
						// response.answeredQuestionList = [{id : 1, question_text: "Who is unum?"},
						// 								{id : 2, question_text: "How are you?"},
						// 								{id : 3, question_text: "Hello"},
						// 								{id : 4, question_text: "Test quest"}
						// 								];

						// Parse list of questions from the response
						response.answeredQuestionList = response.answeredQuestionList || []; // Checking if empty
						if (response.status != "success" || response.answeredQuestionList.length < 1)
							return;

						avatar.showChat(); // Show Chat
						avatar.toggleFAQ(true); // Show sliding container
						avatar.hideSideMenu(); // Hide the side menu
						avatar.createListOfAnsweredQuestions(response.answeredQuestionList); // show list of questions

						// TODO - Play the video file from the response
						// avatar.playVideo(avatar.videoContainer, "idle");
					};

					var errorCallback = function (err) {};

					var dataToSubmit = {
						"action": "get_answered_questions",
						"cmn_id": company_id,
						"c_id": campaign_id,
						"user_id": userID
					};
					// API call to the server
					ajaxFunctions.getObjectFromServer("EbenefitsUnAnsweredQuestionTracking", dataToSubmit, callBack, errorCallback);
				},

				submitOTBEntry: function (args, event, prompt) {
					if ($(".avatar-form-set .mic").hasClass("started")) {
						$(".avatar-form-set .mic").removeClass("started");
						if (!event.isTrigger) {
							recognition.stop();
							$(".avatar-form-set .inner-btn").removeClass("recognizing");
							console.log("Speech Recognition stopped");
							return;
						}
					} else if (event.which != 13 && !event.isTrigger && microphoneAllowed && avatar.clearOTB == true) {
						$(".avatar-form-set .mic").addClass("started");
						recognition.start();
						$(".avatar-form-set .inner-btn").addClass("recognizing");
						console.log("Speech Recognition started");
						return;
					}

					if (!(args.question ? args.question : avatar.questionInput.val())) {
						return;
					}

					$(avatar.poster).fadeIn(250);
					//avatar.addIdle(avatar.videoContainer);

					var dataToSubmit = {
						"questionText": args.question ? args.question : avatar.questionInput.val(),
						"nl_id": avatar.nl_id,
						"category": avatar.category,
						"subCategory": avatar.subCategory,
						"webCampaign": {},
						"oldAbbyNlpCmnId": avatar.oldAbbyNlpCmnId,
						"oldAbbyNlpCId": avatar.oldAbbyNlpCId
					};

					if (args.askOldAbby) {
						dataToSubmit["askOldAbby"] = args.askOldAbby;
					}

					//only call nlp if we have a question to ask
					$('#spinnerdiv').show();
					if (avatar.questionInput.val()) {

						avatar.systemQuestion = avatar.questionInput.val();
						console.log("Question Text : " + avatar.systemQuestion);
						// Hide replay icon
						elements.replayAnswer.addClass("hidden");

						// Auto Clear System questions
						if(QUESTION_CODES.indexOf(avatar.systemQuestion) != -1) {
							avatar.questionInput.val('');
						}

						// Check is user asking question
						if(avatar.checkForControlWord(avatar.systemQuestion) || (avatar.askedQuestion && DID_NOT_UNDERSTAND_QUESTIONS.indexOf(avatar.systemQuestion) == -1)) {
							// Abby already asked a question, check the answer now
							avatar.playNextVideo();
							return;
						} else if(PASSWD_RESET_FLOW_QUESTIONS.indexOf(avatar.systemQuestion) != -1) {
							avatar.askedQuestion = true;
							avatar.lastQuestion = avatar.systemQuestion;
						} else if(QUESTION_CODES.indexOf(avatar.systemQuestion) != -1) {
							// Playing did not understand videos
						} else {
							avatar.askedQuestion = false;
						}

						// Clear the minimize timer to avoid unnecessary minimize
						// clearTimeout(minimizeAfterResponseTimer);

						var apiInfo = {};
						apiInfo["ignore"] = false;
						// Before pushing into queue setIgnore flag for previously sent API calls
						for (var t in ajaxFunctions.apiQueue)
							ajaxFunctions.apiQueue[t]['ignore'] = true;

						var ts = new Date().getTime();
						apiInfo["timestamp"] = ts;
						ajaxFunctions.apiQueue[ts] = apiInfo;

						ajaxFunctions.submitObjectToServer("webFlow/nlp/ask", dataToSubmit, (function (questionText, l_apiInfo) {
							return function (response) {
								// avatar.markAsUnansweredIfNeeded(questionText, response);
								console.log("Ignore response :" + l_apiInfo['ignore']);
								$('#spinnerdiv').hide();
								if (l_apiInfo['ignore'] == false)
									avatar.playMediaFileIfNeeded(response, event, prompt, questionText);

								elements.replayAnswer.addClass("hidden");

								delete ajaxFunctions.apiQueue[l_apiInfo["timestamp"]]; // Clear api info from queue
							};
						})(dataToSubmit.questionText, apiInfo), (function (l_apiInfo) {
							return function (errResponse) {
								$('#spinnerdiv').hide();
								if (l_apiInfo['ignore'] == false)
									avatar.addIdle(avatar.videoContainer);
								delete ajaxFunctions.apiQueue[l_apiInfo["timestamp"]]; // Clear api info from queue
							};
						})(apiInfo));
					}


					avatar.clearOTB = true;
					if (introQuestion) {
						introQuestion = "";
						elements.questionText.val("");
					}

				},

				playMediaFileIfNeeded: function (response, event, prompt, questionText) {
					if (isAdvancedabby) {
						var d = avatar.xmlToJson(response);
						console.log(d);
						if (d.resulttype == "error" || d.abbyanswer == null)
							return;
						d.abbyanswer.response = d.abbyanswer.response.replace(/&/g, 'and').replace(/answerset/g, 'answerList');
						if (d.abbyanswer.response.indexOf("</answerList>") == -1)
							d.abbyanswer.response = d.abbyanswer.response.replaceLast("<answerList>", "</answerList>")
						d.abbyanswer.response = (avatar.xmlToJson('<?xml version=\"1.0\" encoding=\"utf-8\"?><root>' + d.abbyanswer.response + '</root>')).answerList;

						var oJson = {};
						for (var i in d.abbyanswer.response) {
							var r = d.abbyanswer.response[i];
							if (r.type == "text" && r.sequence == 0) {
								oJson.responseText = r.content;
							} else if (r.type == "text" && r.sequence == 1) {
								// Formating the text with HTML tags
								var txt = r.content;
								// Formating the text with HTML tags
								txt = txt.replace(/\\sb/g, "<b>");
								txt = txt.replace(/\\eb/g, "</b>");
								txt = txt.replace(/\\n/g, "<br>");
								txt = txt.replace(/\\t/g, "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;");
								oJson.answerText = txt;
							} else if (r.type == "media" && r.sequence == 0) {
								var name = r.content.replace(/ /gm, '');
								if (name == 'afdadsfd') {
									name = IDLE_VIDEO;
								}
								oJson.mediaFilename = name;
							} else if (r.type == "url" && r.sequence == 0) {
								var correct_url = null;
								if (r.content.indexOf("youtube") != -1) {
									var url = r.content.split('?');
									var replace_url = url[1].replace('and', '&');
									correct_url = url[0] + '?' + replace_url;
								} else {
									correct_url = r.content;
								}
								oJson.redirectUrl = correct_url;
							}
						}

						var local_rUrl;
						if (typeof RedirectUrls != "undefined")
							local_rUrl = RedirectUrls[oJson.redirectUrl];
						else
							local_rUrl = localRedirectUrls[oJson.redirectUrl];

						if (local_rUrl != null)
							oJson.redirectUrl = local_rUrl;

						if (oJson.mediaFilename) {
							var videoPlayerArgs = {};
							videoPlayerArgs["videoFile"] = oJson.mediaFilename;
							videoPlayerArgs[oJson.mediaFilename + "_text"] = oJson.responseText;
							videoPlayerArgs["redirectUrl"] = oJson.redirectUrl;
							videoPlayerArgs["answer_text"] = oJson.answerText;
							videoPlayerArgs["questionText"] = questionText;

							avatar.videoAdded = false;
							avatar.lastAnswerVideo = videoPlayerArgs["videoFile"];
							avatar.updateVideoPlayer(videoPlayerArgs, event, prompt);
						}
					} else {
						if (response.mediaFilename) {
							var videoPlayerArgs = {};
							videoPlayerArgs["videoFile"] = response.mediaFilename;
							videoPlayerArgs[response.mediaFilename + "_text"] = response.responseText;
							videoPlayerArgs["redirectUrl"] = oJson.redirectUrl;
							videoPlayerArgs["answer_text"] = oJson.answerText;
							videoPlayerArgs["questionText"] = questionText;

							avatar.videoAdded = false;
							avatar.lastAnswerVideo = videoPlayerArgs["videoFile"];
							avatar.updateVideoPlayer(videoPlayerArgs, event, prompt);
						}
					}

				},

				markAsUnansweredIfNeeded: function (questionText, response) {
					return;
					var resulttype = $(response).find('resulttype');

					for (i = 0; i < resulttype.length; i++) {
						var answerType = $(resulttype[i]).text();
					}

					if (answerType != "default")
						return;

					var dataToSubmit = {
						"action": "save_unanswered_question",
						"cmn_id": company_id,
						"c_id": campaign_id,
						"user_id": userID
					};
					dataToSubmit['question_text'] = questionText; // question text from input box
					ajaxFunctions.getObjectFromServer("EbenefitsUnAnsweredQuestionTracking", dataToSubmit, function (resp) {}, function (err) {});
				},

				markAsViewed: function (question_id) {
					return;
					// Mark the question is viewed by user
					var dataToSubmit = {
						"action": "answer_viewed",
						"cmn_id": company_id,
						"c_id": campaign_id,
						"user_id": userID
					};
					dataToSubmit['id'] = question_id;
					ajaxFunctions.getObjectFromServer("EbenefitsUnAnsweredQuestionTracking", dataToSubmit, function (resp) {}, function (err) {});
				},

				xmlToJson: function (xml) {
					var xmlDoc;
					var Json = {};

					if (window.DOMParser) {
						parser = new DOMParser();
						xmlDoc = parser.parseFromString(xml, "text/xml");
					}
					/*else
					{
						xmlDoc=new ActiveXObject("Microsoft.XMLDOM");
						xmlDoc.async=false;
						xmlDoc.loadXML(xml);
					}
					*/
					var toJSON = function (xmlDoc, obj) {
						if (xmlDoc.nodeType == 1) {
							for (var i in xmlDoc.childNodes) {

								if (xmlDoc.childNodes[i].nodeType == 1 && xmlDoc.childNodes[i].attributes != null) {
									var x = xmlDoc.childNodes[i];
									if (x.nodeName.indexOf('List', x.nodeName.length - 'List'.length) !== -1) {
										if (obj[x.nodeName] == null)
											obj[x.nodeName] = new Array();
										toJSON(x, obj[x.nodeName]);
										continue;
									}
									if (xmlDoc.childNodes[i].childNodes.length > 1) {
										if (obj instanceof Array) {
											var sobj = {};
											obj.push(sobj);
											toJSON(x, sobj);
										} else {
											var sobj = {};
											obj[x.nodeName] = sobj
											toJSON(x, sobj);
										}
									} else {
										if (obj != null) {
											var element = xmlDoc.childNodes[i];

											var value = element.textContent;
											if (value === 'true')
												value = true;
											if (value === 'false')
												value = false;
											obj[xmlDoc.childNodes[i].nodeName] = value;
										}

									}
								} else
									toJSON(xmlDoc.childNodes[i], Json);
							}
						} else if (xmlDoc.nodeType == 2) {} else if (xmlDoc.nodeType == 3) {} else if (xmlDoc.nodeType == 4) {} else if (xmlDoc.nodeType == 5) {} else if (xmlDoc.nodeType == 6) {} else if (xmlDoc.nodeType == 7) {} else if (xmlDoc.nodeType == 8) {} else if (xmlDoc.nodeType == 9) {
							toJSON(xmlDoc.documentElement, Json);
						} else if (xmlDoc.nodeType == 10) {} else if (xmlDoc.nodeType == 12) {}
					};

					toJSON(xmlDoc);
					return Json;
				},

				checkForControlWord : function (question) {
					question = question.toLowerCase();
					var answers = USER_ANSWER["OPERATOR"];
					if(answers.indexOf(question) != -1) {
						return true;
					}
				
					return false;
				},

				playNextVideo : function() {
					console.log("Last Question : " + avatar.lastQuestion);
					console.log("Current Question : " + avatar.systemQuestion);
					
					// Continue password reset flow
					if(DID_NOT_UNDERSTAND_QUESTIONS.indexOf(avatar.systemQuestion) != -1) {
						avatar.askedQuestion = true;
					} else if(avatar.checkForControlWord(avatar.systemQuestion) == true) {
						avatar.askedQuestion = false;
						var question = QUESTION_CODES[3]; // Transfer video

						elements.questionText.val(question);
						elements.askBtn.click();
					} else if(avatar.askedQuestion) {
						var nextVideo;
						var sysQues = avatar.systemQuestion.toLowerCase();
						for (var key in USER_ANSWER) {
							var answers = USER_ANSWER[key];
							key = key.toLowerCase();
							if(answers.indexOf(sysQues) != -1) {
								var l_obj = PASSWD_RESET_FLOW[avatar.lastQuestion];
								nextVideo = l_obj[key];
								break;
							}
						}


						if(!nextVideo) {
							nextVideo = 4;
						} else {
							avatar.askedQuestion = false;
						}

						var question = QUESTION_CODES[nextVideo];

						elements.questionText.val(question);
						elements.askBtn.click();
						return true;
					} else if(PASSWD_RESET_FLOW[avatar.systemQuestion]) {
						var l_ob = PASSWD_RESET_FLOW[avatar.systemQuestion];

						var question = QUESTION_CODES[l_ob.yes];

						elements.questionText.val(question);
						elements.askBtn.click();
					}

				},

				videoOnEnded: function () {
					console.log("Answer video ended");
					if ($("#chatHelpbutton2").hasClass("overlay_close") == true) {
						console.log("Intro video ended");
						$(".overlay_close").click(); // Trigger overlay_close button click
					}

					// Check our Password reset Flow Ended otherwise go on
					if(avatar.askedQuestion) {
						console.log("Avatar is asking question");
						console.log("Waiting for user answer");
						elements.questionText.val("");
					} else {
						console.log("Avatar is answering");
						if(avatar.playNextVideo())
							return;
					}

					// Show replay icon
					elements.replayAnswer.removeClass("hidden");

					// Add Idle Video after answer video completed.
					if (!mobile) {
						avatar.addIdle($videoContainer);
					}

					// if (minimizeAfterResponse != null) {
					// 	// Minimize Abby, If the timer has been configured
					// 	avatar.startMinimizeTimer();
					// }
				},

				startMinimizeTimer : function() {
					return;
					clearTimeout(minimizeAfterResponseTimer);
					minimizeAfterResponseTimer = setTimeout(function() {
						console.log("Minimizing abby window after delivering response : interval " + minimizeAfterResponse + " secs");
						avatar.hideChat();
					}, minimizeAfterResponse * 1000);
				}
			};
		})();


		/**
		 * ============================================================================
		 * Avatar Initialisation
		 * ============================================================================
		 */
		var onloadQuestion = "";
		var avatarOnloadQuestionParms = {
			"askOldAbby": true,
			"question": onloadQuestion
		};

		//------------------------------------------------------------------------------------------------------------------------
		//
		//	Event listeners for Abby IVA window
		//
		//------------------------------------------------------------------------------------------------------------------------

		elements.askBtn.bind("click", function (event) {
			if (mobile) {
				var lastclickpoint = $(this).attr('data-clickpoint');
				var curclickpoint = event.clientX + 'x' + event.clientY
				if (lastclickpoint == curclickpoint)
					return false;
				$(this).attr('data-clickpoint', curclickpoint);
				window.setTimeout(function () {
					// removeAttribute(event);
				}, 2500);
			}

			avatar.submitOTBEntry({
				"askOldAbby": true
			}, event);
		});

		// Using .on() functions instead of .bind()
		// Click listener for the question links in sliding container
		elements.AbbyContainer.on("click", ".question-list li", function (event) {
			// Ask the clicked question to abby
			$(this).attr({
				"data-clicked": true
			});
			var questionInput = elements.questionText;
			questionInput.val($(this).text());
			var e = $.Event("keypress", {
				which: 13
			});
			questionInput.trigger(e); // Trigger ENTER key press event

			var question_id = $(this).attr("data-id");
			// avatar.markAsViewed(question_id);

			$(".back-btn").html("< Back");
		});

		// Sliding container BACK button click listener
		elements.AbbyContainer.on("click", ".back-btn", function (event) {
			$(".back-btn").html("Close");
			avatar.showQuestionList();
		});

		// Sliding container PRINT button click listener
		elements.AbbyContainer.on("click", ".print-btn", function (event) {
			avatar.printContent('.answer-text');
		});

		// Sliding container close icon click listener
		elements.AbbyContainer.on("click", "#sliding_container_close", function (event) {
			avatar.clickCloseSlidingContainerButton(true);
		});

		elements.AbbyContainer.on("click", ".replay-answer", function (event) {
			console.log(avatar.systemQuestion);
			avatar.updateVideoPlayer({
				videoFile: avatar.lastAnswerVideo
			});
		});

		// First time overlay close icon click listener
		$("body").on("click", ".overlay_close", function (event) {
			var overlay = $(".abbyOverlay");
			overlay.remove();

			isCenter = false;
			setAbbyPosition(abbyPosition, isTop);

			elements.AbbyContainer.removeClass("toppest");
			$(this).removeClass("overlay_close");
		});

		// Submitting question on Enter press
		elements.questionText.keypress(function (event) {
			var txt = this.value.trim();
			if (event.which == "13" && txt.length > 0) {

				avatar.submitOTBEntry({
					"askOldAbby": true
				}, event);
			} else {
				// Clear auto minimize timer, if the user is typing question
				// clearTimeout(minimizeAfterResponseTimer);
			}
		});

		elements.questionText.bind("click", function (event) {
			avatar.avatarOTBClickEvent();
			// clearTimeout(minimizeAfterResponseTimer);
		});

		// elements.questionText.bind("blur", function(event) {
		// 	// restart abby minimize timer
		// 	avatar.startMinimizeTimer();
		// });

		$("#chatHelpbutton").bind("click", function (event) {
			avatar.showChat();
		});

		$("#chatHelpbutton2, #abbyMinimize").bind("click", function (event) {
			avatar.hideChat();

			// Unbind the click, keypress events. Here after abby won't auto start. In this page
			if (typeof (clearIntervalforAbby) != "undefined")
				clearIntervalforAbby();
			// $(document).unbind('click keypress');
			abbyMinimizedFlag = true;
		});

		$("#cc_close").bind("click", function (event) {
			createCookie("ccOpened", "false");
			avatar.clickCloseCCButton();
		});

		$("#slider, .sideMenu").bind("click", function (event) {
			avatar.hideSideMenu();
			avatar.toggleFAQ(true);
		});

		$("#ccButton").bind("click", function (event) {
			createCookie("ccOpened", "true");
			avatar.clickCCButton();
		});

		$(".video-player, .btn-play, .poster").bind("click",
			function (event) {
				if (mobile) {
					var lastclickpoint = $(this).attr('data-clickpoint');
					var curclickpoint = event.clientX + 'x' + event.clientY
					if (lastclickpoint == curclickpoint)
						return false;
					$(this).attr('data-clickpoint', curclickpoint);
					window.setTimeout(function () {
						// removeAttribute(event);
					}, 2500);
				}
				avatar.avatarClickEvent();
			});

		$('.AbbyContainer .micButton').css("background-image", 'url(' + imageDirectory + 'mic.gif)');

		//If any question need to be loaded while loading of the page, then this condition will be executed
		if (onloadQuestion) {

			avatar.submitOTBEntry(avatarOnloadQuestionParms, {
				"isTrigger": true
			});
		}

		//Getting the interaction url. If advanced abby nlp needs to be implemented we need to have an interaction id.
		if (isAdvancedabby)
			ajaxFunctions.getInteractionUrl();


		/**
		 * @description Condition used for engaging Abby after idle time if that option is supported.
		 * Watch the click and keypress events in the document and if it remains idle for more than
		 * the specified time, auto start Abby.
		   
		   On page Navigation don't auto start abby. Instead Keep the previous abby state which is stored in AbbyMaximized cookie
		 */
		if (autoStartAbby == true && getCookie("AbbyMaximized") == null) {

			/**
			 * @description Function Definition for setting the timer of an Abby.
			 * @function
			 * @name setIntervalforAbby
			 */
			function setIntervalforAbby() {
				if (abbyMinimizedFlag == true)
					return;
				AbbyInterval = setInterval(function () {
					avatar.showChat();
				}, timeInterval);
			}

			/**
			 * @description Function Definition for clearing the timer of an Abby.
			 * @function
			 * @name clearIntervalforAbby
			 */
			function clearIntervalforAbby() {
				if (AbbyInterval)
					clearInterval(AbbyInterval);
			}

			/**
			 * @description Click event binded for the document to check user interaction with the page.
			 */
			$(document).bind('click', function () {
				clearIntervalforAbby();
				setIntervalforAbby();
			});

			/**
			 * @description Key Press event binded for the document to check user interaction with the page.
			 */
			$(document).bind('keypress', function () {
				clearIntervalforAbby();
				setIntervalforAbby();
			});

			//Inititate the timer
			setIntervalforAbby();
		}

		/**
		 * @description Window resize function used to set the position of an Abby on window resize.
		 * @function {Window Object's function}
		 * @name resize
		 */
		$(window).resize(function () {
			//Position the Abby container
			setAbbyPosition(abbyPosition, isTop);

			//If slider option is present, position them based on the input value
			if (abbyPosition == 'left')
				elements.slidingContainer.css({
					"left": elements.AbbyContainer.width(),
					"right": ""
				}).addClass("right").removeClass("left");
			else
				elements.slidingContainer.css({
					"right": elements.AbbyContainer.width(),
					"left": ""
				}).addClass("left").removeClass("right");
		});

		//------------------------------------------------------------------------------------------------------------------------
		//
		//	END - Event listeners
		//
		//------------------------------------------------------------------------------------------------------------------------


		/**
		 * @description Function used to set the position of an Abby
		 * @function
		 * @name setAbbyPosition
		 * @param position {String}
		 * @param top {String}
		 */
		function setAbbyPosition(position, top) {
			/**
			 * @description Setting the width dynamically for containers.
			 */
			$(".chatHelp,.AbbyContainer").css("width", abbyWidth);

			/**
			 * @description Setting the height dynamically for containers.
			 */
			abbyHeight = (elements.AbbyContainer.width() / 3) * 4;
			$(".slidingContainer,.avatar-video,.avatar-video .cc,.poster,.video-player").css("height", abbyHeight);

			/**
			 * @description Based on the parameter value, set the class name for aligning the text box with Abby.
			 */
			if (alignTextboxandMicwithVideo) {
				elements.AbbyContainer.addClass('align-input-controls');
				elements.AbbyContainer.removeClass('non-align-input-controls');
			} else {
				elements.AbbyContainer.addClass('non-align-input-controls');
				elements.AbbyContainer.removeClass('align-input-controls');
			}

			var minimizedDiv = $('.chatHelp');
			var maximizedDiv = elements.AbbyContainer;

			var windowHeight = window.innerHeight || $(window).height();
			var windowWidth = window.innerWidth || $(window).width();

			var minimized = {
				"height": minimizedDiv.height(),
				"width": minimizedDiv.width()
			};
			var maximized = {
				"height": maximizedDiv.height(),
				"width": maximizedDiv.width()
			};

			maximized.width += (4 / 100) * windowWidth; // Including 4% of margin

			if (positionType == "absolute") {
				var x = positionX;
				var y = positionY;
			} else {
				var x = (positionX / 100) * windowWidth; // Calculate x percentage of window
				var y = (positionY / 100) * windowHeight; // Calculate y percentage of window
			}

			var p = x + maximized.width; // X + width of panel
			var q = y + maximized.height; // Y + height of panel

			var cssObj = {
				"left": x,
				"top": y,
				"right": "",
				"bottom": ""
			};

			if (x < 0) {
				x = 0;
				cssObj["left"] = 0;
			} else if (p >= windowWidth) {
				// If panel goes out of screen, get it into screen
				x = windowWidth - maximized.width;
				cssObj["right"] = 0;
				cssObj["left"] = "";
			}

			if (y < 0) {
				y = 0;
				cssObj["top"] = 0;
			} else if (q >= windowHeight) {
				// If panel goes out of screen, get it into screen
				y = windowHeight - maximized.height;
				cssObj["bottom"] = 0;
				cssObj["top"] = "";
			}

			maximizedDiv.css(cssObj); // Set X, Y for maximized window
			// X will be same for both the divs
			if (typeof cssObj["top"] != "string")
				cssObj["top"] = y + (maximized.height - minimized.height);
			minimizedDiv.css(cssObj); // Set X, Y for minimized

			abbyPosition = "right";
			var halfOfWindow = (40 / 100) * windowWidth;
			if (x < halfOfWindow)
				abbyPosition = "left";

			if (isCenter == true) {
				$(".chatHelp").css("top", ((windowHeight / 2) - (minimized.height / 2)));
				elements.AbbyContainer.css("top", ((windowHeight / 2) - (maximized.height / 2)));
				$(".chatHelp, .AbbyContainer").css({
					"left": (windowWidth / 2) - (maximized.width / 2),
					"right": "",
					"bottom": ""
				});
			}

			/**
			 * @description For interchanging the cc and FAQ buttons based on the Position.
			 */
			switch (position) {
			case "left":
				$('#slider').css({
					"right": "5px",
					"left": ""
				});
				$('#ccButton').css({
					"left": "5px",
					"right": ""
				});
				break;
			default:
				$('#slider').css({
					"left": "5px",
					"right": ""
				});
				$('#ccButton').css({
					"right": "5px",
					"left": ""
				});
				break;
			}
		}

		//------------------------------------------------------------------------------------------------------------------------
		//
		//	Util Functions
		//
		//------------------------------------------------------------------------------------------------------------------------

		String.prototype.reverse = function () {
			return this.split('').reverse().join('');
		};

		String.prototype.replaceLast = function (what, replacement) {
			return this.reverse().replace(new RegExp(what.reverse()), replacement.reverse()).reverse();
		};

		$.support.cssProperty = (function () {
			function cssProperty(p, rp) {
				var b = document.body || document.documentElement,
					s = b.style;

				// No css support detected
				if (typeof s == 'undefined') {
					return false;
				}

				// Tests for standard prop
				if (typeof s[p] == 'string') {
					return rp ? p : true;
				}

				// Tests for vendor specific prop
				var v = ['Moz', 'Webkit', 'Khtml', 'O', 'ms', 'Icab'],
					p = p.charAt(0).toUpperCase() + p.substr(1);

				for (var i = 0; i < v.length; i++) {
					if (typeof s[v[i] + p] == 'string') {
						return rp ? (v[i] + p) : true;
					}
				}

				return false;
			}

			return cssProperty;
		})();

		function getWelcomebackVideoIndex() {
			return Math.round(Math.random() * (abbyWelcomeBackVideos.length - 1))
		}

		// Read cookie
		function getCookie (name) {
			var cookies = {};
			var c = document.cookie.split('; ');
			for (i = c.length - 1; i >= 0; i--) {
				var C = c[i].split('=');
				cookies[C[0]] = C[1];
			}
			return cookies[name] || null;
		};

		// create cookie
		function createCookie (name, value, minutes) {
			if (minutes) {
				var date = new Date();
				date.setTime(date.getTime() + (minutes * 60 * 1000));
				var expires = "; expires=" + date.toGMTString();
			} else
				var expires = "";
			document.cookie = name + "=" + value + expires + "; path=/";
		}

		function deleteCookie (name) {
			var date = new Date();
			date.setTime(date.getTime() - 60 * 1000);
			document.cookie = name + "=; expires=" + date.toGMTString() + "; path=/";
		};

		function clearInteractionIdFromCookie () {
			console.log("Clearing interaction ID from cookie");
			deleteCookie("interactionId");
		};

		// Creating local object for console log
		for(var key in Object.keys(window.console)) {
			console[key] = window.console[key];
		}

		console.log = function(str) {
			if(abbyIVALogSettings.log == true)
				window.console && window.console.log(str);
			if(abbyIVALogSettings.stacktrace == true)
				window.console && window.console.trace();
		};


		// Make the cookie utility functions as global
		window.getCookie = getCookie;
		window.createCookie = createCookie;
		window.deleteCookie = deleteCookie;
		window.clearInteractionId = clearInteractionIdFromCookie;

		//------------------------------------------------------------------------------------------------------------------------

		var init = function () {

		// check is this the first load. If yes just place abby in Center of the page
		if (getCookie("firstTimeLogin") == "false") {
			// calling the funtion on second login
			// Some user already logged in onto this machine
			// Postioning Abby at default position
			setAbbyPosition(abbyPosition, isTop);

			introQuestion = QUESTION_CODES[0];

			avatar.hideChat();

			// play the answer video, If the page is auto redirected
			// Clear the locally saved question and answer after playing the video
			var l_args = null; //getCookie("lastAskedQuestion");
			if (l_args != null)
				l_args = JSON.parse(l_args);

			if (getCookie("pageRedirected") == "true" && l_args != null) {
				// TODO - don't play video on intermediate page
				// Clear cookies
				deleteCookie("lastAskedQuestion");
				deleteCookie("pageRedirected");

				introQuestion = ""; // Clear Intro question

				avatar.clearOTB = true; // Set flag to clear question text on focus
				elements.questionText.val(l_args["questionText"]); // Set question text in abby window

				$('.chatHelp').hide(); // Hide minimized abby window
				elements.AbbyContainer.show(); // Show abby window
				$('#spinnerdiv').hide(); // Hide loading animation

				avatar.updateVideoPlayer(l_args); // Play Video file
			} else {
				// var abbyMaximizedCookie = getCookie("AbbyMaximized");
				// if (abbyMaximizedCookie != null) {
				// 	$('#spinnerdiv').hide(); // Hide loading animation
				// 	// introQuestion = ""; // Clear welcomeback video, because the page is already opened
				// }
				// var abbyPreviouslyMaximized = abbyMaximizedCookie == "true" ? true : false;
				// if (abbyPreviouslyMaximized == true) {
				// 	avatar.showChat();
				// } else {
				// 	avatar.hideChat();
				// }

				// call this fn on closing first time video popup open
				// avatar.fetchAnsweredQuestions();
			}
			var abbyCCopened = getCookie("ccOpened");
			abbyCCopened = abbyCCopened == "true" ? true : false;
			if (abbyCCopened == true)
				avatar.clickCCButton();
		} else {
			createCookie("firstTimeLogin", "false", (10 * 365 * 24 * 60)); // Set cookie firstTime login is false
			
			// Show abby in page center and Add a overlay
			// var overlay = $("<div></div>").addClass("abbyOverlay");
			// overlay.appendTo("body");
			// $("#chatHelpbutton2").addClass("overlay_close");
			// isCenter = true;

			setAbbyPosition(abbyPosition, isTop);
			avatar.hideChat();

			var AbbyInteractionIdWaitTimer = setInterval(function () {
				if (interactionId != null) {
					clearInterval(AbbyInteractionIdWaitTimer);
					introQuestion = QUESTION_CODES[0];
				}
			}, 500);
			// elements.AbbyContainer.addClass("toppest"); // Set z-index to get abby to the top
		}
		};

		init();
		// console.log(Object.keys(window).length);
	}

	//------------------------------------------------------------------------------------------------------------------------
	//
	//	Extracting script tag's content
	//
	//------------------------------------------------------------------------------------------------------------------------

	var abbyvars = document.getElementById('abbyvars').value;
	abbyvars = abbyvars.replace(/\n/g, "").replace(/\s+/g, "");
	var queries = abbyvars.split('&');
	if (queries.length > 0) {
		for (var i = 0; i < queries.length; i++) {
			var key = queries[i].split('=')[0];
			var value = queries[i].split('=')[1];

			switch (key) {
			case "useItneractionParms":
				useItneractionParms = value;
				break;
			case "hideonMobile":
				if (value == "true")
					hideonMobile = true;
				break;
			case "introQuestion":
				introQuestion = value;
				break;
			case "autoPlay":
				if (value == "true")
					needAutoPlay = "autoplay='true'";
				break;
			case "preLoad":
				if (value == "true") {
					if (needAutoPlay != "autoplay='true'")
						needAutoPlay = "preload='auto'";
				}
				break;
			case "autoStartAbby":
				if (value == "true")
					autoStartAbby = true;
				break;
			case "autoStartAbbyTimer":
				if (parseInt(value))
					timeInterval = parseInt(value) * 1000;
				break;
			case "width":
				abbyWidth = value;
				break;
			case "height":
				abbyHeight = value;
				break;
			case "baseURL":
				baseURL = value;
				break;
			case "alignTextboxandMicwithVideo":
				if (value == "false")
					alignTextboxandMicwithVideo = false;
				else
					alignTextboxandMicwithVideo = true;
				break;
			case "useAdvancedAbbyNLP":
				if (value == "false")
					isAdvancedabby = false;
				else
					isAdvancedabby = true;
				break;
			case "company_id":
				company_id = value;
				break;
			case "campaign_id":
				campaign_id = value;
				break;
			case "nlpUrl":
				nlpUrl = value;
				break;
			case "abbyTheme":
				abbyTheme = value;
				break;
			case "videoDirectoryUrl":
				videoDirectoryUrl = value;
				break;
			case "imageDirectoryUrl":
				imageDirectoryUrl = value;
				break;
			case "jsDirectoryUrl":
				jsDirectoryUrl = value;
				break;
			case "cssDirectoryUrl":
				cssDirectoryUrl = value;
				break;
			case "abbyBgColors":
				abbyBgColors = value;
				break;
			case "userID":
				// userID = value;
				break;
			case "positionType":
				positionType = value;
				break;
			case "positionX":
				positionX = isNaN(value) == false ? parseInt(value) : 100;
				break;
			case "positionY":
				positionY = isNaN(value) == false ? parseInt(value) : 100;
				break;
			case "minimizeAfterResponse":
				minimizeAfterResponse = isNaN(value) == false ? parseInt(value) : null;
				break;
			}

			if (/.*url$/i.test(key) == true)
				localRedirectUrls[key] = value;
		}

		var abbyUserId = document.getElementById(abbyUserIdSelector);
		if (abbyUserId != null)
			userID = abbyUserId.value;
	}

	var createLinkTag = function (fileName) {
		var head = document.getElementsByTagName('head')[0];
		var link = document.createElement('link');
		link.rel = 'stylesheet';
		link.type = 'text/css';
		link.href = (cssDirectoryUrl ? cssDirectoryUrl + "/" : "css/") + fileName + '.css';
		head.appendChild(link);
	};

	var createScriptTag = function (url, callback) {
		if (!callback) callback = function () {};
		var addScript = document.createElement('script');
		addScript.type = "text/javascript";
		addScript.src = url;
		addScript.onload = callback;
		document.head.appendChild(addScript);
	};

	//Add Abby's Cascading Style Sheet to the page
	createLinkTag(abbyTheme);
	createLinkTag(abbyBgColors);

	var jqueryUiSlideUrl = (jsDirectoryUrl ? jsDirectoryUrl + "/" : "js/") + "jquery-ui-slide.min.js"

	//Add jQuery Library if it is not present in the embedding page
	if (!window.jQuery) {
		var jqUrl = (jsDirectoryUrl ? jsDirectoryUrl + "/" : "js/") + "jquery.js"
		createScriptTag(jqUrl, function () {
			createScriptTag(jqueryUiSlideUrl, executeAbby);
		});
	} else {
		createScriptTag(jqueryUiSlideUrl, executeAbby);
	}


	/**
	 * ================================================================
	 * Setting user information using global function and variable.
	 * ================================================================
	 */

	/**
	 * @description Global Function to set the user Information in a global variable.
	 * @function
	 * @name setUserInformation
	 * @param Obj {Object}  exmaple {" Age ":56 ,"Place":"New York "};  //User information object
	 * @returns {String}
	 */
	this.setUserInformation = function (Obj) {
		if (Obj) {
			var jsonObj = null;
			if (typeof Obj == "string")
				jsonObj = $.parseJSON(Obj);
			else if (typeof Obj == "string")
				jsonObj = Obj;

			if (jsonObj) {
				var variableQuery = [];
				var dataQuery = [];

				var keys = Object.keys(jsonObj),
					len = keys.length,
					i = 0,
					prop,
					value;
				while (i < len) {
					prop = keys[i];
					value = jsonObj[prop];
					try {
						// Variable name ends with URL, add it to local redirect Url
						// Otherwise, add it to NLP query params
						if (/.*url$/i.test(prop) == true)
							localRedirectUrls[prop] = value;
						else {
							variableQuery.push(encodeURIComponent(prop.trim()));
							dataQuery.push(encodeURIComponent(value.toString().trim()));
						}
					} catch (err) {

					}


					i += 1;
				}

				if (variableQuery.length > 0)
					userQuery = "&variable=" + variableQuery.join("|");
				if (dataQuery.length > 0)
					userQuery += "&data=" + dataQuery.join("|");
			}

		}
	};

	this.closeAbby = function () {
		deleteCookie("interactionId");
		deleteCookie("AbbyMaximized");
		deleteCookie("ccOpened");
	};

	window.setUserInformation = this.setUserInformation;
	window.clearSessionCookies = this.closeAbby;

	this.playVideo = function (object) {
		if (typeof object == "undefined")
			return false;
		if (object.question != null) {
			introQuestion = object.question;
			avatar.showChat();
		} else if (object.videoFile != null) {
			introQuestion = "";
			$('#spinnerdiv').hide(); // Hide loading animation
			avatar.showChat();
			avatar.updateVideoPlayer(object); // Play Video file
		}
	};
};

/**
	Cookies used by abby window:
	-------------------------------------------------------------------------------------------------------------
	| Name					| Purpose		 											| type 		| expiry    |
	-------------------------------------------------------------------------------------------------------------
	| interactionId 		| Interaction ID used by abby NLP  							| string 	| session 	|
	| firstTimeLogin 		| Used to find the user is logging in first time  			| boolean 	| 10 years 	|
	| pageRedirected 		| Used to check the current page is auto redirected by abby | boolean	| 1 minute 	|
							  window  
	| lastAskedQuestion 	| Question text & Answer for the last asked question while 	| string 	| 1 minute 	|
							  auto redirecting - parsed response
	| AbbyMaximized 		| Maximized status of the abby window 						| boolean 	| session 	|
	| ccOpened				| Status of the CC text panel								| boolean 	| session 	|
	-------------------------------------------------------------------------------------------------------------
*/
})();
