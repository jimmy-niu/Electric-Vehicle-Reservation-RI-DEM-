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
var methodOverride = require('method-override')
var passport = require('passport')
var util = require('util')
var OutlookStrategy = require('passport-outlook').Strategy;

let anyDB = require('any-db');
let conn = anyDB.createConnection('sqlite3://DEM.db');

let engines = require('consolidate');
app.engine('html', require('hogan-express'));
app.set('views', __dirname + '/public'); // tell Express where to find templates, in this case the '/public' directory
app.set('view engine', 'html'); //register .html extension as template engine so we can render .html pages
//
app.use(cookieParser());
app.use(session(
    { secret: 's3cr3t',
     resave: false,
     saveUninitialized: true
    })
       );

/*app.get('/addevent', function(req, res) {
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
});*/

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


//conn.query('DROP TABLE vehicles');
conn.query('DROP TABLE IF EXISTS reservations');
conn.query('DROP TABLE IF EXISTS vehicles');


//Users
conn.query('CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT, admin BOOLEAN)');
//Resevervations
conn.query('CREATE TABLE IF NOT EXISTS vehicles(id INTEGER PRIMARY KEY AUTOINCREMENT, license TEXT, model TEXT, color TEXT, inService BOOLEAN, miles DOUBLE PRECISION, isEV BOOLEAN, extraTrunk BOOLEAN, offRoad BOOLEAN, equipRack BOOLEAN)');
//Vehicles
conn.query('CREATE TABLE IF NOT EXISTS reservations(id INTEGER PRIMARY KEY AUTOINCREMENT, user TEXT, license TEXT, model TEXT, start TEXT, end TEXT, stops TEXT, override BOOLEAN, justification TEXT)');
//Reports
conn.query('CREATE TABLE IF NOT EXISTS reports(id INTEGER PRIMARY KEY AUTOINCREMENT, reservation INTEGER, report TEXT)');

//test data
conn.query('INSERT INTO reservations VALUES(null, ?, ?, ?, ?, ?, ?, ?, ?)',["Jenna Tishler", "ABC123", "Chevy Volt", "2018-04-18 11:00", "2018-04-18 15:00", ["home", "work"], false, ""]);
conn.query('INSERT INTO reservations VALUES(null, ?, ?, ?, ?, ?, ?, ?, ?)',["Jenna Tishler", "DEF456", "Chevy Volt", "2018-04-19 11:00", "2018-04-20 11:00", ["home", "work"], false, ""]);
conn.query('INSERT INTO reservations VALUES(null, ?, ?, ?, ?, ?, ?, ?, ?)',["Max Luebbers", "GHI789", "Chevy Volt", "2018-04-18 11:00", "2018-04-18 15:00", ["home", "work"], false, ""]);
conn.query('INSERT INTO reservations VALUES(null, ?, ?, ?, ?, ?, ?, ?, ?)',["Jimmy Niu", "GHI789", "Chevy Volt", "2018-04-19 14:00", "2018-04-18 17:00", ["home", "work"], false, ""]);

conn.query('INSERT INTO vehicles VALUES(null, ?, ?, ?, ?, ?, ?, ?, ?, ?)', ["ABC123", "Chevy Volt", "Red", true, 100.0, true, true, false, false]);
conn.query('INSERT INTO vehicles VALUES(null, ?, ?, ?, ?, ?, ?, ?, ?, ?)', ["DEF456", "Chevy Volt", "Blue", true, 100.0, true, true, false, false]);
conn.query('INSERT INTO vehicles VALUES(null, ?, ?, ?, ?, ?, ?, ?, ?, ?)', ["VNG734", "Chevy Volt", "Green", true, 100.0, false, true, true, true]);
conn.query('INSERT INTO vehicles VALUES(null, ?, ?, ?, ?, ?, ?, ?, ?, ?)', ["GHI789", "Chevy Volt", "Purple", true, 100.0, true, false, false, false]);
conn.query('INSERT INTO vehicles VALUES(null, ?, ?, ?, ?, ?, ?, ?, ?, ?)', ["OLH985", "Chevy Volt", "Silver", true, 100.0, true, false, false, false]);
conn.query('INSERT INTO vehicles VALUES(null, ?, ?, ?, ?, ?, ?, ?, ?, ?)', ["DOL234", "Chevy Volt", "Red", true, 100.0, false, true, false, true]);

