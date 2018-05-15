//import flatpickr from "flatpickr";
let userSocket = io.connect('http://localhost:8080/user', {forceNew: true});

let userEmail = "";

//current information for reservation being made or edited
let currentReservation = undefined;
//list of alternative vehicles for current reservation
let alternateVehicles = [];
//this state indicates if user is editing or making a new reservation
let isEditing = false;


var count = 3;
var count_edit = 3;
var map = null;
var map_edit = null;
var autocompletes = {};
var autocompletes_edit = {};
var directionsDisplay = null;

jQuery.fn.carousel.Constructor.TRANSITION_DURATION = 5000;

// Sets up the sockets.
$(document).ready(function() {
    initialize(map);

    //gets user email from DOM to use when making a reservation
    userEmail = $("#user_email").html().replace("Welcome, ", "").replace(" <br>", "").replace("\n", "").trim();

    // Sets the date/time input boxes to use flatpickr
    flatpickr(".datePicker", {
        enableTime: true,
        dateFormat: "Y-m-d H:i",
        minDate: "today"
    });

    setReservationTimer();
    setClickHandlers();
    setSockets();
});

function setClickHandlers(){
    //button handlers to add more destination fields
    $("#add-stop").click(addDestination);
    $("#add-stop-edit").click(addDestination);
    
    $('#modal1').on('hidden.bs.modal', function (e) {});
    
    $("#resModal").on("shown.bs.modal", function () {
        google.maps.event.trigger(map, "resize");
    });

    //button handlers for cancel and make report
    $("#cancel-res").click(cancelReservation);
    $("#submit-report").click(submitFeedback);
}

function setReservationTimer(){
    let reservationTimer = setInterval(function(){
        let i = 0;
        while($('.upcomingReservation').get(i) !== undefined){
            let a = $('.upcomingReservation').eq(i).find('.card-end').html().toString().trim();
            let n = new Date(Date.now());
            let b = n.getFullYear() + "-" + ("0"+(n.getMonth() + 1)).slice(-2) + "-" + ("0" + n.getDate()).slice(-2) + " " + ("0" + (n.getHours())).slice(-2) + ":" + ("0" + n.getMinutes()).slice(-2);
            let border;
            if($('.upcomingReservation').eq(i).hasClass('.border-success')){
                border = 1;
            } else if($('.upcomingReservation').eq(i).hasClass('.border-danger')){
                border = 0;
            }
            if(a < b){
                let r = {model: $('.upcomingReservation').eq(i).find('.card-model').html(), license: $('.upcomingReservation').eq(i).find('.card-license').html(),
                         start: $('.upcomingReservation').eq(i).find('.card-start').html(), end: $('.upcomingReservation').eq(i).find('.card-end').html(),
                         isEV: border};
                $('.upcomingReservation').eq(i).remove();
                new OldReservation(r);

            }
            i ++;
        }
    }, 60000);
}

