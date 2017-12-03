'use strict';

const apiai = require('apiai');
const config = require('./config');
const express = require('express');
const crypto = require('crypto');
const bodyParser = require('body-parser');
const request = require('request');
const app = express();
const uuid = require('uuid');
var admin = require("firebase-admin");
var refPath = '/Subscribe/Users/Other';
admin.initializeApp({
	credential: admin.credential.cert({
		projectId: "srmmessfood",
		clientEmail: "firebase-adminsdk-76myt@srmmessfood.iam.gserviceaccount.com",
		privateKey: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCtxflAlaQG+Vsq\ns0+uvVUajCv5hKhVGit3aZDucFHC3x0FUuJ55BJIN//YUQBJ3vL+UVIbo5l8DxxN\nAyXJIv+Tt7mBsvX17FOHtJXGqZm0Rqlsu/4hi38Ms6s3cM80vkxifeeC0mEhRDbn\npRExibYK5pgwQQ8oIkrj4abw5ZlYlSFb34k/AHvN0MM0ZM0/+Z1dZ2pUNvunCx1y\nxOmTso03L+gQ8QwVhnu0zJ+xL3RLgjxthMkfCueOa3mQPrroVq6+utGbBbHk9Swy\no6xz3K1gUksHAMN6p66YkZPkXYm6hNuTZ1Qwzs6EqKCmUWQqZN2gbIuIS3D3SpxN\nnIZwBXKvAgMBAAECggEAKABAhhtsLKbN06B/ISw4IOpPXRqqXRyvEMfeMuTsDT2q\nwoT32TMk+jbZ0AOlW1vU97HkgrRAKoyX6SpmUkyaJHjQXQjDEZ8bA0wQhjCYTyVM\n7ti/gR1JW7UoHpT7PZronmt5FWY0MaIwOVaIBK08mHnIYqM3R/fM4XQaJ63ShM89\ngY2/rwc/SJVXjOJUFidV1y33oPhxPb53C9WDI+GLDiu8rpeZi2nCHMSd/767M4SB\nM4Mw42buCKljhVTC6GifIew8ldDLyCvyk1iqWBE7CBm+EHHr/hmHGDMPNNoQxtGY\nJ7VyIPIvY53Qu05jet5KZilXQRsfHi0osruHr7lfoQKBgQDvdbLVpsBCH7zXVrl5\nsfz/eyCvbBBdySvo/CSE6UyMpjUfT4ODO58akTBCamlgiKZeFhSlzci3HMqNO8Lc\nbF7H6rRV5q5jO7RytHjbpmGYP/ymBoA5bjk1SK1eRPejGjjYKZ+nz0am4cBCA5tF\ngXYzV51wHDSCeoAWG1JgPf9KiQKBgQC5xsKN13aFo0ZRcNRo5NiKOYCMSwNieIB3\n7bVIcFoBhX6wjTmsgO2h2fOKPTl8oLAB6LkiJ0eG9e6BCZOFNJpof7tvnxJrHoy8\nFYwFf0JaK0ib+Jg4mF6AnRDH99IjSywYKV75nnJTlyT6dpsgB7FzvLbZz6AkZOS+\nd/73vvQldwKBgQCac0ERG0gAnnXwMwjY3JvBsYpIe5wm0d3XneJ0NAJi6cVz15aM\n68TYnvMQs5AaaqlcIEPbGdsveIuRAw3RnLiZm+ILUgoDCXx/S7Z0fmGOkR8Fe0Xz\nRQvzOVhRaIyNkBlAG8DVvRTmCNA4BBl/gFxcC1QJ/rdDvX2mRKMiXnqueQKBgE79\nBJG8j+dIQci02Ytz6eHziwWbi2fd5nmXd2HCa3KEKRa2JVSESQVtHxCi8YNc6xkU\ns0qjOtVWUb9JrBCSCijuTmqqTvF+vsXlv3BC6JpgFvJCI67EkkHLBmyPoShiePAY\n/wnRZbjG5fEcZt6ahse38GLx1ZxDzcJyUNVTuokHAoGBAO8tJpqcMdUj4FVbxVob\njOBuR7xlTww+RKNHemxd9riGly3w3wHFaqHQ8OH+7CUWOM/DcGuIDQZjZaWiai9P\nh25UD7kShn4u5a9IhPuDs2hJi5pF2r64c1Ij/DOUQpivbxUpU+b9/SH7ozjmM5OE\n5W5y0lSr2oyrxaekc3F8yKJ3\n-----END PRIVATE KEY-----\n"
	}),
	databaseURL: "https://srmmessfood.firebaseio.com/"
});


