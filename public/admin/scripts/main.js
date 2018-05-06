let adminSocket = io.connect('http://localhost:8080/admin', {forceNew: true});
let currentVehicle = 0;

// Sets up the sockets.
$(document).ready(function() {
    adminSocket.emit('updatePage', function(){
        console.timeEnd('Page Update Event');
    });

    adminSocket.on('reservationChange', function(reservations){
        $('#upcoming').empty();
        for(let i = 0; i < reservations.rowCount; i++){
            new Reservation(reservations.rows[i]);
        }
    });

    adminSocket.on('newReservation', function(reservation){
        for(let i = 0; i < reservation.rowCount; i++){
            new Reservation(reservation.rows[i]);
        }
    });

    adminSocket.on('vehicleChange', function(vehicles){
        for(let i = currentVehicle; i < vehicles.rowCount; i ++){
            new Vehicle(vehicles.rows[i]);
            currentVehicle ++;
        }
    });

    adminSocket.on('reportChange', function(reports){
        // TODO: actually make this do something???
        console.log(reports);
    });

    setUploader();
    bindClickHandlers();
});

function bindClickHandlers(){
    $("#upcoming_title").bind("click", function(){
        toggle_hidden('upcoming'); 
        toggle_hidden('upcoming_header');
        toggleTitle(this);
    });

    $("#fleet_title").bind("click", function(){
        toggle_hidden('fleet_header'); 
        toggle_hidden('current_fleet');
        toggleTitle(this);
    });
}

function toggle_hidden(id){
    document.getElementById(id).classList.toggle('hidden');
}

function toggleTitle(object){
    let content = object.innerHTML;
    if(content.includes("▼")){
        object.innerHTML = content.replace("▼", "▲");
    } else {
        object.innerHTML = content.replace("▲", "▼");
    }
}

function insertVehicleImage(id, imgSrc){
    let img = `<img src = "${imgSrc}"`
    $(`#${id}`).append()
}

function clearForms(obj){
    obj.trigger("reset");
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
    cleanFields();
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

/*
 * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  Classes used to make reservations. 
 * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 */
class Reservation {
    constructor(reservationData){
        this.addToDOM(reservationData);
    }
    addToDOM(r){
        let justification = r.justification;
        if(justification !== ''){
            justification = `<a href = "#justificationModal" class = "btn btn-large btn-primary drop-shadow" data-toggle="modal" onclick = "setJustificationModal('${r.justification}')">Click To See</a>`
        }
        console.log(r);
        let DOMobject = `<div class = "col-entry reservation-user ${r.license}">${r.user}</div>`
        + `<div class = "col-entry reservation-start ${r.license}">${r.start}</div>` 
        + `<div class = "col-entry reservation-end ${r.license}">${r.end}</div>`
        + `<div class = "col-entry carModel ${r.license}">${r.model}</div>`
        + `<div class = "col-entry reservation-license ${r.license}">${r.license}</div>` 
        + `<div class = "col-entry reservation-pickup> ${r.license}">${justification}</div>`;

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
        let DOMobject = `<div class = "col-entry ${v.license}">${v.license}</div>` + `<div class = "col-entry ${v.license}">${v.color} ${v.model}</div>`
        + `<div class = "col-entry ${v.license}">${v.miles} miles</div>`
        + `<div class = "col-entry ${v.license}">${carType}</div>`
        + `<div class = "col-entry ${v.license}"><span class="dropdown">`
        + `<button class="btn btn-primary dropdown-toggle" type="button" data-toggle="dropdown">Change Status</button>`
        + `<ul class="dropdown-menu">`
        + `<a href="#editVehicle"><li><i class="fa fa-wrench"></i> Edit Car</li></a>`
        + `<div onclick = 'deleteVehicle("${v.license}")'><li><i class="fa fa-archive"></i> Retire</li></div>`
        + `</ul></span></div>`;

        $('#current_fleet').append(DOMobject);
    }
}

/*
 * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  Functions used for image uploading
 * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 */
function setUploader(){
    // bind to the form's submit event
    $('#frmUploader').unbind("submit").bind("submit", function(e){
        e.preventDefault();

        let options = {
            resetForm: true,
            data: {license: ""},
            success: function(data){
                console.log("inside the thingy!");
                console.log(data);
                console.log("we done!");
                clearForms($("#frmUploader"));
            }
        };
        options.data.license = $("#licenseField").val();
        $(this).ajaxSubmit(options);
    });
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
