import { Client, Guild, GuildMember, Intents, Message, MessageEmbed, TextChannel } from 'discord.js';
import { autoInjectable, singleton } from 'tsyringe';
import Configuration from './Configuration';
import { ITournamentConfig } from './config.interface';
import consola from 'consola';
import { IUser } from './auth/IUser';

// const ALLOWED_ROLE = process.env.DISCORD_STAFF_ROLE!;

@singleton()
@autoInjectable()
export default class DiscordBot extends Client {
    private tourneyConfig: ITournamentConfig;
    constructor(config?: Configuration) {
        super({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_MESSAGES], partials: ['USER'] });

        if (!config)
            throw new Error("Configuration file not successfully injected.");
        
        this.tourneyConfig = config.config;

        this.once('ready', () => {
            console.log(`/r/osuplace bot is ready`);

            (this.user!).setActivity("go to o.ralek.in to verify")
        });

        this.on('userVerified', async (user: IUser, member: GuildMember) => {
            try {

                const guild = this.guilds.cache.get(this.tourneyConfig.discord.guildId)!;
                const channelId = this.tourneyConfig.discord.welcomeChannelId;
                const channel = guild.channels.cache.get(channelId) as TextChannel;

                
                channel.send(`${member} was verified as <https://osu.ppy.sh/users/${user.osu.id!}> and <https://reddit.com/u/${user.reddit.name}>`)
            } catch (e) {
                consola.error(e);
            }
        });

/*         this.on("messageCreate", (m: Message) => {
            console.log("message from " + m.author.username)
            console.log("has the role: " + (m.member!).roles.cache.has(ALLOWED_ROLE) )
            if ((m.guild) && (m.member!).roles.cache.has(ALLOWED_ROLE) && m.content.startsWith("!uinfo ")) {
                const infoUser = (m.guild!).members.cache.get(m.content.slice(7))
                if (!infoUser) {
                    m.reply("user with id " + m.content.slice(7) + " not found");
                    return;
                }

                infoUser!;

                m.reply({embeds: [
                    new MessageEmbed()
                        .setColor("#ff66aa")
                        .setTitle('user info')
                        .setAuthor({ name: 'osuplace bot' })
                        .addFields(
                            { name: 'username', value: infoUser.displayName + "(" + infoUser.user.username + "#" + infoUser.user.discriminator + ")" },
                            { name: 'joined discord at', value: infoUser.joinedAt ? infoUser.user.createdAt.toISOString() : "not in server" },
                            { name: 'joined server at', value: infoUser.joinedAt ? infoUser.joinedAt.toISOString() : "not in server" },
                            { name: "roles", value: infoUser.roles.cache.reduce((prev, val) => prev + ", " + val.name, "")},
                            )
                    
                ]});
            }
        })

 */        this.login(process.env.DISCORD_BOT_TOKEN)
    }

    public async setUpUser(user: IUser): Promise<void> {
        try {
            const guildMember = await this.findGuildMember(user.discord.id!);

            let nickname = `/u/${user.reddit.name}`
            nickname = nickname.length > 32 ? (nickname.slice(0,31) + "…") : nickname;

            await this.changeNickName(nickname, guildMember);
            consola.success(`Added ${nickname} nickname to ${user.discord.id!}.`)
            
            const role = this.tourneyConfig.discord.role;

            consola.info(`Adding ${role.id} role to ${nickname}...`);
            if (!guildMember.roles.cache.has(role.id)) {
                guildMember.roles.add(role.id);
                this.emit('userVerified', user, guildMember);
            }

        } catch(e) {
            console.error(e);
        }
    }

    private async findGuildMember(userId: string) {
        const guild = this.guilds.cache.get(this.tourneyConfig.discord.guildId);

        if (guild === undefined)
            throw new Error("Invalid guild. Bot is likely not joined to the correct guild.");

        await guild.members.fetch();
        const guildMember = guild.members.cache.get(userId);

        if (guildMember === undefined) {
            consola.info(`Guild member ${userId} not found, moving on...`);
            throw new Error("Member not found!");
        }

        return guildMember;
    }

    public async guildMemberExists(userId: string): Promise<boolean> {
        try {
            const guildMember = await this.findGuildMember(userId);
            if (guildMember !== null)
                return true;
            else
                return false;
        } catch(e) {
            consola.error(e);
            return false;
        }
    }

    private async changeNickName(nickname: string, member: GuildMember) {
        try {
            await member.setNickname(nickname, "Changed nickname to osu! username");
        } catch (e) {
            // We will silence this error to the parent function running this so it can continue.
            consola.error(e);
        }
    }
}
