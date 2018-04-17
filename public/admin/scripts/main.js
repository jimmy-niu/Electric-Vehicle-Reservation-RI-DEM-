let socket = io.connect();

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
    socket.on('newReservation', function(reservations){
        console.log(reservations);
    });

    socket.emit('reservation', {user: "duck", license: "13245", startTime: Date.now(), endTime: "6361", stops: [1, 2, 3, 4, 5], override: true, justification: "my oranges fell into the river."});
});