const { Client, GatewayIntentBits, PermissionsBitField, EmbedBuilder } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildPresences,
    ]
});

const BLACKLIST = new Set(); // Pour stocker les IDs des membres blacklistés

// Log du bot lorsqu'il est en ligne et définition du statut
client.once('ready', () => {
    console.log(`Connecté en tant que ${client.user.tag}!`);
    client.user.setPresence({
        activities: [{ name: '+help', type: 'PLAYING' }],
        status: 'online',
    });
    checkBlacklist();
});

// Fonction pour vérifier et bannir les membres blacklistés dans tous les serveurs
async function checkBlacklist() {
    for (const guild of client.guilds.cache.values()) {
        const members = await guild.members.fetch();
        for (const member of members.values()) {
            if (BLACKLIST.has(member.id)) {
                try {
                    await member.ban({ reason: 'Blacklisté' });
                    console.log(`Membre ${member.user.tag} banni du serveur ${guild.name}.`);
                } catch (err) {
                    console.error(`Erreur lors du bannissement de ${member.user.tag} : ${err}`);
                }
            }
        }
    }
}

// Commande +blacklist
client.on('messageCreate', async message => {
    if (!message.content.startsWith('+')) return; // Vérifie si la commande commence par '+'

    const args = message.content.slice(1).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (command === 'blacklist') {
        const memberPermissions = message.member.permissions;

        if (!memberPermissions.has(PermissionsBitField.Flags.BanMembers)) {
            return message.reply("Vous n'avez pas la permission d'utiliser cette commande.");
        }

        const userId = args[0];
        if (!userId) return message.channel.send('Usage: +blacklist <ID> add|remove');

        if (args[1] === 'add') {
            BLACKLIST.add(userId);
            message.channel.send(`L'utilisateur avec l'ID ${userId} a été ajouté à la liste noire.`);
            // Bannir l'utilisateur de tous les serveurs
            for (const guild of client.guilds.cache.values()) {
                const member = await guild.members.fetch(userId).catch(() => null);
                if (member) {
                    try {
                        await member.ban({ reason: 'Blacklisté' });
                        console.log(`Membre ${member.user.tag} banni du serveur ${guild.name}.`);
                    } catch (err) {
                        console.error(`Erreur lors du bannissement de ${member.user.tag} : ${err}`);
                    }
                }
            }
        } else if (args[1] === 'remove') {
            BLACKLIST.delete(userId);
            message.channel.send(`L'utilisateur avec l'ID ${userId} a été retiré de la liste noire.`);
            // Débanir l'utilisateur de tous les serveurs
            for (const guild of client.guilds.cache.values()) {
                try {
                    await guild.members.unban(userId, 'Retiré de la liste noire');
                    console.log(`Utilisateur avec l'ID ${userId} débanni du serveur ${guild.name}.`);
                } catch (err) {
                    console.error(`Erreur lors du débanissement de l'utilisateur avec l'ID ${userId} : ${err}`);
                }
            }
        } else {
            message.channel.send('Usage: +blacklist <ID> add|remove');
        }
    }

    // Commande +addrole
    if (command === 'addrole') {
        if (args.length < 2) return message.channel.send('Usage: +addrole @role @user');
        let role = message.mentions.roles.first();
        let member = message.mentions.members.first();
        if (!role || !member) return message.channel.send('Rôle ou membre invalide.');
        member.roles.add(role)
            .then(() => message.channel.send(`Rôle ${role.name} ajouté à ${member.user.tag}.`))
            .catch(err => message.channel.send('Erreur: ' + err.message));
    }

    // Commande +removerole
    if (command === 'removerole') {
        if (args.length < 2) return message.channel.send('Usage: +removerole @role @user');
        let role = message.mentions.roles.first();
        let member = message.mentions.members.first();
        if (!role || !member) return message.channel.send('Rôle ou membre invalide.');
        member.roles.remove(role)
            .then(() => message.channel.send(`Rôle ${role.name} retiré de ${member.user.tag}.`))
            .catch(err => message.channel.send('Erreur: ' + err.message));
    }

    // Commande +clear
    if (command === 'clear') {
        const amount = parseInt(args[0]);
        if (isNaN(amount) || amount <= 0) return message.channel.send('Veuillez spécifier un nombre valide de messages à supprimer.');
        await message.channel.bulkDelete(amount + 1)
            .then(() => message.channel.send(`Effacé ${amount} messages.`))
            .catch(err => message.channel.send('Erreur: ' + err.message));
    }

    // Commande +helpperms
    if (command === 'helpperms') {
        const roleId = args[0];
        if (!roleId) return message.channel.send('Usage: +helpperms <ID du rôle>');

        const role = message.guild.roles.cache.get(roleId);
        if (!role) return message.channel.send('Rôle non trouvé.');

        let availableCommands = [];

        if (role.name === 'Perm V') {
            availableCommands = [
                '+blacklist <ID> add|remove',
                '+addrole @role @user',
                '+removerole @role @user',
                '+clear <nombre>',
                '+kick @user',
                '+ban @user',
                '+mute @user',
                '+unmute @user',
                '+vocaux',
                '+userinfo @user ou ID',
                '+serverinfo'
            ];
        } else if (role.name === 'Perm IV') {
            availableCommands = [
                '+addrole @role @user',
                '+removerole @role @user',
                '+clear <nombre>',
                '+kick @user',
                '+ban @user',
                '+mute @user',
                '+unmute @user',
                '+vocaux',
                '+userinfo @user ou ID',
                '+serverinfo'
            ];
        } else if (role.name === 'Perm III') {
            availableCommands = [
                '+addrole @role @user',
                '+removerole @role @user',
                '+clear <nombre>',
                '+kick @user',
                '+ban @user',
                '+mute @user',
                '+unmute @user',
                '+vocaux',
                '+userinfo @user ou ID',
                '+serverinfo'
            ];
            availableCommands = availableCommands.filter(cmd => !['+blacklist <ID> add|remove', '+addrole @role @user', '+removerole @role @user'].includes(cmd)); // Filtrer blacklist, addrole, removerole
        } else if (role.name === 'Perm II') {
            availableCommands = [
                '+mute @user',
                '+ban @user'
            ];
        } else if (role.name === 'Perm I') {
            availableCommands = [
                '+mute @user'
            ];
        } else {
            return message.channel.send('Ce rôle n\'a pas de permissions définies.');
        }

        const embed = new EmbedBuilder()
            .setTitle(`Commandes Disponibles pour le Rôle ${role.name}`)
            .setColor('#6a0dad')  // Couleur violet
            .setDescription(availableCommands.join('\n'))
            .setTimestamp();

        message.channel.send({ embeds: [embed] });
    }

    // Commande +perm pour répertorier les rôles en chiffres romains
    if (command === 'perm') {
        const roles = message.guild.roles.cache
            .filter(role => role.name.match(/^(I|II|III|IV|V)$/))
            .sort((a, b) => a.position - b.position);

        const embed = new EmbedBuilder()
            .setTitle('Différent type de permissions')
            .setColor('#6a0dad')  // Couleur violet
            .setTimestamp();

        roles.forEach(role => {
            embed.addFields({
                name: role.name,
                value: `<@&${role.id}>`,  // Mentionne le rôle
                inline: true
            });
        });

        message.channel.send({ embeds: [embed] });
    }

    // Commande +help pour lister toutes les commandes disponibles
    if (command === 'help') {
        const embed = new EmbedBuilder()
            .setTitle('Commandes disponibles')
            .setColor('#6a0dad')  // Couleur violet
            .addFields(
                { name: '+blacklist <ID> add|remove', value: 'Ajoute ou retire un utilisateur de la liste noire.' },
                { name: '+addrole @role @user', value: 'Ajoute un rôle à un utilisateur.' },
                { name: '+removerole @role @user', value: 'Retire un rôle d’un utilisateur.' },
                { name: '+clear <nombre>', value: 'Efface un nombre spécifique de messages.' },
                { name: '+kick @user', value: 'Expulse un utilisateur du serveur.' },
                { name: '+ban @user', value: 'Bannit un utilisateur du serveur.' },
                { name: '+mute @user', value: 'Mute un utilisateur.' },
                { name: '+unmute @user', value: 'Démute un utilisateur.' },
                { name: '+vocaux', value: 'Gère les salons vocaux.' },
                { name: '+userinfo @user ou ID', value: 'Affiche les informations sur un utilisateur.' },
                { name: '+serverinfo', value: 'Affiche les informations du serveur.' },
                { name: '+helpperms <ID du rôle>', value: 'Affiche les commandes disponibles pour un rôle spécifique.' },
                { name: '+perm', value: 'Répertorie les rôles en chiffres romains.' }
            )
            .setTimestamp();

        message.channel.send({ embeds: [embed] });
    }

    // Commande +kick
    if (command === 'kick') {
        if (!message.member.permissions.has(PermissionsBitField.Flags.KickMembers)) {
            return message.reply("Vous n'avez pas la permission d'utiliser cette commande.");
        }
        const user = message.mentions.members.first();
        if (!user) return message.channel.send('Usage: +kick @user');
        user.kick()
            .then(() => message.channel.send(`L'utilisateur ${user.user.tag} a été expulsé.`))
            .catch(err => message.channel.send('Erreur: ' + err.message));
    }

    // Commande +ban
    if (command === 'ban') {
        if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
            return message.reply("Vous n'avez pas la permission d'utiliser cette commande.");
        }
        const user = message.mentions.members.first();
        if (!user) return message.channel.send('Usage: +ban @user');
        user.ban({ reason: 'Raisons non spécifiées' })
            .then(() => message.channel.send(`L'utilisateur ${user.user.tag} a été banni.`))
            .catch(err => message.channel.send('Erreur: ' + err.message));
    }

    // Commande +mute
    if (command === 'mute') {
        if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
            return message.reply("Vous n'avez pas la permission d'utiliser cette commande.");
        }
        const user = message.mentions.members.first();
        if (!user) return message.channel.send('Usage: +mute @user');
        // Exemple de mise en place du mute, vous devrez adapter cela à votre système
        const muteRole = message.guild.roles.cache.find(role => role.name === 'Muted');
        if (!muteRole) return message.channel.send('Rôle Mute non trouvé.');
        user.roles.add(muteRole)
            .then(() => message.channel.send(`L'utilisateur ${user.user.tag} a été mute.`))
            .catch(err => message.channel.send('Erreur: ' + err.message));
    }

    // Commande +unmute
    if (command === 'unmute') {
        if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
            return message.reply("Vous n'avez pas la permission d'utiliser cette commande.");
        }
        const user = message.mentions.members.first();
        if (!user) return message.channel.send('Usage: +unmute @user');
        // Exemple de mise en place du unmute, vous devrez adapter cela à votre système
        const muteRole = message.guild.roles.cache.find(role => role.name === 'Muted');
        if (!muteRole) return message.channel.send('Rôle Mute non trouvé.');
        user.roles.remove(muteRole)
            .then(() => message.channel.send(`L'utilisateur ${user.user.tag} a été unmute.`))
            .catch(err => message.channel.send('Erreur: ' + err.message));
    }

    // Commande +vocaux
    if (command === 'vocaux') {
        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
            return message.reply("Vous n'avez pas la permission d'utiliser cette commande.");
        }
        // Gestion des salons vocaux, implémentez la logique selon vos besoins
        message.channel.send('Gestion des salons vocaux.');
    }

    // Commande +userinfo
    if (command === 'userinfo') {
        const user = message.mentions.users.first() || await client.users.fetch(args[0]).catch(() => null);
        if (!user) return message.channel.send('Utilisateur non trouvé.');
        const member = message.guild.members.cache.get(user.id);
        const embed = new EmbedBuilder()
            .setTitle(`Informations sur ${user.tag}`)
            .setColor('#6a0dad')  // Couleur violet
            .addFields(
                { name: 'ID', value: user.id },
                { name: 'Nom d’utilisateur', value: user.username },
                { name: 'Discriminateur', value: user.discriminator },
                { name: 'Status', value: user.presence?.status || 'Inconnu' },
                { name: 'Rôles', value: member ? member.roles.cache.map(role => role.name).join(', ') : 'Aucun' },
                { name: 'Rejoint le serveur le', value: member ? member.joinedAt.toDateString() : 'Inconnu' }
            )
            .setTimestamp();
        message.channel.send({ embeds: [embed] });
    }

    // Commande +serverinfo
    if (command === 'serverinfo') {
        const embed = new EmbedBuilder()
            .setTitle('Informations du Serveur')
            .setColor('#6a0dad')  // Couleur violet
            .addFields(
                { name: 'Nom du Serveur', value: message.guild.name },
                { name: 'ID du Serveur', value: message.guild.id },
                { name: 'Nombre de Membres', value: message.guild.memberCount.toString() },
                { name: 'Créé le', value: message.guild.createdAt.toDateString() },
                { name: 'Propriétaire', value: `<@${message.guild.ownerId}>` }
            )
            .setTimestamp();
        message.channel.send({ embeds: [embed] });
    }
});

// Login du bot
client.login('VOTRE_TOKEN_DISCORD');
