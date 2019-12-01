'use strict';

// Imports dependencies and set up http server
const
  express = require('express'),
  bodyParser = require('body-parser'),
  app = express().use(bodyParser.json()); // creates express http server
const request = require('request');

  const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;

// Sets server port and logs message on success
app.listen(process.env.PORT || 80, () => console.log('webhook is listening'));
// Creates the endpoint for our webhook 
app.post('/webhook', (req, res) => {  
 
  let body = req.body;

  // Checks this is an event from a page subscription
  if (body.object === 'page') {

    body.entry.forEach(function(entry) {

      // Gets the body of the webhook event
      let webhook_event = entry.messaging[0];
      console.log(webhook_event);
    
     / Get the sender PSID
      let sender_psid = webhook_event.sender.id;
      console.log('Sender PSID: ' + sender_psid);
      // console.log("IP: " + req.ip);
      
      // // var ip = "207.97.227.239";
      // let geo = geoip.lookup(req.ip);
      // console.log(geo);

      // console.log("------------------------------------------------------");
      console.log("req.headers['x-forwarded-for']: " + req.headers['x-forwarded-for']);
      console.log("req.connection.remoteAddress: " + req.connection.remoteAddress);
      console.log("req.socket.remoteAddress: " + req.socket.remoteAddress);
    
      // Check if the event is a message or postback and
      // pass the event to the appropriate handler function
      if (webhook_event.message) {
        handleMessage(sender_psid, webhook_event.message);        
      } else if (webhook_event.postback) {
        handlePostback(sender_psid, webhook_event.postback);
      }
      
    });

    // Returns a '200 OK' response to all requests
    res.status(200).send('EVENT_RECEIVED');
  } else {
    // Returns a '404 Not Found' if event is not from a page subscription
    res.sendStatus(404);
  }

});
// Adds support for GET requests to our webhook
app.get('/webhook', (req, res) => {

  // Your verify token. Should be a random string.
  let VERIFY_TOKEN = "verify_mybot"
    
  // Parse the query params
  let mode = req.query['hub.mode'];
  let token = req.query['hub.verify_token'];
  let challenge = req.query['hub.challenge'];
    
  // Checks if a token and mode is in the query string of the request
  if (mode && token) {
  
    // Checks the mode and token sent is correct
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      
      // Responds with the challenge token from the request
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);
    
    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);      
    }
  }
});

function callSendAPI(sender_psid, response) {
  // Construct the message body
  let request_body = {
    "recipient": {
      "id": sender_psid
    },
    "message": response
  }
  console.log("----------------------------------");
  console.log(request_body);

  // Send the HTTP request to the Messenger Platform
  request({
    "uri": "https://graph.facebook.com/v2.6/me/messages",
    "qs": { "access_token": PAGE_ACCESS_TOKEN },
    "method": "POST",
    "json": request_body
  }, (err, res, body) => {
    if (!err) {
      console.log('message sent!')
    } else {
      console.error("Unable to send message:" + err);
    }
  }); 
}

function handleMessage(sender_psid, received_message) {

  let response;

  // Check if the message contains text
  if (received_message.text) {    

    // Create the payload for a basic text message
    response = {
      "attachment": {
        "type": "template",
        "payload": {
          "template_type": "generic",
          "elements": [{
            "title": "Welcome to Fide Passenger Bot. How can I help you",
            "subtitle": "Welcome to Fide Passenger Bot. How can I help you",
            "buttons": [
              {
                "type": "postback",
                "title": "Get support",
                "payload": "get-support",
              },
              {
                "type": "postback",
                "title": "Get a ride",
                "payload": "get-ride",
              }
            ],
          }]
        }
      }
    }
  }  
  
  // Sends the response message
  callSendAPI(sender_psid, response);  
  console.log(response);  
}

app.dialog('/getUserLocation', [
    function (session){
        builder.Prompts.text(session, "Send me your current location.");
    },
    function (session) {
        if(session.message.entities.length != 0){
            session.userData.lat = session.message.entities[0].geo.latitude;
            session.userData.lon = session.message.entities[0].geo.longitude;
            session.endDialog();
        }else{
            session.endDialog("Sorry, I didn't get your location.");
        }
    }
]);

function handlePostback(sender_psid, received_message) {

  let response = {
    "text": ""
  };

  switch(received_message.payload) {
    case "get-support":
      response.text = "https://www.facebook.com/fidesupport/";
      break;
    //case "get-ride":
      //response.text = "Enter your current location:";
      //stage = 1;
      //break;
  }
  function (session){
    var data = { method: "sendMessage", parameters: { text: "<b>Save time by sending us your current location.</b>", parse_mode: "HTML", reply_markup: { keyboard: [ [ { text: "Share location", request_location: true } ] ] } } };
    const message = new builder.Message(session);
    message.setChannelData(data);
    session.send(message);
},

  // Sends the response message
  callSendAPI(sender_psid, response);  
  console.log(response);
}
