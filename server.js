let express = require('express');
let app = express();
let path = require('path');
let http =require('http');
let nodemailer = require('nodemailer');
let server = http.createServer(app);

// Uncomment for testing.
// let perf = require('./test/perf-test.js');

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

// var transporter = nodemailer.createTransport({
//     pool: true,
//     maxConnections: 10,
//     host: "smtp-mail.outlook.com", // hostname
//     secureConnection: false, // TLS requires secureConnection to be false
//     port: 587, // port for secure SMTP
//     auth: {
//         user: 'dem_do-not-reply@outlook.com',
//         pass: 'DEMnoreply123'
//     },
//     tls: {
//         ciphers:'SSLv3'
//     }
// });

// let mailOptions = {
//     from: 'dem_do-not-reply@outlook.com',
//     to: 'jenna_tishler@brown.edu',
//     subject: 'Test',
//     text: "Test"
// }

// let mailOptions2 = {
//     from: 'dem_do-not-reply@outlook.com',
//     to: 'jenna.tishler@gmail.com',
//     subject: 'Test',
//     text: "Test"
// }

// let messages = [mailOptions, mailOptions2];
// transporter.on('idle', function(){
//     //send next message from the pending queue
//     while (transporter.isIdle() && messages.length > 0) {
//         console.log("email")
//         transporter.sendMail (messages.shift(), function(error, info){
//             if (error) {
//                 console.log(error);
//             } else {
//                 console.log('Email sent: ' + info.response);
//             }
//         });
//     }
// });

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
conn.query('DROP TABLE IF EXISTS users');


//Users
conn.query('CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT, admin BOOLEAN)');
//Resevervations
conn.query('CREATE TABLE IF NOT EXISTS vehicles(id TEXT, license TEXT, model TEXT, color TEXT, inService BOOLEAN, miles DOUBLE PRECISION, isEV BOOLEAN, extraTrunk BOOLEAN, offRoad BOOLEAN, equipRack BOOLEAN, featureScore INTEGER, image TEXT)');
//Vehicles
conn.query('CREATE TABLE IF NOT EXISTS reservations(id INTEGER PRIMARY KEY AUTOINCREMENT, user TEXT, license TEXT, model TEXT, start TEXT, end TEXT, stops TEXT, override BOOLEAN, justification TEXT, needsTrunk BOOLEAN, needsOffRoad BOOLEAN, needsRack BOOLEAN, image TEXT)');
//Reports
conn.query('CREATE TABLE IF NOT EXISTS reports(id INTEGER PRIMARY KEY AUTOINCREMENT, reservation INTEGER, report TEXT, needsService BOOLEAN, needsCleaning BOOLEAN, notCharging BOOLEAN)');

//test data
conn.query('INSERT INTO reservations VALUES(null, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',["jenna.tishler@gmail.com", "1322", "2015 FORD CMAX", "2018-05-09 01:00", "2018-05-09 03:00", JSON.stringify(["563 North Main Street, Providence, RI, USA", "565 Atwells Avenue, Providence, RI, USA", "563 North Main Street, Providence, RI, USA"]), false, "", false, false, false, "noPicture.png"]);
conn.query('INSERT INTO reservations VALUES(null, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',["jenna_tishler@brown.edu", "704", "2015 FORD CMAX", "2018-05-10 01:00", "2018-05-10 03:00", JSON.stringify(["home", "work", "home"]), false, "", false, false, false, "noPicture.png"]);
conn.query('INSERT INTO reservations VALUES(null, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',["Max Luebbers", "2254", "2016 FORD CMAX", "2018-05-21 11:00", "2018-05-21 15:00", JSON.stringify(["home", "work"]), false, "", false, false, false, "noPicture.png"]);
conn.query('INSERT INTO reservations VALUES(null, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',["dem_test_u_2@outlook.com", "1869", "2011 CHEVROLET EQUINOX", "2018-05-19 14:00", "2018-05-19 17:00", JSON.stringify(["home", "work"]), true, "I have a reason.", false, false, false, "noPicture.png"]);
conn.query('INSERT INTO reservations VALUES(null, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',["dem_test_u_2@outlook.com", "2254", "2016 FORD CMAX", "2018-05-21 10:00", "2018-05-21 10:30", JSON.stringify(["work", "beach"]), false, "", false, false, false, "noPicture.png"]);
conn.query('INSERT INTO reservations VALUES(null, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',["dem_test_u@outlook.com", "704", "2015 FORD CMAX", "2017-05-19 11:00", "2017-05-20 11:00", JSON.stringify(["home", "work"]), false, "", false, false, false, "noPicture.png"]);
conn.query('INSERT INTO reservations VALUES(null, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',["dem_test_u@outlook.com", "1322", "2015 FORD CMAX", "2011-05-18 11:00", "2011-05-18 15:00", JSON.stringify(["Work", "Home"]), false, "", false, false, false, "noPicture.png"]);
conn.query('INSERT INTO reservations VALUES(null, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',["dem_test_u@outlook.com", "704", "2015 FORD CMAX", "2010-05-19 11:00", "2010-05-20 11:00", JSON.stringify(["home", "work"]), false, "", false, false, false, "noPicture.png"]);
conn.query('INSERT INTO reservations VALUES(null, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',["dem_test_u@outlook.com", "2254", "2016 FORD CMAX", "2013-05-21 11:00", "2013-05-21 15:00", JSON.stringify(["home", "work"]), false, "", false, false, false, "noPicture.png"]);

