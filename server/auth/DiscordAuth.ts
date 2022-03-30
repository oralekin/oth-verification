import { NextFunction, Request, Response } from 'express';
import { Profile, Scope, Strategy, VerifyCallback } from '@oauth-everything/passport-discord';
import axios, { AxiosError } from 'axios';
import { container, injectable } from "tsyringe";
import { AuthenticationClient } from "./AuthenticationClient";
import { Client } from 'discord.js';
import DiscordBot from '../DiscordBot';
import { IUser } from './IUser';
import consola from "consola";
import passport from "passport";

@injectable()
export class DiscordAuthentication extends AuthenticationClient {
    clientID = process.env.DISCORD_CLIENT_ID || '';
    clientSecret = process.env.DISCORD_CLIENT_SECRET || '';
    callbackURL = process.env.DISCORD_CALLBACK_URL || '';
    RootURL = "/discord";
    private guildId: string = process.env.DISCORD_GUILD_ID as string || '';

    constructor(scopes: Scope[]) {
        super();

        if (!this.VarsPresent())
            return;

        if (scopes.includes(Scope.GUILDS_JOIN) && this.StrIsEmpty(this.guildId)) {
            consola.error(`Cannot use scope ${Scope.GUILDS_JOIN} when no guild id present.`);
            return;
        }

        consola.info("Setting up Discord authentication routes...")

        passport.use(new Strategy({
            clientID: this.clientID,
            clientSecret: this.clientSecret,
            callbackURL: this.callbackURL,
            scope: scopes,
            passReqToCallback: true
        }, (req: Request, accessToken: string, refreshToken: string, profile: Profile, cb: VerifyCallback<any>) => {
            if (!req.user)
                return cb(new Error("User has not connected osu! account first, or cookie got lost. Check your cookie configuration for any mistakes or errors."), null);
            else {
                const o: IUser = req.user as any;

                o.discord.id = profile.id;
                o.discord.displayName = profile.username;
                o.discord.token = accessToken
                return cb(null, o);
            }
        }));

        this.AddRoutes("discord");

        consola.success("Discord authentication routes are registered.")
    }

    protected async discordJoin(user: IUser): Promise<number> {
        consola.info(`Attemptingto join ${user.discord.id!} to ${this.guildId}`);
        const client = container.resolve(Client) as DiscordBot;
        try {
            const response = await axios.put(`https://discordapp.com/api/guilds/${this.guildId}/members/${user.discord.id!}`, {
                access_token: user.discord.token!,
            }, {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bot ${process.env.DISCORD_BOT_TOKEN}`
                }
            });

            // User has joined the guild through the request
            if (response.status === 201)
                consola.success(`Joined ${user.discord.id!} to the server!`)
            // User was already in the server.
            else if (response.status === 204)
                consola.success("User already in guild");

            await client.setUpUser(user);
            return 0;
        } catch (e) {
            const error = e as AxiosError;

            if (error.response === undefined) {
                consola.error("Response error from Discord is invalid.")
                return -1;
            }

            // Apparently this means the user has reached max guild.
            // So handle like a valid response. 
            if (error.response.status === 400) {
                consola.info(`${user.discord.id!} has reached max guilds, checking if user is present in guild...`);
                const exists = await client.guildMemberExists(user.discord.id!);
                if (exists) {
                    client.setUpUser(user);
                    return 0;
                }
                else
                    return 1;
            }

            consola.error(`An error occured while trying to join ${user.discord.id!} Detailed error description: ${e}`);
            return -1;
        }
    }


    
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected callbackMiddleWare(req: Request, res: Response, next: NextFunction): void {
        
        // If this returns 0 then it's successful
        // If this returns 1 then guild member cannot join the guild (as a result of user reaching max guilds)
        // If this returns -1 then there's some fuck up between discord api and the backend
        
        
        
        const user = req.user as IUser;
        console.dir(user);
        const d = container.resolve(DiscordAuthentication) as DiscordAuthentication;
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const success = d.discordJoin(user);
        success.then(value => {
            if (value === 1)
                res.redirect('/full');
            else if (value === 0)
                res.redirect('/done')
            else
                res.redirect('/') // TODO: flash error on the frontend.
        })
    }
}
