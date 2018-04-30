let express = require('express')
let app = express();
let path = require('path');
let http =require('http');
let nodemailer = require('nodemailer');
let server = http.createServer(app);

let perf = require('./test/perf-test.js');

let io = require('socket.io')(server, {wsEngine: 'ws'}); //fix Windows10 issue
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
// let auth = require('./auth');
var dotenv = require('dotenv').config();
var methodOverride = require('method-override')
var passport = require('passport')
var util = require('util')
var OutlookStrategy = require('passport-outlook').Strategy;
var replace = require("replace");

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

/*email sender (will eventually change to a different email)
you can use your email and password to test
var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'jenna_tishler@brown.edu',
    pass: ''
  }
}); */

// let transporter = nodemailer.createTransport({
//     service: 'gmail',
//     auth: {
//         user: 'jenna_tishler@brown.edu',
//         pass: ''
//     }
// });

/* example of how to send email
let mailOptions = {
  from: 'jenna_tishler@brown.edu',
  to: 'jenna.tishler@gmail.com',
  subject: 'Sending Email using Node.js',
  text: 'That was easy!'
};

transporter.sendMail(mailOptions, function(error, info){
  if (error) {
    console.log(error);
  } else {
    console.log('Email sent: ' + info.response);
  }
}); */


//for testing purposes- data resets every time
conn.query('DROP TABLE IF EXISTS reservations');
conn.query('DROP TABLE IF EXISTS vehicles');
conn.query('DROP TABLE IF EXISTS reports');


//Users
conn.query('CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT, admin BOOLEAN)');
//Resevervations
conn.query('CREATE TABLE IF NOT EXISTS vehicles(id TEXT, license TEXT, model TEXT, color TEXT, inService BOOLEAN, miles DOUBLE PRECISION, isEV BOOLEAN, extraTrunk BOOLEAN, offRoad BOOLEAN, equipRack BOOLEAN)');
//Vehicles
conn.query('CREATE TABLE IF NOT EXISTS reservations(id INTEGER PRIMARY KEY AUTOINCREMENT, user TEXT, license TEXT, model TEXT, start TEXT, end TEXT, stops TEXT, override BOOLEAN, justification TEXT)');
//Reports
conn.query('CREATE TABLE IF NOT EXISTS reports(id INTEGER PRIMARY KEY AUTOINCREMENT, reservation INTEGER, report TEXT)');

//test data
conn.query('INSERT INTO reservations VALUES(null, ?, ?, ?, ?, ?, ?, ?, ?)',["Jenna Tishler", "1322", "2015 FORD CMAX", "2018-04-18 11:00", "2018-04-18 15:00", JSON.stringify(["home", "work"]), false, ""]);
conn.query('INSERT INTO reservations VALUES(null, ?, ?, ?, ?, ?, ?, ?, ?)',["Jenna Tishler", "704", "2015 FORD CMAX", "2018-04-19 11:00", "2018-04-20 11:00", JSON.stringify(["home", "work"]), false, ""]);
conn.query('INSERT INTO reservations VALUES(null, ?, ?, ?, ?, ?, ?, ?, ?)',["Max Luebbers", "739", "2015 FORD CMAX", "2018-04-18 11:00", "2018-04-18 15:00", JSON.stringify(["home", "work"]), false, ""]);
conn.query('INSERT INTO reservations VALUES(null, ?, ?, ?, ?, ?, ?, ?, ?)',["dem_test_u@outlook.com", "1869", "2011 CHEVROLET EQUINOX", "2018-04-19 14:00", "2018-04-18 17:00", JSON.stringify(["home", "work"]), true, "I have a reason."]);
conn.query('INSERT INTO reservations VALUES(null, ?, ?, ?, ?, ?, ?, ?, ?)',["dem_test_u@outlook.com", "2254", "2016 FORD CMAX", "2018-04-21 11:00", "2018-04-21 17:00", JSON.stringify(["work", "beach"]), false, ""]);

