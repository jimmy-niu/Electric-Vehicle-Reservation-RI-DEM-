let adminSocket = io.connect('http://localhost:8080/admin', {forceNew: true});

function toggle_hidden(id, object){
    if(object.innerHTML.includes("▼")){
        object.innerHTML = object.innerHTML.replace("▼", "▲");
    } else {
        object.innerHTML = object.innerHTML.replace("▲", "▼");
    }
    console.log(document.getElementById(id));
    console.log(object.innerHTML);
    document.getElementById(id).classList.toggle('hidden');
}


// Sets up the sockets.
$(document).ready(function() {
    adminSocket.on('reservationChange', function(reservations){
        console.log(reservations);
    });
    adminSocket.on('vehicleChange', function(vehicles){
        console.log(vehicles);
    });
    adminSocket.on('reportChange', function(reports){
        console.log(reports);
    });

    let newVehicle = {license:'Blah', model:'Honda Civic', color:'Red', inService: 'TRUE', miles: 2.0};
    editVehicle(15, newVehicle);
});


function addVehicle(vehicle){
    adminSocket.emit('vehicleAdded', vehicle);
}

function editVehicle(id, vehicle){
    adminSocket.emit('vehicleEdited', id, vehicle);
}

function removeVehicle(license){
    adminSocket.emit('vehicleRemoved', license);
}

function updateVehicleStatus(license, status){
    adminSocket.emit('vehicleStatusUpdated', license, status);
}

function removeReport(id){
    adminSocket.emit('reportRemoved', id);
}

function addAdmin(email){
    adminSocket.emit('adminAdded', email);
}
function removeAdmin(email){
    adminSocket.emit('adminRemoved', email);
}
