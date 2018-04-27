var should = require('should')
var io = require('socket.io-client')

describe('log into user side', function(){
	it('should return and display all the current and past reservations for that client', function(done){
		var client1 = io.connect('http://localhost:8080/user', {forceNew: true});
		client1.emit('reservation', {user: "Jimmy Niu", license: "", start: "2018-04-27 15:00", end: "2018-04-27 17:00", stops: JSON.stringify(["home", "work"]), override: false, justification: ""});
		client1.on('newReservation', function(data){
			console.log("hi")
			should.exist(data);
			data.rows[0].should.have.property('user');
			data.rows[0].user.should.equal('Jimmy Niu');
			data.rows[0].license.should.not.equal("");
			done();
		});

	})
})

describe('new reservation', function(){
	it('should make a new reservation and send the info about it back to the client', function(done){
		var client1 = io.connect('http://localhost:8080/user', {forceNew: true});
		client1.emit('join', "Jenna Tishler", function(data){
			should.exist(data);
			for(var i = 0; i < data.rows.length; i++){
				data.rows[i].user.should.equal("Jenna Tishler");
			}
		});
		done();
	})
})