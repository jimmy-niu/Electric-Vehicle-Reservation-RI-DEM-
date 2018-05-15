let express = require('express');
let app = express();
let path = require('path');
let http =require('http');
let nodemailer = require('nodemailer');
let server = http.createServer(app);

let io = require('socket.io')(server, {wsEngine: 'ws'}); //fix Windows10 issue
io.listen(server);

let multer = require("multer");
let bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: true}));
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
var methodOverride = require('method-override');
var passport = require('passport');
var util = require('util');
var OutlookStrategy = require('passport-outlook').Strategy;
var replace = require("replace");

let anyDB = require('any-db');
let conn = anyDB.createConnection('sqlite3://DEM.db');

let jsoncsv = require('json-csv');

let fs = require('fs');

let engines = require('consolidate');
app.engine('html', require('hogan-express'));
app.set('views', __dirname + '/public'); // tell Express where to find templates, in this case the '/public' directory
app.set('view engine', 'html'); //register .html extension as template engine so we can render .html pages

app.use(cookieParser());
app.use(session(
    { secret: 's3cr3t',
     resave: false,
     saveUninitialized: true
    })
);

//Sets up the server on port 8080.
server.listen(8080, function(){
    console.log('- Server listening on port 8080');
});

//sets up transporter for sending emails
var transporter = nodemailer.createTransport({
    pool: true,
    maxConnections: 10,
    host: "smtp-mail.outlook.com", // hostname
    secureConnection: false, // TLS requires secureConnection to be false
    port: 587, // port for secure SMTP
    auth: {
        user: 'dem_do-not-reply@outlook.com',
        pass: 'DEMnoreply123' //this shouldn't be hardcoded in- you should set up an environment variable or something
    },
    tls: {
        ciphers:'SSLv3'
    }
});

//for testing purposes- data resets every time
conn.query('DROP TABLE IF EXISTS reservations');
conn.query('DROP TABLE IF EXISTS vehicles');
conn.query('DROP TABLE IF EXISTS reports');
conn.query('DROP TABLE IF EXISTS users');


//TABLES:
//Users
conn.query('CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT, admin BOOLEAN)');
//Resevervations
conn.query('CREATE TABLE IF NOT EXISTS vehicles(id TEXT, license TEXT, model TEXT, color TEXT, inService BOOLEAN, miles DOUBLE PRECISION, isEV BOOLEAN, extraTrunk BOOLEAN, offRoad BOOLEAN, equipRack BOOLEAN, featureScore INTEGER, image TEXT)');
//Vehicles
conn.query('CREATE TABLE IF NOT EXISTS reservations(id INTEGER PRIMARY KEY AUTOINCREMENT, user TEXT, license TEXT, model TEXT, start TEXT, end TEXT, stops TEXT, override BOOLEAN, justification TEXT, needsTrunk BOOLEAN, needsOffRoad BOOLEAN, needsRack BOOLEAN, image TEXT, archived BOOLEAN)');
//Reports
conn.query('CREATE TABLE IF NOT EXISTS reports(id INTEGER PRIMARY KEY AUTOINCREMENT, reservation INTEGER, report TEXT, needsService BOOLEAN, needsCleaning BOOLEAN, notCharging BOOLEAN)');

//test data
conn.query('INSERT INTO reservations VALUES(null, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',["jenna.tishler@gmail.com", "1322", "2015 FORD CMAX", "2018-05-21 11:00", "2018-05-21 15:00", JSON.stringify(["563 North Main Street, Providence, RI, USA", "565 Atwells Avenue, Providence, RI, USA", "563 North Main Street, Providence, RI, USA"]), false, "", false, false, false, "fordcmax.jpg", true]);
conn.query('INSERT INTO reservations VALUES(null, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',["jenna_tishler@brown.edu", "704", "2015 FORD CMAX", "2018-05-10 01:00", "2018-05-10 03:00", JSON.stringify(["home", "work", "home"]), false, "", false, false, false, "fordcmax.jpg", false]);
conn.query('INSERT INTO reservations VALUES(null, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',["emily_kasbohm@brown.edu", "2254", "2016 FORD CMAX", "2018-05-21 11:00", "2018-05-21 15:00", JSON.stringify(["563 North Main Street, Providence, RI, USA", "565 Atwells Avenue, Providence, RI, USA", "563 North Main Street, Providence, RI, USA"]), false, "", false, false, false, "fordcmax.jpg", false]);
conn.query('INSERT INTO reservations VALUES(null, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',["dem_test_u_2@outlook.com", "1869", "2011 CHEVROLET EQUINOX", "2018-05-06 14:00", "2018-05-06 17:00", JSON.stringify(["home", "work"]), true, "I have a reason.", false, false, false, "2011chevroletequinox.jpg", false]);
conn.query('INSERT INTO reservations VALUES(null, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',["dem_test_u_2@outlook.com", "2254", "2016 FORD CMAX", "2018-05-21 10:00", "2018-05-21 10:30", JSON.stringify(["work", "beach"]), false, "", false, false, false, "fordcmax.jpg", false]);
conn.query('INSERT INTO reservations VALUES(null, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',["dem_test_u@outlook.com", "704", "2015 FORD CMAX", "2017-05-19 11:00", "2017-05-20 11:00", JSON.stringify(["home", "work"]), false, "", false, false, false, "fordcmax.jpg", false]);
conn.query('INSERT INTO reservations VALUES(null, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',["dem_test_u@outlook.com", "1322", "2015 FORD CMAX", "2011-05-18 11:00", "2011-05-18 15:00", JSON.stringify(["Work", "Home"]), false, "", false, false, false, "fordcmax.jpg", false]);
conn.query('INSERT INTO reservations VALUES(null, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',["dem_test_u@outlook.com", "704", "2015 FORD CMAX", "2010-05-19 11:00", "2010-05-20 11:00", JSON.stringify(["home", "work"]), false, "", false, false, false, "fordcmax.jpg", false]);
conn.query('INSERT INTO reservations VALUES(null, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',["dem_test_u@outlook.com", "2254", "2016 FORD CMAX", "2013-05-21 11:00", "2013-05-21 15:00", JSON.stringify(["563 North Main Street, Providence, RI, USA", "565 Atwells Avenue, Providence, RI, USA", "563 North Main Street, Providence, RI, USA"]), false, "", false, false, false, "fordcmax.jpg", false]);

