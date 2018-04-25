let userSocket = io.connect('http://localhost:8080/user', {forceNew: true});
// import flatpickr from "flatpickr";

let userEmail = "";

let currentCar = undefined;
let alternateVehicles = [];

// Sets up the sockets.
$(document).ready(function() {
    $("#cancel-res").click(cancelReservation);
    $("#add-stop").click(function() {addStop(); return false; });
    $("#submit-report").click(submitFeedback);
    
    userEmail = $("#user_email").html().replace("Welcome, ", "").replace(" <br>", "").replace("\n", "").trim();
    console.log(userEmail);
    
    userSocket.emit('join',"Jimmy Niu", function(reservations){
        // getReservations(reservations);
        // console.log(reservations);
    });

    userSocket.on('reservationChange', function(reservations){
        console.log("reservation change");
        //console.log(reservations);
    });

    userSocket.on('newReservation', function(reservation){
        currentCar = reservation;
        $("#carMakeMText").html($("#carMakeMText").html() + reservation.rows[0].model);
        $("#plateNumberMText").html($("#plateNumberMText").html() + reservation.rows[0].license);
        $("#startMText").html($("#startMText").html() + reservation.rows[0].start);
        $("#endMText").html($("#endMText").html() + reservation.rows[0].end);
        $("#stopsMText").html($("#stopsMText").html() + reservation.rows[0].stops);
    });

    userSocket.on('reservationOverride', function(reservations){
        console.log("reservation vehicle override");
    });

    userSocket.on('alternateVehicles', function(vehicles){
        alternateVehicles = vehicles;
    });
    
    flatpickr(".datePicker", {enableTime: true, dateFormat: "Y-m-d H:i",});

});

function renderCar(){
    console.log("drawing car!");
    if(currentCar !== undefined){
        new Reservation(currentCar);
    }
}

function addStop() {
    let newStop = ` <div class="form-group">
        <label>Destination</label>
        <input type=text class="form-control route-stop">
    </div>`
    $('#stops').append(newStop);
}

function newReservation(){
    // let user = // ???
    let start = $("#start-date").val();
    let end = $("#end-date").val();

    let stops = [];    
    $('.route-stop').each(function() {
        stops.push($(this).val());
    });

    let trunk = $("#trunk").prop('checked');
    let offroad = $("#offroading").prop('checked');
    let rack = $('#kayak').prop('checked');

    let resData = {user: userEmail, start: start, end: end, stops: JSON.stringify(stops).split('},{').join('}, {'), override: false, justification: "", needsTrunk: trunk, needsOffRoad: offroad, needsRack: rack};
    userSocket.emit('reservation', resData);
}

function editReservation(){
    userSocket.emit('edit', {user: "Jimmy Niu", license: "19087", start: "6932", end: "6361", stops: ["home", "work"], override: false, justification: ""});
}

function cancelReservation(){
    // let reservationID = 
    console.log("cancelled");
}

function submitFeedback(reservationID){
    let report = $('#report-area').val();
    // console.log(report);
    userSocket.emit('reportAdded', reservationID, report);
}

class Reservation {
    constructor(reservationData) {
        this.addToDom(reservationData.rows[0]);
    }
    addToDom(r) {
        // console.log("r");
        // console.log(r);
        let DOMobject = `<div class="card border-success mb-3" style="width: 18rem;">
                    <img class = "card-img-top" src="https://upload.wikimedia.org/wikipedia/commons/5/5f/DCA_Prius_1Gen_12_2011_3592.JPG" alt="prius placeholder image">
                    <div class="card-body">
                        <h5 class="card-title">${r.model} ${r.license}</h5>
                        <p class="card-text"><b>Start</b>: ${r.start} <br>
                            <b>End</b>: ${r.end} <br>
                            <b>Route</b>: ${JSON.parse(r.stops)} </p>
                        <a href="#" class="btn btn-primary edit">Edit reservation</a>
                        <a href="#" class="btn btn-secondary" data-toggle="modal" data-target="#cancelModal">Cancel</a>
                    </div>
                </div>`;
        $('.cards').append(DOMobject);
    }
}

function overrideVehicle(reservationID, license, justification){
    userSocket.emit('vehicleOverride', reservationID, license, justification);
}
