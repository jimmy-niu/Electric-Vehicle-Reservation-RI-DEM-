const express = require('express');
const app = new express();
var querystring = require('querystring');
var fs = require('fs');
var path = require('path');

var base =
  '<head>' +
    '<title>Login: DEM Vehicle Reservation</title>' +
  '</head>' +
  '<body>' +
      '<div class="row">' + 
        '<h1>Login: DEM Vehicle Reservation</h1>' +
      '</div>' +
      '<div>' +
        '%body%' +
      '</div>' + 
  '</body>';

module.exports = {
  loginPage: function(signinUrl) {
    var html = '<a class="btn btn-outline-primary" href="' + signinUrl + '">Sign in to Outlook</a>';
    return base.replace('%body%', html);
  },
  loginCompletePage: function(userEmail) {
    if (userEmail ===  'dem_test_a@outlook.com') {
      var html = fs.readFileSync(path.join(__dirname, './admin/index.html'), "utf8");
    } else if (userEmail === 'dem_test_u@outlook.com') {
      var html = fs.readFileSync(path.join(__dirname, './user/index.html'), "utf8");
    }
    return html.replace('%user%', userEmail);
    //var html = './user/index.html';
    //console.log(html);
    //return html;
    
  }
};


function addUser(email){
    adminSocket.emit();
}

function removeUser(email){
    
}


