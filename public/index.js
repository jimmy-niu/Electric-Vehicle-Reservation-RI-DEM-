const express = require('express');
const app = new express();
let querystring = require('querystring');
let fs = require('fs');
let path = require('path');

// Login page for application
let base =
  '<head>' +
    '<title>Login: DEM Vehicle Reservation</title>' +
    '<style>' +
        'body{' +
            'font-family: sans-serif;' +
            'margin: 0px;' +
        '}' +
    
        // Header for login page
        '.header{' +
            'display: flex;' +
            'justify-content: space-between;' +
            'align-items: flex-end; ' +
            'background-color: #17426D;' +
            'padding: 2vh 2vw 2vh 2vw;' +
        '}' +
    
        // DEM logo and page title
        '#first-part{' +
           'display: flex;' +
            'justify-content: flex-start;'+
            'align-items: flex-end;' +
        '}' +

        // Background image for login page
        'html { ' +
          'background-image: url("https://goo.gl/WLebPB");' +
          'background-position: center 10%; ' +
          'background-repeat: no-repeat;' +
        '}' +

        // Container for login information
        '#login-container { ' + 
          'background-color: rgba(255, 255, 255, .8);' +
          'width: 30vw; ' +
          'max-height: 50vh; ' +
          'overflow: auto;' +
          'margin: auto; ' +
          'border-radius: 30px; ' +
          'padding: 1vh 2vw 5vh 2vw;' + 
        '}' +

        // Welcome styling
        `#login-container h5{
            text-align: center;
        }` +

        // Bulleted list styling
        '#login-container ul {' +
          'margin-top: -20px;' +
          'margin-bottom: 30px;' +
          'font-size: 14px;' +
        '}' +

        // Signin button
        `#outlook-btn { 
          text-decoration: none; 
          text-align: center;
          background-color: #17426D; 
          color: white;
          padding: 1vh 2vw 1vh 2vw;
          border-radius: 10px;
          width: 50%;
          margin: 0 auto;
          cursor: pointer;
        }` +

        // Logo styling
        '#logo{ height: 8vh; padding-right: 1vw; }' +

        // Title styling
        '#title{ font-size: 5vh; color: white; }' +
    
    '</style>' +
  '</head>' +
  '<body>' +
  // Header of login page
    '<div class = "header drop-shadow">' +
            // DEM logo and title
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
    // Container for login information
    let html = '<div id="login-container">' +
    '<h5> Welcome to DEM\'s Vehicle Reservation System!</h5>' +
    '<ul><li>Reserve any of our fleet\'s vehicles</li>' +
    '<li>Edit or cancel a reservation</li>'+
    '<li>Get email notifications</li>'+
    '<li>Integrate seamlessly with Outlook Calendar</li></ul>'+
    `<div id="outlook-btn" onclick="window.location = '/auth/outlook'">Sign in with Outlook</div>` +
    '</div>';
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


