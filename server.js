let express = require('express')
let app = express();
let path = require('path');
let http =require('http');
let nodemailer = require('nodemailer');
let server = http.createServer(app);

let io = require('socket.io')(server, {wsEngine: 'ws'}); //fix Windows10 issue
//TO-DO change before handin!
io.listen(server);

let bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());

// additional auth dependencies
let cookieParser = require('cookie-parser');
let session = require('express-session');
let moment = require('moment');
let querystring = require('querystring');
let outlook = require('node-outlook');
let index = require('./public/index');
let auth = require('./auth');
var dotenv = require('dotenv').config();

let anyDB = require('any-db');
let conn = anyDB.createConnection('sqlite3://DEM.db');

let engines = require('consolidate');
app.engine('html', engines.hogan);
app.set('views', __dirname + '/public'); // tell Express where to find templates, in this case the '/public' directory
app.set('view engine', 'html'); //register .html extension as template engine so we can render .html pages
app.use(express.static(__dirname + '/public'));

app.use(cookieParser());
app.use(session(
  { secret: 's3cr3t',
    resave: false,
    saveUninitialized: false
  })
);

app.get('/addevent', function(req, res) {
  var access_token = req.session.access_token;
  var newEvent = {
  "Subject": "Test event",
  "Body": {
    "ContentType": "HTML",
    "Content": "wowee this is a test event",
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

// RESERVATION OBJECT FORMAT


// app.set('view engine', 'pug');
// app.use(express.static('public'));

//email sender (will eventually change to a different email)
//you can use your email and password to test
// var transporter = nodemailer.createTransport({
//   service: 'gmail',
//   auth: {
//     user: 'jenna_tishler@brown.edu',
//     pass: ''
//   }
// });
let transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'jenna_tishler@brown.edu',
    pass: ''
  }
});

//example of how to send email
// let mailOptions = {
//   from: 'jenna_tishler@brown.edu',
//   to: 'jenna.tishler@gmail.com',
//   subject: 'Sending Email using Node.js',
//   text: 'That was easy!'
// };

// transporter.sendMail(mailOptions, function(error, info){
//   if (error) {
//     console.log(error);
//   } else {
//     console.log('Email sent: ' + info.response);
//   }
// });

//Admins
conn.query('CREATE TABLE IF NOT EXISTS admins(id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT)');
//Resevervations
conn.query('CREATE TABLE IF NOT EXISTS vehicles(id INTEGER PRIMARY KEY AUTOINCREMENT, license TEXT, model TEXT, color TEXT, inService BOOLEAN, miles DOUBLE PRECISION)');
//Vehicles
conn.query('CREATE TABLE IF NOT EXISTS reservations(id INTEGER PRIMARY KEY AUTOINCREMENT, user TEXT, license TEXT, start TEXT, end TEXT, stops JSON, override BOOLEAN, justification TEXT)');
//Reports
conn.query('CREATE TABLE IF NOT EXISTS reports(id INTEGER PRIMARY KEY AUTOINCREMENT, reservation INTEGER, report TEXT)');

/*Sets up the server on port 8080.*/
server.listen(8080, function(){
	console.log('- Server listening on port 8080');
});

//handles events when an admin user is connected
io.of('/admin').on('connection', function(socket){
    socket.on('vehicleAdded', function(vehicle){
        addVehicle(vehicle);
    });
    socket.on('vehicleRemoved', function(license){
        removeVehicle(license);
    });
    socket.on('vehicleEdited', function(id, vehicle){
        editVehicle(id, vehicle);
    });
    socket.on('vehicleStatusUpdated', function(license, status){
        updateVehicleStatus(license, status);
    });
    socket.on('reportRemoved', function(license, status){
        removeReport(license, status);
    });
});

//handles events when a regular user is connnected
io.of('/user').on('connection', function(socket){
    socket.on('join', function(user, callback){
        conn.query('SELECT * FROM reservations WHERE user = ?', [user], function(error, data){
           callback(data);
        });
    });
    //emitted when a user makes a new reservation
    socket.on('reservation', function(reservationInfo){
        console.log("got a reservation!");

        conn.query('SELECT model, license FROM vehicles WHERE license NOT IN (SELECT license FROM resrvations WHERE start <= ? AND end >= ?)', [reservationInfo.end, reservationInfo.start], function(error, data){
            console.log(data);

            createReservation(reservationInfo.user, data.rows[0].license,
            reservationInfo.start, reservationInfo.end, reservationInfo.stops, reservationInfo.override,
            reservationInfo.justification);

            socket.to(socket.id).emit('alternateVehicles', data);
        });

        conn.query('SELECT * FROM reservations WHERE user = ?', [reservationInfo.user], function(error, data){
            socket.to(socket.id).emit('reservationChange', data);
            console.log("sending to user");
        });

        conn.query('SELECT * FROM reservations', function(error, data){
           io.of('/admin').emit('reservationChange', data);
        });

    });

    socket.on('edit', function(reservationID, user, license, start, end, stops, override, justification){
        editReservation(reservationID)

        conn.query('SELECT * FROM reservations WHERE user = ?', [user], function(error, data){
           socket.to(socket.id).emit('reservationChange', data);
        });

        conn.query('SELECT * FROM reservations', function(error, data){
           io.of('/admin').emit('reservationChange', data);
        });
    });

    socket.on('cancel', function(reservationID, user){
        cancelReservation(reservationID);

        conn.query('SELECT * FROM reservations WHERE user = ?', [user], function(error, data){
           socket.to(socket.id).emit('reservationChange', data);
        });

        conn.query('SELECT * FROM reservations', function(error, data){
           io.of('/admin').emit('reservationChange', data);
        });
    });

    socket.on('feedback', function(reservationID, report){
        submitFeeback(resrevationID, resport);

        conn.query('SELECT * FROM reports', function(error, data){
           io.of('/admin').emit('reportAdded', data);
        });
    });
});

/**
 * Sets up the landing page to index.html.
 */
app.get('/', function(req, res) {
  res.status(200);
  res.send(index.loginPage(auth.getAuthUrl()));
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
  res.status(200);
  var access_token = req.session.access_token;
  var refresh_token = req.session.access_token;
  var email = req.session.email;

  if (access_token === undefined || refresh_token === undefined) {
    console.log('/logincomplete called while not logged in');
    res.redirect('/');
    return;
  }
  res.send(index.loginCompletePage(email));
  //res.sendFile(path.join(__dirname, './public/user/index.html'));
});

app.get('/logout', function(req, res) {
  req.session.destroy();
  res.redirect('/');
});

// ADMIN
function updateAdminReservations(){
    conn.query('SELECT * FROM reservations', function(error, data){
           io.of('/admin').emit('reservationChange', data);
    });
}
function getVehicles(){
    conn.query('SELECT * FROM vehicles',function(error, data){
        io.of('/admin').emit('vehicleChange', data);
    });
}
function addVehicle(vehicle){
    conn.query('INSERT INTO vehicles VALUES(null, ?, ?, ?, ?, ?)',[vehicle.license, vehicle.model, vehicle.color, vehicle.inService, vehicle.miles],function(error, data){
        getVehicles();
    });
}
function editVehicle(id, vehicle){
    conn.query('REPLACE INTO vehicles VALUES(?, ?, ?, ?, ?, ?)',[id, vehicle.license, vehicle.model, vehicle.color, vehicle.inService, vehicle.miles],function(error, data){
        getVehicles();
    });
}
function removeVehicle(license){
    conn.query('DELETE FROM vehicles WHERE license = ?', [license],function(error, data){
        getVehicles();
    });
}
function updateVehicleStatus(license, status){
    conn.query('UPDATE vehicles SET inService = ? WHERE license = ?',[status, license],function(error, data){
        getVehicles();
    });
}
function getReports(){
    conn.query('SELECT * FROM reports', function(error, data){
        io.of('/admin').emit('reportChange', data);
    });
}
function removeVehicle(id){
    conn.query('DELETE FROM reports WHERE id =?', [id],function(error, data){
        getReports();
    });
}
function getSpecificReports(reservation){
    conn.query('SELECT * FROM reports WHERE reservation = ?', [reservation], function(error, data){

    });
}
function addAdmin(email){
    conn.query('INSERT INTO admins VALUES(null, ?)',[email],function(error, data){
        
    });
}
function removeAdmin(email){
    conn.query('DELETE FROM admins WHERE email = ?', [email], function(error, data){

    });
}

// USER
function updateUserReservations(socketID, user){
    conn.query('SELECT * FROM reservations WHERE user = ?', [user], function(error, data){
           socket.to(socketID).emit('reservationChange', data);
    });
}

function createReservation(user, license, start, end, stops, override, justification){
    conn.query('INSERT INTO reservations VALUES(null, ?, ?, ?, ?, ?, ?, ?, ?, ?)',[user, license, startTime, endTime, startDate, endDate, stops, override, justification],function(error, data){
        console.log(data);
    });
}

function editReservation(id, user, license, start, end, stops, override, justification){
    conn.query('UPDATE reservations SET license = ?, startTime = ?, endTime = ?, startDate = ?, endDate = ?, stops = ?, override = ?, justification = ? WHERE reservationID = ?', [license, startTime, endTime, startDate, endDate, stops, override, justification, id], function(error, data){

    });
}
function cancelReservation(id){
    conn.query('DELETE FROM reservations WHERE id = ?', [id], function(error, data){
        console.log('cancelled');
    });
}
function submitFeeback(reservationID, report){
    conn.query("INSERT INTO reports VALUES(null, ?, ?)", [reservationID, report], function(error, data){

    });

    conn.query('SELECT * FROM reservations WHERE id = ?', [reservationID], function(error, data){
         let mailOptions = {
          from: 'jenna_tishler@brown.edu',
          to: 'jenna.tishler@gmail.com',
          subject: 'Sending Email using Node.js',
          html: '<h1>Reservation: ' + data.rows[0].id + '</h1>' + '<h2>Name: ' + data.rows[0].user + '</h2>' + '<h2>License Plate: ' + data.rows[0].license + '</h2>' + '<p>Report: ' + report + '<p>'
        };

        // transporter.sendMail(mailOptions, function(error, info){
        //   if (error) {
        //     console.log(error);
        //   } else {
        //     console.log('Email sent: ' + info.response);
        //   }
        // });
    });

    //console.log(reservationData);
}