// Messenger API parameters
if (!config.FB_PAGE_TOKEN) {
	throw new Error('missing FB_PAGE_TOKEN');
}
if (!config.FB_VERIFY_TOKEN) {
	throw new Error('missing FB_VERIFY_TOKEN');
}
if (!config.API_AI_CLIENT_ACCESS_TOKEN) {
	throw new Error('missing API_AI_CLIENT_ACCESS_TOKEN');
}
if (!config.FB_APP_SECRET) {
	throw new Error('missing FB_APP_SECRET');
}
if (!config.SERVER_URL) { //used for ink to static files
	throw new Error('missing SERVER_URL');
}



app.set('port', (process.env.PORT || 5000))

//verify request came from facebook
app.use(bodyParser.json({
	verify: verifyRequestSignature
}));

//serve static files in the public directory
app.use(express.static('public'));

// Process application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({
	extended: false
}))

// Process application/json
app.use(bodyParser.json())


const apiAiService = apiai(config.API_AI_CLIENT_ACCESS_TOKEN, {
	language: "en",
	requestSource: "fb"
});
const sessionIds = new Map();

function getSubscribedUsers(callback) {
	var messData;
	console.log("REFERENCE:"+refPath);
	admin.database().ref(refPath).once('value').then(function (snapshot) {
		messData = snapshot.val();
		console.log(JSON.stringify(messData));
		callback(messData);
	});
}

function getSubscribedUser(reference, callback){
	var messData;
	console.log("REFERENCE:"+reference);
	admin.database().ref(reference).once('value').then(function (snapshot) {
		messData = snapshot.val().status.status;
		if(messData){
			console.log(JSON.stringify(messData));
			callback(messData);
		}
		else{
			return "0";
		}
	});
}
function saveSubscribedUser(ID, valueToSave) {
	admin.database().ref(refPath+'/'+ID+'/status/ID').set(ID);
	admin.database().ref(refPath+'/'+ID+'/status/status').set(valueToSave);
}

function sendSubscriptionStatus(senderID){
	getSubscribedUser(refPath+'/'+senderID, function(result){
		console.log(result);
		if(result=='0'){
			sendTextMessage(senderID, "You are not in the subscriber list");
		}
		else if(result=='1'){
			sendTextMessage(senderID, "You are in the subscriber list!");
		}
	});
}
// Index route
app.get('/', function (req, res) {
	saveSubscribedUser(1103399319763620, '1');
	res.send('Hello world, I am a chat bot')
})

app.get('/sendBreakfast', function(req, res){
	//sendToApiAi(1103399319763620,"Breakfast");
	getSubscribedUsers(function(result){
		result.forEach(element => {
			if(element.status=='1'){
				console.log(element.ID);
			}
		});
	});
	res.send('Okay sending breakfast');
})

app.get('/sendLunch', function(req, res){
	//sendToApiAi(1103399319763620,"Lunch");
	res.send('Okay sending lunch');
})

app.get('/sendSnacks', function(req, res){
	sendToApiAi(1103399319763620,"Snacks");
	res.send('Okay sending snacks');
})

app.get('/sendDinner', function(req, res){
	sendToApiAi(1103399319763620,"Dinner");
	res.send('Okay sending dinner');
})