function setSockets(){
    //emits join event when user first loads page
    userSocket.emit('join',userEmail, function(reservations){
        //loads all upcoming and past reservations for this user
        for(var i = 0; i < reservations.rows.length; i++){
            let a = reservations.rows[i].end;
            let n = new Date(Date.now());
            let b = n.getFullYear() + "-" + ("0"+(n.getMonth() + 1)).slice(-2) + "-" + ("0" + n.getDate()).slice(-2) + " " + ("0" + (n.getHours())).slice(-2) + ":" + ("0" + n.getMinutes()).slice(-2);
            if(a >= b){
                new Reservation(reservations.rows[i]);
            } else {
                new OldReservation(reservations.rows[i]);
            }
        }
    });

    userSocket.on('reassignReservation', function(data){
        console.log("reservations reassigned");
    });

    //listens for newReservation event to be emitted by the server 
    userSocket.on('newReservation', function(vehicles, reservation, isEdit, canCarpool, carpoolUsers){
        //sets current info to the info about the new reservation
        currentReservation = reservation;

        //sets alternativeVehicles to the alternative vehicles for this new reservation 
        alternateVehicles = vehicles;

        //different text depending only whether there are any alternative vehicles
        if(alternateVehicles.rows.length === 1){
            if(isEditing){
                $("#select-alt-vehicle-edit").html("There is only one vehicle that meets your needs.");
            } else {
                console.log("one")
                $("#select-alt-vehicle").html("There is only one vehicle that meets your needs.");
            }
        } else {
            if(isEditing){
                $("#select-alt-vehicle-edit").html("Please select a vehicle.");
            } else {
                $("#select-alt-vehicle").html("Please select a vehicle.");
            }
        }

        //sets global variable isEditing to value returned by callback
        isEditing = isEdit;

        //formats stops for display
        let stopsArray = JSON.parse(reservation.stops);
        let stop = "<ol>";
        for(let i=0; i<stopsArray.length; i++){
            stop += `<li>${stopsArray[i]}</li>`;
        }
        stop += "</ol>";

        //fills in information for vehicle assignment modal
        if(isEditing){
            $("#carMakeMText-edit").html($("#carMakeMText-edit").html() + reservation.model);
            $("#plateNumberMText-edit").html($("#plateNumberMText-edit").html() + reservation.license);
            $("#startMText-edit").html($("#startMText-edit").html() + reservation.start);
            $("#endMText-edit").html($("#endMText-edit").html() + reservation.end);
            $("#stopsMText-edit").html($("#stopsMText-edit").html() + "<br>" + stop);

            //make vehicle assignment modal for edit appear
            $("#resModal-edit").modal();
        } else {
            $("#carMakeMText").html($("#carMakeMText").html() + reservation.model);
            $("#plateNumberMText").html($("#plateNumberMText").html() + reservation.license);
            $("#startMText").html($("#startMText").html() + reservation.start);
            $("#endMText").html($("#endMText").html() + reservation.end);
            $("#stopsMText").html($("#stopsMText").html() + "<br>" + stop);

            //make vehicle assignment modal appear
            $("#resModal").modal(); 
        }
    });

    //listens for server to emit noVehicle event
    //there are no eligible vehicles for the inputted reservation criteria
    userSocket.on('noVehicle', function(){
        if(isEditing){
            $("#messageMText-edit").html("There is no vehicle available at that time that meets your needs.");
            $('#errorModal-edit').modal(); //pops up error modal with new text
        } else {
            $("#messageMText").html("There is no vehicle available at that time that meets your needs.");
            $('#errorModal').modal(); //pops up error modal with new text
        }
    });

    //listens for server to emit isOverlap event
    //dates inputted overlap with an upcoming reservation of the same user
    userSocket.on('isOverlap', function(){
        if(isEditing){
            $("#messageMText-edit").html("You have an existing reservation that overlaps with the times you selected.");
            $('#errorModal-edit').modal(); //pops up error modal with new text
        } else {
            $("#messageMText").html("You have an existing reservation that overlaps with the times you selected.");
            $('#errorModal').modal(); //pops up error modal with new text
        }
    });
}

function addDestination(){
    if(isEditing){
        count_edit++;
        addStopEdit(count);
        initializeListeners();
    } else {
        count++;
        addStop(count);
        initializeListeners();
    }
}


function initialize() {
    var mapOptions = {
        center: new google.maps.LatLng(41.8267, -71.3977),
        zoom: 15,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    map = new google.maps.Map(document.getElementById("mapCanvas"), mapOptions);
    map_edit = new google.maps.Map(document.getElementById("mapCanvasEdit"), mapOptions);

    directionsDisplay = new google.maps.DirectionsRenderer;

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {
            initialLocation = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
            map.setCenter(initialLocation);
            map_edit.setCenter(initialLocation);
        });
    }

    initializeListeners();
}

function initializeListeners() {
    var i;
    var inputs = document.getElementsByClassName('route-stop');
    var inputs_edit = document.getElementsByClassName('route-stop-edit');
    for (i = 0; i < inputs.length; i++) {
        var autocomplete = new google.maps.places.Autocomplete(inputs[i]);
        autocomplete.inputId = inputs[i].id;

        autocomplete.addListener('place_changed', function() {
            var place = this.getPlace();
            //alert(place.formatted_address)
            //alert(this.inputId)
            autocompletes[this.inputId] = place;
        })
    }
    for (i = 0; i < inputs_edit.length; i++) {
        var autocomplete = new google.maps.places.Autocomplete(inputs_edit[i]);
        autocomplete.inputId = inputs_edit[i].id;

        autocomplete.addListener('place_changed', function() {
            var place = this.getPlace();
            //alert(place.formatted_address)
            //alert(this.inputId)
            autocompletes_edit[this.inputId] = place;
        })
    }
}