conn.query('INSERT INTO vehicles VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', ["JF2GPBCC3FH253482", "1011", "2016 SUBARU CV", "Red", true, 11451.5, false, true, false, false]);
conn.query('INSERT INTO vehicles VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', ["1FMCU59329KC41390", "1018", "2009 FORD ESCAPE", "Blue", true, 151071.5, false, true, false, false]);
conn.query('INSERT INTO vehicles VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', ["1GNDT13S552325449", "1052", "2005 CHEVROLET TRAILBLAZER", "Blue", true, 62759.9, false, true, false, false]);
conn.query('INSERT INTO vehicles VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', ["1FADP5CU7FL121713", "1252", "2015 FORD CMAX", "Black", true, 6041.9, true, false, false, false]);
conn.query('INSERT INTO vehicles VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', ["1FADP5CU9FL121714", "1254", "2015 FORD CMAX", "Black", true, 9543.2, true, false, false, false]);
conn.query('INSERT INTO vehicles VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', ["1FADP5CU4FL121717", "1322", "2015 FORD CMAX", "Black", true, 13594.4, true, false, false, false]);
conn.query('INSERT INTO vehicles VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', ["1FMYU96H76KD26489", "1583", "2006 FORD ESCAPE", "Blue", true, 72981.1, false, true, false, false]);
conn.query('INSERT INTO vehicles VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', ["JTMRJREV1HD152175", "1650", "2017 TOYOTA RAV 4", "Blue", true, 11295.3, false, true, false, true]);
conn.query('INSERT INTO vehicles VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', ["1G1ZS52855F285454", "1662", "2003 CHEVROLET MALIBU", "Blue", true, 90057.8, false, true, false, false]);
conn.query('INSERT INTO vehicles VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', ["JTMRJREV7HD151726", "1679", "2017 TOYOTA RAV 4", "Blue", true, 8483.8, false, true, false, false]);
conn.query('INSERT INTO vehicles VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', ["JF2GPBCC0FH232864", "2811", "2015 SUBARU XV", "Blue", true, 9131.5, false, true, false, false]);
conn.query('INSERT INTO vehicles VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', ["1FTEW1E89HFC38284", "1834", "2017 FORD F150", "Blue", true, 4385.0, false, true, false, false]);
conn.query('INSERT INTO vehicles VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', ["2GNF1CEK9C6333734", "1869", "2011 CHEVROLET EQUINOX", "Blue", true, 27513.0, false, true, false, false]);
conn.query('INSERT INTO vehicles VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', ["1FMCU59H18KA54880", "1994", "2008 FORD ESCAPE", "Blue", true, 235952.9, false, true, false, false]);
conn.query('INSERT INTO vehicles VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', ["1FMCU59H38KA54881", "2140", "2008 FORD ESCAPE", "Blue", true, 77522.0, false, true, false, false]);
conn.query('INSERT INTO vehicles VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', ["1FTYR10D67PA83081", "2224", "2007 FORD RANGER", "Blue", true, 40558.2, false, true, false, false]);
conn.query('INSERT INTO vehicles VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', ["1G1RA6E47EU133964", "2242", "2014 CHEVROLET VOLT", "Black", true, 9391.1, true, false, false, false]);
conn.query('INSERT INTO vehicles VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', ["1FADP5CU6FL121721", "2254", "2016 FORD CMAX", "Black", true, 17993.8, true, false, false, false]);
conn.query('INSERT INTO vehicles VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', ["JHMES96663S028859", "2468", "2004 HONDA CIVIC", "Blue", true, 363.6, false, true, false, false]);
conn.query('INSERT INTO vehicles VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', ["1FADP5CU8FL121722", "2472", "2015 FORD CMAX", "Black", true, 9327.3, true, false, false, false]);
conn.query('INSERT INTO vehicles VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', ["1FADP5CU2FL121716", "2473", "2015 FORD CMAX", "Black", true, 13772.9, true, false, false, false]);
conn.query('INSERT INTO vehicles VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', ["1GBDV13W07D219007", "2579", "2007 CHEVROLET UPLANDER", "Blue", true, 36831.4, false, true, true, true]);
conn.query('INSERT INTO vehicles VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', ["1FTPW14587FB58781", "2709", "2007 FORD F150", "Blue", true, 167668.3, false, true, false, false]);
conn.query('INSERT INTO vehicles VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', ["1FTYR10D47PA83080", "315", "2007 FORD RANGER", "Blue", true, 43196.2, false, true, false, false]);
conn.query('INSERT INTO vehicles VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', ["1FADP5CU0FL121715", "704", "2015 FORD CMAX", "Black", true, 5868.7, true, false, false, false]);
conn.query('INSERT INTO vehicles VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', ["1FADP5CU8FL121719", "739", "2015 FORD CMAX", "Black", true, 7883.3, true, false, false, false]);
conn.query('INSERT INTO vehicles VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', ["1FADP5CU6FL121718", "827", "2015 FORD CMAX", "Black", true, 9055.6, true, false, false, false]);

conn.query('INSERT INTO reports VALUES(null, ?, ?)', [5, "Car sucks."]);
conn.query('INSERT INTO reports VALUES(null, ?, ?)', [1, "Car is dirty af."]);