// for Facebook verification
app.get('/messengerwebhook/', function (req, res) {
	console.log("request");
	console.log(JSON.stringify(req));
	if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === config.FB_VERIFY_TOKEN) {
		res.status(200).send(req.query['hub.challenge']);
	} else {
		console.error("Failed validation. Make sure the validation tokens match.");
		res.sendStatus(403);
	}
})

/*
 * All callbacks for Messenger are POST-ed. They will be sent to the same
 * webhook. Be sure to subscribe your app to your page to receive callbacks
 * for your page. 
 * https://developers.facebook.com/docs/messenger-platform/product-overview/setup#subscribe_app
 *
 */
app.post('/messengerwebhook/', function (req, res) {

	var data = req.body;
	// Make sure this is a page subscription
	if (data.object == 'page') {
		// Iterate over each entry
		// There may be multiple if batched
		data.entry.forEach(function (pageEntry) {
			var pageID = pageEntry.id;
			var timeOfEvent = pageEntry.time;

			// Iterate over each messaging event
			pageEntry.messaging.forEach(function (messagingEvent) {
				if (messagingEvent.optin) {
					receivedAuthentication(messagingEvent);
				} else if (messagingEvent.message) {
					receivedMessage(messagingEvent);
				} else if (messagingEvent.delivery) {
					receivedDeliveryConfirmation(messagingEvent);
				} else if (messagingEvent.postback) {
					receivedPostback(messagingEvent);
				} else if (messagingEvent.read) {
					receivedMessageRead(messagingEvent);
				} else if (messagingEvent.account_linking) {
					receivedAccountLink(messagingEvent);
				} else {
					console.log("Webhook received unknown messagingEvent: ", messagingEvent);
				}
			});
		});

		// Assume all went well.
		// You must send back a 200, within 20 seconds
		res.sendStatus(200);
	}
});

function receivedMessage(event) {

	var senderID = event.sender.id;
	var recipientID = event.recipient.id;
	var timeOfMessage = event.timestamp;
	var message = event.message;

	if (!sessionIds.has(senderID)) {
		sessionIds.set(senderID, uuid.v1());
	}
	//console.log("Received message for user %d and page %d at %d with message:", senderID, recipientID, timeOfMessage);
	//console.log(JSON.stringify(event));

	var isEcho = message.is_echo;
	var messageId = message.mid;
	var appId = message.app_id;
	var metadata = message.metadata;

	// You may get a text or attachment but not both
	var messageText = message.text;
	var messageAttachments = message.attachments;
	var quickReply = message.quick_reply;

	if (isEcho) {
		handleEcho(messageId, appId, metadata);
		return;
	} else if (quickReply) {
		handleQuickReply(senderID, quickReply, messageId);
		return;
	}


	if (messageText) {
		//send message to api.ai
		sendToApiAi(senderID, messageText);
	} else if (messageAttachments) {
		handleMessageAttachments(messageAttachments, senderID);
	}
}


function handleMessageAttachments(messageAttachments, senderID) {
	//for now just reply
	sendTextMessage(senderID, "Attachment received. Thank you.");
}

function handleQuickReply(senderID, quickReply, messageId) {
	var quickReplyPayload = quickReply.payload;
	console.log("Quick reply for message %s with payload %s", messageId, quickReplyPayload);
	//send payload to api.ai
	sendToApiAi(senderID, quickReplyPayload);
}

//https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-echo
function handleEcho(messageId, appId, metadata) {
	// Just logging message echoes to console
	console.log("Received echo for message %s and app %d with metadata %s", messageId, appId, metadata);
}

function handleApiAiAction(sender, action, responseText, contexts, parameters) {
	switch (action) {
		default:
			//unhandled action, just send back the text
			sendTextMessage(sender, responseText);
	}
}

