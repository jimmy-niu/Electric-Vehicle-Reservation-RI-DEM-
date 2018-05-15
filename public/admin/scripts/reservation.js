$(document).ready(function() {
    adminSocket.emit('updatePage', function(){});
    setSockets();
    bindClickHandlers();
    
    // Hides the archived table on page load. 
    $("#archived_title").click();
});

/**
  * Sets the behavior on receiving reservation related messages. 
  */
function setSockets(){
    adminSocket.on('newReservation', function(reservation){
        for(let i = 0; i < reservation.rowCount; i++){
            new Reservation(reservation.rows[i], '#upcoming');
        }
    });

    adminSocket.on('loadReservations', function(reservations){
        $('#upcoming').empty();
        for(let i = 0; i < reservations.rowCount; i++){
            new Reservation(reservations.rows[i], '#upcoming');
        }
    });

    adminSocket.on('loadArchived', function(reservations){
        $('#archived').empty();
        for(let i = 0; i < reservations.rowCount; i++){
            new Reservation(reservations.rows[i], '#archived');
        }
    });

    adminSocket.on('singleArchived', function(id, status){
        if(status){
            let obj = $(`.res_id_${id}`);
            $(obj).remove();
            $("#archived").append(obj);
        } else {
            let obj = $(`.res_id_${id}`);
            $(obj).remove();
            $("#upcoming").append(obj);
        }
    });

    adminSocket.on('reservationChange', function(res_data){
        editReservation(res_data);
    });

    adminSocket.on('reservationCancellation', function(id){
        $(`.res_id_${id}`).remove();
    });
}

/**
  * Binds several click events to javascript functions.
  */
function bindClickHandlers(){
    $('#export-reservations').click(function(e){
        e.preventDefault();
        window.location.href = 'download/reservations';
    });

    $("#upcoming_title").bind("click", function(){
        toggleHidden('upcoming');
        toggleHidden('upcoming_header');
        toggleTitle(this);
    });

    $("#archived_title").bind("click", function(){
        toggleHidden('archived');
        toggleHidden('archived_header');
        toggleTitle(this);
    });
}

/**
  * Takes in the clicked archive button and toggles whether
  * the reservation is archived. This is bound to the click of the 
  * archive div / icon. 
  *
  * @param
  * The clicked reservation-archive DOM object.
  */
function archive(obj){
    let id = $(obj).attr("reservation_id");
    let archived = $(obj).attr("archived") === "true";
    $(obj).attr("archived", !archived);
    adminSocket.emit('reservationArchived', id, !archived, function(){});
}

/**
  * Creates a justification modal for a reservation entry. 
  *
  * @params
  * id: The reservation id.
  * text: The html / string that needs to go inside the modal. 
  *
  * @return 
  * A string that can be appended to the DOM to create the modal.
  */
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

/**
  * Creates a time modal for each reservation entry. 
  *
  * @params
  * id: The reservation id.
  * text: The html / string that needs to go inside the modal. 
  *
  * @return 
  * A string that can be appended to the DOM to create the modal.
  */
function getTimeModal(id, text){
    let modal = `<div id="time_modal_${id}" class="modal fade">`
    +`<div class="modal-dialog">`
    +   `<div class="modal-content">`
    +       `<div class="modal-header">`
    +           `<h3>Reservation Time</h3>`
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

/**
  * Updates a reservation within the DOM.
  *
  * @params
  * res_data: A json object containing one row that has the
  * edited reservation.
  */
function editReservation(res_data){
    let data = res_data.rows[0];
    $(`.res_id_${data.id}`).remove();
    new Reservation(data);
}

//======Classes for new DOM elements======//

/**
  * A Reservation takes a JSON object containing a reservation, 
  * creates a DOM object based on it, and then appends it to the
  * location. 
  *
  * @params
  * reservationData: A json object containing a reservation. This means
  * the following values.
  *     id: reservation id.
  *     start: reservation start time. 
  *     end: reservation end time. 
  *     user: email of reservation.
  *     model: car model of reservation.
  *     license: The car license
  *     justification: An override justification if one exists, 
  *         an empty string. 
  * 
  * location: the HTML location to append the new Reservation.  
  */
class Reservation {
    constructor(reservationData, location){
        this.addToDOM(reservationData, location);
    }

    addToDOM(r, location){
        let justification_button = "";
        let modal = "";

        let time_button = `<a href = "#time_modal_${r.id}" data-toggle="modal">${r.start} ... </a>`;
        let time_text = `<strong> Start: </strong> ${r.start} <br> <strong> End: </strong> ${r.end}`;
        let time_modal = getTimeModal(r.id, time_text);

        if(r.justification !== '' && r.justification !== null && r.justification !== undefined){
            modal = getJustificationModal(r.id, r.justification);
            justification_button = `<a href = "#justification_modal_${r.id}" class = "btn btn-large btn-primary drop-shadow" data-toggle="modal">Click To See</a>`;
        }

        let DOMobject = `<div class = "col-entry reservation-archive res_id_${r.id}" reservation_id = "${r.id}" archived = ${getBoolean(r.archived)} onclick = "archive(this)"><i class="fa fa-archive"></i></div>`
        + `<div class = "col-entry reservation-id res_id_${r.id}">${r.id}</div>`
        + `<div class = "col-entry reservation-user res_id_${r.id}">${r.user}</div>`
        + `<div class = "col-entry reservation-time res_id_${r.id}">${time_button}</div>`
        + `<div class = "col-entry carModel res_id_${r.id}">${r.model}</div>`
        + `<div class = "col-entry reservation-license res_id_${r.id}">${r.license}</div>`
        + `<div class = "col-entry reservation-pickup> res_id_${r.id}">${justification_button}</div>`
        + modal + time_modal;

        $(location).append(DOMobject);
    }
}
