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
//var conn = anyDB.createConnection('sqlite3://chatroom.db');

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