function handleMessage(message, sender) {
	switch (message.type) {
		case 0: //text
			sendTextMessage(sender, message.speech);
			break;
		case 2: //quick replies
			let replies = [];
			for (var b = 0; b < message.replies.length; b++) {
				let reply =
					{
						"content_type": "text",
						"title": message.replies[b],
						"payload": message.replies[b]
					}
				replies.push(reply);
			}
			sendQuickReply(sender, message.title, replies);
			break;
		case 3: //image
			sendImageMessage(sender, message.imageUrl);
			break;
		case 4:
			// custom payload
			var messageData = {
				recipient: {
					id: sender
				},
				message: message.payload.facebook

			};

			callSendAPI(messageData);

			break;
	}
}


function handleCardMessages(messages, sender) {

	let elements = [];
	for (var m = 0; m < messages.length; m++) {
		let message = messages[m];
		let buttons = [];
		for (var b = 0; b < message.buttons.length; b++) {
			let isLink = (message.buttons[b].postback.substring(0, 4) === 'http');
			let button;
			if (isLink) {
				button = {
					"type": "web_url",
					"title": message.buttons[b].text,
					"url": message.buttons[b].postback
				}
			} else {
				button = {
					"type": "postback",
					"title": message.buttons[b].text,
					"payload": message.buttons[b].postback
				}
			}
			buttons.push(button);
		}


		let element = {
			"title": message.title,
			"image_url": message.imageUrl,
			"subtitle": message.subtitle,
			"buttons": buttons
		};
		elements.push(element);
	}
	sendGenericMessage(sender, elements);
}


function handleApiAiResponse(sender, response) {
	let responseText = response.result.fulfillment.speech;
	let responseData = response.result.fulfillment.data;
	let messages = response.result.fulfillment;
	let action = response.result.action;
	let contexts = response.result.contexts;
	let parameters = response.result.parameters;
	var quickReply = true;
	var listReply = true;
	try {
		messages = messages.data.google.rich_response.suggestions;
	} catch (e) {
		console.log("NO quick reply");
		quickReply = false;
	}
	try {
		messages = messages.data.google.system_intent.spec.option_value_spec.list_select;
	}
	catch (e) {
		console.log("NO list reply");
		listReply = false;
	}
	sendTypingOff(sender);

	if (quickReply) {
		let replies = [];
		messages.forEach(element => {
			let reply =
				{
					"content_type": "text",
					"title": element.title,
					"payload": element.title
				}
			replies.push(reply);
		});
		sendQuickReply(sender, responseText, replies);
	}
	else if (listReply) {
		let replies = [];
		messages.items.forEach(element => {
			let reply = {
				"title": element.title,
				"subtitle": element.description,
				"buttons": [{
					"title": element.title,
					"type": "postback",
					"payload": element.option_info.key
				}
				]
			};
			replies.push(reply);
		});
		sendTextMessage(sender, response.result.fulfillment.speech);
		sendListMessage(sender, replies);
	}
	else if (responseText == '' && !isDefined(action)) {
		//api ai could not evaluate input.
		console.log('Unknown query' + response.result.resolvedQuery);
		sendTextMessage(sender, "I'm not sure what you want. Can you be more specific?");
	} else if (isDefined(action)) {
		handleApiAiAction(sender, action, responseText, contexts, parameters);
	} else if (isDefined(responseData) && isDefined(responseData.facebook)) {
		try {
			console.log('Response as formatted message' + responseData.facebook);
			sendTextMessage(sender, responseData.facebook);
		} catch (err) {
			sendTextMessage(sender, err.message);
		}
	} else if (isDefined(responseText)) {

		sendTextMessage(sender, responseText);
	}
}

function sendToApiAi(sender, text) {

	sendTypingOn(sender);
	let apiaiRequest = apiAiService.textRequest(text, {
		sessionId: sender
	});

	apiaiRequest.on('response', (response) => {
		if (isDefined(response.result)) {
			handleApiAiResponse(sender, response);
		}
	});

	apiaiRequest.on('error', (error) => console.error(error));
	apiaiRequest.end();
}




