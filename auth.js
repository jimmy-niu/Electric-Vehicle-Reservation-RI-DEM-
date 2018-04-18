const credentials = {
    client: {
      id: '5689926f-c6a0-4d4e-82f4-19760907d166',
      secret: 'uqlACP41#%sinnKKRW495!|'
    },
    auth: {
      tokenHost: 'https://login.microsoftonline.com',
      tokenPath: 'common/oauth2/v2.0/token',
      authorizePath: 'common/oauth2/v2.0/authorize'
    }
  };
const oauth2 = require('simple-oauth2').create(credentials);

function getAuthUrl() {
  var returnVal = oauth2.authorizationCode.authorizeURL({
    redirect_uri: process.env.REDIRECT_URI,
    scope: process.env.CLIENT_SCOPES
  });
  console.log(returnVal)
  return returnVal;
}

function getTokenFromCode(code, callback, request, response) {
  const tokenConfig = {
    code: code,
    redirect_uri: process.env.REDIRECT_URI,
    scope: process.env.CLIENT_SCOPES
  };
  oauth2.authorizationCode.getToken(tokenConfig, function (error, result) {
    if (error) {
      callback(request, response, error, null);
    }
    else {
      var token = oauth2.accessToken.create(result);
      callback(request, response, null, token);
    }
  });
}

function getEmailFromToken(id_token) {
  var token_parts = id_token.split('.');
  var encoded_token = new Buffer(token_parts[1].replace('-', '+').replace('_', '/'), 'base64');
  var decoded_token = encoded_token.toString();
  var jwt = JSON.parse(decoded_token);
  return jwt.preferred_username
}

exports.getAuthUrl = getAuthUrl;
exports.getTokenFromCode = getTokenFromCode;
exports.getEmailFromToken = getEmailFromToken;