/*Sets up the server on port 8080.*/
server.listen(8080, function(){
    console.log('- Server listening on port 8080');

});

//handles events when an admin user is connected
io.of('/admin').on('connection', function(socket){
    socket.on('vehicleAdded', function(vehicle,callback){
        addVehicle(vehicle);
        callback();
    });

    socket.on('updatePage', function(callback){
        updateAdminReservations();
        updateVehicles();
        callback();
    });

    socket.on('vehicleRemoved', function(license, callback){
        removeVehicle(license);
        callback();
    });
    socket.on('vehicleEdited', function(id, vehicle, callback){
        editVehicle(id, vehicle);
        callback();
    });
    socket.on('vehicleStatusUpdated', function(license, status, callback){
        updateVehicleStatus(license, status);
        callback();
    });
    socket.on('reportRemoved', function(id){
        removeReport(id);
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

function addEvent(title, bodytext, start, end) {
    var newEvent = {
        "Subject": title,
        "Body": {
            "ContentType": "HTML",
            "Content": bodytext,
        },
        "Start": start, //"2018-04-28T00:00:00.000Z",
        "End": end, //"2018-04-28T00:30:00.000Z"
        /*,
        "Attendees": [
            {
                "EmailAddress": {
                    "Address": email,
                    "Name": name
                },
                "Type": "Required"
            }
        ]*/
    };

    var userInfo = {
        email: "dem_test_u@outlook.com"
    };

    var addEventParameters = {
        token: token,
        event: newEvent,
        user: userInfo
    };

    outlook.calendar.createEvent(addEventParameters,
        function(error, result) {
        if (error) {
            console.log(error);
        }
        else {
            console.log("success adding event");
        }
    });
}

//handles events when a regular user is connnected
io.of('/user').on('connection', function(socket){
    socket.on('join', function(user, callback){
        console.time("Get Reservations Query"); // TIMER START
        conn.query('SELECT * FROM reservations WHERE user = ? ORDER BY start DESC', [user], function(error, data){
            console.timeEnd("Get Reservations Query"); // TIMER END
            callback(data);
        });
    });
    //emitted when a user makes a new reservation
    socket.on('reservation', function(reservationInfo, callback){
        //console.log("got a reservation!");

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
        console.time("Get Vehicle Query"); // TIMER START
        conn.query('SELECT license, model FROM vehicles WHERE extraTrunk >= ? AND offRoad >= ? AND equipRack >= ? AND license NOT IN (SELECT license FROM reservations WHERE start <= ? AND end >= ?) ORDER BY isEV DESC, (extraTrunk + offRoad + equipRack) ASC', [needsTrunk, needsOffRoad, needsRack, reservationInfo.end, reservationInfo.start], function(error, data){
            console.timeEnd("Get Reservations Query"); // TIMER END
            socket.emit('alternateVehicles', data);
            console.time("Insert Reservation Query"); // TIMER START
            conn.query('INSERT INTO reservations VALUES(null, ?, ?, ?, ?, ?, ?, ?, ?)',[reservationInfo.user, data.rows[0].license, data.rows[0].model, reservationInfo.start, reservationInfo.end, reservationInfo.stops, reservationInfo.override, reservationInfo.justification],function(error, data){
                console.timeEnd("Insert Reservation Query"); // TIMER END
                //console.log(data);
                console.time("Get Reservation Query"); // TIMER START
                conn.query('SELECT * FROM reservations WHERE id = ?', [data.lastInsertId], function(error, data){
                    console.timeEnd("Get Reservation Query"); // TIMER END
                    socket.emit('newReservation', data);
                    var start = new Date(reservationInfo.start);
                    var end = new Date(reservationInfo.end);
                    console.log(reservationInfo.start);
                    console.log(reservationInfo.end);
                    addEvent(reservationInfo.user + "'s upcoming DEM trip", data.rows[0].model + " " + data.rows[0].license + "\n" + reservationInfo.stops, start.toISOString(), end.toISOString());
                    io.of('/admin').emit("newReservation", data);
                    //console.log("sending to user");
                });
            });
        });
        //callback();
    });

    socket.on('edit', function(reservationID, reservationInfo){
        //editReservation(reservationID, reservationInfo.start, reservationInfo.end, reservationInfo.stops, reservationInfo.justification);
        console.time("Reservation Edit Query");
        conn.query('UPDATE reservations SET start = ?, end = ?, stops = ?, justification = ? WHERE id = ?', [reservationInfo.start, reservationInfo.end, reservationInfo.stops, reservationInfo.justification, reservationID], function(error, data){
            console.timeEnd("Reservation Edit Query");
            console.time("Get User Reservations Query"); // TIMER START
            conn.query('SELECT * FROM reservations WHERE user = ?', [reservationInfo.user], function(error, data){
                console.timeEnd("Get User Reservations Query"); // TIMER END
                socket.emit('reservationChange', data);
            });
            console.time("Get Reservations Query"); // TIMER START
            conn.query('SELECT * FROM reservations', function(error, data){
                console.timeEnd("Get Reservations Query") // TIMER END
                io.of('/admin').emit('reservationChange', data);
            });
        });
        //callback();
    });

    socket.on('cancel', function(reservationID, user, callback){
        cancelReservation(reservationID);
        console.time("Get User Reservations Query"); // TIMER START
        conn.query('SELECT * FROM reservations WHERE user = ?', [user], function(error, data){
            console.timeEnd("Get User Reservations Query"); // TIMER END
            socket.emit('reservationChange', data);
        });
        console.time("Get Reservations Query"); // TIMER START
        conn.query('SELECT * FROM reservations', function(error, data){
            console.timeEnd("Get Reservations Query") // TIMER END
            io.of('/admin').emit('reservationChange', data);
        });
        //callback();
    });

    socket.on('feedback', function(reservationID, report){
        submitFeedback(reservationID, resport);
        console.time("Get Reports Query"); // TIMER START
        conn.query('SELECT * FROM reports', function(error, data){
            console.timeEnd("Get Reports Query"); // TIMER END
            io.of('/admin').emit('reportChange', data);
        });
    });

    socket.on('vehicleOverride', function(reservationID, license, model, justification){
        console.time("Update Reservations Query"); // TIMER START
        conn.query('UPDATE reservations SET license = ?, model = ?, override = ?, justification = ? WHERE id = ?', [license, model, true, justification, reservationID], function(error, data){
            console.timeEnd("Update Reservations Query"); // TIMER END
            console.time("Get User Reservations Query"); // TIMER START
            conn.query('SELECT * FROM reservations WHERE id = ?', [reservationID], function(error, data){
                console.timeEnd("Get User Reservations Query"); // TIMER END
                socket.emit('reservationOverride', data);
            });
            console.time("Get Reservations Query") // TIMER START
            conn.query('SELECT * FROM reservations', function(error, data){
                console.timeEnd("Get Reservations Query"); // TIMER END
                io.of('/admin').emit('reservationChange', data);
            });
        });
    });
});

/**
 * Sets up the landing page to index.html.
 */

var token = undefined;
var authorized_users = ['dem_test_u@outlook.com', 'dem_test_u_2@outlook.com'];
var authorized_admins = ['dem_test_a@outlook.com'];

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
            token = accessToken;
            return done(null, profile);
        });
    }
));