conn.query('INSERT INTO vehicles VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, null, ?)', ["JF2GPBCC3FH253482", "1011", "2016 SUBARU CV", "Black/White", true, 11451.5, false, true, true, false, "noPicture.png"]);
conn.query('INSERT INTO vehicles VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, null, ?)', ["1FMCU59329KC41390", "1018", "2009 FORD ESCAPE", "Black/White", true, 151071.5, false, true, true, false, "noPicture.png"]);
conn.query('INSERT INTO vehicles VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, null, ?)', ["1GNDT13S552325449", "1052", "2005 CHEVROLET TRAILBLAZER", "Black/White", true, 62759.9, false, false, false, false, "noPicture.png"]);
conn.query('INSERT INTO vehicles VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, null, ?)', ["1FADP5CU7FL121713", "1252", "2015 FORD CMAX", "Black", true, 6041.9, true, false, false, false, "noPicture.png"]);
conn.query('INSERT INTO vehicles VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, null, ?)', ["1FADP5CU9FL121714", "1254", "2015 FORD CMAX", "Black", true, 9543.2, true, false, false, false, "noPicture.png"]);
conn.query('INSERT INTO vehicles VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, null, ?)', ["1FADP5CU4FL121717", "1322", "2015 FORD CMAX", "Black", true, 13594.4, true, false, false, false, "noPicture.png"]);
conn.query('INSERT INTO vehicles VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, null, ?)', ["1FMYU96H76KD26489", "1583", "2006 FORD ESCAPE", "Black/White", true, 72981.1, false, true, true, false, "noPicture.png"]);
conn.query('INSERT INTO vehicles VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, null, ?)', ["JTMRJREV1HD152175", "1650", "2017 TOYOTA RAV 4", "Black/White", true, 11295.3, false, true, true, false, "noPicture.png"]);
conn.query('INSERT INTO vehicles VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, null, ?)', ["1G1ZS52855F285454", "1662", "2003 CHEVROLET MALIBU", "Black/White", true, 90057.8, false, false, false, false, "noPicture.png"]);
conn.query('INSERT INTO vehicles VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, null, ?)', ["JTMRJREV7HD151726", "1679", "2017 TOYOTA RAV 4", "Black/White", true, 8483.8, false, true, true, false, "noPicture.png"]);
conn.query('INSERT INTO vehicles VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, null, ?)', ["JF2GPBCC0FH232864", "2811", "2015 SUBARU XV", "Black/White", true, 9131.5, false, true, true, false, "noPicture.png"]);
//conn.query('INSERT INTO vehicles VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', ["1FTEW1E89HFC38284", "1834", "2017 FORD F150", "Black/White", true, 4385.0, false, true, true, true, "noPicture.png"]);
conn.query('INSERT INTO vehicles VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, null, ?)', ["2GNF1CEK9C6333734", "1869", "2011 CHEVROLET EQUINOX", "Black/White", true, 27513.0, false, true, true, false, "noPicture.png"]);
conn.query('INSERT INTO vehicles VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, null, ?)', ["1FMCU59H18KA54880", "1994", "2008 FORD ESCAPE", "Black/White", true, 235952.9, false, true, true, false, "noPicture.png"]);
conn.query('INSERT INTO vehicles VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, null, ?)', ["1FMCU59H38KA54881", "2140", "2008 FORD ESCAPE", "Black/White", true, 77522.0, false, true, true, false, "noPicture.png"]);
//conn.query('INSERT INTO vehicles VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', ["1FTYR10D67PA83081", "2224", "2007 FORD RANGER", "Black/White", true, 40558.2, false, true, true, true, "noPicture.png"]);
conn.query('INSERT INTO vehicles VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, null, ?)', ["1G1RA6E47EU133964", "2242", "2014 CHEVROLET VOLT", "Black", true, 9391.1, true, false, false, false, "noPicture.png"]);
conn.query('INSERT INTO vehicles VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, null, ?)', ["1FADP5CU6FL121721", "2254", "2016 FORD CMAX", "Black", true, 17993.8, true, false, false, false, "noPicture.png"]);
conn.query('INSERT INTO vehicles VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, null, ?)', ["JHMES96663S028859", "2468", "2004 HONDA CIVIC", "Black/White", true, 363.6, false, false, false, false, "noPicture.png"]);
conn.query('INSERT INTO vehicles VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, null, ?)', ["1FADP5CU8FL121722", "2472", "2015 FORD CMAX", "Black", true, 9327.3, true, false, false, false, "noPicture.png"]);
conn.query('INSERT INTO vehicles VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, null, ?)', ["1FADP5CU2FL121716", "2473", "2015 FORD CMAX", "Black", true, 13772.9, true, false, false, false, "noPicture.png"]);
conn.query('INSERT INTO vehicles VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, null, ?)', ["1GBDV13W07D219007", "2579", "2007 CHEVROLET UPLANDER", "Black/White", true, 36831.4, false, true, false, false, "noPicture.png"]);
//conn.query('INSERT INTO vehicles VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', ["1FTPW14587FB58781", "2709", "2007 FORD F150", "Black/White", true, 167668.3, false, true, true, true, "noPicture.png"]);
//conn.query('INSERT INTO vehicles VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', ["1FTYR10D47PA83080", "315", "2007 FORD RANGER", "Black/White", true, 43196.2, false, true, true, true, "noPicture.png"]);
conn.query('INSERT INTO vehicles VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, null, ?)', ["1FADP5CU0FL121715", "704", "2015 FORD CMAX", "Black", true, 5868.7, true, false, false, false, "noPicture.png"]);
conn.query('INSERT INTO vehicles VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, null, ?)', ["1FADP5CU8FL121719", "739", "2015 FORD CMAX", "Black", true, 7883.3, true, false, false, false, "noPicture.png"]);
conn.query('INSERT INTO vehicles VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, null, ?)', ["1FADP5CU6FL121718", "827", "2015 FORD CMAX", "Black", true, 9055.6, true, false, false, false, "noPicture.png"]);