function addStop(count) {
    let newStop = ` <div class="form-group">
<label>Destination <span onclick = "deleteStop(this);"
id = "deleteX">x</span></label>
<input type=text class="form-control route-stop" id="route-stop-` + count + `">
</div>`
    $('#new-stops').append(newStop);
}

function addStopEdit(count) {
    let newStop = ` <div class="form-group">
<label>Destination <span onclick = "deleteStop(this);"
id = "deleteX">x</span></label>
<input type=text class="form-control route-stop-edit" id="route-stop-` + count + `-edit">
</div>`
    $('#stops-edit').append(newStop);
}

function deleteStop(obj){
    count--;
    count_edit--;
    let toDelete = obj.parentNode.parentNode;
    console.log(toDelete.children[1].id); //.replace(`${obj}`));
    delete autocompletes[toDelete.children[1].id];
    $(toDelete).remove();
}

function sortOnKeys(dict) {
    var sorted = [];
    for(var key in dict) {
        sorted[sorted.length] = key;
    }
    sorted.sort();
    var tempDict = {};
    for(var i = 0; i < sorted.length; i++) {
        tempDict[sorted[i]] = dict[sorted[i]];
    }
    return tempDict;
}

/**
 * This function gets the information the user inputted and send it to the back end for
 * vehicle assigment.
 */
function newReservation() {
    var bounds = new google.maps.LatLngBounds();
    var ac_sorted = Object.values(sortOnKeys(autocompletes));
    var directionsService = new google.maps.DirectionsService;
    directionsDisplay.setMap(map);

    var waypoints = [];
    for (var i = 1; i < ac_sorted.length; i++) {
        if (i != 2) {
            waypoints.push({
                location: new google.maps.LatLng(ac_sorted[i].geometry.location.lat(), ac_sorted[i].geometry.location.lng()),
                stopover: true
            });
        }
    }
    directionsService.route({
        origin: new google.maps.LatLng(ac_sorted[0].geometry.location.lat(), ac_sorted[0].geometry.location.lng()),
        destination: new google.maps.LatLng(ac_sorted[2].geometry.location.lat(), ac_sorted[2].geometry.location.lng()),
        waypoints: waypoints,
        travelMode: 'DRIVING'
    }, function(response, status) {
        if (status === 'OK') {
            var totalDistance = 0;
            var totalDuration = 0;
            directionsDisplay.setDirections(response);
            // calculate time and distance
            var legs = response.routes[0].legs;
            for(var i = 0; i < legs.length; i++) {
                totalDistance += legs[i].distance.value;
                totalDuration += legs[i].duration.value;
            }
            $("#distanceMText").html($("#distanceMText").html() + (totalDistance * 0.000621371).toFixed(2) + " miles");
            $("#durationMText").html($("#durationMText").html() + (totalDuration / 60.0).toFixed(0) + " minutes");
        }
    });

    //gets user inputted date/time
    let start = $("#start-date").val();
    let end = $("#end-date").val();

    //convert strings to Date objects
    let startDate = new Date(Date.parse(start));
    let endDate = new Date(Date.parse(end));
    let cooldownEnd = new Date(Date.parse(end));
    cooldownEnd.setHours(endDate.getHours() + 2);
    //alert(end);
    //alert(Date.parse(end + "-"));
    //gets current date and time
    let today = new Date();

    //only makes reservation when start date is before end date, and
    //the reservation is in the present
    if(startDate >= endDate || startDate < today){
        $("#messageMText").html("The dates you entered are invalid. Please go back and try again.");
        $('#errorModal').modal(); //pops up error modal with new text
    } else {
        //creates an array of the user inputted stops
        let stops = [];
        $('.route-stop').each(function() {
            stops.push($(this).val());
        });

        //gets extra feature info inputted by user
        let trunk = $("#trunk").prop('checked');
        let offroad = $("#offroading").prop('checked');
        let rack = $('#kayak').prop('checked');

        //makes JSON object with data from user
        let resData = {user: userEmail, start: start, end: end, stops: JSON.stringify(stops).split('},{').join('}, {'), override: false, justification: "", needsTrunk: trunk, needsOffRoad: offroad, needsRack: rack};
        //sends data to back end for vehicle assignment
        userSocket.emit('reservation', resData);
        let cooldown = {user: null, start: end, end: end, stops: null, override: false, justification: "", needsTrunk: false, needsOffRoad: false, needsRack: false};
        ///userSocket.emit('reservation', cooldown);
    }
}

