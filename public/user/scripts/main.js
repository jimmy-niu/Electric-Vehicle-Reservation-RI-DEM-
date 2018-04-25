let userSocket = io.connect('http://localhost:8080/user', {forceNew: true});
// import flatpickr from "flatpickr";

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

        new Reservation(reservations);
    });

    userSocket.on('reservationOverride', function(reservations){
        console.log("reservation vehicle override");
    });

    userSocket.on('alternateVehicles', function(vehicles){
        console.log(vehicles);
    });
    
    flatpickr(".datePicker", {enableTime: true, dateFormat: "Y-m-d H:i",});

});

function resres(event){
    console.log("we in reresrs");
    event.preventDefault();
    return false;
}


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
    let start = $("#start-date").val();
    let end = $("#end-date").val();

    let stops = [];    
    $('.route-stop').each(function() {
        stops.push($(this).val());
    })

    let trunk = $("#trunk").prop('checked');
    let offroad = $("#offroading").prop('checked');
    let rack = $('#kayak').prop('checked');

    let resData = {user: "user", start: start, end: end, stops: JSON.stringify(stops).split('},{').join('}, {'), override: false, justification: "", needsTrunk: trunk, needsOffRoad: offroad, needsRack: rack};
    console.log("test", resData)
    userSocket.emit('reservation', resData);
}

function editReservation(){
    userSocket.emit('edit', {user: "Jimmy Niu", license: "19087", start: "6932", end: "6361", stops: ["home", "work"], override: false, justification: ""});
}

function getReservations(reservations){

}

function cancelReservation(reservationID, user){
    console.log("cancelled");
}

function submitFeedback(){
    userSocket.emit('reportAdded', reservationID, report);
}

class Reservation {
    constructor(reservationData) {
        this.addToDom(reservationData.rows[0]);
    }
    addToDom(r) {
        let DOMobject = `<div class="card border-success mb-3" style="width: 18rem;">
                    <img class = "card-img-top" src="https://upload.wikimedia.org/wikipedia/commons/5/5f/DCA_Prius_1Gen_12_2011_3592.JPG" alt="prius placeholder image">
                    <div class="card-body">
                        <h5 class="card-title">${r.model} ${r.license}</h5>
                        <p class="card-text"><b>Start</b>: ${r.start} <br>
                            <b>End</b>: ${r.end} <br>
                            <b>Route</b>: ${JSON.parse(r.stops)} </p>
                        <a href="#" class="btn btn-primary edit">Edit reservation</a>
                        <a href="#" class="btn btn-secondary" data-toggle="modal" data-target="#cancelModal">Cancel </a>
                    </div>
                </div>`;
        $('.cards').append(DOMobject);
    }
}

function overrideVehicle(reservationID, license, justification){
    userSocket.emit('vehicleOverride', reservationID, license, justification);
}
