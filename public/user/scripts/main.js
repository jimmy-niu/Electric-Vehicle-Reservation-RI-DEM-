let userSocket = io.connect('http://localhost:8080/user', {forceNew: true});

// Sets up the sockets.
$(document).ready(function() {
    $("#submit-res").click(newReservation);
    $("#cancel-res").click(cancelReservation);
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
        console.log(reservations);
    });

    userSocket.on('reservationOverride', function(reservations){
        console.log("reservation vehicle override");
        //console.log(reservations);
    });

    userSocket.on('alternateVehicles', function(vehicles){
        console.log(vehicles);
    });

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
    let s = new Date($('#start-date').val());
    let isoStart = new Date(s.getTime() - (s.getTimezoneOffset() * 60000)).toISOString();
    let start = isoStart.substr(0, 16).replace('T', ' ');

    let e = new Date($('#end-date').val());
    let isoEnd = new Date(e.getTime() - (e.getTimezoneOffset() * 60000)).toISOString();
    let end = isoEnd.substr(0, 16).replace('T', ' ');

    let stops = [];    
    $('.route-stop').each(function() {
        stops.push($(this).val());
    })
    // let override =
    // let justification =
    let trunk = $("#trunk").prop('checked');
    let offroad = $("#offroading").prop('checked');
    let rack = $('#kayak').prop('checked');

    let resData = {user: "user", start: start, end: end, stops: stops, override: false, justification: "", needsTrunk: trunk, needsOffRoad: offroad, needsRack: rack};
    let res = new Reservation(resData);
    console.log(res);

    userSocket.emit('reservation', resData);
}

function editReservation(){
    userSocket.emit('edit', {user: "Jimmy Niu", license: "19087", start: "6932", end: "6361", stops: ["home", "work"], override: false, justification: ""});
}

//need to figure out current and past
function getReservations(reservations){

}

function cancelReservation(reservationID, user){
    console.log("cancelled");
    //userSocket.emit('cancel', reservationID);
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
        let DOMobject = `<div class="card border-success mb-3" style="width: 18rem;">
                    <img class = "card-img-top" src="https://upload.wikimedia.org/wikipedia/commons/5/5f/DCA_Prius_1Gen_12_2011_3592.JPG" alt="prius placeholder image">
                    <div class="card-body">
                        <h5 class="card-title">Toyota Prius 787ZXC</h5>
                        <p class="card-text"><b>Start</b>: ${r.start} <br>
                            <b>End</b>: ${r.end} <br>
                            <b>Route</b>: ${r.stops} </p>
                        <a href="#" class="btn btn-primary edit">Edit reservation</a>
                        <a href="#" class="btn btn-secondary" data-toggle="modal" data-target="#cancelModal">Cancel </a>
                    </div>
                </div>`;
        $('.cards').append(DOMobject);
    }
}
function submitJustification(reservationID, justification){
    userSocket.emit('justification', reservationID, justification);
}

function overrideVehicle(reservationID, license){
    userSocket.emit('vehicleOverride', reservationID, license);
}
