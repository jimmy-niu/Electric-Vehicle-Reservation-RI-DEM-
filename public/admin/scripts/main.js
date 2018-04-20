let adminSocket = io.connect('http://localhost:8080/admin', {forceNew: true});

let currentReservation = 0;
let user_email = "test@gmail.com";

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
    adminSocket.on('reservationChange', function(reservations){
        console.log(reservations);
        for(let i = currentReservation; i < reservations.rowCount; i ++){
            new Reservation(reservations.rows[i]);
            currentReservation ++;
        }
    });
    adminSocket.on('vehicleChange', function(vehicles){
        console.log(vehicles);
    });
    adminSocket.on('reportChange', function(reports){
        console.log(reports);
    });
    //new Reservation({user:"blah", start:"blah", end:"blah", license:"blah", model:"blah"});
    //new Vehicle({license:"dsf", model:"blah", color:"blah", license:"blah", model:"blah"});
});


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
//    license TEXT, model TEXT, color TEXT, inService BOOLEAN, miles DOUBLE PRECISION, isEV BOOLEAN, extraTrunk BOOLEAN, offRoad BOOLEAN, equipRack BOOLEAN;
    //adminSocket.emit('vehicleAdded', vehicle);
    let license = $('#licenseField').val();
    let model = $('#modelField').val();
    let color = $('#colorField').val();
    let miles = $('#milesField').val();
    let status  = ($('#carStatusField').val() === "ev");
    let carType = $('#evStatusField').val();
    let trunk = $('#extraTrunkChoice').is(':checked');
    let offRoad = $('#offRoadChoice').is(':checked');
    let equipmentRack = $('#equipChoice').is(':checked');
    
    if(license !== '' && model !== '' && color !== ''){
        let vehicle = {license: license, model: model, color: color, miles: miles, status: status, isEv: carType, trunk: trunk, offRoad: offRoad, equipmentRack: equipmentRack};
        
        console.log(vehicle);
        adminSocket.emit("vehicleAdded", vehicle);
    }
}

function editVehicle(id, vehicle){
    adminSocket.emit('vehicleEdited', id, vehicle);
}

function removeVehicle(license){
    adminSocket.emit('vehicleRemoved', license);
    console.log(license + " removed");
}

function updateVehicleStatus(license, status){
    adminSocket.emit('vehicleStatusUpdated', license, status);
    console.log(license + "updated to " + status);
}

function removeReport(id){
    adminSocket.emit('reportRemoved', id);
    console.log(id + " removed from reports");
}

function changeUserStatus(email, admin){
    adminSocket.emit('userStatusChanged', email, admin);
    console.log(email + "set to " + admin);
}

// Objects
class Reservation {
    constructor(reservationData){
        this.addToDOM(reservationData);
    }
    addToDOM(r){
        let DOMobject = `<div class = "col-entry reservation-user">${r.user}</div>` +
            `<div class = "col-entry reservation-start">${r.start}</div>` +
            `<div class = "col-entry reservation-end">${r.start}</div>` +
            `<div class = "col-entry reservation-license">${r.license}</div>` +
            `<div class = "col-entry reservation-pickup">${r.model}</div>`;
        console.log(DOMobject);

        $('#upcoming').append(DOMobject);
    }
}

class Vehicle {
    constructor(vehicleData){
        this.addToDOM(vehicleData);
    }
    addToDOM(v){
        let DOMobject = `<div class = "col-entry vehicle-license">${v.license}</div>` +
            `<div class = "col-entry vehicle-model">${v.color} ${v.model}</div>` +
            `<div class = "col-entry vehicle-mileage">${v.mileage}</div>` +
            `<div class = "col-entry vehicle-service">${v.inService}</div>` +
            `<div class = "col-entry"><span class="dropdown">
                <button class="btn btn-primary dropdown-toggle" type="button" data-toggle="dropdown">Change Status</button>
                <ul class="dropdown-menu">
                    <a href="#"><li><i class="fa fa-wrench"></i> Service</li></a>
                    <a href="#"><li><i class="fa fa-archive"></i> Retire</li></a>
                </ul>
                </span>
            </div>`;
        $('#current_fleet').append(DOMobject);
    }
}
