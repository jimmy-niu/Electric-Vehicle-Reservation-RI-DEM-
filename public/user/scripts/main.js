let userSocket = io.connect('http://localhost:8080/user', {forceNew: true});
// import flatpickr from "flatpickr";

let userEmail = "";

let currentCar = undefined;
let firstReturnedCar = undefined;
let alternateVehicles = [];

// Sets up the sockets.
$(document).ready(function() {
    $("#cancel-res").click(cancelReservation);
    $("#add-stop").click(function() {addStop(); return false; });
    $("#submit-report").click(submitFeedback);

    userEmail = $("#user_email").html().replace("Welcome, ", "").replace(" <br>", "").replace("\n", "").trim();
    console.log(userEmail);

    userSocket.emit('join',userEmail, function(reservations){
        for(var i = 0; i < reservations.rows.length; i++){
            new Reservation(reservations, i);
            $("#carMakeMText").html($("#carMakeMText").html() + reservations.rows[i].model);
            $("#plateNumberMText").html($("#plateNumberMText").html() + reservations.rows[i].license);
            $("#startMText").html($("#startMText").html() + reservations.rows[i].start);
            $("#endMText").html($("#endMText").html() + reservations.rows[i].end);
            $("#stopsMText").html($("#stopsMText").html() + JSON.parse(reservations.rows[i].stops));
        }    
    });

    userSocket.on('reservationChange', function(reservations){
        console.log("reservation change");
        //console.log(reservations);
    });

    userSocket.on('newReservation', function(reservation){
        cleanFields();
        currentCar = reservation;
        firstReturnedCar = reservation;
        $("#carMakeMText").html($("#carMakeMText").html() + reservation.rows[0].model);
        $("#plateNumberMText").html($("#plateNumberMText").html() + reservation.rows[0].license);
        $("#startMText").html($("#startMText").html() + reservation.rows[0].start);
        $("#endMText").html($("#endMText").html() + reservation.rows[0].end);
        $("#stopsMText").html($("#stopsMText").html() + JSON.parse(reservation.rows[0].stops));
        console.log(reservation);
    });

    userSocket.on('reservationOverride', function(reservations){
        console.log("reservation vehicle override");
    });

    userSocket.on('alternateVehicles', function(vehicles){
        alternateVehicles = vehicles;
    });

    flatpickr(".datePicker", {enableTime: true, dateFormat: "Y-m-d H:i",});

});

function cleanFields(){
    $("#carMakeMText").html("Car Model: ");
    $("#plateNumberMText").html("License Plate: ");
    $("#startMText").html("Start Time: ");
    $("#endMText").html("End Time: ");
    $("#stopsMText").html("Stops: ");
}

function renderCar(){
    console.log("drawing car!");
    if(currentCar !== undefined){
        new Reservation(currentCar, 0);
    }
    cleanFields();
}

function combineCards(){
    let newCar = firstReturnedCar;
    newCar.rows[0].license = currentCar.license;
    newCar.rows[0].model = currentCar.model;
    new Reservation(newCar, 0);

    userSocket.emit('vehicleOverride', newCar.rows[0].id, newCar.rows[0].license, newCar.rows[0].model, $("#report-area").val());

    firstReturnedCar = undefined;
    currentCar = undefined;
    cleanFields();
    $("#report-area").val("");
}

function setVehicle(index){
    console.log(index);
    currentCar = alternateVehicles.rows[index];
    console.log(currentCar);
}

function altVehicles(){
    $("#altVehiclesForm").empty();
    for(let i = 0; i < alternateVehicles.rowCount; i++){
        let command = alternateVehicles.rows[i].model + " || " + alternateVehicles.rows[i].license + ` <input type = "radio" name="altVehiclesGroup" onclick = "setVehicle(${i})"><br>`
        console.log(command);
        $("#altVehiclesForm").append(command);
    }
    cleanFields();
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

function cancelReservation(){
    let reservationID = $("#res-id").html();
    $("." + reservationID).remove();
    userSocket.emit('cancel', reservationID, userEmail);
    //console.log(reservationID)
    //console.log("cancelled");
    cleanFields();
}

function editReservation(){
    userSocket.emit('edit', {user: "Jimmy Niu", license: "19087", start: "6932", end: "6361", stops: ["home", "work"], override: false, justification: ""});
}

function cancelReservation(){
    // let reservationID = 
    console.log("cancelled");
    cleanFields();
}


function submitFeedback(reservationID){
    let report = $('#report-area').val();
    // console.log(report);
    userSocket.emit('reportAdded', reservationID, report);
}

class Reservation {
    constructor(reservationData, i) {
        this.addToDom(reservationData.rows[i]);
    }
    addToDom(r) {
        // console.log("r");
        // console.log(r);
        let DOMobject = `<div class="card border-success mb-3 ${r.id}" style="width: 18rem;">
<img class = "card-img-top" src="https://upload.wikimedia.org/wikipedia/commons/5/5f/DCA_Prius_1Gen_12_2011_3592.JPG" alt="prius placeholder image">
<div class="card-body">
<h5 class="card-title">${r.model} ${r.license}</h5>
<p class="card-text"><b>Start</b>: ${r.start} <br>
<b>End</b>: ${r.end} <br>
<b>Route</b>: ${JSON.parse(r.stops)} </p>
<span style = "display: none;" id = "res-id">${r.id}</span>
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