function sendTextMessage(recipientId, text) {
	var messageData = {
		recipient: {
			id: recipientId
		},
		message: {
			text: text
		}
	}
	callSendAPI(messageData);
}

/*
 * Send an image using the Send API.
 *
 */
function sendImageMessage(recipientId, imageUrl) {
	var messageData = {
		recipient: {
			id: recipientId
		},
		message: {
			attachment: {
				type: "image",
				payload: {
					url: imageUrl
				}
			}
		}
	};

	callSendAPI(messageData);
}

/*
 * Send a Gif using the Send API.
 *
 */
function sendGifMessage(recipientId) {
	var messageData = {
		recipient: {
			id: recipientId
		},
		message: {
			attachment: {
				type: "image",
				payload: {
					url: config.SERVER_URL + "/assets/instagram_logo.gif"
				}
			}
		}
	};

	callSendAPI(messageData);
}

/*
 * Send audio using the Send API.
 *
 */
function sendAudioMessage(recipientId) {
	var messageData = {
		recipient: {
			id: recipientId
		},
		message: {
			attachment: {
				type: "audio",
				payload: {
					url: config.SERVER_URL + "/assets/sample.mp3"
				}
			}
		}
	};

	callSendAPI(messageData);
}

/*
 * Send a video using the Send API.
 * example videoName: "/assets/allofus480.mov"
 */
function sendVideoMessage(recipientId, videoName) {
	var messageData = {
		recipient: {
			id: recipientId
		},
		message: {
			attachment: {
				type: "video",
				payload: {
					url: config.SERVER_URL + videoName
				}
			}
		}
	};

	callSendAPI(messageData);
}

/*
 * Send a video using the Send API.
 * example fileName: fileName"/assets/test.txt"
 */
function sendFileMessage(recipientId, fileName) {
	var messageData = {
		recipient: {
			id: recipientId
		},
		message: {
			attachment: {
				type: "file",
				payload: {
					url: config.SERVER_URL + fileName
				}
			}
		}
	};

	callSendAPI(messageData);
}



/*
 * Send a button message using the Send API.
 *
 */
function sendButtonMessage(recipientId, text, buttons) {
	var messageData = {
		recipient: {
			id: recipientId
		},
		message: {
			attachment: {
				type: "template",
				payload: {
					template_type: "button",
					text: text,
					buttons: buttons
				}
			}
		}
	};

	callSendAPI(messageData);
}


function sendGenericMessage(recipientId, elements) {
	var messageData = {
		recipient: {
			id: recipientId
		},
		message: {
			attachment: {
				type: "template",
				payload: {
					template_type: "generic",
					elements: elements
				}
			}
		}
	};

	callSendAPI(messageData);
}

function sendListMessage(recipientId, elements) {
	var messageData = {
		recipient: {
			id: recipientId
		},
		message: {
			attachment: {
				type: "template",
				payload: {
					"template_type": "list",
					"top_element_style": "compact",
					"elements": elements
				}
			}
		}
	};

	callSendAPI(messageData);
}


function sendReceiptMessage(recipientId, recipient_name, currency, payment_method,
	timestamp, elements, address, summary, adjustments) {
	// Generate a random receipt ID as the API requires a unique ID
	var receiptId = "order" + Math.floor(Math.random() * 1000);

	var messageData = {
		recipient: {
			id: recipientId
		},
		message: {
			attachment: {
				type: "template",
				payload: {
					template_type: "receipt",
					recipient_name: recipient_name,
					order_number: receiptId,
					currency: currency,
					payment_method: payment_method,
					timestamp: timestamp,
					elements: elements,
					address: address,
					summary: summary,
					adjustments: adjustments
				}
			}
		}
	};

	callSendAPI(messageData);
}

