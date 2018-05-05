let adminSocket = io.connect('http://localhost:8080/admin', {forceNew: true});

let currentVehicle = 0;

function toggle_hidden(id, object){
    if(object.innerHTML.includes("▼")){
        object.innerHTML = object.innerHTML.replace("▼", "▲");
    } else {
        object.innerHTML = object.innerHTML.replace("▲", "▼");
    }
    document.getElementById(id).classList.toggle('hidden');
}

// Sets up the sockets.
$(document).ready(function() {
    adminSocket.emit('updatePage', function(){
        console.timeEnd('Page Update Event');
    });

    adminSocket.on('reservationChange', function(reservations){
        console.log("entering reservation change");
        console.log(reservations);
        $('#upcoming').empty();
        for(let i = 0; i < reservations.rowCount; i++){
            new Reservation(reservations.rows[i]);
        }
        console.log("reservation changed");
    });

    adminSocket.on('newReservation', function(reservation){
        console.log("entering new res");
        console.log(reservation);
        for(let i = 0; i < reservation.rowCount; i++){
            new Reservation(reservation.rows[i]);
        }
        console.log("new res appended");
    });

    adminSocket.on('vehicleChange', function(vehicles){
        console.log(vehicles);
        for(let i = currentVehicle; i < vehicles.rowCount; i ++){
            new Vehicle(vehicles.rows[i]);
            currentVehicle ++;
        }
    });

    adminSocket.on('reportChange', function(reports){
        console.log(reports);
    });



    // bind to the form's submit event
    $('#frmUploader').submit(formSubmit);
});

function formSubmit(event){
    let options = {
        beforeSubmit: showRequest,  // pre-submit callback
        uploadProgress: showProgress,
        clearForm: true,
        method: "POST"
    };

    console.log("should be submitting....");
    $(this).ajaxSubmit(options);
    return false;
}
// pre-submit callback
function showRequest(formData, jqForm, options) {
    console.log("Is submitting file!");
    return true;
}

function showProgress(event, position, total, percentageComplete){
    console.log(percentageComplete);
    if(percentageComplete === 100){
        $("#imageInput").val('');
        window.alert("done with upload!");
    }
}

function modifyUser() {
    let email = $('#emailField').val();

    let isAdmin = undefined;
    if($('#adminChoice').is(':checked') || $('#userChoice').is(':checked')) {
        isAdmin = $('#adminChoice').is(':checked');

    }

    let isAdd = undefined;
    if($('#removeChoice').is(':checked') || $('#addChoice').is(':checked')) {
        isAdd = $('#addChoice').is(':checked');

    }

    console.log(email + " || " + isAdmin + " || " + isAdd);
    if(email != undefined && isAdd != undefined){
        if(isAdd  && isAdmin != undefined){
            adminSocket.emit('userAdded', email, isAdmin);
        } else {
            adminSocket.emit('userRemoved', email);
        }
    }

    $('#adminChoice').prop('checked', false);
    $('#userChoice').prop('checked', false);
    $('#addChoice').prop('checked', false);
    $('#removeChoice').prop('checked', false);
    $('#emailField').val('');
}

function addVehicle(){
    let license = $('#licenseField').val();
    let model = $('#modelField').val();
    let color = $('#colorField').val();
    let miles = $('#milesField').val();
    let status  = ($('#carStatusField').val() === "service");
    let carType = ($('#evStatusField').val() === 'ev');
    let trunk = $('#extraTrunkChoice').is(':checked');
    let offRoad = $('#offRoadChoice').is(':checked');
    let equipmentRack = $('#equipChoice').is(':checked');

    if(license !== '' && model !== '' && color !== ''){
        let vehicle = {license: license, model: model, color: color, miles: miles, status: status,
                       isEv: carType, trunk: trunk, offRoad: offRoad, equipmentRack: equipmentRack};
        console.time("Add Vehicle");
        adminSocket.emit("vehicleAdded", vehicle, function(){
            console.timeEnd("Add Vehicle");
        });
    }
}

function editVehicle(id, vehicle){
    console.time("Edit Vehicle");
    adminSocket.emit('vehicleEdited', id, vehicle, function(){
        console.timeEnd("Edit Vehicle")
    });
}

function deleteVehicle(license){
    console.time("Delete Vehicle");
    adminSocket.emit("vehicleRemoved", license, function(){
        console.timeEnd("Delete Vehicle")
    });
    // This works on just deleting the vehicle dom obj btw.
    $('.'+license).remove();
}

function updateVehicleStatus(license, status){
    console.time("Update Vehicle Status");
    adminSocket.emit('vehicleStatusUpdated', license, status, function(){
        console.timeEnd("Update Vehicle Status");
    });
}

function setJustificationModal(text){
    $('#justificationModalText').empty();
    $('#justificationModalText').append(text);
}

// Classes used to create DOM objects.
class Reservation {
    constructor(reservationData){
        this.addToDOM(reservationData);
    }
    addToDOM(r){
        let justification = r.justification;
        if(justification !== ''){
            justification = `<a href = "#justificationModal" class = "btn btn-large btn-primary drop-shadow" data-toggle="modal" onclick = "setJustificationModal('${r.justification}')">Click To See</a>`
        }

        let DOMobject = `<div class = "col-entry reservation-user">${r.user}</div>` +
            `<div class = "col-entry reservation-start ${r.license}">${r.start}</div>` +
            `<div class = "col-entry reservation-end ${r.license}">${r.end}</div>` +
            `<div class = "col-entry reservation-license ${r.license}">${r.license}</div>` +
            `<div class = "col-entry reservation-pickup ${r.license}">${justification}</div>`;

        $('#upcoming').append(DOMobject);
    }
}

class Vehicle {
    constructor(vehicleData){
        this.addToDOM(vehicleData);
    }
    addToDOM(v){
        let carType = "Gas";
        if(v.isEV){
            carType = "Electric Vehicle";
        }
        let DOMobject = `<div class = "col-entry ${v.license}">${v.license}</div>` +
            `<div class = "col-entry ${v.license}">${v.color} ${v.model}</div>` +
            `<div class = "col-entry ${v.license}">${v.miles} miles</div>` +
            `<div class = "col-entry ${v.license}">${carType}</div>` +
            `<div class = "col-entry ${v.license}"><span class="dropdown">` +
            `<button class="btn btn-primary dropdown-toggle" type="button" data-toggle="dropdown">Change Status</button>` +
            `<ul class="dropdown-menu">` +
            `<a href="#editVehicle"><li><i class="fa fa-wrench"></i> Edit Car</li></a>` +
            `<div onclick = 'deleteVehicle("${v.license}")'><li><i class="fa fa-archive"></i> Retire</li></div>` +
            `</ul></span></div>`;
        $('#current_fleet').append(DOMobject);
    }
}

/*
 * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  Functions below are not currently wired up.
 * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 */
function removeReport(id){
    adminSocket.emit('reportRemoved', id);
}

function changeUserStatus(email, admin){
    adminSocket.emit('userStatusChanged', email, admin);
}
