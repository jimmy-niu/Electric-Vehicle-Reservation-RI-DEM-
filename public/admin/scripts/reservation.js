$(document).ready(function() {
    adminSocket.emit('updatePage', function(){});
    
    adminSocket.on('newReservation', function(reservation){
            for(let i = 0; i < reservation.rowCount; i++){
                new Reservation(reservation.rows[i]);
            }
        });

    adminSocket.on('loadReservations', function(reservations){
        $('#upcoming').empty();
        console.log(reservations);
        for(let i = 0; i < reservations.rowCount; i++){
            new Reservation(reservations.rows[i]);
        }
    });
    
    adminSocket.on('reservationChange', function(res_data){
        console.log("in resChange");
        console.log(res_data);
    });
    
    adminSocket.on('reservationCancellation', function(id){
        $(`.res_id_${id}`).remove();
    });
    
    bindClickHandlers2();
});

function bindClickHandlers2(){
    $('#export-reservations').click(function(e){
        e.preventDefault();
        window.location.href = 'download/reservations';
    });
    
    $("#upcoming_title").bind("click", function(){
        toggleHidden('upcoming');
        toggleHidden('upcoming_header');
        toggleTitle(this);
    });
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

class Reservation {
    constructor(reservationData){
        this.addToDOM(reservationData);
    }
    addToDOM(r){
        let justification_button = "";
        let modal = "";

        if(r.justification !== '' && r.justification !== null && r.justification !== undefined){
            modal = getJustificationModal(r.id, r.justification);

            justification_button = `<a href = "#justification_modal_${r.id}" class = "btn btn-large btn-primary drop-shadow" data-toggle="modal">Click To See</a>`;
        }


        //console.log(r);
        let DOMobject = `<div class = "col-entry reservation-id res_id_${r.id}">${r.id}</div>`
        +`<div class = "col-entry reservation-user res_id_${r.id}">${r.user}</div>`
        + `<div class = "col-entry reservation-start res_id_${r.id}">${r.start}</div>`
        + `<div class = "col-entry reservation-end res_id_${r.id}">${r.end}</div>`
        + `<div class = "col-entry carModel res_id_${r.id}">${r.model}</div>`
        + `<div class = "col-entry reservation-license res_id_${r.id}">${r.license}</div>`
        + `<div class = "col-entry reservation-pickup> res_id_${r.id}">${justification_button}</div>`
        + modal;

        $('#upcoming').append(DOMobject);
    }
}
