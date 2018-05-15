$(document).ready(function() {
    adminSocket.emit('updatePage', function(){});
    
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

    $('#export-users').click(function(e){
        e.preventDefault();
        window.location.href = 'download/users';
    });

    
    $('#export-reports').click(function(e){
        e.preventDefault();
        window.location.href = 'download/reports';
    });

    bindClickHandlers();
});

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
