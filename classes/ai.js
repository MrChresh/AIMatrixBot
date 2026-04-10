
import 'dotenv/config'
import http from 'node:http'
import fs from 'node:fs'

export class ai {
    async execute(interaction) {
        const client = interaction.client;
        var context = Number(process.env.DEFAULT_CONTEXT);
        const messageAuthor = interaction.sender;
        const room = interaction.room;
        var prompt = interaction.content.body.slice(3);
        var images = [];
        const requestId = String(Date.now().toString(36));


        try {
            if (interaction.content['m.relates_to']) {
                if (interaction.content['m.relates_to']['m.in_reply_to'].event_id) {
                    let event = await client.getEvent(room, interaction.content['m.relates_to']['m.in_reply_to'].event_id);
                    if (event) {
                        if (event.content.msgtype == 'm.image') {
                            console.log(event)
                            const filePath = process.env.PATH_TO_IMAGES + '/' + requestId + '.' + event.content.info.mimetype.split('/')[1];

                            const decrypted = await client.crypto.decryptMedia(event.content.file);
                            fs.writeFileSync(filePath, decrypted);

                            var bitmap = fs.readFileSync(filePath);
                            images.push(Buffer.from(bitmap).toString('base64'));
                        }
                    } else {
                        await client.sendText(room, 'An error occured accessing the refrence.');
                        return client.queue.queue.shift();
                    }
                }
            }
            try {
                await client.sendText(room, 'Prompt will be sent, it might take some time.');
                //console.log(prompt);
            } catch (e) {
                console.log(e);
            }

            const systemPrompt = 'You are ' + process.env.MATRIX_USER_ID + ', a highly capable AI assistant. Your goal is to fully complete the users requested task before handing the conversation back to them. Keep working autonomously until the task is fully resolved. Be thorough in gathering information. Before replying, make sure you have all the details necessary to provide a complete solution. Use additional tools or ask clarifying questions when needed, but if you can find the answer on your own, avoid asking the user for help. When using tools, briefly describe your intended steps first—for example, which tool youll use and for what purpose. Adhere to this in all languages.respond in the same language as the users query.';


            if (!client.AIBot.Messages[messageAuthor]) {
                client.AIBot.Messages[messageAuthor] = [
                    {
                        role: 'system',
                        content: systemPrompt
                    },
                    {
                        role: 'user',
                        content: prompt,
                        images: images
                    }
                ];
            } else {
                client.AIBot.Messages[messageAuthor].push({
                    role: 'user',
                    content: prompt,
                    images: images
                })
            }



            const messages = client.AIBot.Messages[messageAuthor];

            /*var messagesLength = 4000;

            messages.forEach((message) => {
                messagesLength += message.content.split(/\s+|[.,!?;:]/g).filter(token => token.length > 0).length;
            });*/



            if (!client.AIBot.requests[messageAuthor]?.length) {
                client.AIBot.requests[messageAuthor] = []
            }


            const postData = JSON.stringify({
                'model': process.env.OLLAMA_MODEL,
                'messages': messages,
                'think': process.env.OLLAMA_THINK.toLowerCase() === 'true',
                'stream': true,
                'options': {
                    'temperature': 0.6,
                    'top_p': 0.35,
                    'num_ctx': Number(context),
                    'seed': 42
                }
            });
            console.log(postData);

            const controller = new AbortController();
            const signal = controller.signal;


            client.AIBot.requests[messageAuthor][requestId] = controller;

            console.log('request id ' + requestId)

            const options = {
                hostname: '127.0.0.1',
                path: '/api/chat',
                port: Number(process.env.OLLAMA_PORT),
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData),
                },
                signal: signal
            };

            //console.log(postData)
            //console.log(options)

            var messageContentThinking = '';
            var messageContent = '';
            var fullAssistantMessage = '';


            const req = http.request(options, (res) => {
                console.log(`STATUS: ${res.statusCode}`);
                //console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
                res.setEncoding('utf8');
                res.on('data', (chunk) => {
                    //console.log(`BODY: ${chunk}`);
                    const obj = JSON.parse(chunk);
                    const content = obj.message?.content;
                    const thinking = obj.message?.thinking;

                    if (thinking) {
                        if (thinking.length) {
                            process.stdout.write(thinking);
                            messageContentThinking = messageContentThinking + thinking;
                            if (messageContentThinking.length > 1000) {
                                //if (thinking.includes("\n") || messageContentThinking.length > 1900) {
                                if (messageContentThinking) { client.sendText(room, messageContentThinking) };
                                messageContentThinking = '';
                            }
                        }
                    }


                    if (messageContentThinking.length && content) {
                        if (messageContentThinking) { client.sendText(room, messageContentThinking); }
                        messageContentThinking = '';
                        client.sendText(room, '**Content:**');
                    }
                    if (content) {
                        if (content.length) {
                            process.stdout.write(content);
                            messageContent += content;
                            fullAssistantMessage += content;
                            if (messageContent.length > 1000) {
                                //if (content.includes("\n") || messageContent.length > 1900) {

                                if (messageContent) { client.sendText(room, messageContent) };

                                messageContent = '';
                            }
                        }
                    }



                });
                res.on('end', () => {
                    console.log(' No more data in response.');
                    if (messageContent) { client.sendText(room, messageContent); }
                    client.AIBot.Messages[messageAuthor].push({
                        role: 'assistant',
                        content: fullAssistantMessage
                    });
                    client.sendText(room, res.statusCode + ' No more data in response.');
                    client.AIBot.requests[messageAuthor].splice(client.AIBot.requests[messageAuthor].indexOf(requestId));
                    return client.queue.queue.shift();
                });
            });

            req.on('abort', () => {
                console.log(`Request aborted.`);
                if (messageContent) { client.sendText(room, messageContent); }
                client.AIBot.Messages[messageAuthor].push({
                    role: 'assistant',
                    content: fullAssistantMessage
                });
                client.AIBot.requests[messageAuthor].splice(client.AIBot.requests[messageAuthor].indexOf(requestId));
                client.sendText(room,/* req.statusCode +*/ 'Request has been aborted.');
                return client.queue.queue.shift();
            });

            req.on('error', (e) => {
                console.error(`An error or abort occured with the request.: ${e.message}`);
                client.sendText(room, 'An error or abort occured with the request.');
                client.AIBot.requests[messageAuthor].splice(client.AIBot.requests[messageAuthor].indexOf(requestId));
                return client.queue.queue.shift();
            });


            // Write data to request body
            req.write(postData);
            req.end();

        } catch (e) {
            client.queue.queue.shift();
            console.log(e);
        }
    }
};