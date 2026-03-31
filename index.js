import sdk, { ClientEvent, EventType, MsgType, RoomEvent } from "matrix-js-sdk";
import { KnownMembership } from "matrix-js-sdk/lib/@types/membership.js";
import 'dotenv/config'
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'url';
import url from 'url';
const globalfilename = fileURLToPath(import.meta.url);
const globaldirname = path.dirname(globalfilename);

var myHomeServer = process.env.MATRIX_HOME_SERVER;
var myUserId = process.env.MATRIX_USER_ID;
var myAccessToken = process.env.MATRIX_TOKEN;


var matrixClient = sdk.createClient({
    baseUrl: myHomeServer,
    accessToken: myAccessToken,
    userId: myUserId,
});

// Data structures
var viewingRooms = [];
var numMessagesToShow = 20;

// show the room list after syncing.
matrixClient.on(ClientEvent.Sync, function (state, prevState, data) {
    switch (state) {
        case "PREPARED":
            matrixClient.getRooms().forEach((viewingRoom) => {
                try {
                    if (viewingRoom.getMember(myUserId).membership === KnownMembership.Invite) {
                        // join the room
                        matrixClient.joinRoom(viewingRoom.roomId).then(
                            function (room) {
                                viewingRoom = room;
                            },
                            function (err) {
                                console.log("/join Error: %s", err);
                            },
                        );
                        viewingRooms.push(viewingRoom);
                    } else {
                        
                    }
                } catch (e) {
                    console.log(e);
                }
            })
            break;
    }
});

matrixClient.on(ClientEvent.Room, function () {

});

// print incoming messages.
matrixClient.on(RoomEvent.Timeline,async function (event, room, toStartOfTimeline) {
    try {
        if (toStartOfTimeline) {
            return; // don't print paginated results
        }
        /*if (!viewingRoom || viewingRoom.roomId !== room?.roomId) {
            return; // not viewing a room or viewing the wrong room.
        }*/
        console.log(event.event);
        if (!viewingRooms || findRoom(event.event.room_id)?.roomId !== room?.roomId) {
            return; // not viewing a room or viewing the wrong room.
        }
        if(event.event.content.msgtype != 'm.text') {
            return;
        }
        console.log(event.event.room_id);
        if (event.event.sender != myUserId) {
            matrixClient.commands.forEach(async (textcommand) => {



                if(event.event.content.body.startsWith(`$${textcommand.data.name}`)) {
                    console.log(textcommand);

                    var interaction = event.event;
                    interaction.client = matrixClient;
                    interaction.room = findRoom(event.event.room_id).roomId;
                    textcommand.execute(interaction);
                    //await matrixClient.sendTextMessage(findRoom(event.event.room_id).roomId, event.event.sender + ' you wrote "' + event.event.content.body.slice(textcommand.data.name.length + 2) + '"');
                }
            });
        }
    } catch (e) {
        console.log(e);
    }
});

function findRoom(roomString) {
    var returnViewingRoom = null;
    matrixClient.getRooms().forEach(async (viewingRoom) => {
        if (viewingRoom.roomId == roomString) {
            returnViewingRoom = viewingRoom;
            console.log(returnViewingRoom.roomId);
        }
    });
    
    return returnViewingRoom;
}

matrixClient.startClient({ initialSyncLimit: numMessagesToShow }).then(async () => {
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
    const commandFolders = [''].concat(fs.readdirSync(foldersPath,{ withFileTypes: true })
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

