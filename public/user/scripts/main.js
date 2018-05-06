let userSocket = io.connect('http://localhost:8080/user', {forceNew: true});
// import flatpickr from "flatpickr";

let userEmail = "";

let currentCar = undefined;
//let firstReturnedCar = undefined;
let alternateVehicles = [];
let isEditing = false;


// Sets up the sockets.
$(document).ready(function() {
    $("#cancel-res").click(cancelReservation);
    $("#add-stop").click(function() {addStop(); return false; });
    $("#submit-report").click(submitFeedback);

    userEmail = $("#user_email").html().replace("Welcome, ", "").replace(" <br>", "").replace("\n", "").trim();
    console.log(userEmail);

    userSocket.emit('join',userEmail, function(reservations){
        for(var i = 0; i < reservations.rows.length; i++){
            new Reservation(reservations.rows[i]);
        }
    });

    userSocket.on('reservationChange', function(reservations){
        console.log("reservation change");
        $("." + idToDelete).remove();
        cleanFields();
        //console.log(reservations);
    });

    userSocket.on('newReservation', function(vehicles, reservation, isEdit){
        console.log('new reservation made');
        currentCar = reservation;
        alternateVehicles = vehicles;
        isEditing = isEdit;
        //firstReturnedCar = reservation;
        cleanFields();
        if(isEditing){
            $("#carMakeMText-edit").html($("#carMakeMText-edit").html() + reservation.model);
            $("#plateNumberMText-edit").html($("#plateNumberMText-edit").html() + reservation.license);
            $("#startMText-edit").html($("#startMText-edit").html() + reservation.start);
            $("#endMText-edit").html($("#endMText-edit").html() + reservation.end);
            $("#stopsMText-edit").html($("#stopsMText-edit").html() + JSON.parse(reservation.stops));
            $("#resModal-edit").modal();
        } else {
            $("#carMakeMText").html($("#carMakeMText").html() + reservation.model);
            $("#plateNumberMText").html($("#plateNumberMText").html() + reservation.license);
            $("#startMText").html($("#startMText").html() + reservation.start);
            $("#endMText").html($("#endMText").html() + reservation.end);
            $("#stopsMText").html($("#stopsMText").html() + JSON.parse(reservation.stops));
            $("#resModal").modal();
        }
        // if(isEditing){
        //     $('new-res-label').html('Edit Your Reservation');
        // } else {
        //     $('new-res-label').html('Reserve a DEM Vehicle');
        // }
    });

    userSocket.on('reservationID', function(id){
        currentCar.addClass('id');
        console.log($("." + id))
    });

    // userSocket.on('editReservation', function(reservation){
    //     console.log('edit reservation made');
    //     cleanFieldsEdit();
    //     currentCar = reservation;
    //     //firstReturnedCar = reservation;
    //     $("#carMakeMText-edit").html($("#carMakeMText-edit").html() + reservation.rows[0].model);
    //     $("#plateNumberMText-edit").html($("#plateNumberMText-edit").html() + reservation.rows[0].license);
    //     $("#startMText-edit").html($("#startMText-edit").html() + reservation.rows[0].start);
    //     $("#endMText-edit").html($("#endMText-edit").html() + reservation.rows[0].end);
    //     $("#stopsMText-edit").html($("#stopsMText-edit").html() + JSON.parse(reservation.rows[0].stops));
    //     $("#resModal-edit").modal();
    //     console.log(reservation);
    // });

    userSocket.on('reservationOverride', function(reservations){
        console.log("reservation vehicle override");
    });

    userSocket.on('alternateVehicles', function(vehicles, reservationInfo){
        alternateVehicles = vehicles;
    });

    userSocket.on('noVehicle', function(){
        if(isEditing){
            $("#messageMText-edit").html("There is no vehicle available at that time that meets your needs.");            
            $('#errorModal-edit').modal();
        } else {
            $("#messageMText").html("There is no vehicle available at that time that meets your needs.");  
            $('#errorModal').modal(); 
        }
    });

    userSocket.on('isOverlap', function(){
        if(isEditing){
            $("#messageMText-edit").html("You have an existing reservation that overlaps with the times you selected.");
            $('#errorModal-edit').modal();
        } else {
           $("#messageMText").html("You have an existing reservation that overlaps with the times you selected.");
            $('#errorModal').modal(); 
        }
    });

    flatpickr(".datePicker", {enableTime: true, dateFormat: "Y-m-d H:i"});
    jQuery.fn.carousel.Constructor.TRANSITION_DURATION = 5000;
});

