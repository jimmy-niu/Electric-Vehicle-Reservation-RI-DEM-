let userSocket = io.connect('http://localhost:8080/user', {forceNew: true});
// import flatpickr from "flatpickr";

let userEmail = "";

let currentCar = undefined;
let alternateVehicles = [];
let isEditing = false;


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
    $("#add-stop").click(addDestination);

    $("#add-stop-edit").click(addDestination);

    $("#resModal").on("shown.bs.modal", function () {
        google.maps.event.trigger(map, "resize");
    });

    $("#cancel-res").click(cancelReservation);
    //$("#add-stop").click(function() {addStop(); return false; });
    $("#submit-report").click(submitFeedback);

    userEmail = $("#user_email").html().replace("Welcome, ", "").replace(" <br>", "").replace("\n", "").trim();
    console.log(userEmail);

    userSocket.emit('join',userEmail, function(reservations){
        console.log("hello")
        console.log(reservations);
        //console.log(reservations.rows[0].reservations.id);
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

    userSocket.on('reservationChange', function(reservations){
        console.log("reservation change");
        $("." + idToDelete).remove();
        cleanFields();
    });

    userSocket.on('newReservation', function(vehicles, reservation, isEdit, canCarpool, carpoolUsers){
        console.log('new reservation made');
        currentCar = reservation;
        console.log(currentCar);
        currentCar.canCarpool = canCarpool;
        currentCar.carpoolUsers = carpoolUsers;
        alternateVehicles = vehicles;
        console.log(alternateVehicles)
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
            
            let stopsArray = JSON.parse(reservation.stops);
            let stop = "<ol>";
            for(let i=0; i<stopsArray.length; i++){
                stop += `<li>${stopsArray[i]}</li>`;
            }
            stop += "</ol>";
            
            $("#stopsMText").html($("#stopsMText").html() + "<br>" + stop);
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

    flatpickr(".datePicker", {
        enableTime: true,
        dateFormat: "Y-m-d H:i",
        minDate: "today",
        // defaultDate: "today",
    });

    jQuery.fn.carousel.Constructor.TRANSITION_DURATION = 5000;


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

});

function addDestination(){
    if(isEditing){
        count_edit++;
        addStopEdit(count);
        initMap(count);
    } else {
        count++;
        addStop(count);
        initMap(count);
    }
}


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
    $('#stops-edit').append(newStop);
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
        $("#carMakeMText-edit").html("<span class='reservation-label'>Car Model</span>: ");
        $("#plateNumberMText-edit").html("<span class='reservation-label'>License Plate</span>: ");
        $("#startMText-edit").html("<span class='reservation-label'>Start Time</span>: ");
        $("#endMText-edit").html("<span class='reservation-label'>End Time</span>: ");
        $("#stopsMText-edit").html("<span class='reservation-label'>Stops</span>: ");
        $("#new-stops-edit").empty();
    } else {
        $("#carMakeMText").html("<span class='reservation-label'>Car Model</span>: ");
        $("#plateNumberMText").html("<span class='reservation-label'>License Plate</span>: ");
        $("#startMText").html("<span class='reservation-label'>Start Time</span>: ");
        $("#endMText").html("<span class='reservation-label'>End Time</span>: ");
        $("#stopsMText").html("<span class='reservation-label'>Stops</span>: ");
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
        userSocket.emit('editReservation', currentCar, id, function(){
            currentCar.id = id;

            $("#start_" + id).html(currentCar.start)
            $("#end_" + id).html(currentCar.end)
            $("#stops_" + id).html(JSON.parse(currentCar.stops))
            sortReservations();
            currentCar = undefined;
            $("#reasoning-field-edit").val("");

            cleanFields();
        });
    } else {
        userSocket.emit('addReservation', currentCar, function(id){
            currentCar.id = id;

            new Reservation(currentCar);
            sortReservations();
            currentCar = undefined;
            $("#reasoning-field").val("");

            cleanFields();
        });
    }
}