/**
 * This function populates the fields in the edit modal with the current values for the
 * reservation.
 * @params
 * id: the id of the reservation user is editing
 */
function fillInEditModal(id){
    isEditing = true; 

    let data = JSON.parse($("#res_data_" + id).html());

    let start = data.start;
    let end = data.end;
    let stops = data.stops;

    $("#reservation-id-edit").html(id);
    $("#start-date-edit").val(start);
    $("#end-date-edit").val(end);

    let stopsArr = JSON.parse(stops);

    let numExtraStops = stopsArr.length - 3;
    if(numExtraStops > 0){
        for(let i = 0; i < numExtraStops; i++){
            addDestination();
            console.log("added")
        }
    }

    let i = 0;
    /*$('.route-stop-edit').each(function() {
        $(this).val(stopsArr[i]);
        i++;
    });*/

    if(data.needsTrunk == 1){
        $('#trunk-edit').prop("checked", true);
    } else {
        $('#trunk-edit').prop("checked", false);
    }

    if(data.needsOffRoad == 1){
        $('#offroading-edit').prop("checked", true);
    } else {
        $('#offroading-edit').prop("checked", false);
    }

    if(data.needsRack == 1){
        $('#kayak-edit').prop("checked", true);
    } else {
        $('#kayak-edit').prop("checked", false);
    }
}

/*
 * This function gets the user inputted values for editing the reservation and sends them
 * to the back end for vehicle (re)-assignment.
 */
function editReservation() {
    var totalDistance = 0;
    var totalDuration = 0;
    var bounds = new google.maps.LatLngBounds();
    var ac_sorted = Object.values(sortOnKeys(autocompletes_edit));
    var directionsService = new google.maps.DirectionsService;
    directionsDisplay.setMap(map_edit);

    var waypoints = [];
    for (var i = 1; i < ac_sorted.length; i++) {
        if (i != 2) {
            waypoints.push({
                location: new google.maps.LatLng(ac_sorted[i].geometry.location.lat(), ac_sorted[i].geometry.location.lng()),
                stopover: true
            });
        }
    }
    directionsService.route({
        origin: new google.maps.LatLng(ac_sorted[0].geometry.location.lat(), ac_sorted[0].geometry.location.lng()),
        destination: new google.maps.LatLng(ac_sorted[2].geometry.location.lat(), ac_sorted[2].geometry.location.lng()),
        waypoints: waypoints,
        travelMode: 'DRIVING'
    }, function(response, status) {
        if (status === 'OK') {
            var totalDistance = 0;
            var totalDuration = 0;
            directionsDisplay.setDirections(response);
            // calculate time and distance
            var legs = response.routes[0].legs;
            for(var i = 0; i < legs.length; i++) {
                totalDistance += legs[i].distance.value;
                totalDuration += legs[i].duration.value;
            }
            $("#distanceMText-edit").html($("#distanceMText-edit").html() + (totalDistance * 0.000621371).toFixed(2) + " miles");
            $("#durationMText-edit").html($("#durationMText-edit").html() + (totalDuration / 60.0).toFixed(0) + " minutes");
        }
    });

    //gets id from modal
    let id =  $("#reservation-id-edit").html();

    //gets user inputted date/time
    let start = $("#start-date-edit").val();
    let end = $("#end-date-edit").val();

    //convert strings to Date objects
    let startDate = new Date(start);
    let endDate = new Date(end);
    //gets current date and time
    let today = new Date();

    //only makes reservation when start date is before end date, and
    //the reservation is in the present
    if(startDate >= endDate || startDate < today){
        $("#messageMText-edit").html("The dates you entered are invalid. Please go back and try again.");
        $('#errorModal-edit').modal(); //pops up error modal with new text
    } else {
        //creates an array from the user inputted destinations
        let stops = [];
        $('.route-stop-edit').each(function() {
            stops.push($(this).val());
        });

        //gets extra feature info from the checkboxes
        let trunk = $("#trunk-edit").prop('checked');
        let offroad = $("#offroading-edit").prop('checked');
        let rack = $('#kayak-edit').prop('checked');

        //makes JSON object with updated reservation info and send it to the back end
        let resData = {id: id, user: userEmail, start: start, end: end, stops: JSON.stringify(stops).split('},{').join('}, {'), override: false, justification: "", needsTrunk: trunk, needsOffRoad: offroad, needsRack: rack};
        userSocket.emit('edit', resData);
    }
}

