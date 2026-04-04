import { MatrixAuth } from "matrix-bot-sdk";
                                                                                     //username password deviceId
const authedClient = await (new MatrixAuth('https://matrix.chresh.de')).passwordLogin('bot', 'password', 'BotLogin');
console.log(authedClient.homeserverUrl + " token: \n" + authedClient.accessToken)