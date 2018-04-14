var express = require('express')
var app = express();
var path = require('path');
var http =require('http');
var server = http.createServer(app);

var io = require('socket.io')(server, {wsEngine: 'ws'}); //fix Windows10 issue
//TO-DO change before handin!
io.listen(server);

var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());

var anyDB = require('any-db');
var conn = anyDB.createConnection('sqlite3://DEM.db');

app.set('view engine', 'pug');
app.use(express.static('public'));


//Resevervations
conn.query('CREATE TABLE IF NOT EXISTS vehicles(id INTEGER PRIMARY KEY AUTOINCREMENT, license TEXT, model TEXT, color TEXT, inService BOOLEAN, miles DOUBLE PRECISION)');
//Vehicles
conn.query('CREATE TABLE IF NOT EXISTS reservations(id INTEGER PRIMARY KEY AUTOINCREMENT, user TEXT, license TEXT, startTime TEXT, endTime TEXT, startDate TEXT, endDate TEXT, stops JSON, override BOOLEAN, justification TEXT)');
//Reports
conn.query('CREATE TABLE IF NOT EXISTS reports(id INTEGER PRIMARY KEY AUTOINCREMENT, reservation INTEGER, report TEXT)');

app.get('/home/user', function(request, response){
	console.log('- Request received:', request.method, request.url);

    createReservation("Jenna Tishler", "ABC123", "8:20AM", "10:30AM", "04/14/18", "04/14/18", ["1 Johnson Lane, Providence RI", "2 Brown Court, Barrington, RI"], false, "");
    getMyReservations("Jenna Tishler");
    response.render('user');
});

/*Sets up the server on port 8080.*/
server.listen(8080, function(){
	console.log('- Server listening on port 8080');
});

//handles events when a user is connected
io.sockets.on('connection', function(socket){


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
        console.log(data);
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
}