function cleanFields(){
    if(isEditing){
        console.log('clean edit')
        $("#carMakeMText-edit").html("Car Model: ");
        $("#plateNumberMText-edit").html("License Plate: ");
        $("#startMText-edit").html("Start Time: ");
        $("#endMText-edit").html("End Time: ");
        $("#stopsMText-edit").html("Stops: ");
        $("#new-stops-edit").empty();
    } else {
        $("#carMakeMText").html("Car Model: ");
        $("#plateNumberMText").html("License Plate: ");
        $("#startMText").html("Start Time: ");
        $("#endMText").html("End Time: ");
        $("#stopsMText").html("Stops: ");
        $("#new-stops").empty();
    }
}

// function renderCar(){
//     if(isEditing){
//         let id = $("#reservation-id-edit").html();
//         userSocket.emit('editReservation', currentCar, id, function(id){
//             currentCar.id = id;

//             console.log("drawing car!");
//             if(currentCar !== undefined){
//                 new Reservation(currentCar);
//             }
            

//             if(isEditing){
//                 cancelReservation();
//             } 

//             cleanFields();
//         });
//     } else {
//         userSocket.emit('addReservation', currentCar, isEditing, function(id){
//             currentCar.id = id;

//             console.log("drawing car!");
//             if(currentCar !== undefined){
//                 new Reservation(currentCar);
//             }
            

//             if(isEditing){
//                 cancelReservation();
//             } 

//             cleanFields();
//         });
//     }
// }

function override(){
    if(isEditing){
        currentCar.justification = $("#reasoning-field-edit").val();
    } else{
        currentCar.justification = $("#reasoning-field").val();
    }
    currentCar.override = true;
    renderCar();
}

function renderCar(){
    // let newCar = firstReturnedCar;
    // newCar.rows[0].license = currentCar.license;
    // newCar.rows[0].model = currentCar.model;
    //console.log('combine')
    //userSocket.emit('vehicleOverride', newCar.rows[0].id, newCar.rows[0].license, newCar.rows[0].model, $("#reasoning-field").val());
    //console.log(isEditing)

    if(isEditing){
        let id = $("#reservation-id-edit").html();
        console.log(id)
        userSocket.emit('editReservation', currentCar, id, function(){
            console.log('added')
            currentCar.id = id;

            $("." + idToDelete).remove();

            new Reservation(currentCar);

            currentCar = undefined;
            $("#reasoning-field-edit").val("");

            cleanFields();
        });
    } else {
        userSocket.emit('addReservation', currentCar, function(id){
            console.log('added')
            currentCar.id = id;
            new Reservation(currentCar);

            currentCar = undefined;
            $("#reasoning-field").val("");

            cleanFields();
        });
    }
}

function setVehicle(index){
    console.log(alternateVehicles.rows[index]);
    //currentCar = alternateVehicles.rows[index];
    currentCar.license = alternateVehicles.rows[index].license;
    currentCar.model = alternateVehicles.rows[index].model;
    console.log(currentCar);
}

