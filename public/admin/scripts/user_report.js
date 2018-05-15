$(document).ready(function() {
    adminSocket.emit('updatePage', function(){});
    setSockets();
    bindClickHandlers();
});

/**
  * Sets the behavior on receiving users/reports related 
  * websocket messages. 
  */
function setSockets(){
    adminSocket.on('userChange', function(users, message){
        $('#users').empty();
        for(let i = 0; i < users.rowCount; i++){
            new User(users.rows[i]);
        }
    });

    adminSocket.on('reportChange', function(reports){
        console.log("we are in reportchange!");

        $('#reports').empty();
        for(let i = 0; i < reports.rowCount; i++){
            new Report(reports.rows[i]);
        }
    });

    adminSocket.on('newReport', function(report){
        for(let i = 0; i < report.rowCount; i++){
            new Report(report.rows[i]);
        }
    });
}

/**
  * Binds several click events to javascript functions.
  */
function bindClickHandlers(){
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
    
    //Set onclick to download CSVs
    $('#export-users').click(function(e){
        e.preventDefault();
        window.location.href = 'download/users';
    });


    $('#export-reports').click(function(e){
        e.preventDefault();
        window.location.href = 'download/reports';
    });
}

/**
  * modifyUser reads the value of the modify user form, which
  * shows up when modify user is clicked. This is bound to the 
  * submit of said form. 
  *
  * Once the data is read, a websocket connection is sent to the 
  * server and the users sql table is updated. 
  */
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

//======Classes for new DOM elements======//

/**
  * A Report takes a JSON object containing a report and 
  * creates a DOM object based on it, and then appends it to the
  * reports table. 
  *
  * @params
  * reportData: A json object containing a report. reportData has
  * the following values.
  *     reservation: the reservation id.
  *     report: the text content of the report. 
  *     needsCleaning: A 1/0 boolean stating whether the car 
  *         was indicated to need cleaning. 
  *     needsService: A 1/0 boolean stating whether the car 
  *         was indicated to need service. 
  *     notCharging: A 1/0 boolean stating whether the car 
  *         was indicated to be left not charging. 
  */
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

/**
  * A User takes a JSON object containing a user and 
  * creates a DOM object based on it, and then appends it to the
  * users table. 
  *
  * @params
  * userData: A json object containing a user. userData has
  * the following values.
  *     id: the unique user id.
  *     email: the email of the user. 
  *     admin: A 1/0 boolean stating whether the user has admin
  *         privledges.
  */
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
