

export default {
    data: {
        name: 'cancel',
        description: 'Cancels all your prompts.'
    },
    execute: async (interaction) => {
        const client = interaction.client;
        if (!client.AIBot.allowedUsers.includes(interaction.sender)) {
            return client.sendText(interaction.room, 'You dont have access to this bot.');
        }
        const messageAuthor = interaction.sender;
        const room = interaction.room;

        if (!client.AIBot.requests[messageAuthor]) {
            client.AIBot.requests[messageAuthor] = [];
            return client.sendText(room, 'No requests found.');
        }
        Object.keys(client.AIBot.requests[messageAuthor]).forEach(function (requestId) {
            client.AIBot.requests[messageAuthor][requestId].abort();
        })
        return await client.sendText(room, 'All requests have been cancelled.');
    }
}