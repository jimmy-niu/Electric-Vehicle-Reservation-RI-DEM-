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

//Resevervations
conn.query('CREATE TABLE vehicles(id INTEGER PRIMARY KEY AUTOINCREMENT, license TEXT, model TEXT, color TEXT, inService BOOLEAN, miles DOUBLE PRECISION)', function(error, data){
    if(error !== null && error.errno !== 1){ // Ignore the error sent when the table is already created.
        console.log("Error: vehicles table was not created in database");
    }
});
//Vehicles
conn.query('CREATE TABLE reservations(id INTEGER PRIMARY KEY AUTOINCREMENT, license TEXT, startTime TEXT, endTime TEXT, startDate TEXT, endDate TEXT, stops JSON, override BOOLEAN, justification TEXT)', function(error, data){
    if(error !== null && error.errno !== 1){ // Ignore the error sent when the table is already created.
        console.log("Error: reservations table was not created in database");
    }
});
//Reports
conn.query('CREATE TABLE reports(id INTEGER PRIMARY KEY AUTOINCREMENT, reservation INTEGER, report TEXT)', function(error, data){
    if(error !== null && error.errno !== 1){ // Ignore the error sent when the table is already created.
        console.log("Error: reports table was not created in database");
    }
});


app.set('view engine', 'pug');
app.use(express.static('public'));





app.get('/home/user', function(request, response){
	console.log('- Request received:', request.method, request.url);

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