/*
 * Send a message with Quick Reply buttons.
 *
 */
function sendQuickReply(recipientId, text, replies, metadata) {
	var messageData = {
		recipient: {
			id: recipientId
		},
		message: {
			text: text,
			metadata: isDefined(metadata) ? metadata : '',
			quick_replies: replies
		}
	};

	callSendAPI(messageData);
}

/*
 * Send a read receipt to indicate the message has been read
 *
 */
function sendReadReceipt(recipientId) {

	var messageData = {
		recipient: {
			id: recipientId
		},
		sender_action: "mark_seen"
	};

	callSendAPI(messageData);
}

/*
 * Turn typing indicator on
 *
 */
function sendTypingOn(recipientId) {


	var messageData = {
		recipient: {
			id: recipientId
		},
		sender_action: "typing_on"
	};

	callSendAPI(messageData);
}

/*
 * Turn typing indicator off
 *
 */
function sendTypingOff(recipientId) {


	var messageData = {
		recipient: {
			id: recipientId
		},
		sender_action: "typing_off"
	};

	callSendAPI(messageData);
}

/*
 * Send a message with the account linking call-to-action
 *
 */
function sendAccountLinking(recipientId) {
	var messageData = {
		recipient: {
			id: recipientId
		},
		message: {
			attachment: {
				type: "template",
				payload: {
					template_type: "button",
					text: "Welcome. Link your account.",
					buttons: [{
						type: "account_link",
						url: config.SERVER_URL + "/authorize"
					}]
				}
			}
		}
	};

	callSendAPI(messageData);
}


function greetUserText(userId) {
	//first read user firstname
	request({
		uri: 'https://graph.facebook.com/v2.7/' + userId,
		qs: {
			access_token: config.FB_PAGE_TOKEN
		}

	}, function (error, response, body) {
		if (!error && response.statusCode == 200) {

			var user = JSON.parse(body);

			if (user.first_name) {
				console.log("FB user: %s %s, %s",
					user.first_name, user.last_name, user.gender);

				sendTextMessage(userId, "Welcome " + user.first_name + '!');
			} else {
				console.log("Cannot get data for fb user with id",
					userId);
			}
		} else {
			console.error(response.error);
		}

	});
}

/*
 * Call the Send API. The message data goes in the body. If successful, we'll 
 * get the message id in a response 
 *
 */
function callSendAPI(messageData) {
	request({
		uri: 'https://graph.facebook.com/v2.6/me/messages',
		qs: {
			access_token: config.FB_PAGE_TOKEN
		},
		method: 'POST',
		json: messageData

	}, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			var recipientId = body.recipient_id;
			var messageId = body.message_id;

			if (messageId) {
				console.log("Successfully sent message with id %s to recipient %s",
					messageId, recipientId);
			} else {
				console.log("Successfully called Send API for recipient %s",
					recipientId);
			}
		} else {
			console.error("Failed calling Send API", response.statusCode, response.statusMessage, body.error);
		}
	});
}



/*
 * Postback Event
 *
 * This event is called when a postback is tapped on a Structured Message. 
 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/postback-received
 * 
 */
function receivedPostback(event) {
	var senderID = event.sender.id;
	var recipientID = event.recipient.id;
	var timeOfPostback = event.timestamp;

	// The 'payload' param is a developer-defined field which is set in a postback 
	// button for Structured Messages. 
	var payload = event.postback.payload;

	switch (payload) {
		case 'DO_SUBSCRIBE':
			saveSubscribedUser(senderID, '1');
			sendTextMessage(senderID, "You have been added to the subscriber list!");
			break;
		case 'DO_UNSUBSCRIBE':
			saveSubscribedUser(senderID, '0');
			sendTextMessage(senderID, "You have been removed from the subscriber list!");
			break;
		case 'SUBSCRIPTION_STATUS':
			sendSubscriptionStatus(senderID);
			break;
		default:
			sendToApiAi(senderID, payload);
			break;

	}

	console.log("Received postback for user %d and page %d with payload '%s' " +
		"at %d", senderID, recipientID, payload, timeOfPostback);

}