app.get('/', function(req, res) {
    res.send(index.loginPagePassport());
});


function ensureAuthenticated(req, res, next) {
    var email = req.user._json.EmailAddress;
    if (req.isAuthenticated() && authorized_users.includes(email) && req.path.startsWith("/user/")) {
        return next();
    }
    if (req.isAuthenticated() && authorized_admins.includes(email) && req.path.startsWith("/admin/")) {
        return next();
    }
    else res.redirect('/');
}

app.all('*', function(req,res,next) {
    if (req.path === '/' || req.path === '/auth/outlook' || req.path === '/authorize')
        next();
    else
        ensureAuthenticated(req,res,next);
});

app.get('/authorize',
        passport.authenticate('windowslive', { failureRedirect: '/' }),
        function(req, res) {
    var user_email = req.user._json.EmailAddress;
    var name = req.user._json.DisplayName;
    if (authorized_admins.includes(user_email)) {
        app.use("/admin", express.static(__dirname + '/public/admin'));
        replace({
            regex: "Welcome,(.+)<br>",
            replacement: "Welcome, " + user_email + " <br>",
            paths: ['./public/admin/data.html', './public/admin/fleet.html', './public/admin/index.html'],
            silent: true
        })
        res.redirect('admin/index.html');
        //res.render('admin/index.html', {user : user_email});
        //res.redirect('admin/index/?email=' + encodeURIComponent(user_email));
        io.of('/admin').emit('admin-connected', user_email);
    } else if (authorized_users.includes(user_email)) {
        app.use("/user", express.static(__dirname + '/public/user'));
        io.sockets.emit('user-connected', user_email);
        replace({
            regex: "Welcome,(.+)<br>",
            replacement: "Welcome, " + user_email + " <br>",
            paths: ['./public/user/index.html'],
            silent: true
        })
        res.redirect('user/index.html');
    }
});

