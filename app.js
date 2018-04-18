var express = require('express');
var app = express();

var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var moment = require('moment');
var querystring = require('querystring');
var outlook = require('node-outlook');
var dotenv = require('dotenv').config();

var pages = require('./pages');
var auth = require('./auth');

app.use(express.static('static'));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(session(
  { secret: 's3cr3t',
    resave: false,
    saveUninitialized: false 
  })
);
  

app.get('/', function(req, res) {

  res.send(pages.loginPage(auth.getAuthUrl()));
  
});

app.get('/authorize', function(req, res) {
  var authCode = req.query.code;
  if (authCode) {
    console.log('');
    console.log('Retrieved auth code in /authorize: ' + authCode);
    auth.getTokenFromCode(authCode, tokenReceived, req, res);
  }
  else {
    console.log('/authorize called without a code parameter, redirecting to login');
    res.redirect('/');
  }
});

function tokenReceived(req, res, error, token) {
  if (error) {
    console.log(error);
    res.send(error);
  }
  else {
    req.session.access_token = token.token.access_token;
    req.session.refresh_token = token.token.refresh_token;
    req.session.email = auth.getEmailFromToken(token.token.id_token);
    res.redirect('/logincomplete');
  }
}

app.get('/logincomplete', function(req, res) {
  var access_token = req.session.access_token;
  var refresh_token = req.session.access_token;
  var email = req.session.email;
  
  if (access_token === undefined || refresh_token === undefined) {
    console.log('/logincomplete called while not logged in');
    res.redirect('/');
    return;
  }
  
  res.send(pages.loginCompletePage(email));
});

app.get('/logout', function(req, res) {
  req.session.destroy();
  res.redirect('/');
});

app.get('/sync', function(req, res) {
  var token = req.session.access_token;
  var email = req.session.email;
  if (token === undefined || email === undefined) {
    console.log('/sync called while not logged in');
    res.redirect('/');
    return;
  }

  outlook.base.setApiEndpoint('https://outlook.office.com/api/v2.0');
  outlook.base.setAnchorMailbox(req.session.email);
  outlook.base.setPreferredTimeZone('Eastern Standard Time');
  
  var requestUrl = req.session.syncUrl;
  if (requestUrl === undefined) {
    requestUrl = outlook.base.apiEndpoint() + '/Me/CalendarView';
  }
  
  // time frame
  var startDate = moment().startOf('day');
  var endDate = moment(startDate).add(30, 'days');
  var params = {
    startDateTime: startDate.toISOString(),
    endDateTime: endDate.toISOString()
  };
  
  var headers = {
    Prefer: [ 
      'odata.track-changes',
      'odata.maxpagesize=5'
    ]
  };
  
  var apiOptions = {
    url: requestUrl,
    token: token,
    headers: headers,
    query: params
  };
  
  outlook.base.makeApiCall(apiOptions, function(error, response) {
    if (error) {
      console.log(JSON.stringify(error));
      res.send(JSON.stringify(error));
    }
    else {
      if (response.statusCode !== 200) {
        console.log('API Call returned ' + response.statusCode);
        res.send('API Call returned ' + response.statusCode);
      }
      else {
        var nextLink = response.body['@odata.nextLink'];
        if (nextLink !== undefined) {
          req.session.syncUrl = nextLink;
        }
        var deltaLink = response.body['@odata.deltaLink'];
        if (deltaLink !== undefined) {
          req.session.syncUrl = deltaLink;
        }
        res.send(pages.syncPage(email, response.body.value));
      }
    }
  });
});

app.get('/viewevent', function(req, res) {
  var itemId = req.query.id;
  var access_token = req.session.access_token;
  var email = req.session.email;
  
  if (itemId === undefined || access_token === undefined) {
    res.redirect('/');
    return;
  }
  
  var select = {
    '$select': 'Subject,Attendees,Location,Start,End,IsReminderOn,ReminderMinutesBeforeStart'
  };
  
  var getEventParameters = {
    token: access_token,
    eventId: itemId,
    odataParams: select
  };
  
  outlook.calendar.getEvent(getEventParameters, function(error, event) {
    if (error) {
      console.log(error);
      res.send(error);
    }
    else {
      res.send(pages.itemDetailPage(email, event));
    }
  });
});

app.get('/updateevent', function(req, res) {
  var itemId = req.query.eventId;
  var access_token = req.session.access_token;
  
  if (itemId === undefined || access_token === undefined) {
    res.redirect('/');
    return;
  }
  
  var newSubject = req.query.subject;
  var newLocation = req.query.location;
  
  console.log('UPDATED SUBJECT: ', newSubject);
  console.log('UPDATED LOCATION: ', newLocation);
  
  var updateEventParameters = {
    token: access_token,
    eventId: itemId,
    update: {
      Subject: newSubject,
      Location: {
        DisplayName: newLocation
      }
    }
  };
  
  outlook.calendar.updateEvent(updateEventParameters, function(error, event) {
    if (error) {
      console.log(error);
      res.send(error);
    }
    else {
      res.redirect('/viewevent?' + querystring.stringify({ id: itemId }));
    }
  });
});

app.get('/addevent', function(req, res) {
  var access_token = req.session.access_token;
  var newEvent = {
    "Subject": "Test event",
    "Body": {
      "ContentType": "HTML",
      "Content": "wowee this is a test event"
    },
    "Start": "2018-04-27T00:00:00.000Z",
    "End": "2018-04-27T00:30:00.000Z",
    "Attendees": [
      {
        "EmailAddress": {
          "Address": "kyle.cui9@gmail.com",
          "Name": "Kyle Cui"
        },
        "Type": "Required"
      }
    ]
  };

  var userInfo = {
    email: 'kyle.cui9@gmail.com'
  };

  var addEventParameters = {
    token: access_token,
    event: newEvent,
    user: userInfo
  };

  outlook.calendar.createEvent(addEventParameters,
    function(error, result) {
      if (error) {
        console.log(error);
        res.send(error);
      }
      else {
        res.redirect('/sync');
      }
    });
});

app.get('/deleteevent', function(req, res) {
  var itemId = req.query.id;
  var access_token = req.session.access_token;
  
  if (itemId === undefined || access_token === undefined) {
    res.redirect('/');
    return;
  }
  
  var deleteEventParameters = {
    token: access_token,
    eventId: itemId
  };
  
  outlook.calendar.deleteEvent(deleteEventParameters, function(error, event) {
    if (error) {
      console.log(error);
      res.send(error);
    }
    else {
      res.redirect('/sync');
    }
  });
});

// Start the server
var server = app.listen(3000, function() {
  var host = server.address().address;
  var port = server.address().port;
  
  console.log('Example app listening at http://%s:%s', host, port);
});