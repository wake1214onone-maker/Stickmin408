const { 
    Client, 
    GatewayIntentBits, 
    Partials, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    ModalBuilder, 
    TextInputBuilder, 
    TextInputStyle, 
    InteractionType, 
    EmbedBuilder 
} = require('discord.js');
require('dotenv').config();

const { exec } = require('child_process');

// เรียก main.py เพื่อรัน Flask keep-alive
exec('python main.py', (err, stdout, stderr) => {
    if (err) {
        console.error(`Error starting keep-alive: ${err}`);
        return;
    }
    console.log('Flask keep-alive started');
});


const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ],
    partials: [Partials.Channel]
});

// ห้องต่างๆ
const INPUT_CHANNEL_ID = '1420410004326060162';
const CHECK_IN_CHANNEL_ID = '1420409765451923586';
const LEAVE_CHANNEL_ID = '1420409797903384718';

// เมื่อบอทพร้อม
client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}`);

    const channel = await client.channels.fetch(INPUT_CHANNEL_ID);

    // ปุ่มเช็คชื่อ / แจ้งลา
    const buttonRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('openCheckinModal')
            .setLabel('เช็คชื่อ')
            .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
            .setCustomId('openLeaveModal')
            .setLabel('แจ้งลา')
            .setStyle(ButtonStyle.Danger)
    );

    // Embed พร้อมข้อความและรูป
    const embed = new EmbedBuilder()
        .setDescription('กดปุ่มด้านล่างเพื่อเช็คชื่อหรือแจ้งลา')
        .setImage('https://media.discordapp.net/attachments/1413878684812836998/1420426577757605908/ddadadada-2.jpg?ex=68d60396&is=68d4b216&hm=50b4ed785ca2800a97116f62680bf3d3b33f74d005e4c983fc2b0d1d73ec912f&=&format=webp&width=1572&height=864'); // <-- ใส่ลิงก์รูปของคุณ

    await channel.send({
        embeds: [embed],
        components: [buttonRow]
    });
});

// ฟังการกดปุ่ม / ส่ง modal / ส่งข้อมูล
client.on('interactionCreate', async interaction => {
    // ปุ่มเช็คชื่อ
    if (interaction.isButton() && interaction.customId === 'openCheckinModal') {
        const modal = new ModalBuilder()
            .setCustomId('checkinModal')
            .setTitle('เช็คชื่อ');

        const nameInput = new TextInputBuilder()
            .setCustomId('name')
            .setLabel('ชื่อของคุณ')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const discordTagInput = new TextInputBuilder()
            .setCustomId('discordTag')
            .setLabel('แท็ก Discord ของคุณ')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        modal.addComponents(
            new ActionRowBuilder().addComponents(nameInput),
            new ActionRowBuilder().addComponents(discordTagInput)
        );

        await interaction.showModal(modal);
    }

    // ปุ่มแจ้งลา
    if (interaction.isButton() && interaction.customId === 'openLeaveModal') {
        const modal = new ModalBuilder()
            .setCustomId('leaveModal')
            .setTitle('แจ้งลา');

        const nameInput = new TextInputBuilder()
            .setCustomId('name')
            .setLabel('ชื่อของคุณ')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const discordTagInput = new TextInputBuilder()
            .setCustomId('discordTag')
            .setLabel('แท็ก Discord ของคุณ')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const startDateInput = new TextInputBuilder()
            .setCustomId('startDate')
            .setLabel('วันเริ่มลา (ตัวอย่าง: 1/1/2568)')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const endDateInput = new TextInputBuilder()
            .setCustomId('endDate')
            .setLabel('วันสิ้นสุดลา (ตัวอย่าง: 2/2/2568)')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        modal.addComponents(
            new ActionRowBuilder().addComponents(nameInput),
            new ActionRowBuilder().addComponents(discordTagInput),
            new ActionRowBuilder().addComponents(startDateInput),
            new ActionRowBuilder().addComponents(endDateInput)
        );

        await interaction.showModal(modal);
    }

    // ส่งข้อมูลเช็คชื่อ / แจ้งลา
    if (interaction.type === InteractionType.ModalSubmit) {
        const userAvatar = interaction.user.displayAvatarURL({ dynamic: true });
        const userMention = `<@${interaction.user.id}>`;

        if (interaction.customId === 'checkinModal') {
            const name = interaction.fields.getTextInputValue('name');
            const discordTag = interaction.fields.getTextInputValue('discordTag');

            const targetChannel = interaction.guild.channels.cache.get(CHECK_IN_CHANNEL_ID);
            if (targetChannel) {
                const embed = new EmbedBuilder()
                    .setTitle('เช็คชื่อ')
                    .setColor(0x00FF00)
                    .setDescription(`**ชื่อ:** ${name}\n**Discord:** ${discordTag}`)
                    .setThumbnail(userAvatar)
                    .setTimestamp();

                await targetChannel.send({ content: userMention, embeds: [embed] });
                await interaction.reply({ content: 'เช็คชื่อเรียบร้อย!', ephemeral: true });
            }
        }

        if (interaction.customId === 'leaveModal') {
            const name = interaction.fields.getTextInputValue('name');
            const discordTag = interaction.fields.getTextInputValue('discordTag');
            const startDate = interaction.fields.getTextInputValue('startDate');
            const endDate = interaction.fields.getTextInputValue('endDate');

            const targetChannel = interaction.guild.channels.cache.get(LEAVE_CHANNEL_ID);
            if (targetChannel) {
                const embed = new EmbedBuilder()
                    .setTitle('แจ้งลา')
                    .setColor(0xFF0000)
                    .setDescription(`**ชื่อ:** ${name}\n**Discord:** ${discordTag}\n**ลาวันที่:** ${startDate} ถึง ${endDate}`)
                    .setThumbnail(userAvatar)
                    .setTimestamp();

                await targetChannel.send({ content: userMention, embeds: [embed] });
                await interaction.reply({ content: 'แจ้งลาเรียบร้อย!', ephemeral: true });
            }
        }
    }
});

// ล็อกอินบอท
client.login(process.env.TOKEN);