/*Sets up the server on port 8080.*/
server.listen(8080, function(){
    console.log('- Server listening on port 8080');
});

//handles events when an admin user is connected
io.of('/admin').on('connection', function(socket){
    updateAdminReservations();
    updateVehicles();

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
    socket.on('userAdded', function(email, admin){
        addUser(email, admin);
    });
    socket.on('userStatusChanged', function(email, admin){
        changeUserStatus(email, admin);
    });
    socket.on('userRemoved', function(email){
        removeUser(email);
    });
});

//handles events when a regular user is connnected
io.of('/user').on('connection', function(socket){
    socket.on('join', function(user, callback){
        conn.query('SELECT * FROM reservations WHERE user = ? ORDER BY start DESC', [user], function(error, data){
            callback(data);
        });
    });
    //emitted when a user makes a new reservation
    socket.on('reservation', function(reservationInfo){
        console.log("got a reservation!");

        var needsTrunk;
        if(reservationInfo.needsTrunk){
            needsTrunk = 1;
        } else {
            needsTrunk = 0;
        }

        var needsOffRoad;
        if(reservationInfo.needsOffRoad){
            needsOffRoad = 1;
        } else {
            needsOffRoad = 0;
        }

        var needsRack;
        if(reservationInfo.needsRack){
            needsRack = 1;
        } else {
            needsRack = 0;
        }

        conn.query('SELECT license, model FROM vehicles WHERE extraTrunk >= ? AND offRoad >= ? AND equipRack >= ? AND license NOT IN (SELECT license FROM reservations WHERE start <= ? AND end >= ?) ORDER BY isEV DESC, (extraTrunk + offRoad + equipRack) ASC', [needsTrunk, needsOffRoad, needsRack, reservationInfo.end, reservationInfo.start], function(error, data){
            socket.emit('alternateVehicles', data);

            conn.query('INSERT INTO reservations VALUES(null, ?, ?, ?, ?, ?, ?, ?, ?)',[reservationInfo.user, data.rows[0].license, data.rows[0].model, reservationInfo.start, reservationInfo.end, reservationInfo.stops, reservationInfo.override, reservationInfo.justification],function(error, data){
                console.log(data);
                conn.query('SELECT * FROM reservations WHERE id = ?', [data.lastInsertId], function(error, data){
                    socket.emit('newReservation', data);
                    io.of('/admin').emit('reservationChange', data);
                    console.log("sending to user");
                });
            });
        });
    });

    socket.on('edit', function(reservationID, reservationInfo){
        editReservation(reservationID, reservationInfo.user, reservationInfo.start, reservationInfo.end, reservationInfo.stops, reservationInfo.justification)

        conn.query('SELECT * FROM reservations WHERE user = ?', [reservationInfo.user], function(error, data){
            socket.emit('reservationChange', data);
        });

        conn.query('SELECT * FROM reservations', function(error, data){
            io.of('/admin').emit('reservationChange', data);
        });
    });

    socket.on('cancel', function(reservationID, user){
        cancelReservation(reservationID);

        conn.query('SELECT * FROM reservations WHERE user = ?', [user], function(error, data){
            socket.emit('reservationChange', data);
        });

        conn.query('SELECT * FROM reservations', function(error, data){
            io.of('/admin').emit('reservationChange', data);
        });
    });

    socket.on('feedback', function(reservationID, report){
        submitFeedback(reservationID, resport);

        conn.query('SELECT * FROM reports', function(error, data){
            io.of('/admin').emit('reportAdded', data);
        });
    });

    socket.on('vehicleOverride', function(reservationID, license, model, justification){
        conn.query('UPDATE reservations SET license = ?, model = ?, override = ?, justification = ? WHERE id = ?', [license, model, true, justification, reservationID], function(error, data){
            conn.query('SELECT * FROM reservations WHERE id = ?', [reservationID], function(error, data){
                socket.emit('reservationOverride', data);
            });

            conn.query('SELECT * FROM reservations', function(error, data){
                io.of('/admin').emit('reservationChange', data);
            });
        });
    });
});