conn.query('INSERT INTO vehicles VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, null, ?)', ["JF2GPBCC3FH253482", "1011", "2016 SUBARU XV", "Black/White", true, 11451.5, false, true, true, false, "2016subaruxv.jpg"]);
conn.query('INSERT INTO vehicles VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, null, ?)', ["1FMCU59329KC41390", "1018", "2009 FORD ESCAPE", "Black/White", true, 151071.5, false, true, true, false, "2009fordescape.jpg"]);
conn.query('INSERT INTO vehicles VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, null, ?)', ["1GNDT13S552325449", "1052", "2005 CHEVROLET TRAILBLAZER", "Black/White", true, 62759.9, false, false, false, false, "2005chevrolettrailblazer.jpg"]);
conn.query('INSERT INTO vehicles VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, null, ?)', ["1FADP5CU7FL121713", "1252", "2015 FORD CMAX", "Black", false, 6041.9, true, false, false, false, "fordcmax.jpg"]);
conn.query('INSERT INTO vehicles VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, null, ?)', ["1FADP5CU9FL121714", "1254", "2015 FORD CMAX", "Black", false, 9543.2, true, false, false, false, "fordcmax.jpg"]);
conn.query('INSERT INTO vehicles VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, null, ?)', ["1FADP5CU4FL121717", "1322", "2015 FORD CMAX", "Black", true, 13594.4, true, false, false, false, "fordcmax.jpg"]);
conn.query('INSERT INTO vehicles VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, null, ?)', ["1FMYU96H76KD26489", "1583", "2006 FORD ESCAPE", "Black/White", true, 72981.1, false, true, true, false, "2006fordescape.jpg"]);
conn.query('INSERT INTO vehicles VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, null, ?)', ["JTMRJREV1HD152175", "1650", "2017 TOYOTA RAV 4", "Black/White", true, 11295.3, false, true, true, false, "2017toyotarav4.jpg"]);
conn.query('INSERT INTO vehicles VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, null, ?)', ["1G1ZS52855F285454", "1662", "2003 CHEVROLET MALIBU", "Black/White", true, 90057.8, false, false, false, false, "2003cheroletmalibu.jpg"]);
conn.query('INSERT INTO vehicles VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, null, ?)', ["JTMRJREV7HD151726", "1679", "2017 TOYOTA RAV 4", "Black/White", true, 8483.8, false, true, true, false, "2017toyotarav4.png"]);
conn.query('INSERT INTO vehicles VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, null, ?)', ["JF2GPBCC0FH232864", "2811", "2015 SUBARU XV", "Black/White", true, 9131.5, false, true, true, false, "2015subaruxv.jpg"]);
conn.query('INSERT INTO vehicles VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, null, ?)', ["1FTEW1E89HFC38284", "1834", "2017 FORD F150", "Black/White", true, 4385.0, false, true, true, true, "2017fordf150.jpg"]);
conn.query('INSERT INTO vehicles VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, null, ?)', ["2GNF1CEK9C6333734", "1869", "2011 CHEVROLET EQUINOX", "Black/White", true, 27513.0, false, true, true, false, "2011chevroletequinox.jpg"]);
conn.query('INSERT INTO vehicles VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, null, ?)', ["1FMCU59H18KA54880", "1994", "2008 FORD ESCAPE", "Black/White", true, 235952.9, false, true, true, false, "2008fordescape.jpg"]);
conn.query('INSERT INTO vehicles VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, null, ?)', ["1FMCU59H38KA54881", "2140", "2008 FORD ESCAPE", "Black/White", true, 77522.0, false, true, true, false, "2008fordescape.jpg"]);
//conn.query('INSERT INTO vehicles VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, null, ?)', ["1FTYR10D67PA83081", "2224", "2007 FORD RANGER", "Black/White", true, 40558.2, false, true, true, true, "2007fordranger.jpg"]);
conn.query('INSERT INTO vehicles VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, null, ?)', ["1G1RA6E47EU133964", "2242", "2014 CHEVROLET VOLT", "Black", true, 9391.1, true, false, false, false, "2014chevroletvolt.jpg"]);
conn.query('INSERT INTO vehicles VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, null, ?)', ["1FADP5CU6FL121721", "2254", "2016 FORD CMAX", "Black", true, 17993.8, true, false, false, false, "fordcmax.jpg"]);
conn.query('INSERT INTO vehicles VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, null, ?)', ["JHMES96663S028859", "2468", "2004 HONDA CIVIC", "Black/White", true, 363.6, false, false, false, false, "2004hondacivic"]);
conn.query('INSERT INTO vehicles VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, null, ?)', ["1FADP5CU8FL121722", "2472", "2015 FORD CMAX", "Black", true, 9327.3, true, false, false, false, "fordcmax.jpg"]);
conn.query('INSERT INTO vehicles VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, null, ?)', ["1FADP5CU2FL121716", "2473", "2015 FORD CMAX", "Black", true, 13772.9, true, false, false, false, "fordcmax.jpg"]);
conn.query('INSERT INTO vehicles VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, null, ?)', ["1GBDV13W07D219007", "2579", "2007 CHEVROLET UPLANDER", "Black/White", true, 36831.4, false, true, false, false, "2007chevroletuplander.jpg"]);
//conn.query('INSERT INTO vehicles VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, null, ?)', ["1FTPW14587FB58781", "2709", "2007 FORD F150", "Black/White", true, 167668.3, false, true, true, true, "2007fordf150.jpg"]);
//conn.query('INSERT INTO vehicles VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, null, ?)', ["1FTYR10D47PA83080", "315", "2007 FORD RANGER", "Black/White", true, 43196.2, false, true, true, true, "2007fordranger.jpg"]);
conn.query('INSERT INTO vehicles VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, null, ?)', ["1FADP5CU0FL121715", "704", "2015 FORD CMAX", "Black", true, 5868.7, true, false, false, false, "fordcmax.jpg"]);
conn.query('INSERT INTO vehicles VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, null, ?)', ["1FADP5CU8FL121719", "739", "2015 FORD CMAX", "Black", true, 7883.3, true, false, false, false, "fordcmax.jpg"]);
conn.query('INSERT INTO vehicles VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, null, ?)', ["1FADP5CU6FL121718", "827", "2015 FORD CMAX", "Black", true, 9055.6, true, false, false, false, "fordcmax.jpg"]);

