import { ai } from './ai.js'
import { aiimg } from './aiimg.js'
import { aiimgedit } from './aiimgedit.js'
import { context } from './context.js'

export class queue {
    constructor(...args) {
        this.queue = [];
        this.ai = new ai();
        this.aiimg = new aiimg();
        this.aiimgedit = new aiimgedit();
        this.context = new context();

        const me = this;
        setInterval(function () {
            if (me.queue.length) {
                if (me.queue[0].status != 'running') {
                    me.queue[0].status = 'running';
                    me.runCommand(me.queue[0].interaction);
                }
            }
        }, 1000);
    }
    add(interaction) {
        this.queue.push({
            interaction: interaction,
            status: ''
        })
    }
    async runCommand(interaction) {
        console.log(interaction.commandName)
        try {
            switch (interaction.commandName) {
                case 'ai':
                    await this.ai.execute(interaction);
                    break;
                case 'aiimg':
                    await this.aiimg.execute(interaction);
                    break;
                case 'aiimgedit':
                    await this.aiimgedit.execute(interaction);
                    break;
                case 'context':
                    await this.context.execute(interaction);
                    break;
                default:
                    await this.queue.shift();
                    break;
            }
        } catch (e) {
            console.log(e)
        }
    }
}