/**
 * Sets up the landing page to index.html.
 */

var token = undefined;

app.use(passport.initialize());
app.use(passport.session());

var OUTLOOK_CLIENT_ID = "5689926f-c6a0-4d4e-82f4-19760907d166";
var OUTLOOK_CLIENT_SECRET = "uqlACP41#%sinnKKRW495!|";

passport.serializeUser(function(user, done) {
    done(null, user);
});

passport.deserializeUser(function(obj, done) {
    done(null, obj);
});

passport.use(new OutlookStrategy({
    clientID: OUTLOOK_CLIENT_ID,
    clientSecret: OUTLOOK_CLIENT_SECRET,
    callbackURL: "http://localhost:8080/authorize"
},
                                 function(accessToken, refreshToken, profile, done) {
    process.nextTick(function () {
        return done(null, profile);
    });
}
                                ));

app.get('/', function(req, res) {
    res.send(index.loginPagePassport());
    /*res.status(200);
    res.send(index.loginPage(auth.getAuthUrl()));*/
});

app.get('/authorize', //function(req, res) {
        /*var authCode = req.query.code;
    if (authCode) {
        console.log('');
        console.log('Retrieved auth code in /authorize: ' + authCode);
        auth.getTokenFromCode(authCode, tokenReceived, req, res);
    }
    else {
        console.log('/authorize called without a code parameter, redirecting to login');
        res.redirect('/');
    }*/
        passport.authenticate('windowslive', { failureRedirect: '/' }),
        function(req, res) {
    var user_email = req.user._json.EmailAddress;
    if (user_email === 'dem_test_a@outlook.com') {
      app.use("/admin", express.static(__dirname + '/public/admin'));
      res.redirect('admin/index.html');
      //res.render('admin/index.html', {user : user_email});
      //res.redirect('admin/index/?email=' + encodeURIComponent(user_email));
      io.of('/admin').emit('admin-connected', user_email);
>>>>>>> 815c0e2f3c2a944a532002701dee7d7c82531cb4
    } else if (user_email === 'dem_test_u@outlook.com' || user_email === 'dem_test_u_2@outlook.com') {
        app.use("/user", express.static(__dirname + '/public/user'));
        io.sockets.emit('user-connected', user_email);
        res.redirect('user/index.html');
    }
});

app.post('admin/index', 
  function(req, res) {
    console.log(decodeURIComponent(req.query.email));
    res.render('admin/index.html', {user : decodeURIComponent(req.query.email)});
  });

app.get('/auth/outlook',
        passport.authenticate('windowslive', { scope: process.env.CLIENT_SCOPES }),
        function(req, res){
});

/*function tokenReceived(req, res, error, token) {
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
}*/

/*app.get('/logincomplete', function(req, res) {
    res.status(200);
    var access_token = req.session.access_token;
    var refresh_token = req.session.access_token;
    var email = req.session.email;
    if (access_token === undefined || refresh_token === undefined) {
        console.log('/logincomplete called while not logged in');
        res.redirect('/');
        return;
    }
    token = req.session.access_token;
    if (email === 'dem_test_a@outlook.com') {
      var to_send = 'admin/index.html';
    } else if (email === 'dem_test_u@outlook.com') {
      var to_send = 'user/index.html';
    }
    res.redirect(to_send);
    //res.sendFile(path.join(__dirname, './public/user/index.html'));
});*/

