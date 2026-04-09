import 'dotenv/config'

/*
You will need to edit this file except you have the exact same setup.
For this setup you will need a graphics card with 16Gb VRAM.

dotenv example

DEFAULT_IMAGE_WIDTH=512
MIN_IMAGE_WIDTH=256
MAX_IMAGE_WIDTH=1024

DEFAULT_IMAGE_HEIGHT=512
MIN_IMAGE_HEIGHT=256
MAX_IMAGE_HEIGHT=1024

DEFAULT_IMAGE_STEPS=20
MIN_IMAGE_STEPS=1
MAX_IMAGE_STEPS=50

PATH_TO_SD_CLI=C:/sdcpp
PATH_TO_IMAGES=C:/sdcpp/images
*/
export default {
    data: {
        name: 'aiimg',
        description: 'Prompts the ai for an image'
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