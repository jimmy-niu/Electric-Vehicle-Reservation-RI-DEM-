let userSocket = io.connect('http://localhost:8080/user', {forceNew: true});

// Sets up the sockets.
$(document).ready(function() {
    $("#submit-res").click(newReservation);
    $("#add-stop").click(function() {addStop(); return false; });

    userSocket.emit('join',"Jimmy Niu", function(reservations){
        getReservations(reservations);
        console.log(reservations);
    });

    userSocket.on('reservationChange', function(reservations){
        console.log("reservation change");
        //console.log(reservations);
    });

    userSocket.on('newReservation', function(reservations){
        console.log("new reservation added");
        //console.log(reservations);
    });

    userSocket.on('reservationOverride', function(reservations){
        console.log("reservation vehicle override");
        //console.log(reservations);
    });

    userSocket.on('alternateVehicles', function(vehicles){
        console.log(vehicles);
    });

    updateReservation(1, "JGH456")
});

function addStop() {
    let newStop = ` <div class="form-group">
        <label>Destination</label>
        <input type=text class="form-control route-stop">
    </div>`
    $('#stops').append(newStop);
}

function newReservation(){
    console.log("pressed");

    // let user = // ???
    let start = $('#start-date').val();
    let end = $('#end-date').val();
    let stops = [];    
    $('.route-stop').each(function() {
        stops.push($(this).val());
    })
    // let override =
    // let justification =
    let trunk = $("#trunk").prop('checked');
    let offroad = $("#offroading").prop('checked');
    let rack = $('#kayak').prop('checked');

    let res = new Reservation({start: start, end: end, stops: stops, needsTrunk: trunk, needsOffRoad: offroad, needsRack: rack});
    console.log(res);

    userSocket.emit('reservation', {user: "Jimmy Niu", start: "2018-04-18 11:00", end: "2018-04-18 16:00", stops: ["home", "work"], override: true, justification: "my oranges fell into the river.", needsTrunk: false, needsOffRoad: false, needsRack: false});
}

function editReservation(){
    userSocket.emit('edit', {user: "Jimmy Niu", license: "19087", start: "6932", end: "6361", stops: ["home", "work"], override: false, justification: ""});
}

//need to figure out current and past
function getReservations(reservations){

}

function cancelReservation(reservationID, user){
    userSocket.emit('cancel', reservationID);
}

function submitFeedback(){
    userSocket.emit('reportAdded', reservationID, report);
}

class Reservation {
    constructor(reservationData) {
        this.data = reservationData;
        this.addToDom(this.data);
    }
    addToDom(r) {
        let DOMobject = `hi`;
        console.log(DOMobject);
        $('#cardz').append(DOMobject);
    }
}
function submitJustification(reservationID, justification){
    userSocket.emit('justification', reservationID, justification);
}

function overrideVehicle(reservationID, license){
    userSocket.emit('vehicleOverride', reservationID, license);
}
