'use strict';

(function() {

    // Print colored log in the Console
    console.colorLog = function (str) {
        console.log("%c" + str, 'color: purple;');
    }

    console.colorLog("Assistant JS loaded")
    var $ = null;
    var synth = window.speechSynthesis || {};
    var voices = synth.getVoices();
    /**
     * Assistant reqires jQuery library
     */

    //--------------------------------------------------------------------------
    // Load Assistant chat panel on Window load
    //--------------------------------------------------------------------------

    // This function failed to call, If the script loaded after page rendering
    function addEvent(element, eventName, fn) {
        if (element.addEventListener)
            element.addEventListener(eventName, fn, false);
        else if (element.attachEvent)
            element.attachEvent('on' + eventName, fn);
    }

    // Prevent overwrite of the window.load function
    // addEvent(window, 'load', function () {
    //     startUp();
    // });

    // This function will start, If the page loaded successfully
    var readyStateCheckInterval = setInterval(function() {
        if (document.readyState === "complete") {
            clearInterval(readyStateCheckInterval);
            startUp();
        }
    }, 10);

    // Constant Strings
    var Constants = {

    };

    function startUp() {
        console.colorLog("Assistant Starting")

        // Storing global variables in local
        var accessToken = API_ACCESS_TOKEN;
        var options = assistantOptions;

        options.baseUrl = options.baseUrl || "";

        var imageDirectory = options.baseUrl + options.imageDirUrl;
        var jsDirectory = options.baseUrl + options.jsDirUrl;
        var cssDirectory = options.baseUrl + options.cssDirUrl;

        var chatHistory;
        var Status = {};
        var userProfile = null;

        // The text here will be played
        var followUpQuery = "";

        // kit starts here
        function startAssistantKit() {
            console.colorLog("Assistant Initialized")

            // Template HTML for the chat panel
            var AssistantPanelHtml = '<div id="audio-assistant" class="panel panel-primary"><div class="panel-heading">' +
                '<span class="panel-title">Assistant</span><img src="' + imageDirectory + 'minimize.png" ' +
                'class="minimize-icon"></div><div class="panel-body"><ul class="chatHistory"></ul></div>' +
                '<form class="form-inline">' +
                '<div class="panel-footer"><div class="input-holder"><input type="text" class="form-control" ' +
                'id="queryText" placeholder="Ask Assistant">' +
                '</div><a id="AskBtn" class="btn btn-default"><img src=""></a></div></form></div>';

            $('body').append(AssistantPanelHtml)

            var assistantPanel = $("#audio-assistant");
            var askButton = $("#AskBtn");
            var queryInput = $("#queryText");
            chatHistory = $(".chatHistory", assistantPanel);
            var minimizeIcon = $(".minimize-icon", assistantPanel);
            var micIcon = $("img", askButton);

            var micImage = {
                on: imageDirectory + 'mic.gif',
                off: imageDirectory + 'mic.png',
                send: imageDirectory + 'send.png'
            };

            var icons = {
                user : imageDirectory + 'female.png',
                assistant : imageDirectory + 'female.png',
            }

            $.fn.extend({
              animateCss: function(animationName, callback) {
                var animationEnd = (function(el) {
                  var animations = {
                    animation: 'animationend',
                    OAnimation: 'oAnimationEnd',
                    MozAnimation: 'mozAnimationEnd',
                    WebkitAnimation: 'webkitAnimationEnd',
                  };

                  for (var t in animations) {
                    if (el.style[t] !== undefined) {
                      return animations[t];
                    }
                  }
                })(document.createElement('div'));

                this.addClass('animated ' + animationName).one(animationEnd, function() {
                  $(this).removeClass('animated ' + animationName);

                  if (typeof callback === 'function') callback();
                });

                return this;
              },
            });

            // Avatar img not showing workaround
            $('body').append('<img src="' + icons.assistant +
                                '" style="display: none;">');

            var ClearQuery = false;

            // Closure variables for Playing Audio
            window.AudioContext = window.AudioContext || window.webkitAudioContext;
            var audioContext = new AudioContext(); // Audio context
            var audioSource;

            var audioQueue = []; // A Queue Object used to store audio
            var audioSeqTag = 1;

            // ========================================================================
            // AJAX functions start
            // ========================================================================
            //
            var ajaxFunctions = (function() {
                var queryBaseUrl = "https://api.api.ai/v1/query?v=20150910";
                var ttsBaseUrl = "https://api.api.ai/api/tts";
                var userProfileUrl = options.baseUrl + "api/profile/";
                var apiSessionID = "api" + new Date().getTime();
                return {
                    sendQuery: function(queryText, callback, errorCallback) {
                        // Not sending SourceAccount Number with query api
                        var context_param = {
                            "san" : "" // (assistantOptions.loginToken || "")
                        };

                        var param = {
                            "lang" : "en",
                            "query" : queryText,
                            "sessionId" : apiSessionID,
                            "contexts" : [{
                                "name" : "mjn",
                                "lifespan" : 1,
                                "parameters" : context_param
                            }]
                        };

                        var header = {
                            "Authorization" : "Bearer " + accessToken,
                            "Content-Type" : "application/json; charset=utf-8"
                        };

                        var options = {
                            "responseType" : "json"
                        };

                        ajaxFunctions.makeRequest(queryBaseUrl, "POST", JSON.stringify(param), header, options, callback, errorCallback);
                    },
                    textToSpeech: function(text, callback, errorCallback) {
                        // var promise = apiAIClient.ttsRequest(text);
                        // promise.then(callback)
                        //     .catch(errorCallback);

                        var param = {
                            "lang" : "en-US",
                            "text" : encodeURIComponent(encodeURIComponent(text)),
                            "v" : "20150910"
                        }

                        var header = {
                            "Authorization" : "Bearer " + accessToken
                        }

                        var options = {
                            "responseType" : "arraybuffer"
                        }

                        ajaxFunctions.makeRequest(ttsBaseUrl, "GET", param, header, options, callback, errorCallback);
                    },
                    getUserProfile: function(userId, callback, errorCallback) {

                        var url = userProfileUrl + userId;
                        var param = {};
                        var header = {};
                        var options = {
                            "responseType" : "json"
                        };

                        if(!errorCallback)
                            errorCallback = callback;

                        ajaxFunctions.makeRequest(url, "GET", null, header, options, callback, errorCallback);
                    },
                    makeRequest: function (url, method, params, headers, options, callback, errorCallback) {
                        var httpRequest = new XMLHttpRequest();

                        if (!httpRequest) {
                            console.log('Giving up :( Cannot create an XMLHTTP instance');
                            return false;
                        }

                        if("GET" == method) {
                            var param_str = "";

                            if(-1 == url.indexOf("?") && params) {
                                url += "?";
                            }

                            if ("object" == typeof params) {
                                for (var prop in params) {
                                    param_str += "&" + prop + "=" + params[prop];
                                }
                            } else if ("string" == typeof params) {
                                param_str = "&" + params;
                            }

                            url += param_str;
                        }

                        for (var key in options) {
                            if (key in httpRequest) {
                                httpRequest[key] = options[key];
                            }
                        }

                        httpRequest.onreadystatechange = function() {
                            if (httpRequest.readyState === XMLHttpRequest.DONE) {
                                // console.log(url);
                                if (httpRequest.status === 200) {
                                    if (callback)
                                        callback(httpRequest.response);
                                    // console.log(httpRequest.responseText);
                                } else {
                                    console.warn('There was a problem with the request.');
                                    if (errorCallback)
                                        errorCallback(httpRequest.responseText);
                                }
                            }
                        };

                        httpRequest.open(method, url);

                        // httpRequest.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
                        for(var k in headers)
                            httpRequest.setRequestHeader(k, headers[k]);

                        if ("POST" == method && params) {
                            httpRequest.send(params)
                        } else {
                            httpRequest.send();
                        }
                    }
                };
            })();

            // ==================== AJAX functions END

            //Finding whether the operating device is mobile or not
            var mobile = (/Android|iPhone|iPad|iPod|BlackBerry|Windows Phone/i)
                        .test(navigator.userAgent || navigator.vendor || window.opera);
            var isAndroid = navigator.userAgent.toLowerCase().indexOf("android") > -1;
            //Finding wheter the brower is Chrome or not
            var isChrome = navigator.userAgent.toLowerCase().indexOf('chrome') > -1;
            var Opera = (navigator.userAgent.match(/Opera|OPR\//) ? true : false);
            var Edge = '-ms-scroll-limit' in document.documentElement.style &&
                    '-ms-ime-align' in document.documentElement.style && !window.navigator.msPointerEnabled;

            var micBtn;
            if (isChrome) {
                micBtn = micImage.off;
                Status.recordingAvailable = true;
                askButton.addClass('assistant-record-icon');
            } else {
                micBtn = micImage.send;
                askButton.addClass("btn-primary");
                Status.recordingAvailable = false;
            }

            // set send button icon
            micIcon.attr("src", micBtn);

            if(assistantOptions['loginTokenElementID']) {
                var authToken = $("#" + assistantOptions['loginTokenElementID']).val()
                assistantOptions['authToken'] = authToken;
            }

            // ========================================================================
            // Listener functions START
            // ========================================================================

            // Query Input ENTER key handler
            queryInput.keypress(function(event) {
                if (13 == event.which) {
                    // $(this).blur();
                    event.preventDefault();
                    verifyAndSendQuery();
                } else {
                    ClearQuery = false;
                }
            });

            // Query Input change send button icon on typing
            queryInput.keyup(function(event) {
                updateSendIcon(false);
            });

            // Query Input clear text on focus
            // queryInput.focus(function(event) {
            //     if (ClearQuery) {
                    // queryInput.val('');
            //     }
            // });

            // Recording button click
            $(document).on('click', '.assistant-record-icon', function(event) {
                switchRecognition();
            });

            // Send query button click
            $(document).on('click', '.assistant-send-icon', function(event) {
                verifyAndSendQuery();
            });

            // Select product button click
            $(document).on('click', '[data-product]', function(event) {
                var product_name = $(this).attr('data-product');
                sendQuery(product_name);
            });

            // Panel minimize icon
            minimizeIcon.click(function(event) {
                var panelBody = $(".panel-body, .panel-footer", assistantPanel);
                if(panelBody.hasClass("hide")) {
                    panelBody.removeClass("hide").animateCss('slideInUp');
                    assistantPanel.removeClass("minimize").animateCss('slideInUp');
                } else {
                    assistantPanel.animateCss('slideOutDown', function () {
                      panelBody.addClass("hide");
                      assistantPanel.addClass("minimize");
                    });
                }
            });

            // For DEV purpose, focus text box when "Q" key pressed
            $(document).keypress(function(event) {
                if (81 == event.which) {
                    event.preventDefault();
                    queryInput.focus();
                }
            });

            // ========================= Listener functions END

            // ========================================================================
            // Speech recognition functions start
            // ========================================================================
            var recognition;

            function startRecognition() {
                try {
                    recognition = new webkitSpeechRecognition();
                    micIcon.attr("src", micImage.on);
                    stopAudio();
                } catch (e) {
                    recognition = { available: "not available" };
                    recognition.start = function() {
                        console.log("This browser does not support accessing the microphone.");
                        ClearQuery = true;
                        Status.isVoicRequest = false;
                        sendQuery();
                    };
                    recognition.stop = function() {
                        console.log("This browser does not support accessing the microphone.");
                        ClearQuery = true;
                        Status.isVoicRequest = false;
                        sendQuery();
                    }
                }

                recognition.onstart = function() {
                    queryInput.val('');
                    followUpQuery = '';
                    ClearQuery = true;
                }

                recognition.onresult = function(event) {
                    var text = "";
                    for (var i = event.resultIndex; i < event.results.length; ++i) {
                        text += event.results[i][0].transcript;
                    }
                    console.log("Speech recognition result : " + text);
                    setInput(text);
                    stopRecognition();
                };
                recognition.onend = function() {
                    stopRecognition();
                };
                recognition.lang = "en-US";
                recognition.start();
            }

            function stopRecognition() {
                if (recognition) {
                    if (!recognition.available) {
                        micIcon.attr("src", micImage.off);
                    }
                    recognition.stop();
                    recognition = null;
                }
            }

            function switchRecognition() {
                if (recognition) {
                    stopRecognition();
                } else {
                    startRecognition();
                }
            }

            // Set Query text and send to query api
            function setInput(text) {
                Status.isVoicRequest = true;
                queryInput.val(text);
                sendQuery();
            }

            // ========================= Speech recognition end

            // Change the send button icon, when typing.
            // Reset icon once query sent
            function updateSendIcon(resetIcon) {
                var txt = queryInput.val().trim();

                if(Status.recordingAvailable == true && (0 == txt.length || resetIcon)) {
                    micIcon.attr("src", micImage.off);
                    askButton.removeClass("assistant-send-icon");
                    askButton.addClass("assistant-record-icon");
                } else {
                    micIcon.attr("src", micImage.send);
                    askButton.removeClass("assistant-record-icon");
                    askButton.addClass("assistant-send-icon");
                }
            }

            // Call sendQuery and set need flags
            function verifyAndSendQuery() {
                ClearQuery = true;
                followUpQuery = '';
                Status.isVoicRequest = false;
                updateSendIcon(true);
                sendQuery();
            }

            // ============================================================================
            // Send Query to API.AI and added query to chat history
            function sendQuery(FollowupQuery) {
                var text = queryInput.val().trim();
                queryInput.val('');

                if(FollowupQuery) {
                    text = FollowupQuery;
                }

                if (text.length == 0) {
                    console.log("No Query text available");
                    return;
                }

                // Stop the currently playing audio
                stopAudio();

                if (!FollowupQuery) {
                    chatHistory.append("<li><div class='col-12'>" +
                        "<div class='bubble mom-card-white tri-right border right-top'>" +
                         text + "</div></div></li>");
                    // Scroll to bottom
                    chatHistory.scrollTop(chatHistory[0].scrollHeight);
                } else {
                    followUpQuery = '';
                }

                ajaxFunctions.sendQuery(text,
                    (function (txt, isVoicRequest) {
                        return function(res) {
                            console.log("Query API response: " + txt);
                            console.log("Requested using voice : " + isVoicRequest);
                            console.log(res);

                            processQueryResponse(res, isVoicRequest);
                        }
                    })(text, Status.isVoicRequest),
                    function(error) {
                        console.log("Query API error");
                        console.log(error);
                    }
                );
            }

            // ========================================================================
            // Text to Speech
            // ========================================================================

            // Send Text to TTS API and get Audio Response
            // Play the audio response
            //
            // If the text is too big, split it into small sentences and send to
            // TTS api. Wait for all the audio reponse to receive. Then play the audio
            // in the correct sequence
            function textToSpeech(text) {
                if(!text)
                    return;
                console.log(text);

                  if (synth.speaking) {
                    console.warn('speechSynthesis.speaking');
                    synth.cancel();
                  }

                  var utterThis = new SpeechSynthesisUtterance(text);
                  utterThis.onend = function (event) {
                    console.log('SpeechSynthesisUtterance.onend');
                  }
                  utterThis.onerror = function (event) {
                    console.error('SpeechSynthesisUtterance.onerror');
                  }
                  for(i = 0; i < voices.length ; i++) {
                    if(voices[i].name.contains("en-US")) {
                      utterThis.voice = voices[i];
                      break;
                    }
                  }
                  utterThis.pitch = 1;
                  utterThis.rate = 1.2;
                  synth.speak(utterThis);
                  return;

                var count = texts.length;

                audioSeqTag++;
                audioQueue = [];

                for(var i in texts) {
                    if(!texts[i])
                        continue;
                    (function (tag, txt, l_i, count) {
                        // This Library will play the audio
                        ajaxFunctions.textToSpeech(txt,
                        (function(l_tag, l_txt, index, l_count) {
                            return function(resData) {
                                console.colorLog("TTS API Audio downloaded: " +
                                 index + " - " + l_tag + " : " + l_txt);
                                // console.log(resData);
                                audioContext.decodeAudioData(resData, function(buffer) {
                                    addAudioBufferToQueue(l_tag, buffer, index, l_count);
                                });
                            };
                        })(tag, txt, l_i, count),
                        (function(l_tag, l_txt, index, l_count) {
                            return function(error) {
                                console.log("TTS API error");
                                console.log(error);
                                addAudioBufferToQueue(l_tag, null, index, l_count);
                            }
                        })(tag, txt, l_i, count));
                    })(audioSeqTag, texts[i], i, count);
                }
            }

            // Collect the audio response in the queue, Once all the audio received
            // start playing the audio
            // The audio reponse will be ArrayBuffer.
            function addAudioBufferToQueue(tag, buffer, index, count) {

                console.log("Tags : " + audioSeqTag + " : " + tag);
                if(audioSeqTag > tag) {
                    console.log("This is an old audio")
                    return;
                }

                // Adding Audio to the queue
                audioQueue[index] = buffer;

                // console.log(audioQueue);
                // console.log(count + " : " + audioQueue.length);

                var queueLen = 0;
                for (var i = audioQueue.length - 1; i >= 0; i--) {
                    if(audioQueue[i])
                        queueLen++;
                }

                if(count == queueLen) {
                    var buf = audioQueue[0];
                    audioQueue.splice(0, 1);
                    playSound(buf);
                }
            }

            // Play the loaded file
            function playSound(buf) {

                if(audioSource) {
                    audioSource.onended = function () {
                        console.log("Dummy audio onEnded");
                    }
                    audioSource.stop();
                }

                if(!buf) {
                    audioEnded();
                }

                // Create a source node from the buffer
                audioSource = audioContext.createBufferSource();;
                var source = audioSource;
                source.buffer = buf;
                // Connect to the final output node (the speakers)
                source.connect(audioContext.destination);
                source.onended = audioEnded;
                // Play immediately
                source.start(0);
            }

            // Stop playing audio and clear audio queue
            function stopAudio() {
                if(audioSource) {
                    audioSource.onended = function () {
                        console.log("Dummy audio onEnded");
                    }
                    audioSource.stop();
                }
                audioSeqTag++;
                if(audioQueue.length > 0) {
                    audioQueue = [];
                }
            }

            // TTS Audio ended callback
            function audioEnded() {
                console.log("Audio Ended");

                if(audioQueue.length > 0) {
                    var buf = audioQueue[0];
                    audioQueue.splice(0, 1);
                    playSound(buf);
                } else if(followUpQuery) {
                    sendQuery(followUpQuery);
                }
            }

            // Split long paragraph into small sentences.
            // Delimitter is . and ,
            function splitSentences(string) {

                if(string.length < 120)
                    return [string];

                var str = string;
                var l = 100;

                var strs = [];
                while(str.length > l){
                    var separator;
                    separator = str.substring(0, l).lastIndexOf('.') > 50 ? '.' : null;
                    if(separator == null)
                        separator = str.substring(0, l).lastIndexOf(',') > 50 ? ',' : ' ';


                    var pos = str.substring(0, l).lastIndexOf(separator);

                    pos = pos <= 0 ? l : pos;
                    strs.push(str.substring(0, pos + 1));
                    var i = str.indexOf(separator, pos)+1;
                    if(i < pos || i > pos+l)
                        i = pos;
                    str = str.substring(i);
                }
                strs.push(str);
                return strs;
            }

            // ========================================================================
            // API.AI query reseponse handler
            //      Display response in chat history
            //      Play audio response
            //      Create card views from the response
            //
            function processQueryResponse(res, isVoicRequest) {
                var fulfillment = res.result.fulfillment;
                var parameters = res.result.parameters;
                var actionIncomplete = res.result.actionIncomplete;
                var action = res.result.action;

                if (parameters && parameters.callEvent && actionIncomplete == false) {
                    followUpQuery = parameters.callEvent;
                }

                if (fulfillment) {
                    var speechText = fulfillment['speech'] || '';
                    var messages = fulfillment['messages'] || [];
                    var fb_data = getDatafromObject(fulfillment, 'data.facebook.attachment.payload', {});

                    var l_container = $("<li><img class='user-icon right-space' src='" + icons.assistant + "'></li>");
                    chatHistory.append(l_container);

                    var contentPlaceholder = $("<div class='bubble right'></div>");
                    l_container.append(contentPlaceholder);

                    // Add Card View
                    for(var i in messages) {
                        var obj = messages[i];
                        if(obj.type == 1 || obj.type == 4) {
                            addCardView(obj, contentPlaceholder);
                        }
                    }

                    // Render List Products
                    if(fb_data['elements']) {
                        listFbCards(fb_data, chatHistory, action);
                    } else {
                        contentPlaceholder.append("<div><span>" + speechText + "</span></div>");
                    }
                    // Scroll to bottom
                    chatHistory.scrollTop(chatHistory[0].scrollHeight);

                    if(true || isVoicRequest) {
                        // Play audio
                        textToSpeech(speechText);
                    } else  if(followUpQuery) {
                        sendQuery(followUpQuery);
                    }
                } else {
                    console.warn("No Fulfillment available in result")
                }
            };

            // Get Value for the key from the JSON object
            function getDatafromObject(json, key, def) {
                var keys = key.split(".");
                var tmp = json;
                for(i=0; i<keys.length && key.length>0; i++)
                {
                    if(tmp[keys[i]] == null) {
                        tmp = null;
                        break;
                    }else
                        tmp = tmp[keys[i]];
                }
                if (tmp == null && def != null)
                    return def;
                else
                    return tmp;
            }

            // Create card views If the response data contains card data
            function addCardView(cardData) {

                var cardTag = '<div class="card card-info"></div>';
                var cardTitleTag = '<h4 class="card-title"></h4>';
                var cardTextTag = '<p class="card-text"></p>';
                var cardImgTag = '<img class="card-img-bottom" src="" alt="Card image cap">';
                var cardBtnTag = '<a class="btn btn-outline-primary btn-left btn-link"></a>';

                var card = $(cardTag);

                if(1 == cardData.type) {
                    console.colorLog("Adding card with image");

                    var title = $(cardTitleTag).text(cardData.title);
                    card.append(title);

                    if(cardData.buttons) {
                        for (var i = 0; i < cardData.buttons.length; i++) {
                            var btn_data = cardData.buttons[i];
                            var temp_btn = $(cardBtnTag)
                                .attr({'href': btn_data['postback'], 'target': '_blank'})
                                .text(btn_data['text']);
                            card.append(temp_btn);
                        }
                        card.addClass('card-outline-info').removeClass('card-info');
                    } else {
                        var img = $(cardImgTag).attr('src', cardData.imageUrl);
                        card.append(img);
                    }

                    chatHistory.append(card);

                } else if (4 == cardData.type) {
                    var data = cardData.payload;
                    console.colorLog("Adding custom card");
                    if (data.title) {
                        var card = $(cardTag);
                        var title = $(cardTitleTag).text(data.title);
                        card.append(title);
                        var text = $(cardTitleTag).text(data.address);
                        card.append(text);
                        chatHistory.append(card);
                    } else if (data.attachment) {
                        var attachment = data.attachment;

                        for(var i in attachment) {
                            var l_attach = attachment[i];

                            switch(l_attach.type) {
                                case 'video':
                                    addVideoCard(l_attach.url_list);
                                    break;
                                case 'url':
                                    var url_list = l_attach.url_list;

                                    for(var i in url_list) {
                                        var l_obj = url_list[i];

                                        var card = $(cardWithYoutubeVideo);
                                        $('.card-img-bottom', card).attr('src', getYoutubeEmbedUrl(videoUrl));
                                        $('.card-title', card).html("");
                                        chatHistory.append(card);
                                    }
                                    break;
                            }
                        }

                    }
                }
            }

            // Create list of  products
            function listFbCards(fb_cards, content_placeholder, action) {
                var products = fb_cards['elements'];
                var view_more = fb_cards['buttons'] || [];

                var cardWithImg = '<div class="card card-outline-info product"></div>';
                var cardTitleTag = '<h4 class="card-title"></h4>';
                var cardTextTag = '<p class="card-text"></p>';
                var imageTag = '<img class="card-img-right vert-center" src="" alt="Card image cap">';
                var btnTag = '<a class="btn btn-outline-primary btn-left btn-link"></a>';
                var seeMoreBtn = '<a class="btn btn-outline-primary btn-link"></a>';

                for (var i = 0; i < products.length; i++) {
                    var product = products[i] || {};
                    var pro_buttons = product['buttons'] || [];
                    var pro_image = product['image_url'] || '';

                    var temp_card = $(cardWithImg);

                    var title = $(cardTitleTag).text(product['title']);
                    temp_card.append(title);

                    if(pro_image) {
                        var product_img = $(imageTag).attr('src', pro_image);
                        temp_card.append(product_img);
                    }

                    // Showing subtitle for only the selected product
                    if(product['subtitle']) {
                        var subtitle = product['subtitle'];
                        // Replace \n and \r with <br> tag
                        subtitle = subtitle.replace(/\r?\n|\r/g, '<br>');
                        var txt = $(cardTextTag).html(subtitle);
                        temp_card.append(txt);
                    }

                    for (var j = 0; j < pro_buttons.length; j++) {
                        var btn_data = pro_buttons[j];
                        var select_btn = $(btnTag).text(btn_data['title']);
                        temp_card.append(select_btn);

                        if('postback' == btn_data['type']) {
                            select_btn.attr('data-product', btn_data['payload']);
                        } else if ('web_url' == btn_data['type']) {
                            select_btn.attr({'href': btn_data['url'], 'target': '_blank'})
                                .removeClass('btn-left');
                            product_img && product_img.addClass('img-block');
                        }
                    }

                    content_placeholder.append(temp_card);
                }

                for (var i = 0; i < view_more.length; i++) {
                    var btn_data = view_more[i];
                    var temp_btn = $(seeMoreBtn)
                            .text(btn_data['title'])
                            .attr('data-product', btn_data['payload']);
                    content_placeholder.append(temp_btn);
                }

            }

            // =================================================================
            // Play Welcome
            // if(assistantOptions.loginToken) {
            //     ajaxFunctions.getUserProfile(assistantOptions.loginToken, function (res) {
            //         console.log(res);
            //         userProfile = res;
            //         playWelcomeIntent();
            //     });
            // } else {
                playWelcomeIntent();
            // }

            function playWelcomeIntent() {
                var welcomeCode = cookie.get("canPlayWelcome");
                var canPlayWelcome = false;
                if(welcomeCode == null) {
                    canPlayWelcome = true;
                    if(assistantOptions.loginToken)
                        cookie.set("canPlayWelcome", 1);
                    else
                        cookie.set("canPlayWelcome", 0);
                    console.log("First time playing welcome");
                } else if(0 == welcomeCode && assistantOptions.loginToken) {
                    canPlayWelcome = true;
                    cookie.set("canPlayWelcome", 1);
                    console.log("After login playing welcome");
                } else {
                    console.log("Not playing welcome");
                }

                if(canPlayWelcome) {
                    Status.isVoicRequest = true;
                    sendQuery('welcome');
                }
            }
            // =================================================================
        };
        // =====================================================================
        // StartAssistantKit END
        // =====================================================================

        // Create Card view with Video Tag
        function addVideoCard(url_list) {
            var cardWithYoutubeVideo = '<div class="card card-info"><div style="position:relative;height:0;padding-bottom:56.25%">' +
                '<iframe class="card-img-bottom" src="" width="640" height="360" frameborder="0" ' +
                'style="position:absolute;width:100%;height:100%;left:0" allowfullscreen></iframe></div></div>';

            var cardWithVideo = '<div class="card card-info"><video width="320" height="240" controls>' +
                '<source src="" type="" class="card-img-bottom">Your browser does not support the video tag.</video></div>';

            for(var i in url_list) {
                var videoUrl = url_list[i]
                if (-1 != videoUrl.indexOf("youtu")) {
                    var card = $(cardWithYoutubeVideo);
                    $('.card-img-bottom', card).attr('src', getYoutubeEmbedUrl(videoUrl));
                    chatHistory.append(card);
                } else {
                    var card = $(cardWithVideo);
                    // mp4 - MIME-type video/mp4
                    // webm - MIME-type video/webm
                    // ogg - MIME-type video/ogg
                    var videoType;
                    if(-1 != videoUrl.indexOf('.mp4')) {
                        videoType = 'video/mp4';
                    } else if(-1 != videoUrl.indexOf('.webm')) {
                        videoType = 'video/webm';
                    } else if(-1 != videoUrl.indexOf('.ogg')) {
                        videoType = 'video/ogg';
                    }

                    $('.card-img-bottom', card).attr('src', videoUrl);
                    $('.card-img-bottom', card).attr('type', videoType);
                    chatHistory.append(card);
                }
            }
        };

        function getYoutubeEmbedUrl(videoUrl) {
            if(videoUrl.indexOf("watch") != -1) {
                videoUrl = videoUrl.replace("watch?v=", "embed/");
                videoUrl += "?ecver=2";
            }
            return videoUrl;
        };

        // Assistant Kit END
        // =====================================================================
        //

        var cookie = {
            // Read cookie
            get : function getCookie (name) {
                var cookies = {};
                var c = document.cookie.split('; ');
                for (i = c.length - 1; i >= 0; i--) {
                    var C = c[i].split('=');
                    cookies[C[0]] = C[1];
                }
                return cookies[name] || null;
            },

            // create cookie
            set : function createCookie (name, value, minutes) {
                if (minutes) {
                    var date = new Date();
                    date.setTime(date.getTime() + (minutes * 60 * 1000));
                    var expires = "; expires=" + date.toGMTString();
                } else
                    var expires = "";
                document.cookie = name + "=" + value + expires + "; path=/";
            },

            remove : function deleteCookie (name) {
                var date = new Date();
                date.setTime(date.getTime() - 60 * 1000);
                document.cookie = name + "=; expires=" + date.toGMTString() + "; path=/";
            }
        };

        // Create <link> tag in <head> tag
        var createLinkTag = function(fileName) {
            var head = document.getElementsByTagName('head')[0];
            var link = document.createElement('link');
            link.rel = 'stylesheet';
            link.type = 'text/css';
            link.href = fileName;
            head.appendChild(link);
        };

        // Create <script> tag in <head> tag
        var createScriptTag = function(url, callback) {
            if (!callback) callback = function() {};
            var addScript = document.createElement('script');
            addScript.type = "text/javascript";
            addScript.onload = callback;
            addScript.src = url;
            document.head.appendChild(addScript);
        };

        // Load required JS Libraries
        var customCSS = cssDirectory + "custom.css"
        var animateCSS = cssDirectory + "animate.css"
        var jqueryJS = "https://ajax.googleapis.com/ajax/libs/jquery/3.1.1/jquery.min.js"

        createLinkTag(customCSS);
        createLinkTag(animateCSS);

        // Check jQuery library already exists, If not create script tag. Then start kit
        if (!window.jQuery) {
            createScriptTag(jqueryJS, function () {
                $ = window.jQuery;
                startAssistantKit();
            });
        } else {
            $ = window.jQuery;
            startAssistantKit();
        }
    };


    // Get the options provided in the script tag data-options
    // Parse the key=value pairs and store it for local usage
    var scriptTag = document.querySelectorAll('script[data-options]')[0];

    var API_ACCESS_TOKEN = null;
    var assistantOptions = {};

    var params = scriptTag.getAttribute('data-options')
                .replace(/\n/g, "").replace(/\s+/g, "");
    scriptTag.removeAttribute('data-options', '')
    var queries = params.split('&');
    if (queries.length > 0) {
        for (var i = 0; i < queries.length; i++) {
            var key = queries[i].split('=')[0];
            var value = queries[i].split('=')[1];

            switch (key) {
                case "API_ACCESS_TOKEN":
                    API_ACCESS_TOKEN = value;
                    break;
                default:
                    assistantOptions[key] = value;
            }
        }
    }

})();
