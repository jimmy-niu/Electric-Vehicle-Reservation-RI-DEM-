let adminSocket = io.connect('http://localhost:8080/admin', {forceNew: true});
let currentVehicle = 0;

// Sets up the sockets.
$(document).ready(function() {
    adminSocket.emit('updatePage', function(){
        // Callback
    });

    adminSocket.on('userChange', function(users, message){
        $('#users').empty();
        for(let i = 0; i < users.rowCount; i++){
            new User(users.rows[i]);
        }
    });

    adminSocket.on('newReservation', function(reservation){
        for(let i = 0; i < reservation.rowCount; i++){
            new Reservation(reservation.rows[i]);
        }
    });

    adminSocket.on('reservationChange', function(reservations){
        $('#upcoming').empty();
        console.log(reservations);
        for(let i = 0; i < reservations.rowCount; i++){
            new Reservation(reservations.rows[i]);
        }
    });

    adminSocket.on('reportChange', function(reports){
        console.log("we are in reportchange!");

        $('#reports').empty();
        for(let i = 0; i < reports.rowCount; i++){
            new Report(reports.rows[i]);
        }
    });


    $('#export-users').click(function(e){
        e.preventDefault();
        window.location.href = 'download/users';
    });

    $('#export-reservations').click(function(e){
        e.preventDefault();
        window.location.href = 'download/reservations';
    });

    $('#export-reports').click(function(e){
        e.preventDefault();
        window.location.href = 'download/reports';
    });

    setUploader();
    bindClickHandlers();
});

function bindClickHandlers(){
    $("#upcoming_title").bind("click", function(){
        toggleHidden('upcoming');
        toggleHidden('upcoming_header');
        toggleTitle(this);
    });

    $("#report_title").bind("click", function(){
        toggleHidden('report_header');
        toggleHidden('reports');
        toggleTitle(this);
    });

    $("#user_title").bind("click", function(){
        toggleHidden('user_header');
        toggleHidden('users');
        toggleTitle(this);
    });
}

function toggleHidden(id){
    document.getElementById(id).classList.toggle('hidden');
}

function toggleTitle(object){
    let content = object.innerHTML;
    if(content.includes("▼")){
        object.innerHTML = content.replace("▼", "▲");
    } else {
        object.innerHTML = content.replace("▲", "▼");
    }
}

function clearForms(obj){
    obj.trigger("reset");
}

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

    if(email != undefined && isAdd != undefined){
        if(isAdd  && isAdmin != undefined){
            adminSocket.emit('userAdded', email, isAdmin);
        } else {
            adminSocket.emit('userRemoved', email);
        }
    }
    clearForms($('#userForm'));
}




function getJustificationModal(id, text){
    let modal = `<div id="justification_modal_${id}" class="modal fade">`
    +`<div class="modal-dialog">`
    +   `<div class="modal-content">`
    +       `<div class="modal-header">`
    +           `<h3>Override Justification</h3>`
    +           `<button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>`
    +       `</div>`
    +       `<div class="modal-body"> ${text} </div>`
    +       `<div class="modal-footer">`
    +            `<button type="button" class="btn btn-default" data-dismiss="modal">Close</button>`
    +         `</div>`
    +      `</div>`
    +   `</div>`
    +`</div>`;
    return modal;
}

/*
 * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  Classes used to make dom objects.
 * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 */
class Reservation {
    constructor(reservationData){
        this.addToDOM(reservationData);
    }
    addToDOM(r){
        let justification_button = "";
        let modal = "";

        if(r.justification !== '' && r.justification !== null && r.justification !== undefined){
            modal = getJustificationModal(r.license, r.justification);

            justification_button = `<a href = "#justification_modal_${r.license}" class = "btn btn-large btn-primary drop-shadow" data-toggle="modal">Click To See</a>`;
        }


        //console.log(r);
        let DOMobject = `<div class = "col-entry reservation-id ${r.license}">${r.id}</div>`
        +`<div class = "col-entry reservation-user ${r.license}">${r.user}</div>`
        + `<div class = "col-entry reservation-start ${r.license}">${r.start}</div>`
        + `<div class = "col-entry reservation-end ${r.license}">${r.end}</div>`
        + `<div class = "col-entry carModel ${r.license}">${r.model}</div>`
        + `<div class = "col-entry reservation-license ${r.license}">${r.license}</div>`
        + `<div class = "col-entry reservation-pickup> ${r.license}">${justification_button}</div>`
        + modal;

        $('#upcoming').append(DOMobject);
    }
}


class Report {
    constructor(reportData){
        this.addToDOM(reportData);
        console.log(reportData);
    }

    addToDOM(r){
        let DOMobject = `<div class = "col-entry report-res-id ${r.id}">${r.reservation}</div>`
        + `<div class = "col-entry report-content ${r.id}">${r.report}</div>`
        + `<div class = "col-entry needs-cleaning ${r.id}">${getBooleanStr(r.needsCleaning)}</div>`
        + `<div class = "col-entry needs-service ${r.id}">${getBooleanStr(r.needsService)}</div>`
        + `<div class = "col-entry charging ${r.id}">${getBooleanStr(r.notCharging)}</div>`;
        $('#reports').append(DOMobject);
    }
}

class User {
    constructor(userData){
        this.addToDOM(userData);
    }

    addToDOM(r){
        let DOMobject = `<div class = "col-entry ${r.id}">${r.email}</div>`
        + `<div class = "col-entry ${r.id}">${getBooleanStr(r.admin)}</div>`
        $('#users').append(DOMobject);
    }
}

function getBooleanStr(aNumber){
    if(aNumber === 1){
        return "Yes";
    } else {
        return "No";
    }
}

/*
 * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  Functions below are not currently wired up.
 * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 */
function removeReport(id){
    adminSocket.emit('reportRemoved', id);
}

function changeUserStatus(email, admin){
    adminSocket.emit('userStatusChanged', email, admin);
}