function altVehicles(){
    if(isEditing){
        if($("#reasoning-field-edit").val().trim().length > 0){
            $("#appealModal-edit").modal('hide');
            $("#altModal-edit").modal();
            $("#justification-help-edit").addClass('d-none');

            $("#altVehiclesForm-edit").empty();
            for(let i = 0; i < alternateVehicles.rowCount; i++){
                let command = alternateVehicles.rows[i].model + " || " + alternateVehicles.rows[i].license + ` <input type = "radio" name="altVehiclesGroup-edit" onclick = "setVehicle(${i})"><br>`
                //console.log(command);
                $("#altVehiclesForm-edit").append(command);
            }
            cleanFields();
        } else {
            $("#justification-help-edit").removeClass('d-none');
        }
    } else {
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
}

// function altVehiclesEdit(){
//     if($("#reasoning-field-edit").val().trim().length > 0){
//         $("#appealModal-edit").modal('hide');
//         $("#altModal-edit").modal();
//         $("#justification-help-edit").addClass('d-none');

//         $("#altVehiclesForm-edit").empty();
//         for(let i = 0; i < alternateVehicles.rowCount; i++){
//             let command = alternateVehicles.rows[i].model + " || " + alternateVehicles.rows[i].license + ` <input type = "radio" name="altVehiclesGroup" onclick = "setVehicle(${i})"><br>`
//             //console.log(command);
//             $("#altVehiclesForm-edit").append(command);
//         }
//         cleanFieldsEdit();
//     } else {
//         $("#justification-help-edit").removeClass('d-none');
//     }
// }

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

// function newEditedReservation(){
//     cancelReservation();
//     renderCar();
//     cleanFieldsEdit();
// }

// function newEditedReservationOverride(){
//     console.log(idToDelete);
//     cancelReservation();
//     combineCards();
//     cleanFieldsEdit();
// }

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
    let start = $("." + idToDelete)[0].children[1].children[1].children[0].nextSibling.textContent.substring(2);
    let end = $("." + idToDelete)[0].children[1].children[1].children[2].nextSibling.textContent.substring(2);
    let carName = $("." + idToDelete)[0].children[1].children[0].firstChild.textContent.split(" ");
    let license = carName[carName.length - 1]
    userSocket.emit('cancel', idToDelete, userEmail, license, start, end, function(){
    });

    $("." + idToDelete).remove();
    cleanFields();
}
function cancelReservationProcess(){
    console.log(currentCar.id);
    userSocket.emit('cancel', currentCar.rows[0].id, userEmail,function(){
    });
    cleanFields();
}

function addIDToModal(reservationObj){
    $("#reservation-id-edit").html(reservationObj.id);
    //isEditing = true;
    // console.log("try to delete")
    idToDelete = reservationObj.id;
    // console.log(typeof idToDelete)
    // cancelReservation();
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
        $("#messageMText-edit").html("The dates you entered are invalid. Please go back and try again.");
        $('#errorModal-edit').modal();
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
        idToDelete = id;
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
    constructor(reservationData) {
        this.addToDom(reservationData);
    }
    addToDom(r) {
        // console.log("r");
        // console.log(r);
        let DOMobject = `<div class="card border-success mb-3 ${r.id}" style="width: 18rem;">
<img class = "card-img-top" src="https://upload.wikimedia.org/wikipedia/commons/5/5f/DCA_Prius_1Gen_12_2011_3592.JPG" alt="prius placeholder image">
<div class="card-body">
<h5 class="card-title-${r.id}">${r.model} ${r.license}</h5>
<p class="card-text-${r.id}"><strong>Start</strong>: ${r.start} <br>
<strong>End</strong>: ${r.end} <br>
<strong>Route</strong>: ${JSON.parse(r.stops)} </p>
<span style = "display: none;" id = "res-id-${r.id}">${r.id}</span>
<a href="#" id = "${r.id}" class="btn btn-primary edit" data-toggle="modal" data-target="#editModal" onclick="addIDToModal(this);">Edit reservation</a>
<a href="#" id = "${r.id}" class="btn btn-secondary" data-toggle="modal" data-target="#cancelModal" onclick = "setDeleteCard(this);">Cancel</a>
</div>
</div>`;
        $('.cards').append(DOMobject);
    }
}

function overrideVehicle(reservationID, license, model, justification){
    userSocket.emit('vehicleOverride', reservationID, license, model, justification);
}
