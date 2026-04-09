export class context {
    async execute(interaction) {
        const client = interaction.client;

        const messageAuthor = interaction.sender;
        const room = interaction.room;

        client.AIBot.Messages[messageAuthor] = null;
        client.sendText(room, 'Context has been cleared');
        return client.queue.queue.shift();
    }
}