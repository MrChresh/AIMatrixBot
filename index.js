import 'dotenv/config'
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'url';
import url from 'url';

import {
    MatrixClient, AutojoinRoomsMixin, LogService,
    RustSdkCryptoStorageProvider, SimpleFsStorageProvider
} from 'matrix-bot-sdk';

const globalfilename = fileURLToPath(import.meta.url);
const globaldirname = path.dirname(globalfilename);


var myHomeServer = process.env.MATRIX_HOME_SERVER;
var myUserId = process.env.MATRIX_USER_ID;
var myAccessToken = process.env.MATRIX_TOKEN;
var storage = new SimpleFsStorageProvider('bot.json');
var cryptoStore = new RustSdkCryptoStorageProvider('encrypted');

var matrixClient = new MatrixClient(myHomeServer, myAccessToken, storage, cryptoStore);
AutojoinRoomsMixin.setupOnClient(matrixClient);

matrixClient.on('room.message', (roomId, event) => {
    try {
        if (event.content.msgtype != 'm.text') {
            return;
        }
        console.log(roomId);
        if (event.sender != myUserId) {
            matrixClient.commands.forEach(async (textcommand) => {

                if (event.content.body.startsWith(`$${textcommand.data.name} `)) {
                    console.log(textcommand);

                    var interaction = event;
                    interaction.client = matrixClient;
                    interaction.room = roomId;
                    textcommand.execute(interaction);
                }
            });
        }
    } catch (e) {
        console.log(e);
    }

});


  matrixClient.on('room.failed_decryption', async (roomId, event, error) => {
    // handle `m.room.encrypted` event that could not be decrypted
    LogService.error('index', `Failed decryption event!\n${{ roomId, event, error }}`);
    await matrixClient.sendText(roomId, `Room key error. I will leave the room, please reinvite me!`);
    try {
      await matrixClient.leaveRoom(roomId);
    } catch (e) {
      LogService.error('index', `Failed to leave room ${roomId} after failed decryption!`);
    }
  });

  matrixClient.on('room.join', async (roomId, _event) => {
    LogService.info('index', `Bot joined room ${roomId}`);
      await matrixClient.sendMessage(roomId, {
        'msgtype': 'm.notice',
        'body': 'I have arrived',
      });
  });

matrixClient.start().then(async () => {
    matrixClient.commandsArr = [];
    matrixClient.commands = new Map();
    matrixClient.AIBot = {};

    try {
        const data = fs.readFileSync('allowed_users.json', 'utf8');
        console.log(JSON.parse(data));
        matrixClient.AIBot.allowedUsers = JSON.parse(data)['allowedUsers'];

    } catch (e) {
        console.error('Error loading allowed_users.json', e);
        matrixClient.AIBot.allowedUsers = [];
    }
    matrixClient.AIBot.Messages = [];
    matrixClient.AIBot.requests = [];

    // Grab all the command folders from the commands directory you created earlier
    const foldersPath = path.join(globaldirname, 'commands');
    console.log(foldersPath)
    const commandFolders = [''].concat(fs.readdirSync(foldersPath, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name));

    for (const folder of commandFolders) {
        // Grab all the command files from the commands directory you created earlier
        const commandsPath = path.join(foldersPath, folder);
        const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith('.js'));
        // Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
        for (const file of commandFiles) {
            const filePath = path.join(commandsPath, file);
            const command = await import(url.pathToFileURL(filePath));
            if ('data' in command.default && 'execute' in command.default) {
                console.log(command)
                matrixClient.commandsArr.push(command.default.data);
                matrixClient.commands.set(command.default.data.name, command.default);
            } else {
                console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
            }
        }
    }
});
