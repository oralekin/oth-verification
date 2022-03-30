export interface ITournamentRole {
    id: string;
    name: string;
}

export interface ITournamentConfig {
    discord: {
        guildId: string;
        welcomeChannelId: string;
        ownerId: string;
        role: ITournamentRole;
    }
    domains: string[];
    dev: {
        https: boolean
    }
}