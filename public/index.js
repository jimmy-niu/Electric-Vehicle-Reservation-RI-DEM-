const express = require('express');
const app = new express();
let querystring = require('querystring');
let fs = require('fs');
let path = require('path');

let base =
  '<head>' +
    '<title>Login: DEM Vehicle Reservation</title>' +
    '<style>' +
        'body{' +
            'font-family: sans-serif;' +
            'background-color: white;' +
            'margin: 0px;' +
        '}' +
    
        '.header{' +
            'display: flex;' +
            'justify-content: space-between;' +
            'align-items: flex-end; ' +
            'background-color: #17426D;' +
            'padding: 2vh 2vw 2vh 2vw;' +
        '}' +
    
        '#first-part{' +
           'display: flex;' +
            'justify-content: flex-start;'+
            'align-items: flex-end;' +
        '}' +


        '#logo{ height: 8vh; padding-right: 1vw; }' +

        '#title{ font-size: 5vh; color: white; }' +
    
    '</style>' +
  '</head>' +
  '<body>' +
    '<div class = "header drop-shadow">' +
            '<div id = "first-part">' +
                '<img id = "logo" src = "http://www.dem.ri.gov/assets/agency-template/img/ri-dem-logo.png">' +
                '<div id = "title" >' +
                    '<span style = "font-size: 7vh;">V</span>ehicle Reservation Login ' +
                '</div>' +
            '</div>' +
    '</div>' +
      '<div style = "padding: 5vh 2vw 5vh 2vw; font-size: 3vh;">' +
        '%body%' +
      '</div>' + 
  '</body>';

module.exports = {
  loginPage: function(signinUrl) {
    let html = '<a class="btn btn-outline-primary" href="' + signinUrl + '">Sign in to Outlook</a>';
    return base.replace('%body%', html);
  },
  loginPagePassport: function() {
    let html = '<a class="btn btn-outline-primary" href="/auth/outlook">Sign in to Outlook</a>';
    return base.replace('%body%', html);
  },
  loginCompletePage: function(userEmail) {
    if (userEmail ===  'dem_test_a@outlook.com') {
      let html = fs.readFileSync(path.join(__dirname, './admin/index.html'), "utf8");
    } else if (userEmail === 'dem_test_u@outlook.com') {
      let html = fs.readFileSync(path.join(__dirname, './user/index.html'), "utf8");
    }
    return html.replace('dem_test_u@outlook.com', userEmail);
    //let html = './user/index.html';
    //console.log(html);
    //return html;
    
  }
};


