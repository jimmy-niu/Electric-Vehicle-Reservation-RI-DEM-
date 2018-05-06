let userSocket = io.connect('http://localhost:8080/user', {forceNew: true});
// import flatpickr from "flatpickr";

let userEmail = "";

let currentCar = undefined;
let alternateVehicles = [];
let isEditing = false;

let reservationTimer = setInterval(function(){

}, 60000);

var count = 3;
var count_edit = 3;
var map = null;
var map_edit = null;
var autocompletes = {};
var autocompletes_edit = {};

// Sets up the sockets.
$(document).ready(function() {
    var mapOptions = {
        center: new google.maps.LatLng(41.8267, -71.3977),
        zoom: 15,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    map = new google.maps.Map(document.getElementById("mapCanvas"), mapOptions);
    map_edit = new google.maps.Map(document.getElementById("mapCanvasEdit"), mapOptions);

    if (navigator.geolocation) {
         navigator.geolocation.getCurrentPosition(function (position) {
             initialLocation = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
             map.setCenter(initialLocation);
             map_edit.setCenter(initialLocation);
         });
    }
    initMap(map);
    $("#add-stop").click(function() {
        count++;
        addStop(count);
        initMap(count);
    });

    $("#add-stop-edit").click(function() {
        count_edit++;
        addStopEdit(count);
        initMap(count);
    });

    $("#resModal").on("shown.bs.modal", function () {
        google.maps.event.trigger(map, "resize");
    });

    $("#cancel-res").click(cancelReservation);
    //$("#add-stop").click(function() {addStop(); return false; });
    $("#submit-report").click(submitFeedback);

    userEmail = $("#user_email").html().replace("Welcome, ", "").replace(" <br>", "").replace("\n", "").trim();
    console.log(userEmail);

    userSocket.emit('join',userEmail, function(reservations){
        for(var i = 0; i < reservations.rows.length; i++){
            if(Date.parse(reservations.rows[i].end) > Date.now()){
                new Reservation(reservations.rows[i]);
            } else {
                new OldReservation(reservations.rows[i]);
            }
        }
    });

    userSocket.on('reservationChange', function(reservations){
        console.log("reservation change");
        $("." + idToDelete).remove();
        cleanFields();
    });

    userSocket.on('newReservation', function(vehicles, reservation, isEdit){
        console.log('new reservation made');
        currentCar = reservation;
        alternateVehicles = vehicles;
        isEditing = isEdit;
        cleanFields();
        if(isEditing){
            $("#carMakeMText-edit").html($("#carMakeMText-edit").html() + reservation.model);
            $("#plateNumberMText-edit").html($("#plateNumberMText-edit").html() + reservation.license);
            $("#startMText-edit").html($("#startMText-edit").html() + reservation.start);
            $("#endMText-edit").html($("#endMText-edit").html() + reservation.end);
            $("#stopsMText-edit").html($("#stopsMText-edit").html() + JSON.parse(reservation.stops));
            $("#resModal-edit").modal();
        } else {
            $("#carMakeMText").html($("#carMakeMText").html() + reservation.model);
            $("#plateNumberMText").html($("#plateNumberMText").html() + reservation.license);
            $("#startMText").html($("#startMText").html() + reservation.start);
            $("#endMText").html($("#endMText").html() + reservation.end);
            $("#stopsMText").html($("#stopsMText").html() + JSON.parse(reservation.stops));
            $("#resModal").modal();
        }
    });

    userSocket.on('reservationID', function(id){
        currentCar.addClass('id');
        console.log($("." + id))
    });

    userSocket.on('reservationOverride', function(reservations){
        console.log("reservation vehicle override");
    });

    userSocket.on('alternateVehicles', function(vehicles, reservationInfo){
        alternateVehicles = vehicles;
    });

    userSocket.on('noVehicle', function(){
        if(isEditing){
            $("#messageMText-edit").html("There is no vehicle available at that time that meets your needs.");
            $('#errorModal-edit').modal();
        } else {
            $("#messageMText").html("There is no vehicle available at that time that meets your needs.");
            $('#errorModal').modal();
        }
    });

    userSocket.on('isOverlap', function(){
        if(isEditing){
            $("#messageMText-edit").html("You have an existing reservation that overlaps with the times you selected.");
            $('#errorModal-edit').modal();
        } else {
           $("#messageMText").html("You have an existing reservation that overlaps with the times you selected.");
            $('#errorModal').modal();
        }
    });

    flatpickr(".datePicker", {enableTime: true, dateFormat: "Y-m-d H:i"});
    jQuery.fn.carousel.Constructor.TRANSITION_DURATION = 5000;
});


function initMap(map) {
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

function getBoundsZoomLevel(bounds, mapDim) {
    var WORLD_DIM = { height: 256, width: 256 };
    var ZOOM_MAX = 21;

    function latRad(lat) {
        var sin = Math.sin(lat * Math.PI / 180);
        var radX2 = Math.log((1 + sin) / (1 - sin)) / 2;
        return Math.max(Math.min(radX2, Math.PI), -Math.PI) / 2;
    }

    function zoom(mapPx, worldPx, fraction) {
        return Math.floor(Math.log(mapPx / worldPx / fraction) / Math.LN2);
    }

    var ne = bounds.getNorthEast();
    var sw = bounds.getSouthWest();

    var latFraction = (latRad(ne.lat()) - latRad(sw.lat())) / Math.PI;

    var lngDiff = ne.lng() - sw.lng();
    var lngFraction = ((lngDiff < 0) ? (lngDiff + 360) : lngDiff) / 360;

    var latZoom = zoom(mapDim.height, WORLD_DIM.height, latFraction);
    var lngZoom = zoom(mapDim.width, WORLD_DIM.width, lngFraction);

    return Math.min(latZoom, lngZoom, ZOOM_MAX);
}

function addStop(count) {
    let newStop = ` <div class="form-group">
        <label>Destination <span onclick = "deleteStop(this);"
        id = "deleteX">x</span></label>
        <input type=text class="form-control route-stop" id="route-stop-` + count + `">
        </div>`
    $('#stops').append(newStop);
}

function addStopEdit(count) {
    let newStop = ` <div class="form-group">
        <label>Destination <span onclick = "deleteStop(this);"
        id = "deleteX">x</span></label>
        <input type=text class="form-control route-stop-edit" id="route-stop-` + count + `">
        </div>`
    $('#stops').append(newStop);
}

function deleteStop(obj){
    let toDelete = obj.parentNode.parentNode;
    toDelete.parentNode.removeChild(toDelete);
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

function cleanFields(){
    if(isEditing){
        console.log('clean edit')
        $("#carMakeMText-edit").html("Car Model: ");
        $("#plateNumberMText-edit").html("License Plate: ");
        $("#startMText-edit").html("Start Time: ");
        $("#endMText-edit").html("End Time: ");
        $("#stopsMText-edit").html("Stops: ");
        $("#new-stops-edit").empty();
    } else {
        $("#carMakeMText").html("Car Model: ");
        $("#plateNumberMText").html("License Plate: ");
        $("#startMText").html("Start Time: ");
        $("#endMText").html("End Time: ");
        $("#stopsMText").html("Stops: ");
        $("#new-stops").empty();
    }
}

function override(){
    if(isEditing){
        currentCar.justification = $("#reasoning-field-edit").val();
    } else{
        currentCar.justification = $("#reasoning-field").val();
    }
    currentCar.override = true;
    renderCar();
}

function renderCar(){
    if(isEditing){
        let id = $("#reservation-id-edit").html();
        console.log(id)
        userSocket.emit('editReservation', currentCar, id, function(){
            console.log('added')
            currentCar.id = id;

            $("." + idToDelete).remove();

            new Reservation(currentCar);

            currentCar = undefined;
            $("#reasoning-field-edit").val("");

            cleanFields();
        });
    } else {
        userSocket.emit('addReservation', currentCar, function(id){
            console.log('added')
            currentCar.id = id;
            new Reservation(currentCar);

            currentCar = undefined;
            $("#reasoning-field").val("");

            cleanFields();
        });
    }
}

function setVehicle(index){
    currentCar.license = alternateVehicles.rows[index].license;
    currentCar.model = alternateVehicles.rows[index].model;
}

function altVehicles(){
    if(isEditing){
        if($("#reasoning-field-edit").val().trim().length > 0){
            $("#appealModal-edit").modal('hide');
            $("#altModal-edit").modal();
            $("#justification-help-edit").addClass('d-none');

            $("#altVehiclesForm-edit").empty();
            for(let i = 0; i < alternateVehicles.rowCount; i++){
                let command = alternateVehicles.rows[i].model + " || " + alternateVehicles.rows[i].license + ` <input type = "radio" name="altVehiclesGroup-edit" onclick = "setVehicle(${i})"><br>`
                $("#altVehiclesForm-edit").append(command);
            }
            cleanFields();
        } else {
            $("#justification-help-edit").removeClass('d-none');
        }
    } else {
        if($("#reasoning-field").val().trim().length > 0){
            $("#appealModal").modal('hide');
            $("#altModal").modal();
            $("#justification-help").addClass('d-none');

            $("#altVehiclesForm").empty();
            for(let i = 0; i < alternateVehicles.rowCount; i++){
                let command = alternateVehicles.rows[i].model + " || " + alternateVehicles.rows[i].license + ` <input type = "radio" name="altVehiclesGroup" onclick = "setVehicle(${i})"><br>`
                $("#altVehiclesForm").append(command);
            }
            cleanFields();
        } else {
            $("#justification-help").removeClass('d-none');
        }
    }
}


/*function addStop() {
    console.log("we in addStop");
    let newStop = ` <div class="form-group">
<label>Destination <span onclick = "deleteStop(this);"
id = "deleteX">x</span></label>
<input type=text class="form-control route-stop">
</div>`
    $('#stops').append(newStop);
}

function deleteStop(obj){
    let toDelete = obj.parentNode.parentNode;
    toDelete.parentNode.removeChild(toDelete);
}*/

function newReservation() {
    // let user = // ???
    var totalDistance = 0;
    var totalDuration = 0;
    var bounds = new google.maps.LatLngBounds();
    var ac_sorted = Object.values(sortOnKeys(autocompletes))

    alert(ac_sorted);
    /*for (var i = 0; i < ac_sorted.length; i++) {
        /*var marker = new google.maps.Marker({
            position: ac_sorted[i].geometry.location,
            map: map,
            status: "active"
        })
        //alert(JSON.stringify(ac_sorted[key].geometry.location))
        var coords = new google.maps.LatLng(ac_sorted[i].geometry.location.lat(), ac_sorted[i].geometry.location.lng())
        bounds.extend(coords)
    }
    map.fitBounds(bounds);*/

    map.setZoom(15);
    var directionsService = new google.maps.DirectionsService;
    var directionsDisplay = new google.maps.DirectionsRenderer;
    directionsDisplay.setMap(map)

    var waypoints = [];
    for (var i = 1; i < ac_sorted.length - 1; i++) {
        waypoints.push({
            location: new google.maps.LatLng(ac_sorted[i].geometry.location.lat(), ac_sorted[i].geometry.location.lng()),
            stopover: true
        })
    }
    directionsService.route({
        origin: new google.maps.LatLng(ac_sorted[0].geometry.location.lat(), ac_sorted[0].geometry.location.lng()),
        destination: new google.maps.LatLng(ac_sorted[ac_sorted.length - 1].geometry.location.lat(), ac_sorted[ac_sorted.length - 1].geometry.location.lng()),
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

    let start = $("#start-date").val();
    let end = $("#end-date").val();

    //convert strings to Date objects
    let startDate = new Date(start);
    let endDate = new Date(end);
    //gets current date and time
    let today = new Date();

    //only makes reservation when start date is before end date, and
    //the reservation is in the present
    if(startDate >= endDate || startDate < today){
        $("#messageMText").html("The dates you entered are invalid. Please go back and try again.");
        $('#errorModal').modal();
    } else {
        let stops = [];
        $('.route-stop').each(function() {
            stops.push($(this).val());
        });

        let trunk = $("#trunk").prop('checked');
        let offroad = $("#offroading").prop('checked');
        let rack = $('#kayak').prop('checked');
        let resData = {user: userEmail, start: start, end: end, stops: JSON.stringify(stops).split('},{').join('}, {'), override: false, justification: "", needsTrunk: trunk, needsOffRoad: offroad, needsRack: rack};
        userSocket.emit('reservation', resData, function(){

        });
    }
}

function cancelReservation(){
    let start = $("." + idToDelete)[0].children[1].children[1].children[0].nextSibling.textContent.substring(2);
    let end = $("." + idToDelete)[0].children[1].children[1].children[2].nextSibling.textContent.substring(2);
    let carName = $("." + idToDelete)[0].children[1].children[0].firstChild.textContent.split(" ");
    let license = carName[carName.length - 1]
    userSocket.emit('cancel', idToDelete, userEmail, license, start, end, function(){
    });

    $("." + idToDelete).remove();
    cleanFields();
}
function cancelReservationProcess(){
    console.log(currentCar.id);
    userSocket.emit('cancel', currentCar.rows[0].id, userEmail,function(){
    });
    cleanFields();
}

function addIDToModal(reservationObj){
    $("#reservation-id-edit").html(reservationObj.id);
    idToDelete = reservationObj.id;
}

function editReservation(){
    var totalDistance = 0;
    var totalDuration = 0;
    var bounds = new google.maps.LatLngBounds();
    var ac_sorted = Object.values(sortOnKeys(autocompletes_edit))

    /*for (var i = 0; i < ac_sorted.length; i++) {
        /*var marker = new google.maps.Marker({
            position: ac_sorted[i].geometry.location,
            map: map,
            status: "active"
        })
        //alert(JSON.stringify(ac_sorted[key].geometry.location))
        var coords = new google.maps.LatLng(ac_sorted[i].geometry.location.lat(), ac_sorted[i].geometry.location.lng())
        bounds.extend(coords)
    }
    map.fitBounds(bounds);*/

    map_edit.setZoom(15);
    var directionsService = new google.maps.DirectionsService;
    var directionsDisplay = new google.maps.DirectionsRenderer;
    directionsDisplay.setMap(map_edit)

    var waypoints = [];
    for (var i = 1; i < ac_sorted.length - 1; i++) {
        waypoints.push({
            location: new google.maps.LatLng(ac_sorted[i].geometry.location.lat(), ac_sorted[i].geometry.location.lng()),
            stopover: true
        })
    }
    directionsService.route({
        origin: new google.maps.LatLng(ac_sorted[0].geometry.location.lat(), ac_sorted[0].geometry.location.lng()),
        destination: new google.maps.LatLng(ac_sorted[ac_sorted.length - 1].geometry.location.lat(), ac_sorted[ac_sorted.length - 1].geometry.location.lng()),
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

    let id =  $("#reservation-id-edit").html();
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
        $('#errorModal-edit').modal();
    } else {
        let stops = [];
        $('.route-stop-edit').each(function() {
            stops.push($(this).val());
        });

        let trunk = $("#trunk-edit").prop('checked');
        let offroad = $("#offroading-edit").prop('checked');
        let rack = $('#kayak-edit').prop('checked');

        let resData = {user: userEmail, start: start, end: end, stops: JSON.stringify(stops).split('},{').join('}, {'), override: false, justification: "", needsTrunk: trunk, needsOffRoad: offroad, needsRack: rack};
        userSocket.emit('edit', id, resData, function(){

        });
        idToDelete = id;
    }
}


function submitFeedback(reservationID){
    let report = $('#report-area').val();
    let serviceNeeded = $('#service-needed').is(":checked");
    let cleaningNeeded = $('#cleaning-needed').is(":checked");
    let notCharging = $('#not-charging').is(":checked");
    userSocket.emit('reportAdded', reservationID, report, serviceNeeded, cleaningNeeded, notCharging);
}

let idToDelete = "";
function setDeleteCard(obj){
    idToDelete = obj.id;
}

class Reservation {
    constructor(reservationData) {
        this.addToDom(reservationData);
    }
    addToDom(r) {
        let DOMobject = `<div class="card border-success mb-3 ${r.id}" style="width: 18rem;">
                            <img class = "card-img-top" src="https://upload.wikimedia.org/wikipedia/commons/5/5f/DCA_Prius_1Gen_12_2011_3592.JPG" alt="prius placeholder image">
                            <div class="card-body">
                                <h5 class="card-title">${r.model} ${r.license}</h5>
                                <p class="card-text"><strong>Start</strong>: ${r.start} <br>
                                    <strong>End</strong>: ${r.end} <br>
                                        <strong>Route</strong>: ${JSON.parse(r.stops)} </p>
                                        <span style = "display: none;" id = "res-id">${r.id}</span>
                                <a href="#" id = "${r.id}" class="btn btn-primary edit" data-toggle="modal" data-target="#editModal" onclick = "addIDToModal(this);">Edit reservation</a>
                                <a href="#" id = "${r.id}" class="btn btn-secondary" data-toggle="modal" data-target="#cancelModal" onclick = "setDeleteCard(this);">Cancel</a>
                            </div>
                        </div>`;
        $('.cards').append(DOMobject);
    }
}

class OldReservation {
    constructor(reservationData) {
        this.addToDom(reservationData);
    }
    addToDom(r) {
        let DOMobject = `<div class="card border-danger mb-3" style="width: 18rem;">
                            <img class = "card-img-top" src="https://media.ed.edmunds-media.com/ford/explorer/2017/oem/2017_ford_explorer_4dr-suv_platinum_rq_oem_1_815.jpg" alt="explorer placeholder image">
                            <div class="card-body">
                                <h5 class="card-title">${r.model} ${r.license}</h5>
                                <p class="card-text"><strong>Start</strong>: ${r.start}<br>
                                    <strong>End</strong>: ${r.end}</p>
                                    <a href="#" class="btn btn-primary edit" data-toggle="modal" data-target="#reportModal">Make report </a>
                            </div>
                        </div>`;
        $('#old-reservations').append(DOMobject);
    }
}

function overrideVehicle(reservationID, license, model, justification){
    userSocket.emit('vehicleOverride', reservationID, license, model, justification);
}
