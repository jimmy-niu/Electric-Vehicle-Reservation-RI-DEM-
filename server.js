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
let auth = require('./auth');

let anyDB = require('any-db');
let conn = anyDB.createConnection('sqlite3://DEM.db');

let engines = require('consolidate');
app.engine('html', engines.hogan);
app.set('views', __dirname + '/public'); // tell Express where to find templates, in this case the '/public' directory
app.set('view engine', 'html'); //register .html extension as template engine so we can render .html pages
app.use(express.static(__dirname + '/public'));

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


//Resevervations
conn.query('CREATE TABLE IF NOT EXISTS vehicles(id INTEGER PRIMARY KEY AUTOINCREMENT, license TEXT, model TEXT, color TEXT, inService BOOLEAN, miles DOUBLE PRECISION)');
//Vehicles
conn.query('CREATE TABLE IF NOT EXISTS reservations(id INTEGER PRIMARY KEY AUTOINCREMENT, user TEXT, license TEXT, startTime TEXT, endTime TEXT, startDate TEXT, endDate TEXT, stops JSON, override BOOLEAN, justification TEXT)');
//Reports
conn.query('CREATE TABLE IF NOT EXISTS reports(id INTEGER PRIMARY KEY AUTOINCREMENT, reservation INTEGER, report TEXT)');

app.get('/home/user', function(request, response){
	console.log('- Request received:', request.method, request.url);

    //createReservation("Jenna Tishler", "ABC123", "8:20AM", "10:30AM", "04/14/18", "04/14/18", ["1 Johnson Lane, Providence RI", "2 Brown Court, Barrington, RI"], false, "");
    console.log(getMyReservations("Jenna Tishler"));


    submitFeeback(2, "Car is ok");
    response.render('user');
});

/*Sets up the server on port 8080.*/
server.listen(8080, function(){
	console.log('- Server listening on port 8080');
});

//handles events when a user is connected
io.sockets.on('connection', function(socket){
    //emitted when a user makes a new reservation
    socket.on('reservation', function(reservationInfo){
        console.log("got a reservation!");
        createReservation(reservationInfo.user, reservationInfo.license, 
            reservationInfo.startTime, reservationInfo.endTime, reservationInfo.startDate, 
            reservationInfo.endDate, reservationInfo.stops, reservationInfo.override, 
            reservationInfo.justification);
        
        conn.query('SELECT * FROM reservations WHERE user = ?', "Jenna Tishler", function(error, data){
           socket.to(socket.id).emit('newReservation', data);
        });
    });
    
    
});

/**
 * Sets up the landing page to index.html.
 */
app.get("/*", (req, res) => {
    console.log("Serving Login Page.");
    res.render("index.html");
});

// ADMIN
function getReservations(){
    // conn.query('',function(error, data){
    //
    // });
}
function getVehicles(){
    conn.query('SELECT * FROM vehicles',function(error, data){

    });
}
function addVehicle(vehicle){
    conn.query('INSERT INTO vehicles VALUES(null, ?, ?, ?, ?, ?)',[vehicle.license, vehicle.model, vehicle.color, vehicle.inService, vehicle.miles],function(error, data){

    });
}
function removeVehicle(license){
    conn.query('DELETE FROM vehicles WHERE license = ?', [license],function(error, data){

    });
}

// USER
function getMyReservations(currrentUser){
    conn.query('SELECT * FROM reservations WHERE user = ?', [currrentUser], function(error, data){
        return data;
    });
}

function createReservation(user, license, startTime, endTime, startDate, endDate, stops, override, justification){
    conn.query('INSERT INTO reservations VALUES(null, ?, ?, ?, ?, ?, ?, ?, ?, ?)',[user, license, startTime, endTime, startDate, endDate, stops, override, justification],function(error, data){

    });
}

function cancelReservation(id){
    conn.query('DELETE FROM reservations WHERE id = ?', [id], function(error, data){

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
