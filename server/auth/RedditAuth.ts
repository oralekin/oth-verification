import { NextFunction, Request, Response } from 'express';
import { AuthenticationClient } from "./AuthenticationClient";
import { DateTime } from "luxon";
import { IUser } from "./IUser";
import consola from "consola";
import { injectable } from "tsyringe";
import passport from "passport";
import RedditStrategy from '../lib/RedditStrategyBad';

@injectable()
export class RedditAuthentication extends AuthenticationClient {
    protected clientID: string = process.env.REDDIT_CLIENT_ID || '';
    protected clientSecret: string = process.env.REDDIT_CLIENT_SECRET || '';
    protected callbackURL: string = process.env.REDDIT_CALLBACK_URL || '';
    RootURL = "/reddit";

    constructor() {
        super();

        if (!this.VarsPresent())
            return;

        consola.info("Setting up Reddit authentication routes...");

        passport.use(new RedditStrategy({
            type: 'StrategyOptionsWithRequest',
            clientID: this.clientID,
            clientSecret: this.clientSecret,
            callbackURL: this.callbackURL,
            passReqToCallback: true,
            scope: ["identity"],
            state: false
        }, (req: Request, _accessToken: string, _refreshToken: string, profile: any, cb: any) => {
            if (!req.user)
                return cb(new Error("User has not connected osu! account first, or cookie got lost. Check your cookie configuration for any mistakes or errors."), null);
            else {
                const o: IUser = req.user as any;


                o.reddit.id = profile.id; 
                o.reddit.name = profile.name;
                o.reddit.joinDate = DateTime.fromMillis(profile._json.created);

                return cb(null, o);
            }
        }));

        this.AddRoutes("reddit");

        consola.success("Reddit authentication routes are registered.")
    }
    
    // You can insert your own method of checking here if you're familiar with TypeScript.
    // Alternatively you can remove everything in the body and just keep: res.redirect('/checks/discord');
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected callbackMiddleWare(req: Request, res: Response, next: NextFunction): void {
        
        const aprilFools = DateTime.fromISO("2012-04-01T00:00:00-04");
        const u = req.user as IUser;
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const userJoinDate = u.reddit.joinDate!;

        // User is allowed to join the discord, so go to verification.
        if (aprilFools > userJoinDate) 
            res.redirect('/auth/discord');
        // User failed verification so we redirect somewhere else for manual intervention or can customise the error.
         else {
            u.failureReason = "Reddit account is not made before r/place started";
            consola.info(`${u.reddit.name} joined on ${userJoinDate} needs manual verification.`)
            res.redirect('/checks/manual');
        }
    }
}