/*
 * Message Read Event
 *
 * This event is called when a previously-sent message has been read.
 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-read
 * 
 */
function receivedMessageRead(event) {
	var senderID = event.sender.id;
	var recipientID = event.recipient.id;

	// All messages before watermark (a timestamp) or sequence have been seen.
	var watermark = event.read.watermark;
	var sequenceNumber = event.read.seq;

	console.log("Received message read event for watermark %d and sequence " +
		"number %d", watermark, sequenceNumber);
}

/*
 * Account Link Event
 *
 * This event is called when the Link Account or UnLink Account action has been
 * tapped.
 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/account-linking
 * 
 */
function receivedAccountLink(event) {
	var senderID = event.sender.id;
	var recipientID = event.recipient.id;

	var status = event.account_linking.status;
	var authCode = event.account_linking.authorization_code;

	console.log("Received account link event with for user %d with status %s " +
		"and auth code %s ", senderID, status, authCode);
}

/*
 * Delivery Confirmation Event
 *
 * This event is sent to confirm the delivery of a message. Read more about 
 * these fields at https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-delivered
 *
 */
function receivedDeliveryConfirmation(event) {
	var senderID = event.sender.id;
	var recipientID = event.recipient.id;
	var delivery = event.delivery;
	var messageIDs = delivery.mids;
	var watermark = delivery.watermark;
	var sequenceNumber = delivery.seq;

	if (messageIDs) {
		messageIDs.forEach(function (messageID) {
			console.log("Received delivery confirmation for message ID: %s",
				messageID);
		});
	}

	console.log("All message before %d were delivered.", watermark);
}

/*
 * Authorization Event
 *
 * The value for 'optin.ref' is defined in the entry point. For the "Send to 
 * Messenger" plugin, it is the 'data-ref' field. Read more at 
 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/authentication
 *
 */
function receivedAuthentication(event) {
	var senderID = event.sender.id;
	var recipientID = event.recipient.id;
	var timeOfAuth = event.timestamp;

	// The 'ref' field is set in the 'Send to Messenger' plugin, in the 'data-ref'
	// The developer can set this to an arbitrary value to associate the 
	// authentication callback with the 'Send to Messenger' click event. This is
	// a way to do account linking when the user clicks the 'Send to Messenger' 
	// plugin.
	var passThroughParam = event.optin.ref;

	console.log("Received authentication for user %d and page %d with pass " +
		"through param '%s' at %d", senderID, recipientID, passThroughParam,
		timeOfAuth);

	// When an authentication is received, we'll send a message back to the sender
	// to let them know it was successful.
	sendTextMessage(senderID, "Authentication successful");
}

/*
 * Verify that the callback came from Facebook. Using the App Secret from 
 * the App Dashboard, we can verify the signature that is sent with each 
 * callback in the x-hub-signature field, located in the header.
 *
 * https://developers.facebook.com/docs/graph-api/webhooks#setup
 *
 */
function verifyRequestSignature(req, res, buf) {
	var signature = req.headers["x-hub-signature"];

	if (!signature) {
		throw new Error('Couldn\'t validate the signature.');
	} else {
		var elements = signature.split('=');
		var method = elements[0];
		var signatureHash = elements[1];
		var expectedHash = crypto.createHmac('sha1', config.FB_APP_SECRET)
			.update(buf)
			.digest('hex');
		if (signatureHash != expectedHash) {
			throw new Error("Couldn't validate the request signature.");
		}
	}
}

function isDefined(obj) {
	if (typeof obj == 'undefined') {
		return false;
	}

	if (!obj) {
		return false;
	}

	return obj != null;
}

// Spin up the server
app.listen(app.get('port'), function () {
	console.log('running on port', app.get('port'))
})