/**
 * This function sends the reservation details to the back end so the reservation can be 
 * added to the database, and displays the reservation card on the front end.
 */
function renderCar(){
    if(isEditing){
        //gets id so database knows which reservation to update
        let id = $("#reservation-id-edit").html();
        //sends updated information to the back end
        userSocket.emit('editReservation', currentReservation, id, function(){
            currentReservation.id = id;

            //updates reservation card
            $("#start_" + id).html(currentReservation.start)
            $("#end_" + id).html(currentReservation.end)
            $("#stops_" + id).html(JSON.parse(currentReservation.stops))
            $("#model_" + id).html(currentReservation.model);
            $("#license_" + id).html(currentReservation.license);
            $("#res_data_" + id).html(JSON.stringify(currentReservation));

            sortReservations();

            $("#reasoning-field-edit").val("");

            cleanFields();

            carpoolAlert(currentReservation.user, currentReservation.canCarpool, currentReservation.carpoolUsers);

            currentReservation = undefined;
        });
    } else {
        //sends new reservation information to the backend
        userSocket.emit('addReservation', currentReservation, function(id){
            currentReservation.id = id;

            //makes a new reservation object and displays the card
            new Reservation(currentReservation);
            sortReservations();

            $("#reasoning-field").val("");

            cleanFields();

            carpoolAlert(currentReservation.user, currentReservation.canCarpool, currentReservation.carpoolUsers);

            currentReservation = undefined;
        });
    }
}

/*
 * This function pops up an alert for the user if their reservation is at the same time and
 * has the same route as someone else's reservation. 
 * @params
 * user: the user who is making/editing the current reservation
 * canCarpool: true if there exists other users the user can carpool with for this reservation
 * carpoolUsers: list of users with reservations at same time, traveling the same route
 */
function carpoolAlert(user, canCarpool, carpoolUsers){
    if(canCarpool){
        $("#carpoolUsersList").empty();
        for(let i = 0; i < carpoolUsers.length; i++){
            if (carpoolUsers[i] != user){
                $("#carpoolUsersList").append("<li class = 'list-group-item'>" + carpoolUsers[i] + "</li>");
            }
        }
        $("#carpoolModal").modal(); //displays carpool alert modal with list of potential carpool companions
    }
}

/*
 * This function is called if the user clicked the confirm alternative vehicle button, 
 * therefore overriding their originally assigned vehicle.
 */
function override(){
    //saves justification so it can be sent to back end
    if(isEditing){
        currentReservation.justification = $("#reasoning-field-edit").val();
    } else{
        currentReservation.justification = $("#reasoning-field").val();
    }
    //sets to true so back end knows its an override
    currentReservation.override = true;
    //display reservation card and send information to back end
    renderCar();
}

/*
 * This function is called when the user selects an alternative vehicle. It updates the current 
 * reservation to contain this new information. 
 * @params
 * index: the index in the list alternativeVehicles of the car the user chose
 */
function setVehicle(index){
    currentReservation.license = alternateVehicles.rows[index].license;
    currentReservation.model = alternateVehicles.rows[index].model;
    currentReservation.image = alternateVehicles.rows[index].image;
}