conn.query('UPDATE vehicles SET featureScore = extraTrunk + offRoad + equipRack');

conn.query('INSERT INTO reports VALUES(null, ?, ?, ?, ?, ?)', [5, "Car sucks.", true, true, false]);
conn.query('INSERT INTO reports VALUES(null, ?, ?, ?, ?, ?)', [1, "Car is  very dirty.", false, true, false]);

conn.query('INSERT INTO users VALUES(null, ?, ?)', ["jenna.tishler@gmail.com", true]);
conn.query('INSERT INTO users VALUES(null, ?, ?)', ["jenna_tishler@brown.edu", true]);
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
            console.log('getEvents returned ' + result.value.length + ' events.');
            //return result.value;
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
    socket.on('join', function(user, callback){
        conn.query('SELECT *, vehicles.isEV FROM reservations INNER JOIN vehicles ON reservations.license = vehicles.license WHERE user = ? ORDER BY end ASC', [user], function(error, data){
            callback(data);
        });
    });
    //emitted when a user makes a new reservation
    socket.on('reservation', function(reservationInfo, callback){
        //console.log("got a reservation!");
        newReservation(socket, reservationInfo, false);
    });

    socket.on('addReservation', function(reservationInfo, callback){
        conn.query('INSERT INTO reservations VALUES(null, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',[reservationInfo.user, reservationInfo.license, reservationInfo.model, reservationInfo.start, reservationInfo.end, reservationInfo.stops, reservationInfo.override, reservationInfo.justification, reservationInfo.needsTrunk, reservationInfo.needsOffRoad, reservationInfo.needsRack, reservationInfo.image],function(error, data){
            conn.query('SELECT * FROM reservations WHERE id = ?', [data.lastInsertId], function(error, resData){
                callback(data.lastInsertId);
                io.of('/admin').emit("newReservation", resData);
                var start = new Date(reservationInfo.start);
                var end = new Date(reservationInfo.end);
                addEvent(reservationInfo.user + "'s upcoming DEM trip (" +reservationInfo.model + " " + reservationInfo.license + ")", reservationInfo.model + " " + reservationInfo.license + "\n" + reservationInfo.stops, start.toISOString(), end.toISOString());
                if(reservationInfo.canCarpool){
                    carpoolNotification(reservationInfo);
                }
            });
        });
    });

    socket.on('editReservation', function(reservationInfo, id, callback){
        console.log('edit')
        console.log(id)
        conn.query('UPDATE reservations SET license = ?, model = ?, start = ?, end = ?, stops = ?, override = ?, justification = ?, needsTrunk = ?, needsOffRoad = ?, needsRack = ?, image = ? WHERE id = ?',[reservationInfo.license, reservationInfo.model, reservationInfo.start, reservationInfo.end, reservationInfo.stops, reservationInfo.override, reservationInfo.justification, reservationInfo.needsTrunk, reservationInfo.needsOffRoad, reservationInfo.needsRack, reservationInfo.image, id],function(error, data){
            conn.query('SELECT * FROM reservations', function(error, data){
                console.log(data)
                callback();
                io.of('/admin').emit("reservationChange", data);
                //Calendar event
                var start = new Date(reservationInfo.start);
                var end = new Date(reservationInfo.end);
                addEvent(reservationInfo.user + "'s upcoming DEM trip (" +reservationInfo.model + " " + reservationInfo.license + ")", reservationInfo.model + " " + reservationInfo.license + "\n" + reservationInfo.stops, start.toISOString(), end.toISOString());
                if(reservationInfo.canCarpool){
                    carpoolNotification(reservationInfo);
                }
            });
        });
    })

    socket.on('edit', function(reservationInfo){
        //editReservation(reservationID, reservationInfo.start, reservationInfo.end, reservationInfo.stops, reservationInfo.justification);
        // conn.query('DELETE FROM reservations WHERE id = ?', [reservationID], function(error, data){

        // });
        newReservation(socket, reservationInfo, true);
        // conn.query('UPDATE reservations SET start = ?, end = ?, stops = ?, justification = ? WHERE id = ?', [reservationInfo.start, reservationInfo.end, reservationInfo.stops, reservationInfo.justification, reservationID], function(error, data){
        //     conn.query('SELECT * FROM reservations WHERE user = ?', [reservationInfo.user], function(error, data){
        //         socket.emit('reservationChange', data);
        //     });
        //     conn.query('SELECT * FROM reservations', function(error, data){
        //         io.of('/admin').emit('reservationChange', data);
        //     });
        // });
    });

    socket.on('cancel', function(reservationID, user, license, start, end, callback){
        cancelReservation(reservationID);
        conn.query('SELECT * FROM reservations WHERE user = ?', [user], function(error, data){
            socket.emit('reservationChange', data);
        });
        conn.query('SELECT * FROM reservations', function(error, data){
            io.of('/admin').emit('reservationChange', data);
        });
    });

    socket.on('reportAdded', function(reservationID, report, needsService, needsCleaning, notCharging){
        //submitFeedback(reservationID, resport);
        console.log('report added')
        conn.query("INSERT INTO reports VALUES(null, ?, ?, ?, ?, ?)", [reservationID, report, needsService, needsCleaning, notCharging], function(error, data){
            updateReports();
        });

        conn.query('SELECT * FROM reservations WHERE id = ?', [5], function(error, data){
            let mailOptions = {
                from: 'dem_do-not-reply@outlook.com',
                to: 'jenna_tishler@brown.edu',
                subject: 'New Report Added',
                html: '<h1>Reservation: ' + data.rows[0].id + '</h1>' + '<h2>Name: ' + data.rows[0].user + '</h2>' + '<h2>License Plate: ' + data.rows[0].license + '</h2>' + '<p>Report: ' + report + '<p>' + '<p>Needs Service: ' + needsService + '<p>' + '<p>Needs Cleaning: ' + needsCleaning + '<p>' + '<p>Not Charging: ' + notCharging + '<p>'
            };
            transporter.sendMail(mailOptions, function(error, info){
                if (error) {
                    console.log(error);
                } else {
                    console.log('Email sent: ' + info.response);
                }
            });
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
    if (user_email === 'dem_test_a@outlook.com') {
        app.use("/admin", express.static(__dirname + '/public/admin'));
        app.use("/admin_u", express.static(__dirname + '/public/user'));
        replace({
            regex: "Welcome,(.+)<br>",
            replacement: "Welcome, " + user_email + " <br>",
            paths: ['./public/admin/data.html', './public/admin/fleet.html', './public/admin/index.html',
                    './public/user/index_admin.html'],
            silent: true
        })
        nukeEvents();
        res.redirect('admin/index.html');
        //res.render('admin/index.html', {user : user_email});
        //res.redirect('admin/index/?email=' + encodeURIComponent(user_email));
        io.of('/admin').emit('admin-connected', user_email);
    } else if (user_email === 'dem_test_u@outlook.com' || user_email === 'dem_test_u_2@outlook.com') {
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
    conn.query('SELECT * FROM reservations', function(error, data){
        io.of('/admin').emit('reservationChange', data);
    });
}
function updateVehicles(){
    conn.query('SELECT * FROM vehicles',function(error, data){
        io.of('/admin').emit('vehicleChange', data);
        //console.log(data)
    });
}
function addVehicle(vehicle){
    conn.query('INSERT INTO vehicles VALUES(null, ?, ?, ?, ?, ?, ?, ?, ?, ?, null, ?)',[vehicle.license, vehicle.model, vehicle.color, vehicle.status, vehicle.miles, vehicle.isEv, vehicle.trunk, vehicle.offRoad, vehicle.equipmentRack, vehicle.image],function(error, data){
        conn.query('UPDATE vehicles SET featureScore = extraTrunk + offRoad + equipRack WHERE id = ?', [vehicle.id]);
        updateVehicles();
    });
    console.log(vehicle);
}

function editVehicle(vehicle){
    console.log(vehicle)
    conn.query('UPDATE vehicles SET license = ?, model = ?, color = ?, miles = ?, inService = ?, isEV = ?, extraTrunk = ?, offRoad = ?, equipRack = ?, image = ? WHERE id = ?',[vehicle.license, vehicle.model, vehicle.color, vehicle.miles, vehicle.inService, vehicle.isEV, vehicle.extraTrunk, vehicle.offRoad, vehicle.equipRack, vehicle.image, vehicle.id],function(error, data){
        conn.query('UPDATE vehicles SET featureScore = extraTrunk + offRoad + equipRack WHERE id = ?', [vehicle.id]);
        updateVehicles();
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
        console.log(data);
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
        console.log("User Removal Query");
    });
}

// USER help functions
function newReservation(socket, reservationInfo, isEdit){
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
    //this queries finds overlapping reservations
    conn.query('SELECT id, user, start, end, stops FROM reservations WHERE (start >= ? AND start <= ?) OR (end >= ? AND end <= ?)', [reservationInfo.start, reservationInfo.end, reservationInfo.start, reservationInfo.end], function(error, data){
        console.log(data);
        for(var i = 0; i < data.rows.length; i++){
            //if reservations overlaps and is from same user
            //unless is editing then allows overlap with same id
            if(data.rows[i].user === reservationInfo.user){
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
            //alerts users via email that they have reservations at the same time w/ same stops
            // if(canCarpool){
            //     carpoolNotification(carpoolUsers);
            // }

            conn.query('SELECT license, model, vehicles.isEV FROM vehicles WHERE extraTrunk >= ? AND offRoad >= ? AND equipRack >= ? AND license NOT IN (SELECT license FROM reservations WHERE start <= ? AND end >= ?) ORDER BY isEV DESC, featureScore ASC, miles ASC', [needsTrunk, needsOffRoad, needsRack, reservationInfo.end, reservationInfo.start], function(error, data){
                if(data.rows.length !== 0){
                    reservationInfo.model = data.rows[0].model;
                    reservationInfo.license = data.rows[0].license;
                    reservationInfo.isEV = data.rows[0].isEV;
                    socket.emit('newReservation', data, reservationInfo, isEdit, canCarpool, carpoolUsers);
                } else {
                    socket.emit('noVehicle');
                }
            });
        }
    });
}

function editReservation(id, start, end, stops, justification){
    conn.query('UPDATE reservations SET start = ?, end = ?, stops = ?, justification = ? WHERE reservationID = ?', [start, end, stops, justification, id], function(error, data){

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
    });
}

function carpoolNotification(reservationInfo){
    var transporter = nodemailer.createTransport({
        pool: true,
        maxConnections: 10,
        host: "smtp-mail.outlook.com", // hostname
        secureConnection: false, // TLS requires secureConnection to be false
        port: 587, // port for secure SMTP
        auth: {
            user: 'dem_do-not-reply@outlook.com',
            pass: 'DEMnoreply123'
        },
        tls: {
            ciphers:'SSLv3'
        }
    });

    console.log("You can carpool!");
    let mailOptionsList = [];
    for(let i = 0; i < reservationInfo.carpoolUsers.length; i++){
        let mailOptions = {
            from: 'dem_do-not-reply@outlook.com',
            to: reservationInfo.carpoolUsers[i],
            subject: 'Carpool Notifcation',
            html: "<h2>Carpool Alert!</h2>" +
                "<p>You are receiving this email because you and at least one other " +
                "user have made reservations at the same exact time with the same route. " +
                "We strongly encourage you to talk to them and arrange a carpool. By " +
                "carpooling just twice a week, 1,600 pounds of greenhouse gases can be " +
                "kept out of the air each year. Here is a list of the people you can " +
                "carpool with: " + JSON.stringify(reservationInfo.carpoolUsers) + "</p>" +
                "<h5>Reservation Details</h5>" + "<p><strong>Vehicle:</strong>" + reservationInfo.model +
                " " + reservationInfo.license + "</p>" + "<p><strong>Start:</strong>" + reservationInfo.start +
                "</p>" + "<p><strong>End:</strong>" + reservationInfo.end + "</p>"
        }
        mailOptionsList.push(mailOptions);
    }

    transporter.on('idle', function(){
        //send next message from the pending queue
        console.log("idle")
        while (transporter.isIdle() && mailOptionsList.length > 0) {
            console.log("email")
            transporter.sendMail (mailOptionsList.shift(), function(error, info){
                if (error) {
                    console.log(error);
                } else {
                    console.log('Email sent: ' + info.response);
                }
            });
        }
    });
}

//id TEXT, license TEXT, model TEXT, color TEXT, inService BOOLEAN, miles DOUBLE PRECISION, isEV BOOLEAN, extraTrunk BOOLEAN, offRoad BOOLEAN, equipRack BOOLEAN
function reassignReservations(license){
    conn.query('SELECT * FROM reservations WHERE license = ? ORDER BY id ASC', [license], function(error, data){
        for(let i = 0; i < data.rowCount; i ++){
            let reservationInfo = data.rows[i];
            conn.query('SELECT license, model, image FROM vehicles WHERE extraTrunk >= ? AND license != ? AND offRoad >= ? AND equipRack >= ? AND license NOT IN (SELECT license FROM reservations WHERE start <= ? AND end >= ?) ORDER BY isEV DESC, (extraTrunk + offRoad + equipRack) ASC, miles ASC', [reservationInfo.needsTrunk, license, reservationInfo.needsOffRoad, reservationInfo.needsRack, reservationInfo.end, reservationInfo.start], function(error, data){
                console.log(data);
                if(data.rows.length !== 0){
                    conn.query('UPDATE reservations SET license = ?, model = ?, image = ? WHERE id = ?',[data.rows[0].license, data.rows[0].model, data.rows[0].image, reservationInfo.id],function(error, data){
                        conn.query('SELECT * FROM reservations WHERE id = ?', [reservationInfo.id], function(error, data){
                            //socket.emit('reassignReservation', data);
                            io.of('/admin').emit("newReservation", data);
                        });
                    });
                } else {
                    cancelReservation();
                    //Send email
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

let fs = require('fs');

app.post("/admin/api/Upload", upload.single("imgUploader"), function (req, res) {
    let newName = `${req.body.license}.${req.file.mimetype.replace("image/", "")}`;

    fs.rename(`public/user/media/vehicle_images/${tempName}`, `public/user/media/vehicle_images/${newName}`, function(err){
        if ( err ) {
            console.log('ERROR: ' + err);
        } else {
            console.log(newName);
            res.send(newName);
        }

    });
});
