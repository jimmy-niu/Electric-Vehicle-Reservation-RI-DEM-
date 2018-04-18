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

    let newVehicle = {license:'EDU-1324', model:'Honda Civic', color:'Red', inService: 'TRUE', miles: 2.0};
    addVehicle(newVehicle);
    requestVehicles();
    removeVehicle('EDU-1324');
    requestVehicles();
    //Syncing issues?
});


function addVehicle(vehicle){
    adminSocket.emit('addVehicle', vehicle);
}

function editVehicle(id, vehicle){
    adminSocket.emit('editVehicle', id, vehicle);
}

function removeVehicle(license){
    adminSocket.emit('removeVehicle', license);
}

function updateVehicleStatus(license, status){
    adminSocket.emit('updateVehicleStatus', license, status);
}

function requestReports(){
    adminSocket.emit('requestReports', function(data){
        console.log(data);
    });
}

function requestSpecificReports(){
    adminSocket.emit('requestSpecificReports', reservation, function(data){
        console.log(data);
    });
}
function requestVehicles(){
    adminSocket.emit('requestVehicles', function(data){
        console.log(data);
    });
}
