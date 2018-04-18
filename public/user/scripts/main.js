let userSocket = io.connect('http://localhost:8080/user', {forceNew: true});

// Sets up the sockets.
$(document).ready(function() {
    $("#submit-res").click(newReservation);

    adminSocket.on('reservationChange', function(reservations){
        updateReservations(reservations);
        console.log(reservations);
    });
});

function newReservation(){
    console.log("pressed");
    userSocket.emit('reservation', {user: "Jimmy Niu", license: "13245", startTime: "6932", endTime: "6361", stops: ["home", "work"], override: true, justification: "my oranges fell into the river."});
}

function editReservation(){
    userSocket.emit('edit', {user: "Jimmy Niu", license: "19087", startTime: "6932", endTime: "6361", stops: ["home", "work"], override: false, justification: ""});
}

//need to figure out current and past
function updateReservations(){

}

function cancelReservation(){
    userSocket.emit('cancel', reservationID);
}

function submitFeedback(){
    userSocket.emit('reportAdded', reservationID, report);
}