app.get('/auth/outlook',
    passport.authenticate('windowslive', { scope: process.env.CLIENT_SCOPES }),
    function(req, res) {
});

app.get('/logout', function(req, res) {
    let user_email = "";
    if(req.user !== undefined){
        user_email = req.user._json.EmailAddress;
    }
    replace({
        regex: "Welcome,(.+)<br>",
        replacement: "Welcome, %user% <br>",
        paths: ['./public/user/index.html', './public/admin/data.html', './public/admin/fleet.html', './public/admin/index.html'],
        silent: true
    });
    token = undefined;
    req.logout();
    req.session.destroy(function (err) {
        res.redirect('/');
    });
});

// ADMIN helper functions
function updateAdminReservations(){
    console.time("Update Admin Query");
    conn.query('SELECT * FROM reservations', function(error, data){
        console.timeEnd("Update Admin Query");
        io.of('/admin').emit('reservationChange', data);
    });
}
function updateVehicles(){
    console.time("Update Vehicles Query");
    conn.query('SELECT * FROM vehicles',function(error, data){
        console.timeEnd("Update Vehicles Query");
        io.of('/admin').emit('vehicleChange', data);
    });

}
function addVehicle(vehicle){
    console.time("Add Vehicle Query");
    conn.query('INSERT INTO vehicles VALUES(null, ?, ?, ?, ?, ?, ?, ?, ?, ?)',[vehicle.license, vehicle.model, vehicle.color, vehicle.status, vehicle.miles, vehicle.isEv, vehicle.trunk, vehicle.offRoad, vehicle.equipmentRack],function(error, data){
        console.timeEnd("Add Vehicle Query");
        updateVehicles();
    });
    console.log(vehicle);
}
function editVehicle(id, vehicle){
    console.time("Edit Vehicle Query");
    conn.query('REPLACE INTO vehicles VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',[vehicle.license, vehicle.model, vehicle.color, vehicle.miles, vehicle.status, vehicle.isEv, vehicle.trunk, vehicle.offRoad, vehicle.equipmentRack],function(error, data){
        console.timeEnd("Edit Vehicle Query");
        updateVehicles();
    });
}
function removeVehicle(license){
    console.time("Remove Vehicle Query");
    conn.query('DELETE FROM vehicles WHERE license = ?', [license],function(error, data){
        console.timeEnd("Remove Vehicle Query");
        updateVehicles();
    });
}
function updateVehicleStatus(license, status){
    console.time("Update Status Query");
    conn.query('UPDATE vehicles SET inService = ? WHERE license = ?',[status, license],function(error, data){
        console.timeEnd("Update Status Query");
        updateVehicles();
    });
}
function updateReports(){
    console.time("Update Reports Query");
    conn.query('SELECT * FROM reports', function(error, data){
        console.timeEnd("Update Reports Query");
        io.of('/admin').emit('reportChange', data);
    });
}
function removeReport(id){
    console.time("Remove Reports Query");
    conn.query('DELETE FROM reports WHERE id =?', [id], function(error, data){
        console.timeEnd("Remove Reports Query");
        updateReports();
    });
}
function getSpecificReports(reservation){
    console.time("Specific Reports Query");
    conn.query('SELECT * FROM reports WHERE reservation = ?', [reservation], function(error, data){
        console.timeEnd("Specific Reports Query");
    });
}

function addUser(email, admin){
    console.time("User Add Query");
    conn.query('INSERT INTO users VALUES(null, ?, ?)',[email, admin],function(error, data){
        console.timeEnd("User Add Query");
        console.log(error);
        console.log("done");
    });
}

function changeUserStatus(email, admin){
    console.time("User Change Query");
    conn.query('UPDATE users SET admin = ? WHERE email = ?',[admin, email],function(error, data){
        console.timeEnd("User Change Query");
    });
}
function removeUser(email){
    console.time("User Removal Query");
    conn.query('DELETE FROM users WHERE email = ?', [email], function(error, data){
        console.timeEnd("User Removal Query");
        console.log("User Removal Query");
    });
}

// USER help functions
function editReservation(id, start, end, stops, justification){
    console.time("Reservation Edit Query");
    conn.query('UPDATE reservations SET start = ?, end = ?, stops = ?, justification = ? WHERE reservationID = ?', [start, end, stops, justification, id], function(error, data){
        console.timeEnd("Reservation Edit Query");
    });
}
function cancelReservation(id){
    console.time("Reservation Cancellation Query");
    conn.query('DELETE FROM reservations WHERE id = ?', [id], function(error, data){
        console.timeEnd("Reservation Cancellation Query");
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
    });
}
