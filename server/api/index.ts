import { Request, Response, Router } from "express";
import { autoInjectable, singleton } from "tsyringe";
import Configuration from "../Configuration";

@singleton()
@autoInjectable()
export default class ApiRouting {
    public readonly router: Router = Router();
    public dbConnected = false;
    public configPath = '';
    private tournament: Configuration;
    private roles: string[] = [];

    constructor(config?: Configuration) {
        this.addRoutes();
        if (config === undefined)
            throw new Error("Configuration file not injected");
        this.tournament = config;
        this.roles = [this.tournament.config.discord.role.name]
    }

    private addRoutes() {

        this.router.get('/discord-roles', async (req: Request, res: Response) => {
            res.send(this.roles);
        })
    }
}
