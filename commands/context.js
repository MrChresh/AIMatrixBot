

export default {
    data: {
        name: 'context',
        description: 'Basically clear your personal chat history.'
    },
    execute: async (interaction) => {
        const client = interaction.client;
        if (!client.AIBot.allowedUsers.includes(interaction.sender)) {
            return client.sendText(interaction.room, 'You dont have access to this bot.');
        }
        const messageAuthor = interaction.sender;
        const room = interaction.room;

        client.AIBot.Messages[messageAuthor] = null;
        return client.sendText(room, 'Context has been cleared');
    }
}