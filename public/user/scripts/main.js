let userSocket = io.connect('http://localhost:8080/user', {forceNew: true});

// Sets up the sockets.
$(document).ready(function() {
    $("#submit-res").click(newReservation);
});

function newReservation(){
    console.log("pressed");
    userSocket.emit('reservation', {user: "Jimmy Niu", license: "13245", startTime: "6932", endTime: "6361", stops: ["home", "work"], override: true, justification: "my oranges fell into the river."});
}