/*
 * This function validates the justification input, populates the list of alternative vehicles,
 * and makes the modal with that list appear.
 */
function altVehicles(){
    if(isEditing){
        //checks if user wrote some text in the justification field
        if($("#reasoning-field-edit").val().trim().length > 0){
            //hides appeal modal and shows list of alt vehicles
            $("#appealModal-edit").modal('hide');
            $("#altModal-edit").modal();
            $("#justification-help-edit").addClass('d-none');

            //populates list of alt vehicles
            $("#altVehiclesForm-edit").empty();
            for(let i = 0; i < alternateVehicles.rowCount; i++){
                let command = alternateVehicles.rows[i].model + " || " + alternateVehicles.rows[i].license + ` <input type = "radio" name="altVehiclesGroup-edit" onclick = "setVehicle(${i})"><br>`
                $("#altVehiclesForm-edit").append(command);
            }
        } else {
            //shows text alerting the user they must enter a justification
            $("#justification-help-edit").removeClass('d-none');
        }
    } else {
        //checks if user wrote some text in the justification field
        if($("#reasoning-field").val().trim().length > 0){
            //hides appeal modal and shows list of alt vehicles
            $("#appealModal").modal('hide');
            $("#altModal").modal();
            $("#justification-help").addClass('d-none');

            //populates list of alt vehicles
            $("#altVehiclesForm").empty();
            for(let i = 0; i < alternateVehicles.rowCount; i++){
                let command = alternateVehicles.rows[i].model + " || " + alternateVehicles.rows[i].license + ` <input type = "radio" name="altVehiclesGroup" onclick = "setVehicle(${i})"><br>`
                $("#altVehiclesForm").append(command);
            }
        } else {
            //shows text alerting the user they must enter a justification
            $("#justification-help").removeClass('d-none');
        }
    }
}

/**
 * This function is called when the user presses the 'yes, cancel my reservation' button;
 * it cancels the reservation, removing it visually and from the database.
 */
function cancelReservation(){
    //gets id from cancel confirmation modal
    let id = $("#cancelres_id").html();

    //gets reservation info from reservation card
    let start = $("#start_" + id).html();
    let end = $("#end_" + id).html();
    let model = $("#model_" + id).html();
    let license = $("#license_" + id).html();

    //tells back end to remove the reservation from the database
    userSocket.emit('cancel', id, userEmail, model, license, start, end);

    //visually removed the reservation card
    $("." + id).remove();

    cleanFields();
}

/**
 * This function stores the reservation id in the cancel confirmation modal so it can be
 * used in the cancelReservation() function.
 * @params
 * id: the id of the reservation staged for cancellation
 */
function setCancelID(id){
    $("#cancelres_id").html(id);
}

/**
 * This function gets the user input from the report modal and sends it to the back end.
 * @params
 * id: the id of the reservation the report is about
 */
function submitFeedback(id){
    let report = $('#report-area').val();
    let serviceNeeded = $('#service-needed').is(":checked");
    let cleaningNeeded = $('#cleaning-needed').is(":checked");
    let notCharging = $('#not-charging').is(":checked");
    userSocket.emit('reportAdded', id, report, serviceNeeded, cleaningNeeded, notCharging);
}

/**
 * This function is called when the make report button is pressed, so it clears the text
 * box in the modal before it appears.
 */
function clearReportModal(){
    $('#report-area').val("");
}

function sortReservations(){
    var cards = $('.cards');
    var reservations = $('.upcomingReservation');
    console.log(reservations);
    reservations.sort(function(a,b){
        var an = $(a).find('.card-end').html().toString().trim();
        var bn = $(b).find('.card-end').html().toString().trim();

        if(an > bn) {
            return 1;
        }
        if(an < bn) {
            return -1;
        }
        return 0;
    });

    reservations.detach().appendTo(cards);
}

/*
 * This function clears the modal fields so that the data doesn't persist between discrete
 * actions.
 */
