let adminSocket = io.connect('http://localhost:8080/admin', {forceNew: true});
let currentVehicle = 0;

// Sets up the sockets.
$(document).ready(function() {
    adminSocket.emit('updatePage', function(){
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
        $('#current_fleet').empty();
        for(let i = 0; i < vehicles.rowCount; i++){
            new Vehicle(vehicles.rows[i]);
        }
    });

    adminSocket.on('reportChange', function(reports){
        console.log("we are in reportchange!");
        console.log(reports);

        $('#reports').empty();
        for(let i = 0; i < reports.rowCount; i++){
            new Report(reports.rows[i]);
        }
    });

    $('#export-users').click(function(e){
        e.preventDefault();
        window.location.href = 'download/users';
    });

    $('#export-vehicles').click(function(e){
        e.preventDefault();
        window.location.href = 'download/vehicles';
    });

    $('#export-reservations').click(function(e){
        e.preventDefault();
        window.location.href = 'download/reservations';
    });

    $('#export-reports').click(function(e){
        e.preventDefault();
        window.location.href = 'download/reports';
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
    let id = $('#vinField').val();
    let license = $('#licenseField').val();
    let model = $('#modelField').val();
    let color = $('#colorField').val();
    let miles = $('#milesField').val();
    let status  = ($('#carStatusField').val() === "service");
    let carType = ($('#evStatusField').val() === 'ev');
    let trunk = $('#extraTrunkChoice').is(':checked');
    let offRoad = $('#offRoadChoice').is(':checked');
    let equipmentRack = $('#equipChoice').is(':checked');
    let image = $('#imageFileName').val();

    if(id !== '' && license !== '' && model !== '' && color !== ''){
        let vehicle = {id: id, license: license, model: model, color: color, miles: miles, status: status,
                       isEv: carType, trunk: trunk, offRoad: offRoad, equipmentRack: equipmentRack, image: image};
        adminSocket.emit("vehicleAdded", vehicle, function(){
        });
    }
    clearForms($("#carSpecs"));
    clearForms($("#carCaps"));
    clearForms($("#frmUploader"));
    console.log($("#imageFileName").val());
}

function fillInEditModal(vehicleData){
    $('#vinField-edit').val(vehicleData.id);
    $('#licenseField-edit').val(vehicleData.license);
    $('#modelField-edit').val(vehicleData.model);
    $('#colorField-edit').val(vehicleData.color);
    $('#milesField-edit').val(vehicleData.miles);

    if(vehicleData.inService == 1){
        $('#carStatusField-edit').val("ready");
    } else {
        $('#carStatusField-edit').val("service");
    }

    if(vehicleData.isEV == 1){
        $('#evStatusField-edit').val("ev");
    } else {
        $('#evStatusField-edit').val("gas");
    }

    if(vehicleData.extraTrunk == 1){
        $('#extraTrunkChoice-edit').prop("checked", true);
    } else {
        $('#extraTrunkChoice-edit').prop("checked", false);
    }

    if(vehicleData.offRoad == 1){
        $('#offRoadChoice-edit').prop("checked", true);
    } else {
        $('#offRoadChoice-edit').prop("checked", false);
    }

    if(vehicleData.equipmentRack == 1){
        $('#equipChoice-edit').prop("checked", true);
    } else {
        $('#equipChoice-edit').prop("checked", false);
    }
}

function editVehicle(){
    let id = $('#vinField-edit').val();
    let license = $('#licenseField-edit').val();
    let model = $('#modelField-edit').val();
    let color = $('#colorField-edit').val();
    let miles = $('#milesField-edit').val();
    let status  = ($('#carStatusField-edit').val() === "service");
    let carType = ($('#evStatusField-edit').val() === 'ev');
    let trunk = $('#extraTrunkChoice-edit').is(':checked');
    let offRoad = $('#offRoadChoice-edit').is(':checked');
    let equipmentRack = $('#equipChoice-edit').is(':checked');

    if(id !== '' && license !== '' && model !== '' && color !== ''){
        let vehicle = {id: id, license: license, model: model, color: color, miles: miles, inService: status,
                       isEV: carType, extraTrunk: trunk, offRoad: offRoad, equipRack: equipmentRack};
        adminSocket.emit('vehicleEdited', vehicle);
    }
    //cleanFields();
}

function deleteVehicle(license){
    adminSocket.emit("vehicleRemoved", license, function(){
    });
    // This works on just deleting the vehicle dom obj btw.
    $('.'+license).remove();
}

function updateVehicleStatus(license, status){
    adminSocket.emit('vehicleStatusUpdated', license, status, function(){
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
        //console.log(r);
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
        let data = JSON.stringify(v);
        let DOMobject = `<div class = "col-entry ${v.license}">${v.license}</div>` + `<div class = "col-entry ${v.license}">${v.color} ${v.model}</div>`
        + `<div class = "col-entry ${v.license}">${v.miles} miles</div>`
        + `<div class = "col-entry ${v.license}">${carType}</div>`
        + `<div class = "col-entry ${v.license}"><span class="dropdown">`
        + `<button class="btn btn-primary dropdown-toggle" type="button" data-toggle="dropdown">Change Status</button>`
        + `<ul class="dropdown-menu">`
        + `<a href="#editVehicle" data-toggle="modal" data-target="#editVehicleModal" onclick = 'fillInEditModal(${data});'<li><i class="fa fa-wrench"></i> Edit Car</li></a>`
        + `<div onclick = 'deleteVehicle("${v.license}")'><li><i class="fa fa-archive"></i> Retire</li></div>`
        + `</ul></span></div>`;

        $('#current_fleet').append(DOMobject);
    }
}

function getBooleanStr(aNumber){
    if(aNumber === 1){
        return "Yes";
    } else {
        return "No";
    }
}

class Report {
    constructor(reportData){
        this.addToDOM(reportData);
    }

    addToDOM(r){
        let justification = r.justification;
        if(justification !== ''){
            justification = `<a href = "#justificationModal" class = "btn btn-large btn-primary drop-shadow" data-toggle="modal" onclick = "setJustificationModal('${r.justification}')">Click To See</a>`
        }
        let DOMobject = `<div class = "col-entry report-res-id ${r.id}">${r.id}</div>`
        + `<div class = "col-entry report-content ${r.id}">${r.report}</div>`
        + `<div class = "col-entry needs-cleaning ${r.id}">${getBooleanStr(r.needsCleaning)}</div>`
        + `<div class = "col-entry needs-service ${r.id}">${getBooleanStr(r.needsService)}</div>`
        + `<div class = "col-entry charging ${r.id}">${getBooleanStr(r.notCharging)}</div>`;

        $('#reports').append(DOMobject);
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
        if($('#licenseField').val() === "" || $('#licenseField').val() === undefined){
            window.alert("Please enter a license plate number before uploading the vehicle!")
        } else {
            let options = {
                data: {license: ""},
                success: finishedUpload
            };
            options.data.license = $("#licenseField").val();
            $(this).ajaxSubmit(options);
        }
    });
}

function finishedUpload(data){
    console.log(data);
    $('#imageFileName').val(data);
    window.alert("Image uploaded successfully!");
}

/*
 * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  CSV Export
 * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 */

// function exportUsers(){
//     adminSocket.emit('exportUsers', function(){
//
//     });
// }
function exportVehicles(){
    //adminSocket.emit('exportVehicles');
}
function exportReservations(){
    //adminSocket.emit('exportReservations');
}
function exportReports(){
    //adminSocket.emit('exportReports');
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