app.get('/logout', function(req, res) {
    /*token = undefined;
    req.session.destroy();
    res.redirect('/');*/
    if(req.user !== undefined){
        var user_email = req.user._json.EmailAddress;
        if (user_email === 'dem_test_a@outlook.com') {
            socket.emit('admin-disconnected', user_email);
        } else if (user_email === 'dem_test_u@outlook.com') {
            socket.emit('user-disconnected', user_email);
        }
    }
    req.logout();
    req.session.destroy(function (err) {
        res.redirect('/');
    });
});

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) { return next(); }
    res.redirect('/');
}

app.all('*', function(req,res,next) {
    if (req.path === '/')
        next();
    else
        ensureAuthenticated(req,res,next);  
});


app.get('/admin/index', function (req, res) {
    res.sendFile(path.join(__dirname + "/public/admin/index.html"));
})

// ADMIN
function updateAdminReservations(){
    conn.query('SELECT * FROM reservations', function(error, data){
        io.of('/admin').emit('reservationChange', data);
    });
}
function updateVehicles(){
    conn.query('SELECT * FROM vehicles',function(error, data){
        io.of('/admin').emit('vehicleChange', data);
    });

}
function addVehicle(vehicle){
    conn.query('INSERT INTO vehicles VALUES(null, ?, ?, ?, ?, ?, ?, ?, ?, ?)',[vehicle.license, vehicle.model, vehicle.color, vehicle.status, vehicle.miles, vehicle.isEv, vehicle.trunk, vehicle.offRoad, vehicle.equipmentRack],function(error, data){
        updateVehicles();
    });
    console.log(vehicle);
}
function editVehicle(id, vehicle){
    conn.query('REPLACE INTO vehicles VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',[vehicle.license, vehicle.model, vehicle.color, vehicle.miles, vehicle.status, vehicle.isEv, vehicle.trunk, vehicle.offRoad, vehicle.equipmentRack],function(error, data){
        updateVehicles();
    });
}
function removeVehicle(license){
    conn.query('DELETE FROM vehicles WHERE license = ?', [license],function(error, data){
        updateVehicles();
    });
}
function updateVehicleStatus(license, status){
    conn.query('UPDATE vehicles SET inService = ? WHERE license = ?',[status, license],function(error, data){
        updateVehicles();
    });
}
function updateReports(){
    conn.query('SELECT * FROM reports', function(error, data){
        io.of('/admin').emit('reportChange', data);
    });
}
function removeReports(id){
    conn.query('DELETE FROM reports WHERE id =?', [id],function(error, data){
        updateReports();
    });
}
function getSpecificReports(reservation){
    conn.query('SELECT * FROM reports WHERE reservation = ?', [reservation], function(error, data){

    });
}

function addUser(email, admin){
    conn.query('INSERT INTO users VALUES(null, ?, ?)',[email, admin],function(error, data){
        console.log(error);
        console.log("done");
    });
}

function changeUserStatus(email, admin){
    conn.query('UPDATE users SET admin = ? WHERE email = ?',[admin, email],function(error, data){

    });
}
function removeUser(email){
    conn.query('DELETE FROM users WHERE email = ?', [email], function(error, data){
        console.log("deleted");
    });
}

// USER
function editReservation(id, start, end, stops, justification){
    conn.query('UPDATE reservations SET start = ?, end = ?, stops = ?, justification = ? WHERE reservationID = ?', [license, start, end, stops, override, justification, id], function(error, data){

    });
}
function cancelReservation(id){
    conn.query('DELETE FROM reservations WHERE id = ?', [id], function(error, data){
        console.log('cancelled');
    });
}
function submitFeedback(reservationID, report){
    conn.query("INSERT INTO reports VALUES(null, ?, ?)", [reservationID, report], function(error, data){
        updateReports();
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
}