function cleanFields(){
    if(isEditing){
        console.log('clean edit')
        $("#carMakeMText-edit").html("<span class='reservation-label'>Car Model</span>: ");
        $("#plateNumberMText-edit").html("<span class='reservation-label'>License Plate</span>: ");
        $("#startMText-edit").html("<span class='reservation-label'>Start Time</span>: ");
        $("#endMText-edit").html("<span class='reservation-label'>End Time</span>: ");
        $("#stopsMText-edit").html("<span class='reservation-label'>Stops</span>: ");

        $("#distanceMText").html(`<span class="reservation-label">Total distance</span>: `);
        $("#durationMText").html(`<span class="reservation-label">Total duration</span>: `);

        $("#new-stops-edit").empty();
    } else {
        $("#carMakeMText").html("<span class='reservation-label'>Car Model</span>: ");
        $("#plateNumberMText").html("<span class='reservation-label'>License Plate</span>: ");
        $("#startMText").html("<span class='reservation-label'>Start Time</span>: ");
        $("#endMText").html("<span class='reservation-label'>End Time</span>: ");
        $("#stopsMText").html("<span class='reservation-label'>Stops</span>: ");

        $("#distanceMText").html(`<span class="reservation-label">Total distance</span>: `);
        $("#durationMText").html(`<span class="reservation-label">Total duration</span>: `);

        $("#newReservationBody")
            .find("input,textarea,select")
            .val('')
            .end()
            .find("input[type=checkbox], input[type=radio]")
            .prop("checked", "")
            .end();
        $("#new-stops").empty();
    }
    autocompletes = {};
}

class Reservation {

    constructor(reservationData) {

        if(reservationData.isEV == true){
            reservationData.border = "border-success";
        } else {
            reservationData.border = "border-danger";
        }
        console.log(reservationData);
        this.addToDom(reservationData);

    }
    addToDom(r) {
        let data = JSON.stringify(r);
        //console.log(r.id)
        let imageFilePath = "./media/vehicle_images/"
        let DOMobject = `<div class="card ${r.border} mb-3 ${r.id} upcomingReservation" style="width: 18rem;">`
        + `<img class = "card-img-top" src="${imageFilePath + r.image}">`
        + `<div class="card-body">`
        + `<h5 class="card-title"><span id="model_${r.id}" class="card-model">${r.model}</span> <span id="license_${r.id}" class="card-license">${r.license}</span></h5>`
        + `<p class="card-text"><strong>Start</strong>: <span id="start_${r.id}" class="card-start">${r.start}</span> <br>`
        + `<strong>End</strong>:<span id="end_${r.id}" class="card-end">${r.end}</span> <br>`
        + `<strong>Route</strong>: <span id = "stops_${r.id}">${JSON.parse(r.stops)}</span> </p>`
        + `<span style = "display: none;" id = "res_data_${r.id}">${data}</span>`
        + `<a href="#" class="btn btn-primary edit" data-toggle="modal" data-target="#editModal" onclick = 'fillInEditModal(${r.id});'>Edit reservation</a>`
        + `<a href="#" class="btn btn-secondary" data-toggle="modal" data-target="#cancelModal" onclick = "setCancelID(${r.id});">Cancel</a>`
        + `</div>`
        + `</div>`;
        $('.cards').append(DOMobject);
    }
}

class OldReservation {
    constructor(reservationData) {
        if(reservationData.isEV == true){
            reservationData.border = "border-success";
        } else {
            reservationData.border = "border-danger";
        }
        this.addToDom(reservationData);
    }
    addToDom(r) {
        let imageFilePath = "./media/vehicle_images/";
        let DOMobject = `<div class="card mb-3 ${r.border}" style="width: 18rem;">`
        + `<img class = "card-img-top" src="${imageFilePath + r.image}">`
        + `<div class="card-body">`
        + `<h5 class="card-title">${r.model} ${r.license}</h5>`
        + `<p class="card-text"><strong>Start</strong>: ${r.start}<br>`
        + `<strong>End</strong>: ${r.end}</p>`
        + `<a href="#" class="btn btn-primary edit" data-toggle="modal" data-target="#reportModal" onclick = "clearReportModal()">Make report </a>`
        + `</div>`
        + `</div>`;
        $('#old-reservations').prepend(DOMobject);
    }
}