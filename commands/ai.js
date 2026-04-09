import 'dotenv/config'

export default {
    data: {
        name: 'ai',
        description: 'Prompts the ai'
    },
    execute: async (interaction) => {
        const client = interaction.client;
        if (!client.AIBot.allowedUsers.includes(interaction.sender)) {
            return client.sendText(interaction.room, 'You dont have access to this bot.');
        }
        client.sendText(interaction.room, 'Your command has been queued.');
        return client.queue.add(interaction);
    }
};