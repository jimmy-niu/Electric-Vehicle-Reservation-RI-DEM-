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

        'html { ' +
          'background-image: url("https://goo.gl/WLebPB");' +
          'background-position: center 10%; ' +
          'background-repeat: no-repeat;' +
        '}' +

        '#login-container { ' + 
          'background-color: rgba(255, 255, 255, .8);' +
          'width: 400px; ' +
          'height: 30vh; ' +
          'margin: auto; ' +
          'border-radius: 30px; ' +
          'padding-left: 15px; ' +
        '}' +

        '#login-container h5 {' +
          'padding: 20px 20px 0; ' +
        '}' +

        '#login-container ul {' +
          'margin-top: -20px;' +
          'margin-bottom: 30px;' +
          'font-size: 14px;' +
        '}' +

        '#outlook-btn {' +
          'text-decoration: none; ' +
          'color: white;' + 
          'font-size: 16px;' +
          'background-color: #17426D; ' +
          'padding: 10px 30px; ' +
          'border-radius: 10px;' +
          'border: 0;' +
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
    let html = '<div id="login-container">' +
    '<h5> Welcome to DEM\'s Vehicle Reservation System!</h5>' +
    '<ul><li>Reserve any of our fleet\'s vehicles</li>' +
    '<li>Edit or cancel a reservation</li>'+
    '<li>Get email notifications</li>'+
    '<li>Integrate seamlessly with Outlook Calendar</li></ul>'+
    '<div style="text-align: center;"><a id="outlook-btn" href="/auth/outlook">Sign in with Outlook</a></div>' +
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


