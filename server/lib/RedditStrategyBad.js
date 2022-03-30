const OAuth2Strategy = require("passport-oauth2");
const InternalOAuthError = OAuth2Strategy.InternalOAuthError;

class RedditStrategy extends OAuth2Strategy {

    constructor(options, verify) {
        options = options;
        options.customHeaders = options.customHeaders || {};
        options.authorizationURL = options.authorizationURL || 'https://www.reddit.com/api/v1/authorize';
        options.tokenURL = options.tokenURL || 'https://www.reddit.com/api/v1/access_token';
        options.scopeSeparator = options.scopeSeparator || ' ';

        super(options, verify)

        this._oauth2.useAuthorizationHeaderforGET(true); 
        this.name = "reddit";

        this._oauth2.getOAuthAccessToken = function getOAuthAccessToken(code, params, callback) {
            var params = params || {};
            params.type= 'web_server';
            var codeParam = (params.grant_type === 'refresh_token') ? 'refresh_token' : 'code';
            params[codeParam]= code;
    
            var post_data= (new URLSearchParams(params)).toString();
            var authorization = "Basic " + Buffer.from("" + this._clientId + ":" + this._clientSecret).toString('base64');
            var post_headers= {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization' : authorization
            };
    
            this._request("POST", this._getAccessTokenUrl(), post_headers, post_data, null, function(error, data, response) {
                if( error )  callback(error);
                else {
                    var results = JSON.parse( data );
                    var access_token = results.access_token;
                    var refresh_token = results.refresh_token;
                    delete results.refresh_token;
                    callback(null, access_token, refresh_token, results); // callback results =-=
                }
            });
        }
    
    }

    userProfile(accessToken, done) {
        this._oauth2.get('https://oauth.reddit.com/api/v1/me', accessToken, (err, body) => {
            if (err || body instanceof Buffer || body === undefined) 
                return done(new InternalOAuthError('Failed to fetch the user profile.', err))
            try {
                const json = JSON.parse(body);
                const parsedData = {
                    _raw: body,
                    _json: json,
                    provider: "reddit",
                    id: json.id,
                    name: json.name
                }
                return done(null, parsedData);
            }
            catch (e) {
                return done(new InternalOAuthError('Failed to parse the user profile.', e));
            }
        });
    }

    authorizationParams(options) {
        return { duration: "temporary" };
    }
}

module.exports = RedditStrategy