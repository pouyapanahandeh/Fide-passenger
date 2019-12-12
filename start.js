// 'use strict';

// Imports dependencies and set up http server
const
  express = require('express'),
  bodyParser = require('body-parser'),
  app = express().use(bodyParser.json()); // creates express http server
const request = require('request');
const { Client } = require('pg');

const client = new Client({
  user: 'wcyxlfvjultpeh',
  host: 'ec2-54-247-82-14.eu-west-1.compute.amazonaws.com',
  database: 'ddd5fleaueoj2k',
  password: '143af35a27f1fd44fc325947ea1e1c86195a56f1dd80e673113c55bc2ff7238f',
  port: 5432
});

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
    
      // Get the sender PSID
      let sender_psid = webhook_event.sender.id;
      console.log('Sender PSID: ' + sender_psid);
      // console.log("IP: " + req.ip);
      
      // // var ip = "207.97.227.239";
      // let geo = geoip.lookup(req.ip);
      // console.log(geo);

      // console.log("------------------------------------------------------");
      // console.log("req.headers['x-forwarded-for']: " + req.headers['x-forwarded-for']);
      // console.log("req.connection.remoteAddress: " + req.connection.remoteAddress);
      // console.log("req.socket.remoteAddress: " + req.socket.remoteAddress);
      // console.log("req.connection.socket.remoteAddress: " + req.connection.socket.remoteAddress);
    
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

var users = [];
var stage = [];
var data = [];

function handleMessage(sender_psid, received_message) {

  if(stage[sender_psid] == 2.5 && stage[sender_psid] == 3.5) {

    console.log("PROCESSING IS IN PROGRESS, INGNORING INCOMING MESSAGES...");
    return;
  }

  let response;

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

  console.log("*********** RESPONSE ***********");
  console.log(received_message);
  switch(stage[sender_psid]) {
    case 1:
      data[sender_psid].location = received_message.text;
      response = {
        "text": "Thank you,now we have your location, please enter your destination?"
      };
      stage[sender_psid] = 2;
      break;
    case 2:
      data[sender_psid].destination = received_message.text;
      response = {
        "text": "Please wait we are trying to find a driver for you nearby."
      }

      // client.connect();
      // const query_str = 'INSERT INTO public."passenger-feed"('+
      //   'sender_psid, location, destination)'+
      //   'VALUES (\''+sender_psid+'\', \''+data[sender_psid].location+'\', \''+data[sender_psid].destination+'\')';
      // client.query(query_str, (err, res) => {
      //   console.log(err, res)
      //   client.end()
      // });

      setTimeout(function() {

        let request_body = {
          "recipient": {
            "id": sender_psid
          },
          "sender_action":"typing_on"
        };
  
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
      }, 2500);

      stage[sender_psid] = 2.5;
      setTimeout(function() {

        console.log("PROGESSING IS DONE");
        stage[sender_psid] = 3;
        handleMessage(sender_psid, received_message);
      }, 5000);
      break;
    case 3:

      stage[sender_psid] = 3.5;
      response = {
        "text": "There is 1 drived available...\nDriver: Pooya Panahandeh\n",
      };
      setTimeout(function() {

        console.log("PROGESSING IS DONE");
        stage[sender_psid] = 4;
        handleMessage(sender_psid, received_message);
      }, 2000);
      break;
    case 4:

      response = {
        "attachment":{
          "type":"image", 
          "payload":{
            "url":"https://scontent-vie1-1.xx.fbcdn.net/v/t1.0-9/14915710_105380106610860_7797887482897586005_n.jpg?_nc_cat=110&_nc_ohc=GxLzbHTb7u0AQnfUr3r7aG9egJ1nRt_ur1FTXxzIK2bVosaRVSHALoicA&_nc_ht=scontent-vie1-1.xx&oh=775b96d5e7b21496184a79a6d93f39e0&oe=5E715190", 
            "is_reusable":true
          }
        }
      };

      let r = users.indexOf(sender_psid);
      users.splice(r, 1);
      stage.splice(r, 1);
      data.splice(r, 1);
      break;
  }
  
  // Sends the response message
  callSendAPI(sender_psid, response);
}

function handlePostback(sender_psid, received_message) {

  let response = {
    "text": ""
  };

  switch(received_message.payload) {
    case "get-support":
      response.text = "https://www.facebook.com/fidesupport/";
      break;
    case "get-ride":
      response.text = "Enter your current location with zip code:";
      users.push(sender_psid);
      stage[sender_psid] = 1;
      data[sender_psid] = {
        "location": "...",
        "destination": "..."
      };
      break;
  }

  // Sends the response message
  callSendAPI(sender_psid, response);
}
