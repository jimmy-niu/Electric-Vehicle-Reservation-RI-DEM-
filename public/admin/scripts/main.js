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
