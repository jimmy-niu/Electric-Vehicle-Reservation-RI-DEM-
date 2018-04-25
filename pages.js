var querystring = require('querystring');

var baseHtml = '<html>' +
  '<head>' +
    '<meta content="IE=edge" http-equiv="X-UA-Compatible">' +
    '<meta charset="utf-8">' +
    '<title>%title%</title>'  +
    '<link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.1.0/css/bootstrap.min.css" integrity="sha384-9gVQ4dYFwwWSjIDZnLEWnxCjeSWFphJiwGPXr1jddIhOegiu1FwO5qRGvFXOdJZ4" crossorigin="anonymous">' +
  '</head>' +
  '<body>' +
    '<div id="main-content" class="container">' +
      '<div class="row">' + 
        '<h1>outlook sync</h1>' +
      '</div>' +
      '<divclass="row">' +
        '%body%' +
      '</div>' + 
    '</div>' + 
  '</body>' +
'</html>';

var buttonRow = '<div class="row">' +
  '<div id="user-email">Signed in as: %email%</div>' +
  '</div>' +
  '<div class="row">' +
    '<div class="col-sm">' +
      '<a class="btn btn-secondary btn-sm" href="/sync">Sync calendar</a>' +
    '</div>' +
    '<div class="col-sm">' +
      '<a class="btn btn-secondary btn-sm" href="/addevent">Add event</a>' +
    '</div>' +
    '<div class="col-sm">' +
      '<a class="btn btn-secondary btn-sm" href="/logout">Logout</a>' +
    '</div>' +
  '</div>';
  
function extractId(change) {
  return change.id.match(/'([^']+)'/)[1];
}

function getViewItemLink(change) {
  if (change.reason && change.reason === 'deleted') {
    return '';
  }
  var link = '<a href="/viewevent?';
  link += querystring.stringify({ id: change.Id });
  link += '">View Item</a>';
  return link;
}

module.exports = {
  loginPage: function(signinUrl) {
    var html = '<a class="btn btn-outline-primary" href="' + signinUrl + '">Sign in to Outlook</a>';
    return baseHtml.replace('%title%', 'Login').replace('%body%', html);
  },
  
  loginCompletePage: function(userEmail) {
    var html = '<div class="container">';
    html += buttonRow.replace('%email%', userEmail);
    html += '</div>';
    
    return baseHtml.replace('%title%', 'Main').replace('%body%', html);
  },
  
  syncPage: function(userEmail, changes) {
    var html = '<div class="container">';
    html += buttonRow.replace('%email%', userEmail);
    
    html += '<div class="row"><div>Events</div><table class="table">';
    if (changes && changes.length > 0) {
      changes.forEach(function(change){
        var changeType = (change.reason && change.reason === 'deleted') ? 'Delete' : 'Add/Update';
        var detail = (changeType === 'Delete') ? extractId(change) : change.Subject;
        html += '<tr><td>' + detail + '</td><td>' + getViewItemLink(change) + '</td><tr>';
      });
    }
    
    html += '  </table></div>';

    return baseHtml.replace('%title%', 'Sync').replace('%body%', html);
  },
  
  itemDetailPage: function(userEmail, event) {
    var html = '<div class="container">';
    html += buttonRow.replace('%email%', userEmail);
    
    html += '<form action="/updateevent" method="get">';
    
    html += '<input name="eventId" type="hidden" value="' + event.Id + '"/>';
    
    html += '<div id="event-subject" class="row">';
    html += '    <div class="form-group">';
    html += '      <label class="col-2 col-form-label">Subject</label>';
    html += '      <div class="col-sm-12">'
    html += '       <input name = "subject" class="form-control" value="' + event.Subject + '"/>';
    html += '      </div>';
    html += '    </div>';
    html += '</div>';
    
    html += '<div id="event-subject" class="row">';
    html += '    <div class="form-group">';
    html += '      <label class="col-2 col-form-label">Location</label>';
    html += '      <div class="col-sm-12">'
    html += '       <input name="location" class="form-control" value="' + event.Location.DisplayName + '"/>';
    html += '      </div>';
    html += '    </div>';
    html += '</div>';

    html += '<div id="event-subject" class="row">';
    html += '    <div class="form-group">';
    html += '      <label class="col-2 col-form-label">Start</label>';
    html += '      <div class="col-sm-12">'
    html += '       <input class="form-control" value="' + new Date(event.Start.DateTime).toString() + '" disabled>';
    html += '      </div>';
    html += '    </div>';
    html += '</div>';

    html += '<div id="event-subject" class="row">';
    html += '    <div class="form-group">';
    html += '      <label class="col-2 col-form-label">End</label>';
    html += '      <div class="col-sm-12">'
    html += '       <input class="form-control" value="' + new Date(event.End.DateTime).toString() + '" disabled>';
    html += '      </div>';
    html += '    </div>';
    html += '</div>';
    
    html += '<div id="action-buttons" class="row">';
    html += '  <div class="col-sm-6">';
    html += '    <input type="submit" class="btn btn-outline-primary" value="Update item"/>';
    html += '  </div>';
    html += '  <div class="col-sm-6">';
    html += '    <a class="btn btn-danger" href="/deleteevent?' + querystring.stringify({ id: event.Id }) + '">Delete item</a>';
    html += '  </div>';
    html += '</div>';
    html += '</form>';
    
    return baseHtml.replace('%title%', event.Subject).replace('%body%', html);
  }
};