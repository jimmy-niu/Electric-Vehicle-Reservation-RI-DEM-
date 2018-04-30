var should = require('should')
var io = require('socket.io-client')

describe('log into user side', function(){
	it('should return and display all the current and past reservations for that client', function(done){
		var client1 = io.connect('http://localhost:8080/user', {forceNew: true});
		client1.emit('join', "Jenna Tishler", function(data){
			data.rows.length.should.be.above(0);
			for(var i = 0; i < data.rows.length; i++){
				data.rows[i].user.should.equal("Jenna Tishler");
			}
		});
		done();
	});
});

describe('new reservation', function(){
	it('should make a new reservation and send the info about it back to the client and admin', function(done){
		var client1 = io.connect('http://localhost:8080/user', {forceNew: true});
		var admin1 = io.connect('http://localhost:8080/admin', {forceNew: true});
		client1.emit('reservation', {user: "Jimmy Niu", license: "", start: "2018-04-27 15:00", end: "2018-04-27 17:00", stops: JSON.stringify(["home", "work"]), override: false, justification: ""});
		client1.on('newReservation', function(data){
			data.rows.length.should.be.above(0);
			data.rows[0].should.have.property('user');
			data.rows[0].user.should.equal('Jimmy Niu');
			data.rows[0].license.should.not.equal("");
		});
		client1.on('alternateVehicles', function(data){
			data.rows.length.should.be.above(0);
		});
		admin1.on('newReservation', function(data){
			data.rows.length.should.equal(1);
			data.rows[0].should.have.property('user');
			data.rows[0].user.should.equal('Jimmy Niu');
			data.rows[0].license.should.not.equal("");
			data.rows[0].start.should.equal("2018-04-27 15:00");
			data.rows[0].end.should.equal("2018-04-27 17:00");
			data.rows[0].stops.should.equal(JSON.stringify(["home", "work"]));
		});
		done();
	});
});

describe('edit reservation', function(){
	it('should edit the given reservation and send an updated list of reservations to the client and admin', function(done){
		var client1 = io.connect('http://localhost:8080/user', {forceNew: true});
		var admin1 = io.connect('http://localhost:8080/admin', {forceNew: true});
		client1.emit('edit', 4, {user: "dem_test_u@outlook.com", start: "2018-05-06 10:00", end: "2018-05-06 12:00", stops: JSON.stringify(["work", "park", "work"]), justification: ""});
		client1.on('reservationChange', function(data){
			for(var i = 0; i < data.rows.length; i++){
				data.rows[i].user.should.equal("dem_test_u@outlook.com");
				if (data.rows[i].id === 4){
					data.rows[i].start.should.equal("2018-05-06 10:00");
					data.rows[i].end.should.equal("2018-05-06 12:00");
					data.rows[i].stops.should.equal(JSON.stringify(["work", "park", "work"]));
					data.rows[i].justification.should.equal("");
				}
			}
		});
		admin1.on('reservationChange', function(data){
			for(var i = 0; i < data.rows.length; i++){
				if (data.rows[i].id === 4){
					data.rows[i].start.should.equal("2018-05-06 10:00");
					data.rows[i].end.should.equal("2018-05-06 12:00");
					data.rows[i].stops.should.equal(JSON.stringify(["work", "park", "work"]));
					data.rows[i].justification.should.equal("");
				}
			}
		});
		done();
	});
});

describe('cancel reservation', function(){
	it('should cancel the reservation and send back an updated list of reservations for the client and admin', function(done){
		var client1 = io.connect('http://localhost:8080/user', {forceNew: true});
		var admin1 = io.connect('http://localhost:8080/admin', {forceNew: true});
		client1.emit('cancel', 4, "dem_test_u@outlook.com");
		client1.on('reservationChange', function(data){
			if (data != null){
				for(var i = 0; i < data.rows.length; i++){
					data.rows[i].user.should.equal("dem_test_u@outlook.com");
					data.rows[i].id.should.not.equal(4);
				}
			}
		});
		admin1.on('reservationChange', function(data){
			if (data != null){
				for(var i = 0; i < data.rows.length; i++){
					data.rows[i].id.should.not.equal(4);
				}
			}
		});
		done();
	})
});