function setVehicle(index){
    currentCar.license = alternateVehicles.rows[index].license;
    currentCar.model = alternateVehicles.rows[index].model;
    currentCar.image = alternateVehicles.rows[index].image;
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
            //cleanFields();
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
            //cleanFields();
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
    var bounds = new google.maps.LatLngBounds();
    var ac_sorted = Object.values(sortOnKeys(autocompletes))

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
        //2018-05-09 03:00
        //alert(end);
        var endDateString = endDate.getFullYear() + "-" + ("0"+(endDate.getMonth() + 1)).slice(-2) + "-" + ("0" + endDate.getDate()).slice(-2) + " " + ("0" + (endDate.getHours() + 6)).slice(-2) + ":" + ("0" + endDate.getMinutes()).slice(-2);
        // alert(endDateString)
        /*if (23 > 20) {
            let resData = {user: userEmail, start: endDate.toString(), end: (new Date(endDate.setHours(endDate.getHours() + 2))).toString(), stops: "", override: false, justification: "", needsTrunk: false, needsOffRoad: false, needsRack: false};
            userSocket.emit('reservation', resData, function(){

            });
        }*/
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

function fillInEditModal(data){
    isEditing = true; 

    $("#reservation-id-edit").html(data.id);
    $("#start-date-edit").val(data.start);
    $("#end-date-edit").val(data.end);

    let stopsArr = JSON.parse(data.stops)

    let numExtraStops = stopsArr.length - 3;
    if(numExtraStops > 0){
        for(let i = 0; i < numExtraStops; i++){
            addDestination();
            console.log("added")
        }
    }

    let i = 0;
    $('.route-stop-edit').each(function() {
        $(this).val(stopsArr[i]);
        i++;
    });

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

// function addIDToModal(reservationObj){
//     $("#reservation-id-edit").html(reservationObj.id);
//     idToDelete = reservationObj.id;
// }

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

    // map_edit.setZoom(15);
    // var directionsService = new google.maps.DirectionsService;
    // var directionsDisplay = new google.maps.DirectionsRenderer;
    // directionsDisplay.setMap(map_edit)

    // var waypoints = [];
    // for (var i = 1; i < ac_sorted.length - 1; i++) {
    //     waypoints.push({
    //         location: new google.maps.LatLng(ac_sorted[i].geometry.location.lat(), ac_sorted[i].geometry.location.lng()),
    //         stopover: true
    //     })
    // }
    // directionsService.route({
    //     origin: new google.maps.LatLng(ac_sorted[0].geometry.location.lat(), ac_sorted[0].geometry.location.lng()),
    //     destination: new google.maps.LatLng(ac_sorted[ac_sorted.length - 1].geometry.location.lat(), ac_sorted[ac_sorted.length - 1].geometry.location.lng()),
    //     waypoints: waypoints,
    //     travelMode: 'DRIVING'
    // }, function(response, status) {
    //     if (status === 'OK') {
    //         var totalDistance = 0;
    //         var totalDuration = 0;
    //         directionsDisplay.setDirections(response);
    //         // calculate time and distance
    //         var legs = response.routes[0].legs;
    //         for(var i = 0; i < legs.length; i++) {
    //             totalDistance += legs[i].distance.value;
    //             totalDuration += legs[i].duration.value;
    //         }
    //         $("#distanceMText-edit").html($("#distanceMText-edit").html() + (totalDistance * 0.000621371).toFixed(2) + " miles");
    //         $("#durationMText-edit").html($("#durationMText-edit").html() + (totalDuration / 60.0).toFixed(0) + " minutes");
    //     }
    // });

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

        let resData = {id: id, user: userEmail, start: start, end: end, stops: JSON.stringify(stops).split('},{').join('}, {'), override: false, justification: "", needsTrunk: trunk, needsOffRoad: offroad, needsRack: rack};
        userSocket.emit('edit', resData, function(){

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
                                + `<h5 class="card-title"><span class="card-model">${r.model}</span> <span class="card-license">${r.license}</span></h5>`
                                + `<p class="card-text"><strong>Start</strong>: <span id="start_${r.id}" class="card-start">${r.start}</span> <br>`
                                    + `<strong>End</strong>:<span id="end_${r.id}" class="card-end"> ${r.end}</span> <br>`
                                        + `<strong>Route</strong>: <span id = "stops_${r.id}">${JSON.parse(r.stops)}</span> </p>`
                                        + `<span style = "display: none;" id = "res-id">${r.id}</span>`
                                + `<a href="#" id = "${r.id}" class="btn btn-primary edit" data-toggle="modal" data-target="#editModal" onclick = 'fillInEditModal(${data});'>Edit reservation</a>`
                                + `<a href="#" id = "${r.id}" class="btn btn-secondary" data-toggle="modal" data-target="#cancelModal" onclick = "setDeleteCard(this);">Cancel</a>`
                            + `</div>`
                        + `</div>`;

        $('.cards').append(DOMobject);
        //console.log(DOMobject)
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
        let DOMobject = `<div class="card mb-3 ${r.border}" style="width: 18rem;">
                            <img class = "card-img-top" src="${imageFilePath + r.image}">
                            <div class="card-body">
                                <h5 class="card-title">${r.model} ${r.license}</h5>
                                <p class="card-text"><strong>Start</strong>: ${r.start}<br>
                                    <strong>End</strong>: ${r.end}</p>
                                    <a href="#" class="btn btn-primary edit" data-toggle="modal" data-target="#reportModal">Make report </a>
                            </div>
                        </div>`;
        $('#old-reservations').prepend(DOMobject);
    }
}


function overrideVehicle(reservationID, license, model, justification){
    userSocket.emit('vehicleOverride', reservationID, license, model, justification);
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
