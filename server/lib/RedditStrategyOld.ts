import OAuth2Strategy, { InternalOAuthError } from 'passport-oauth2';
import { OutgoingHttpHeaders } from 'http';
import passport from 'passport';
import { IRedditProfile } from './IRedditProfile';


export default class RedditStrategy extends OAuth2Strategy {

    constructor(options: StrategyOptions | StrategyOptionsWithRequest, verify: OAuth2Strategy.VerifyFunction | OAuth2Strategy.VerifyFunctionWithRequest) {
        options = options;
        options.customHeaders = options.customHeaders || {};
        options.authorizationURL = options.authorizationURL || 'https://www.reddit.com/api/v1/authorize';
        options.tokenURL = options.tokenURL || 'https://www.reddit.com/api/v1/access_token';
        options.scopeSeparator = options.scopeSeparator || ' ';

        if (options.type === "StrategyOptions") 
            super(options as OAuth2Strategy.StrategyOptions, verify as OAuth2Strategy.VerifyFunction);
         else 
            super(options as OAuth2Strategy.StrategyOptionsWithRequest, verify as OAuth2Strategy.VerifyFunctionWithRequest);

        this._oauth2.useAuthorizationHeaderforGET(true); 
        this.name = "reddit";

        /* this._oauth2.getOAuthAccessToken = function getOAuthAccessToken(code: any, params: any, callback?: any) {
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
    
            this._request("POST", this._getAccessTokenUrl(), post_headers, post_data, null, function(error: any, data: any, response: any) {
                if( error )  callback(error);
                else {
                    var results = JSON.parse( data );
                    var access_token = results.access_token;
                    var refresh_token = results.refresh_token;
                    delete results.refresh_token;
                    callback(null, access_token, refresh_token, results); // callback results =-=
                }
            });
        }; */
    }

    userProfile(accessToken: string, done: (err?: Error | null, profile?: PassportProfile) => void): void {
        this._oauth2.get('https://oauth.reddit.com/api/v1/me', accessToken, (err, body) => {
            if (err || body instanceof Buffer || body === undefined) 
                return done(new InternalOAuthError('Failed to fetch the user profile.', err))

            try {
                const json = JSON.parse(body) as IRedditProfile;
                const parsedData: PassportProfile = {
                    _raw: body,
                    _json: json,
                    provider: "reddit",
/*                     id: json.id,
                    name: json.name
 */                }
                return done(null, parsedData);
            }
            catch (e) {
                return done(new InternalOAuthError('Failed to parse the user profile.', e));
            }
        });
    }

    authorizationParams(options: any): object {
        return { duration: "temporary" };
    }
}

export interface StrategyOption extends passport.AuthenticateOptions {
    clientID: string;
    clientSecret: string;
    callbackURL: string;

    scope?: string[];
    userAgent?: string;
    state?: string;

    authorizationURL?: string;
    tokenURL?: string;
    scopeSeparator?: string;
    customHeaders?: OutgoingHttpHeaders;
    
    duration?: "temporary" | "permanent";
}

export type OAuth2StrategyOptionsWithoutRequiredURLs = Pick<
    OAuth2Strategy._StrategyOptionsBase,
    Exclude<keyof OAuth2Strategy._StrategyOptionsBase, 'authorizationURL' | 'tokenURL'>
>;

export interface _StrategyOptionsBase extends OAuth2StrategyOptionsWithoutRequiredURLs {
    clientID: string;
    clientSecret: string;
    callbackURL: string;
    
    scope?: string[];
    userAgent?: string;
    state?: boolean;

    authorizationURL?: string;
    tokenURL?: string;
    scopeSeparator?: string;
    customHeaders?: OutgoingHttpHeaders;

}

export interface StrategyOptions extends _StrategyOptionsBase {
    type: 'StrategyOptions';
    passReqToCallback?: false;
}

export interface StrategyOptionsWithRequest extends _StrategyOptionsBase {
    type: 'StrategyOptionsWithRequest';
    passReqToCallback: true;
}

export interface PassportProfile {
    _raw: string;
    _json: any;
    provider: string;
}
