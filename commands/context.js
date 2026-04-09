

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
        client.sendText(interaction.room, 'Your command has been queued.');
        return client.queue.add(interaction);
    }
}