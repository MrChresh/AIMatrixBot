import 'dotenv/config'
import fs from 'node:fs'
import child_process from 'child_process';

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
export class aiimg {
async execute(interaction) {
        const client = interaction.client;
        const width = Number(process.env.DEFAULT_IMAGE_WIDTH);
        const height = Number(process.env.DEFAULT_IMAGE_HEIGHT);
        const steps = Number(process.env.DEFAULT_IMAGE_STEPS);

        //const messageAuthor = interaction.sender;
        const room = interaction.room;
        var prompt = interaction.content.body.slice(6);
        const negativePrompt = '';

        try {
            await client.sendText(room, 'Prompt will be sent, it might take some time.');

            const requestId = String(Date.now().toString(36));

            var prc = child_process.spawn(process.env.PATH_TO_SD_CLI + '/sd-cli.exe', [
                '--diffusion-model', process.env.PATH_TO_SD_CLI + '/' + 'qwen-image-2512-Q4_K_M.gguf',
                '--vae', process.env.PATH_TO_SD_CLI + '/' + 'qwen_image_vae.safetensors',
                '--llm', process.env.PATH_TO_SD_CLI + '/' + 'Qwen2.5-VL-7B-Instruct-abliterated.f16.gguf',
                '-p', prompt,
                '-n', negativePrompt,
                '--output', process.env.PATH_TO_IMAGES + '/' + requestId + '.png',
                '--offload-to-cpu',
                '--threads', '-1',
                '--diffusion-fa',
                '--vae-tiling',
                '--vae-tile-size', '25x25',
                '--cfg-scale', '2.5',
                //'--guidance','5.0',
                '--strength', '1.0',
                '--seed', '-1',
                '--scheduler', 'sgm_uniform',
                '--sampling-method', 'dpm++2m',
                //'--type','f16',
                '--flow-shift', '3',
                '-H', height,
                '-W', width,
                '--steps', steps
            ])


            var lastLogTime = Date.now();
            prc.stdout.setEncoding('utf8');
            prc.stdout.on('data', function (data) {
                var str = data.toString()
                var lines = str.split(/(\r?\n)/g);
                var joinedLines = lines.join("");
                console.log(joinedLines);

                //Progress report can be removed if not functioning properly
                if (str.substring(2).startsWith(' |') && Date.now() >= lastLogTime + 10000) {
                    lastLogTime = Date.now();
                    client.sendText(room, str.replace('[K', ''));
                }

            });

            prc.on('close', async function (code) {
                console.log('process exit code ' + code);
                if (code == 0) {
                    var filename = requestId + '.png';
                    let buffer = fs.readFileSync(process.env.PATH_TO_IMAGES + '/' + requestId + '.png');
                    const encrypted = await client.crypto.encryptMedia(buffer);
                    const mxc = await client.uploadContent(encrypted.buffer);

                    await client.sendMessage(room, {
                        msgtype: "m.image",
                        body: filename,
                        info: {
                            mimetype: "image/png"
                        },
                        file: {
                            url: mxc,
                            ...encrypted.file,
                        },
                    });
                } else {
                    client.sendText(room, 'Something went wrong generating the image.');
                }
                client.queue.queue.shift();
            });

        } catch (e) {
            console.log(e);
        }
    }
};