conn.query('INSERT INTO reports VALUES(null, ?, ?, ?, ?, ?)', [5, "Car sucks.", true, true, false]);
conn.query('INSERT INTO reports VALUES(null, ?, ?, ?, ?, ?)', [1, "Car is  very dirty.", false, true, false]);

conn.query('INSERT INTO users VALUES(null, ?, ?)', ["dem_test_a@outlook.com", true]);
conn.query('INSERT INTO users VALUES(null, ?, ?)', ["dem_test_u@outlook.com", false]);
conn.query('INSERT INTO users VALUES(null, ?, ?)', ["dem_test_u_2@outlook.com", false]);

//calculates feature scores
conn.query('UPDATE vehicles SET featureScore = extraTrunk + offRoad + equipRack');

let adminEmails = [];
let normalEmails = [];

function populateEmailLists(){
    conn.query('SELECT * FROM users', function(error, data){
        console.log(data);
        for(let i = 0; i < data.rowCount; i++) {
            if(data !== undefined && data.rows[i].admin === 1){
                adminEmails.push(data.rows[i].email);
            } else {
                normalEmails.push(data.rows[i].email);
            }
        }
    });
}

populateEmailLists();

//handles events when an admin user is connected
io.of('/admin').on('connection', function(socket){
    socket.on('vehicleAdded', function(vehicle,callback){
        addVehicle(vehicle);
        callback();
    });

    socket.on('updatePage', function(callback){
        updateAdminReservations();
        updateAdminArchived();
        updateVehicles();
        updateReports();
        updateUsers();
        callback();
    });
    
    socket.on('reservationArchived', setReservationArchived);

    socket.on('vehicleRemoved', function(license, callback){
        removeVehicle(license);
        callback();
    });
    socket.on('vehicleEdited', function(vehicle){
        editVehicle(vehicle);
        //callback();
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

/**
 * This function adds a reservation as an event to the user's outlook calendar.
 *
 * @params
 * title: String that contains user and license
 * bodytext: String that contains license, model, stops
 * start: start date and time
 * end: end date and time
 */
function addEvent(title, bodytext, start, end) {
    console.log(bodytext)
    var newEvent = {
        "Subject": title,
        "Body": {
            "ContentType": "HTML",
            "Content": bodytext,
        },
        "Start": start, //"2018-04-28T00:00:00.000Z",
        "End": end, //"2018-04-28T00:30:00.000Z"
    };

    var addEventParameters = {
        token: token,
        event: newEvent
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

/**
 * This function removes a reservation from the user's outlook calendar.
 * @params
 * subject: event title (user and license)
 * start: start date and time
 * end: end date and time
 */
function removeEvent(subject, start, end) {
    var queryParams = {
        '$select': 'Subject,Start,End,Id',
        '$top': 50,
    };

    outlook.calendar.getEvents({token: token, odataParams: queryParams},
                               function(error, result){
        if (error) {
            console.log('getEvents returned an error: ' + error);
        }
        else if (result) {
            result.value.forEach(function(event) {
                if (event.Subject === subject && event.Start === start && event.End == end) {
                    outlook.calendar.deleteEvent({token: token, eventId: event.Id},
                                                 function(error, result) {
                        if (error) {
                            console.log(error)
                        } else {
                            console.log("deleteEvent success");
                        }
                    })
                }
            });
        }
    });
}

//for testing purposes only- remove before deployment!
function nukeEvents() {
    var queryParams = {
        '$select': 'Subject,Start,End,Id',
        '$top': 500,
    };

    outlook.calendar.getEvents({token: token, odataParams: queryParams},
                               function(error, result){
        if (error) {
            console.log('getEvents returned an error: ' + error);
        }
        else if (result) {
            console.log('getEvents returned ' + result.value.length + ' events.');
            //return result.value;
            result.value.forEach(function(event) {
                console.log(event.Start)
                console.log(event.End)
                outlook.calendar.deleteEvent({token: token, eventId: event.Id},
                                             function(error, result) {
                    if (error) {
                        console.log(error)
                        //console.log('deleteEvent returned an error');
                    } else {
                        console.log("deleteEvent success");
                    }
                });
            });
        }
    });
}

//handles events when a regular user is connnected
io.of('/user').on('connection', function(socket) {
    //used when the user first logs in, sends back all reservations for that user, ordered by date/time
    socket.on('join', function(user, callback){
        conn.query('SELECT *, vehicles.isEV, reservations.id FROM reservations INNER JOIN vehicles ON reservations.license = vehicles.license WHERE user = ? ORDER BY end ASC', [user], function(error, data){
            callback(data);
        });
    });

    //used when the user submits information for a new reservation
    socket.on('reservation', function(reservationInfo, callback){
        //this function will asign a vehicle for the reservation
        assignVehicle(socket, reservationInfo, false);
    });

    //used when user submits information an edited reservation
    socket.on('edit', function(reservationInfo, oldData){
        //this function will reassign a vehicle for the reservation
        assignVehicle(socket, reservationInfo, oldData, true);
    });

    //used when the user confirms creation of new reservation
    socket.on('addReservation', insertReservation);

    //used when the user confirms the edit of a reservation
    socket.on('editReservation', function(reservationInfo, id, oldData, callback){
        //updates reservation entry in database
        editReservation(reservationInfo, id, oldData, callback);
    })

    //used when the user cancels a reservation
    socket.on('cancel', function(reservationID, user, model, license, start, end){
        //removes reservation from database
        cancelReservation(reservationID, user, model, license, start, end);
    });

    //used when the user submits a report about a reservation
    socket.on('reportAdded', function(reservationID, report, needsService, needsCleaning, notCharging){
        submitFeedback(reservationID, resport, needsService, needsCleaning, notCharging);
    });
});

function insertReservation(reservationInfo, callback){
    conn.query('INSERT INTO reservations VALUES(null, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',[reservationInfo.user, reservationInfo.license, reservationInfo.model, reservationInfo.start, reservationInfo.end, reservationInfo.stops, reservationInfo.override, reservationInfo.justification, reservationInfo.needsTrunk, reservationInfo.needsOffRoad, reservationInfo.needsRack, reservationInfo.image, false],function(error, data){
        //get information about newest reservation to the admin
        conn.query('SELECT * FROM reservations WHERE id = ?', [data.lastInsertId], function(error, resData){
            //sends back id created by database so client has it
            callback(data.lastInsertId);
            //sends new reservation to admins
            io.of('/admin').emit("newReservation", resData);

            //adds reservation to user's calendar
            var start = new Date(reservationInfo.start);
            var end = new Date(reservationInfo.end);
            addEvent(reservationInfo.user + "'s upcoming DEM trip (" + reservationInfo.license + ")", reservationInfo.model + " " + reservationInfo.license + "\n" + reservationInfo.stops, start.toISOString(), end.toISOString());
        });
    });
}

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
        token = accessToken;
        return done(null, profile);
    });
}
                                ));

app.get('/', function(req, res) {
    res.send(index.loginPagePassport());
});

app.get('/authorize',
        passport.authenticate('windowslive', { failureRedirect: '/' }),
        function(req, res) {
    var user_email = req.user._json.EmailAddress;
    var name = req.user._json.DisplayName;
    if (adminEmails.includes(user_email)) {
        app.use("/admin", express.static(__dirname + '/public/admin'));
        app.use("/admin_u", express.static(__dirname + '/public/user'));
        replace({
            regex: "Welcome,(.+)<br>",
            replacement: "Welcome, " + user_email + " <br>",
            paths: ['./public/admin/reports.html', './public/admin/fleet.html', './public/admin/index.html',
                    './public/user/index_admin.html'],
            silent: true
        })
        nukeEvents();
        res.redirect('admin/index.html');
        //res.render('admin/index.html', {user : user_email});
        //res.redirect('admin/index/?email=' + encodeURIComponent(user_email));
        io.of('/admin').emit('admin-connected', user_email);
    } else if (normalEmails.includes(user_email)) {
        app.use("/user", express.static(__dirname + '/public/user'));
        io.sockets.emit('user-connected', user_email);
        replace({
            regex: "Welcome,(.+)<br>",
            replacement: "Welcome, " + user_email + " <br>",
            paths: ['./public/user/index.html'],
            silent: true
        })
        nukeEvents();
        res.redirect('user/index.html');
    } else {
        res.send(index.loginPagePassport());
    }
});

app.get('/auth/outlook',
        passport.authenticate('windowslive', { scope: process.env.CLIENT_SCOPES }),
        function(req, res) {
});

app.get('/admin/download/users',
    function(req, res) {
    var user_email = req.user._json.EmailAddress;
    if (adminEmails.includes(user_email)) {
        exportUsers(function(){
            res.download(__dirname + '/public/admin/temp/users.csv',function(){
                fs.unlink(__dirname + '/public/admin/temp/users.csv');
            });
        });
    } else {
        console.log("not authorized");
        res.redirect("/");
    }
});

app.get('/admin/download/vehicles',
    function(req, res) {
    var user_email = req.user._json.EmailAddress;
    if (adminEmails.includes(user_email)) {
        exportVehicles(function(){
            res.download(__dirname + '/public/admin/temp/vehicles.csv',function(){
                fs.unlink(__dirname + '/public/admin/temp/vehicles.csv');
            });
        });
    } else {
        console.log("not authorized");
        res.redirect("/");
    }
});

app.get('/admin/download/reservations',
    function(req, res) {
    var user_email = req.user._json.EmailAddress;
    if (adminEmails.includes(user_email)) {
        exportReservations(function(){
            res.download(__dirname + '/public/admin/temp/reservations.csv',function(){
                fs.unlink(__dirname + '/public/admin/temp/reservations.csv');
            });
        });
    } else {
        console.log("not authorized");
        res.redirect("/");
    }
});

app.get('/admin/download/reports',
    function(req, res) {
    var user_email = req.user._json.EmailAddress;
    if (adminEmails.includes(user_email)) {
        exportReports(function(){
            res.download(__dirname + '/public/admin/temp/reports.csv',function(){
                fs.unlink(__dirname + '/public/admin/temp/reports.csv');
            });
        });
    } else {
        console.log("not authorized");
        res.redirect("/");
    }
});

app.get('/logout', function(req, res) {
    let user_email = "";
    if(req.user !== undefined){
        user_email = req.user._json.EmailAddress;
    }
    replace({
        regex: "Welcome,(.+)<br>",
        replacement: "Welcome, %user% <br>",
        paths: ['./public/user/index.html', './public/admin/reports.html', './public/admin/fleet.html', './public/admin/index.html'],
        silent: true
    });
    token = undefined;
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

// ADMIN helper functions
function updateAdminReservations(){
    conn.query('SELECT * FROM reservations WHERE archived = ?', [false], function(error, data){
        io.of('/admin').emit('reservationChange', data);
    });
}

function setReservationArchived(id, status){
    console.log("We in set reservationId");
    console.log(id + " || " + status);
    conn.query('UPDATE reservations SET archived = ? WHERE id = ?', [status, id], function (error){
        if(error){
            console.log('ERROR: ' + error);
        } else {
            updateAdminArchived();
            updateAdminReservations();
        }
    });
}

function updateAdminArchived(){
    conn.query('SELECT * FROM reservations WHERE archived = ?', [true], function(error, data){
        io.of('/admin').emit('archivedReservations', data);
    });
}

function updateVehicles(){
    conn.query('SELECT * FROM vehicles',function(error, data){
        io.of('/admin').emit('vehicleChange', data);
        //console.log(data)
    });
}
function addVehicle(vehicle){
    conn.query('INSERT INTO vehicles VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, null, ?)',[vehicle.id, vehicle.license, vehicle.model, vehicle.color, vehicle.status, vehicle.miles, vehicle.isEv, vehicle.trunk, vehicle.offRoad, vehicle.equipmentRack, vehicle.image],function(error, data){
        conn.query('UPDATE vehicles SET featureScore = extraTrunk + offRoad + equipRack WHERE id = ?', [vehicle.id]);
        updateVehicles();
    });
    console.log(vehicle);
}

function editVehicle(vehicle){
    console.log(vehicle)
    conn.query('UPDATE vehicles SET license = ?, model = ?, color = ?, miles = ?, inService = ?, isEV = ?, extraTrunk = ?, offRoad = ?, equipRack = ?, image = ? WHERE id = ?',[vehicle.license, vehicle.model, vehicle.color, vehicle.miles, vehicle.inService, vehicle.isEV, vehicle.extraTrunk, vehicle.offRoad, vehicle.equipRack, vehicle.image, vehicle.id],function(error, data){
        conn.query('UPDATE vehicles SET featureScore = extraTrunk + offRoad + equipRack WHERE id = ?', [vehicle.id], function(){
            console.log('reached1');
            console.log(vehicle.inService);
            if(vehicle.inService === true){
                console.log('reached2');
                reassignReservations(vehicle.license);
               
            }  
            updateVehicles();
        });
    });
}
function removeVehicle(license){
    conn.query('DELETE FROM vehicles WHERE license = ?', [license],function(error, data){
        updateVehicles();
        reassignReservations(license);
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
function updateUsers(message){
    conn.query('SELECT * FROM users ORDER BY admin DESC', function(error, data){
        io.of('/admin').emit('userChange', data, message);
        populateEmailLists();
    });
}
function removeReport(id){
    conn.query('DELETE FROM reports WHERE id =?', [id], function(error, data){
        updateReports();
    });
}
function getSpecificReports(reservation){
    conn.query('SELECT * FROM reports WHERE reservation = ?', [reservation], function(error, data){

    });
}

function addUser(email, admin){
    conn.query('SELECT * FROM users WHERE email = ?', [email], function(error,data){
        if(data !== undefined && data.rowCount === 0){
            conn.query('INSERT INTO users VALUES(null, ?, ?)',[email, admin],function(error, data){
                if(admin === 1){
                    updateUsers(`${email} added as an admin.`);
                } else {
                    updateUsers(`${email} added as a user.`);
                }
            });
        } else{
            if(data !== undefined && data.rows[0].admin === 1){
                updateUsers(`${email} is already an admin.`);
            } else {
                updateUsers(`${email} is already a user.`);
            }
        }
    });
}

function changeUserStatus(email, admin){
    conn.query('UPDATE users SET admin = ? WHERE email = ?',[admin, email],function(error, data){
        updateUsers();
    });
}
function removeUser(email){
    conn.query('DELETE FROM users WHERE email = ?', [email], function(error, data){
        updateUsers();
    });
}

// USER help functions

/**
 * This function checks if the reservation overlaps with another one of the same user's reservations,
 * checks if the user can carpool with others, and assigns a vehicle to the reservation. The assigned 
 * vehicle and list of alternative vehicles is sent back to the client. 
 * 
 * @params 
 * socket: socket of user making the reservation
 * reservationInfo: data user submitted about reservation
 * isEdit: true if the user is editing an existing reservation
 */
function assignVehicle(socket, reservationInfo, oldData, isEdit){
    //calculates feature score of reservation
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

    var isOverlap = false;
    var canCarpool = false;
    var carpoolUsers = [reservationInfo.user];
    //this query finds overlapping reservations
    conn.query('SELECT id, user, start, end, stops FROM reservations WHERE (start >= ? AND start <= ?) OR (end >= ? AND end <= ?)', [reservationInfo.start, reservationInfo.end, reservationInfo.start, reservationInfo.end], function(error, data){
        for(var i = 0; i < data.rows.length; i++){
            //if reservations overlaps and is from same user
            //unless is editing then allows overlap with same id
            if(data !== undefined && data.rows[i].user === reservationInfo.user){
                if(!isEdit || data.rows[i].id != reservationInfo.id){
                    isOverlap = true;
                }
            }
            //if reservation is at exact times and is from different user
            else if (data.rows[i].start === reservationInfo.start && data.rows[i].end === reservationInfo.end){
                if (data.rows[i].stops === reservationInfo.stops){
                    canCarpool = true;
                    carpoolUsers.push(data.rows[i].user);
                }
            }
        }
        //don't make reservation is overlaps, alert user
        if(isOverlap){
            socket.emit('isOverlap');
        }
        else {
            //selects all vehicles that meet user's needs, sort them by prioritizing EVs, the lowest feature score, then lowest mileage
            conn.query('SELECT license, model, vehicles.isEV, image FROM vehicles WHERE inService != ? AND extraTrunk >= ? AND offRoad >= ? AND equipRack >= ? AND license NOT IN (SELECT license FROM reservations WHERE start <= ? AND end >= ?) ORDER BY isEV DESC, featureScore ASC, miles ASC', [true, needsTrunk, needsOffRoad, needsRack, reservationInfo.end, reservationInfo.start], function(error, data){
                if(data.rows.length !== 0){
                    //updates reservation info with car info
                    reservationInfo.model = data.rows[0].model;
                    reservationInfo.license = data.rows[0].license;
                    reservationInfo.isEV = data.rows[0].isEV;
                    reservationInfo.image = data.rows[0].image;
                    reservationInfo.canCarpool = canCarpool;
                    reservationInfo.carpoolUsers = carpoolUsers;
                    //sends updated reservation info to client so user can confirm/decline vehicle
                    if(isEdit){
                        socket.emit('editReservation', data, reservationInfo, oldData, isEdit);
                    } else {
                        socket.emit('newReservation', data, reservationInfo, isEdit);
                    }
                } else {
                    //if no vehicle meets needs of the user, alert them
                    socket.emit('noVehicle');
                }
            });
        }
    });
}

/**
 * This function updates the given reservation in the database to contain the updated information, and then sends that information to the admins.
 *
 * @params
 * reservationInfo: updated information about the reservation
 * id: reservation id
 * callback: when called the client side updates the reservation card visually
 */
function editReservation(reservationInfo, id, oldData, callback){
   conn.query('UPDATE reservations SET license = ?, model = ?, start = ?, end = ?, stops = ?, override = ?, justification = ?, needsTrunk = ?, needsOffRoad = ?, needsRack = ?, image = ? WHERE id = ?',[reservationInfo.license, reservationInfo.model, reservationInfo.start, reservationInfo.end, reservationInfo.stops, reservationInfo.override, reservationInfo.justification, reservationInfo.needsTrunk, reservationInfo.needsOffRoad, reservationInfo.needsRack, reservationInfo.image, id],function(error, data){
        conn.query('SELECT * FROM reservations WHERE id = ?', [id], function(error, data){
            //callback tells client to update reservation card visually
            callback();
            //sends updated reservation info to admin
            io.of('/admin').emit("reservationChange", data);

            //remove old calendar event
            var startDate = new Date(oldData.start);
            var endDate = new Date(oldData.end);
            var startISO = startDate.toISOString().split('.')[0]+"Z";
            var endISO = endDate.toISOString().split('.')[0]+"Z";
            removeEvent(reservationInfo.user + "'s upcoming DEM trip (" + oldData.license + ")", startISO, endISO);
            
            //adds calendar event with updated information
            var start = new Date(reservationInfo.start);
            var end = new Date(reservationInfo.end);
            addEvent(reservationInfo.user + "'s upcoming DEM trip (" + reservationInfo.license + ")", reservationInfo.model + " " + reservationInfo.license + "\n" + reservationInfo.stops, start.toISOString(), end.toISOString());
        });
    });
}

/**
 * This function cancels the given reservation and removes it from the user's calendar.
 * @params
 * id: the id of the reservation to be cancelled
 */
function cancelReservation(id, user, model, license, start, end, callback){
    conn.query('DELETE FROM reservations WHERE id = ?', [id]);

    //removes event from user's calendar
    var startDate = new Date(start);
    var endDate = new Date(end);
    console.log(start)
    console.log(startDate)
    var startISO = startDate.toISOString().split('.')[0]+"Z";
    var endISO = endDate.toISOString().split('.')[0]+"Z";
    removeEvent(user + "'s upcoming DEM trip (" + license + ")", startISO, endISO);

    //tells admin clients which reservation to delete from table
    io.of('/admin').emit('reservationCancellation', id);
}

/**
 * This function adds the new report to the database, and emails the admin with information from the report.
 *
 * @params
 * reservationID: id of the reservation connected to the report
 * report: text of the report
 * needsService: boolean indicating if the car needs immediate service
 * needsCleaning: boolean indicating if the car needs immediate cleaning
 * notCharging: boolean indicating if the car is not charging/no charging spot was available
 */
function submitFeedback(reservationID, report, needsService, needsCleaning, notCharging){
    //adds report to database
    conn.query("INSERT INTO reports VALUES(null, ?, ?, ?, ?, ?)", [reservationID, report, needsService, needsCleaning, notCharging], function(error, data){
        //sends report to admins
        updateReports();
    });

    //gets reservation details to include in email
    conn.query('SELECT * FROM reservations WHERE id = ?', [5], function(error, data){
        let mailOptions = {
            from: 'dem_do-not-reply@outlook.com',
            to: 'dem_test_a@outlook.com',
            subject: 'New Report Added',
            html: '<h1>Reservation: ' + data.rows[0].id + '</h1>' + '<h2>User: ' + data.rows[0].user + '</h2>' + '<h2>Vehicle: ' + data.rows[0].model + " " + data.rows[0].license + '</h2>' + '<p style="font-size: 22px;">Report: ' + report + '<p><br>' + '<p>Needs Service: ' + needsService + '<p>' + '<p>Needs Cleaning: ' + needsCleaning + '<p>' + '<p>Not Charging: ' + notCharging + '<p>'
        };
        transporter.sendMail(mailOptions, function(error, info){
            if (error) {
                console.log(error);
            } else {
                console.log('Email sent: ' + info.response);
            }
        });
    });
}

/**
 * This function updates the mileage of the vehicle with the given license place by adding the given amount of miles.
 * @params
 * license: license plate of car to be updated
 * miles: miles to add to mileage of car
 */
function updateVehicleMiles(license, miles){
    conn.query('UPDATE vehicles SET miles = miles + ? WHERE license = ?', [miles, license]);
}

function reassignReservations(license){
    conn.query('SELECT * FROM reservations WHERE license = ? ORDER BY id ASC', [license], function(error, data){
        for(let i = 0; i < data.rowCount; i ++){
            let reservationInfo = data.rows[i];
            conn.query('SELECT license, model, image FROM vehicles WHERE inService != ? AND extraTrunk >= ? AND license != ? AND offRoad >= ? AND equipRack >= ? AND license NOT IN (SELECT license FROM reservations WHERE start <= ? AND end >= ?) ORDER BY isEV DESC, (extraTrunk + offRoad + equipRack) ASC, miles ASC', [true, reservationInfo.needsTrunk, license, reservationInfo.needsOffRoad, reservationInfo.needsRack, reservationInfo.end, reservationInfo.start], function(error, data){
                console.log(data);
                if(data !== undefined && data.rows.length !== 0){
                    let mailOptions = {
                        from: 'dem_do-not-reply@outlook.com',
                        to: reservationInfo.user,
                        subject: 'Important Change to Your Reservation',
                        html: '<p>The vehicle you had reserved is now unavailable. You have been assigned a new vehicle. If you would like to change your vehicle, you can edit your reservation on the website.</p>'
                            + '<h4>Old Vehicle: </h4>' + '<p>' + reservationInfo.model + " " + license + '</p>' + '<h4>Start: </h4>' + '<p>' + reservationInfo.start + '</p>' + '<h4>End: </h4>' + '<p>' 
                            + reservationInfo.end + '</p>' + '<h4>New Vehicle:</h4>' + '<p>' + data.rows[0].model + " " + data.rows[0].license + '</p>'
                    };
                    transporter.sendMail(mailOptions, function(error, info){
                        if (error) {
                            console.log(error);
                        } else {
                            console.log('Email sent: ' + info.response);
                        }
                    });


                    conn.query('UPDATE reservations SET license = ?, model = ?, image = ? WHERE id = ?',[data.rows[0].license, data.rows[0].model, data.rows[0].image, reservationInfo.id],function(error, data){
                        conn.query('SELECT * FROM reservations WHERE id = ?', [reservationInfo.id], function(error, data){
                            io.of('/admin').emit("newReservation", data);
                        });
                    });
                } else {
                    cancelReservation(reservationInfo.id, reservationInfo.user, reservationInfo.model, reservationInfo.license, reservationInfo.start, reservationInfo.end);
                    
                    let mailOptions = {
                        from: 'dem_do-not-reply@outlook.com',
                        to: reservationInfo.user,
                        subject: 'Important Change to Your Reservation',
                        html: '<p>The vehicle you had reserved is now unavailable. Unfortunately, there are no other vehicles available at this time that meet your needs. You can use the website to make a new ' 
                        + 'reservation with different criteria.</p>' + '<h3>Cancelled Reservation Details:</h3>' + '<h4>Vehicle: </h4>' + '<p>' + reservationInfo.model + " " + license + '</p>' + '<h4>Start: </h4>' 
                        + '<p>' + reservationInfo.start + '</p>' + '<h4>End: </h4>' + '<p>' + reservationInfo.end + '</p>'
                    };
                    transporter.sendMail(mailOptions, function(error, info){
                        if (error) {
                            console.log(error);
                        } else {
                            console.log('Email sent: ' + info.response);
                        }
                    });
                }
            });
        }
    });
}


// Code Below is Used for Image Processing
let tempName = "";
let Storage = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, "./public/user/media/vehicle_images/");
    },
    filename: function (req, file, callback) {
        console.log("in filename");
        tempName = "TEMPIMAGE." + file.mimetype.replace("image/", "");
        callback(null, tempName);
    }
});

let upload = multer({ storage: Storage });



app.post("/admin/api/Upload", upload.single("imgUploader"), function (req, res) {
    let newName = `${req.body.license}.${req.file.mimetype.replace("image/", "")}`;

    fs.rename(`public/user/media/vehicle_images/${tempName}`, `public/user/media/vehicle_images/${newName}`, function(err){
        if ( err ) {
            res.send("ERROR: " + err);
        } else {
            res.send(newName);
        }

    });
});



function exportUsers(callback){
    conn.query('SELECT * FROM users', function(error, data){
        let users = data.rows;
        let options = {fields:[{name:'id', label:'Id'},
                      {name:'email', label:'Email'},
                      {name:'admin', label:'Admin'}]};
        jsoncsv.csvBuffered(users, options, function(err, csv){
            console.log(csv);
            fs.writeFile(__dirname + '/public/admin/temp/users.csv', csv, function(err) {
                if(err) {
                    return console.log(err);
                }
                console.log("The file was saved!");
                callback();
            });
            if(err) {
                return console.log(err);
            }
        });
    });
}

function exportVehicles(callback){
    conn.query('SELECT * FROM vehicles', function(error, data){
        let vehicles = data.rows;
        let options = {fields:[{name:'id', label:'Id'},
                        {name:'license', label:'License'},
                        {name:'model', label:'Model'},
                        {name:'color', label:'Color'},
                        {name:'inService', label:'In Service'},
                        {name:'miles', label:'Miles'},
                        {name:'isEV', label:'Is EV'},
                        {name:'extraTrunk', label:'Extra Trunk'},
                        {name:'offRoad', label:'Off Road'},
                        {name:'equipRack', label:'Equip Rack'}]};
        jsoncsv.csvBuffered(vehicles, options, function(err, csv){
            console.log(csv);
            fs.writeFile(__dirname + '/public/admin/temp/vehicles.csv', csv, function(err) {
                if(err) {
                    return console.log(err);
                }
                console.log("The file was saved!");
                callback();
            });
            if(err) {
                return console.log(err);
            }
        });
    });
}

function exportReservations(callback){
    conn.query('SELECT * FROM reservations', function(error, data){
        let reservations = data.rows;
        let options = {fields:[{name:'id', label:'Id'},
                        {name:'user', label:'User'},
                        {name:'license', label:'License'},
                        {name:'model', label:'Model'},
                        {name:'start', label:'Start'},
                        {name:'end', label:'End'},
                        {name:'stops', label:'Stops'},
                        {name:'override', label:'Override'},
                        {name:'justification', label:'Justification'},
                        {name:'needsTrunk', label:'Extra Trunk'},
                        {name:'needsOffRoad', label:'Off Road'},
                        {name:'needsRack', label:'Equip Rack'}]};
        jsoncsv.csvBuffered(reservations, options, function(err, csv){
            console.log(csv);
            fs.writeFile(__dirname + '/public/admin/temp/reservations.csv', csv, function(err) {
                if(err) {
                    return console.log(err);
                }
                console.log("The file was saved!");
                callback();
            });
            if(err) {
                return console.log(err);
            }
        });
    });
}

function exportReports(callback){
    conn.query('SELECT * FROM reports', function(error, data){
        let reports = data.rows;
        let options = {fields:[{name:'id', label:'Id'},
                        {name:'reservation', label:'Reservation'},
                        {name:'report', label:'Report'},
                        {name:'needsService', label:'Needs Service'},
                        {name:'needsCleaning', label:'Needs Cleaning'},
                        {name:'notCharging', label:'Not Charging'}]};
        jsoncsv.csvBuffered(reports, options, function(err, csv){
            console.log(csv);
            fs.writeFile(__dirname + '/public/admin/temp/reports.csv', csv, function(err) {
                if(err) {
                    return console.log(err);
                }
                console.log("The file was saved!");
                callback();
            });
            if(err) {
                return console.log(err);
            }
        });
    });
}