describe('override reservation', function(){
	it('should update the reservation and send back an updated list of reservations for the client and admin', function(done){
		var client1 = io.connect('http://localhost:8080/user', {forceNew: true});
		var admin1 = io.connect('http://localhost:8080/admin', {forceNew: true});
		client1.emit('vehicleOverride', 5, "1869", "2011 CHEVROLET EQUINOX", "I'm scared of small cars.");
		client1.on('reservationOverride', function(data){
			data.rows.length.should.be.above(0);
			data.rows[0].license.should.equal("1869");
			data.rows[0].model.should.equal("2011 CHEVROLET EQUINOX");
			data.rows[0].override.should.equal(true);
			data.rows[0].justification.should.equal("I'm scared of small cars.");
		});
		admin1.on('reservationChange', function(data){
			for(var i = 0; i < data.rows.length; i++){
				if (data.rows[i].id === 5){
					data.rows[i].license.should.equal("1869");
					data.rows[i].model.should.equal("2011 CHEVROLET EQUINOX");
					data.rows[i].override.should.equal(true);
					data.rows[i].justification.should.equal("I'm scared of small cars.");
				}
			}
		});
		done();
	})
});

describe('add report', function(){
	it('should add report and update admin list of reports', function(done){
		var client1 = io.connect('http://localhost:8080/user', {forceNew: true});
		var admin1 = io.connect('http://localhost:8080/admin', {forceNew: true});
		client1.emit('reportAdded', 5, "The car was just fine.");
		admin1.on('reportChange', function(data){
			data.rows.length.should.be.above(0);
			for(var i = 0; i < data.rows.length; i++){
				if (data.rows[i].reservation === 5){
					data.rows[i].report.should.equal("The car was just fine.");
				}
			}
		});
		done();
	})
});

describe('log into admin side', function(){
	it('should display all the current reservations and vehicles', function(done){
		var admin1 = io.connect('http://localhost:8080/admin', {forceNew: true});
		admin1.emit('updatePage', function(){

		});
		admin1.on('reservationChange', function(data){
			data.rows.length.should.be.above(0);
		});
		admin1.on('vehicleChange', function(data){
			data.rows.length.should.be.above(0);
		});
		done();
	})
});

describe('vehicle removed', function(){
	it('should return an updated list of vehicles', function(done){
		var admin1 = io.connect('http://localhost:8080/admin', {forceNew: true});
		admin1.emit('vehicleRemoved', "2242", function(){
			
		});
		admin1.on('vehicleChange', function(data){
			for(var i = 0; i < data.rows.length; i++){
				data.rows[i].license.should.not.equal("2242");
			}
		});
		done();
	})
});

describe('edit vehicle', function(){
	it('should return an updated list of vehicles', function(done){
		var admin1 = io.connect('http://localhost:8080/admin', {forceNew: true});
		admin1.emit('vehicleEdited', "2GNF1CEK9C6333734", {license: "1869", model: "2011 CHEVROLET EQUINOX", color: "Red", miles: 27513.0, status: true,
                       isEv: false, trunk: true, offRoad: false, equintRack: false}, function(){
			
		});
		admin1.on('vehicleChange', function(data){
			for(var i = 0; i < data.rows.length; i++){
				if(data.rows[i].id === "2GNF1CEK9C6333734"){
					data.rows[i].color.should.equal('Red');
				}
			}
		});
		done();
	})
});

describe('update vehicle status', function(){
	it('should return an updated list of vehicles', function(done){
		var admin1 = io.connect('http://localhost:8080/admin', {forceNew: true});
		admin1.emit('vehicleStatusUpdated', "704", false, function(){
			
		});
		admin1.on('vehicleChange', function(data){
			for(var i = 0; i < data.rows.length; i++){
				if(data.rows[i].license === "704"){
					data.rows[i].status.should.equal(false);
				}
			}
		});
		done();
	})
});

describe('report removed', function(){
	it('should return an updated list of vehicles', function(done){
		var admin1 = io.connect('http://localhost:8080/admin', {forceNew: true});
		admin1.emit('reportRemoved', 1, function(){
			
		});
		admin1.on('reportChange', function(data){
			for(var i = 0; i < data.rows.length; i++){
				data.rows[i].id.should.not.equal(1);
			}
		});
		done();
	})
});
