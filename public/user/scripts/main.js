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
        }
    });

    userSocket.on('reservationChange', function(reservations){
        console.log("reservation change");
        //console.log(reservations);
    });

    userSocket.on('newReservation', function(reservation){
        console.log('new reservation made');
        cleanFields();
        currentCar = reservation;
        firstReturnedCar = reservation;
        $("#carMakeMText").html($("#carMakeMText").html() + reservation.rows[0].model);
        $("#plateNumberMText").html($("#plateNumberMText").html() + reservation.rows[0].license);
        $("#startMText").html($("#startMText").html() + reservation.rows[0].start);
        $("#endMText").html($("#endMText").html() + reservation.rows[0].end);
        $("#stopsMText").html($("#stopsMText").html() + JSON.parse(reservation.rows[0].stops));
        $("#resModal").modal();
        console.log(reservation);
    });

    userSocket.on('reservationOverride', function(reservations){
        console.log("reservation vehicle override");
    });

    userSocket.on('alternateVehicles', function(vehicles){
        alternateVehicles = vehicles;
    });

    userSocket.on('noVehicle', function(){
        $("#messageMText").html("There is no vehicle available at that time that meets your needs.");
        $('#errorModal').modal();
    });

    userSocket.on('isOverlap', function(){
        $("#messageMText").html("You have an existing reservation that overlaps with the times you selected.");
        $('#errorModal').modal();
    });

    flatpickr(".datePicker", {enableTime: true, dateFormat: "Y-m-d H:i"});

});

function cleanFields(){
    $("#carMakeMText").html("Car Model: ");
    $("#plateNumberMText").html("License Plate: ");
    $("#startMText").html("Start Time: ");
    $("#endMText").html("End Time: ");
    $("#stopsMText").html("Stops: ");
    $("#new-stops").empty();
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
    $("#reasoning-field").val("");
}

function setVehicle(index){
    console.log(index);
    currentCar = alternateVehicles.rows[index];
    console.log(currentCar);
}

function altVehicles(){
    if($("#reasoning-field").val().trim().length > 0){
        $("#appealModal").modal('hide');
        $("#altModal").modal();
        $("#justification-help").addClass('d-none');

        $("#altVehiclesForm").empty();
        for(let i = 0; i < alternateVehicles.rowCount; i++){
            let command = alternateVehicles.rows[i].model + " || " + alternateVehicles.rows[i].license + ` <input type = "radio" name="altVehiclesGroup" onclick = "setVehicle(${i})"><br>`
            //console.log(command);
            $("#altVehiclesForm").append(command);
        }
        cleanFields();
    } else {
        $("#justification-help").removeClass('d-none');
    }
}

function addStop() {
    console.log("we in addStop");
    let newStop = ` <div class="form-group">
<label>Destination <span onclick = "deleteStop(this);" 
id = "deleteX">x</span></label>
<input type=text class="form-control route-stop">
</div>`
    $('#new-stops').append(newStop);
}

function deleteStop(obj){
    let toDelete = obj.parentNode.parentNode;
    toDelete.parentNode.removeChild(toDelete);
}

function newReservation(){
    // let user = // ???
    let start = $("#start-date").val();
    let end = $("#end-date").val();

    //convert strings to Date objects
    let startDate = new Date(start);
    let endDate = new Date(end);
    //gets current date and time
    let today = new Date();

    //only makes reservation when start date is before end date, and
    //the reservation is in the present
    if(startDate >= endDate || startDate < today){
        $("#messageMText").html("The dates you entered are invalid. Please go back and try again.");
        $('#errorModal').modal();
    } else {
        let stops = [];
        $('.route-stop').each(function() {
            stops.push($(this).val());
        });

        let trunk = $("#trunk").prop('checked');
        let offroad = $("#offroading").prop('checked');
        let rack = $('#kayak').prop('checked');

        let resData = {user: userEmail, start: start, end: end, stops: JSON.stringify(stops).split('},{').join('}, {'), override: false, justification: "", needsTrunk: trunk, needsOffRoad: offroad, needsRack: rack};
        userSocket.emit('reservation', resData, function(){

        });
    }
}

function cancelReservation(){
    //console.log($(`"#${idToDelete}"`))
    let start = $("." + idToDelete)[0].children[1].children[1].children[0].nextSibling.textContent.substring(2);
    let end = $("." + idToDelete)[0].children[1].children[1].children[2].nextSibling.textContent.substring(2);
    let carName = $("." + idToDelete)[0].children[1].children[0].firstChild.textContent.split(" ");
    let license = carName[carName.length - 1]
    userSocket.emit('cancel', idToDelete, userEmail, license, start, end, function(){
    });

    $("." + idToDelete).remove();
    //console.log(reservationID)
    //console.log("cancelled");
    cleanFields();
}
function cancelReservationProcess(){
    console.log(currentCar.id);
    userSocket.emit('cancel', currentCar.rows[0].id, userEmail,function(){
    });
    cleanFields();
}

function addIDToModal(reservationObj){
    $("#reservation-id").html(reservationObj.id);
    setDeleteCard(reservationObj);
    cancelReservation();
}

function editReservation(){
    let id =  $("#reservation-id-edit").html();

    let start = $("#start-date-edit").val();
    let end = $("#end-date-edit").val();

    //convert strings to Date objects
    let startDate = new Date(start);
    let endDate = new Date(end);
    //gets current date and time
    let today = new Date();

    //only makes reservation when start date is before end date, and
    //the reservation is in the present
    if(startDate >= endDate || startDate < today){
        $("#messageMText").html("The dates you entered are invalid. Please go back and try again.");
        $('#errorModal').modal();
    } else {
        let stops = [];
        $('.route-stop-edit').each(function() {
            stops.push($(this).val());
        });

        let trunk = $("#trunk-edit").prop('checked');
        let offroad = $("#offroading-edit").prop('checked');
        let rack = $('#kayak-edit').prop('checked');

        let resData = {user: userEmail, start: start, end: end, stops: JSON.stringify(stops).split('},{').join('}, {'), override: false, justification: "", needsTrunk: trunk, needsOffRoad: offroad, needsRack: rack};
        userSocket.emit('edit', id, resData, function(){

        });
    }
}


function submitFeedback(reservationID){
    let report = $('#report-area').val();
    let serviceNeeded = $('#service-needed').is(":checked");
    let cleaningNeeded = $('#cleaning-needed').is(":checked");
    let notCharging = $('#not-charging').is(":checked");
    // console.log(report);
    userSocket.emit('reportAdded', reservationID, report, serviceNeeded, cleaningNeeded, notCharging);
}

let idToDelete = "";
function setDeleteCard(obj){
    idToDelete = obj.id;
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
<p class="card-text"><strong>Start</strong>: ${r.start} <br>
<strong>End</strong>: ${r.end} <br>
<strong>Route</strong>: ${JSON.parse(r.stops)} </p>
<span style = "display: none;" id = "res-id">${r.id}</span>
<a href="#" id = "${r.id}" class="btn btn-primary edit" data-toggle="modal" data-target="#editModal" onclick = "addIDToModal(this);">Edit reservation</a>
<a href="#" id = "${r.id}" class="btn btn-secondary" data-toggle="modal" data-target="#cancelModal" onclick = "setDeleteCard(this);">Cancel</a>
</div>
</div>`;
        $('.cards').append(DOMobject);
    }
}

function overrideVehicle(reservationID, license, model, justification){
    userSocket.emit('vehicleOverride', reservationID, license, model, justification);
}
