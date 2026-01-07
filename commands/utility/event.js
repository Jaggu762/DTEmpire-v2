const { EmbedBuilder, PermissionsBitField, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    name: 'event',
    description: 'Create a quick event announcement (without Discord scheduled events)',
    aliases: ['events', 'createevent'],
    category: 'Utility',

    async execute(message, args) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
            return message.reply('❌ You need Manage Server permissions to create events.');
        }

        // Help center
        if (args.length === 0 || args[0].toLowerCase() === 'help') {
            const help = new EmbedBuilder()
                .setColor('#00b0f4')
                .setTitle('📚 Event Command Help')
                .setDescription('Create clean announcement embeds and optional countdowns (UTC).')
                .addFields(
                    { name: 'Usage', value: '^event <title> | <when> | <description> | [#channel]', inline: false },
                    { name: 'Examples', value: [
                        '• ^event Movie Night | 1/7/2026 10PM | We watch Interstellar | #events',
                        '• ^event Team Meeting | 2026-01-07 22:00 | Quarterly updates',
                        '• ^event Game Night | Friday 7PM | Casual matches',
                    ].join('\n'), inline: false },
                    { name: 'Date Format', value: 'Accepts `MM/DD/YYYY HH[AM/PM]`, `DD/MM/YYYY HH[AM/PM]` (ambiguous dates will prompt), or ISO `YYYY-MM-DD HH:mm`. Time is treated as UTC.', inline: false },
                    { name: 'Countdown', value: 'Adds a live relative timestamp. Example: `<t:1736296800:R>` shows “in X time”.', inline: false }
                )
                .setFooter({ text: 'Requires Manage Server permissions • UTC time' });
            return message.reply({ embeds: [help] });
        }

        // Parse segments split by |
        const raw = args.join(' ');
        const parts = raw.split('|').map(p => p.trim()).filter(Boolean);

        const [title, when, desc, channelPart] = parts;
        if (!title || !when || !desc) {
            return message.reply('❌ Please provide at least title, when, and description.\nExample: `^event Movie Night | Friday 7PM | We watch Interstellar | #events`');
        }

        const targetChannel = message.mentions.channels.first() || message.guild.channels.cache.get(channelPart) || message.channel;
        if (!targetChannel || !targetChannel.isTextBased()) {
            return message.reply('❌ Please mention a valid text channel for the event (or leave empty to use this channel).');
        }

        // Try to parse UTC datetime
        const parseResult = parseUTCDate(when);

        // If ambiguous (e.g., 1/7/2026), prompt user to pick MM/DD or DD/MM
        if (parseResult.ambiguous) {
            const optionA = parseResult.candidates.mmdd;
            const optionB = parseResult.candidates.ddmm;

            const prompt = new EmbedBuilder()
                .setColor('#ffaa00')
                .setTitle('📅 Ambiguous Date Detected')
                .setDescription(`Your input \`${when}\` can be interpreted in two ways. Choose the correct format:`)
                .addFields(
                    { name: 'MM/DD (Month/Day)', value: optionA ? `UTC: <t:${optionA}:F>\nCountdown: <t:${optionA}:R>` : 'Invalid date', inline: true },
                    { name: 'DD/MM (Day/Month)', value: optionB ? `UTC: <t:${optionB}:F>\nCountdown: <t:${optionB}:R>` : 'Invalid date', inline: true }
                )
                .setFooter({ text: 'Select a format below • UTC time' });

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('event_mmdd').setLabel('Use MM/DD').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('event_ddmm').setLabel('Use DD/MM').setStyle(ButtonStyle.Secondary)
            );

            const promptMsg = await message.reply({ embeds: [prompt], components: [row] });

            try {
                const interaction = await promptMsg.awaitMessageComponent({ filter: i => i.user.id === message.author.id, time: 30000 });
                let ts = null;
                if (interaction.customId === 'event_mmdd' && optionA) ts = optionA;
                if (interaction.customId === 'event_ddmm' && optionB) ts = optionB;

                // Disable buttons
                const disabled = ActionRowBuilder.from(row);
                disabled.components.forEach(c => c.setDisabled(true));
                await interaction.update({ components: [disabled] });

                await postEventEmbed({ message, title, desc, targetChannel, hostId: message.author.id, timestampSec: ts, whenRaw: when });
            } catch (e) {
                // Timeout or failure: fall back to raw when string without countdown
                await postEventEmbed({ message, title, desc, targetChannel, hostId: message.author.id, timestampSec: null, whenRaw: when });
            }
            return;
        }

        // Not ambiguous: post directly (with countdown if parsed)
        await postEventEmbed({
            message,
            title,
            desc,
            targetChannel,
            hostId: message.author.id,
            timestampSec: parseResult.timestampSec || null,
            whenRaw: when
        });
    }
};

// Helpers
function parseUTCDate(input) {
    // Normalize input
    const s = String(input).trim();
    const isoMatch = s.match(/^([0-9]{4})-(\d{1,2})-(\d{1,2})(?:[ T](\d{1,2})(?::(\d{1,2}))?)?$/);
    const mdYMatch = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})(?:\s+(\d{1,2})(?::(\d{2}))?\s*([APap][Mm])?)?$/);

    // ISO: YYYY-MM-DD HH:mm (UTC)
    if (isoMatch) {
        const year = parseInt(isoMatch[1], 10);
        const mon = parseInt(isoMatch[2], 10) - 1;
        const day = parseInt(isoMatch[3], 10);
        const hour = parseInt(isoMatch[4] || '0', 10);
        const min = parseInt(isoMatch[5] || '0', 10);
        const ms = Date.UTC(year, mon, day, hour, min, 0);
        return { timestampSec: Math.floor(ms / 1000), ambiguous: false };
    }

    // M/D/Y or D/M/Y with optional time
    if (mdYMatch) {
        const a = parseInt(mdYMatch[1], 10);
        const b = parseInt(mdYMatch[2], 10);
        const year = parseInt(mdYMatch[3], 10);
        let hour = parseInt(mdYMatch[4] || '0', 10);
        const min = parseInt(mdYMatch[5] || '0', 10);
        const ampm = (mdYMatch[6] || '').toLowerCase();

        // Convert 12h to 24h
        if (ampm) {
            if (ampm === 'pm' && hour < 12) hour += 12;
            if (ampm === 'am' && hour === 12) hour = 0;
        }

        const aIsMonth = a >= 1 && a <= 12;
        const bIsMonth = b >= 1 && b <= 12;

        // Both could be month -> ambiguous, build candidates
        if (aIsMonth && bIsMonth && a !== b) {
            const mmddMs = Date.UTC(year, a - 1, b, hour, min, 0);
            const ddmmMs = Date.UTC(year, b - 1, a, hour, min, 0);
            return {
                ambiguous: true,
                candidates: {
                    mmdd: Math.floor(mmddMs / 1000),
                    ddmm: Math.floor(ddmmMs / 1000)
                }
            };
        }

        // Decide by validity
        let ms = null;
        if (aIsMonth) {
            ms = Date.UTC(year, a - 1, b, hour, min, 0);
        } else {
            ms = Date.UTC(year, b - 1, a, hour, min, 0);
        }
        return { timestampSec: Math.floor(ms / 1000), ambiguous: false };
    }

    // Fallback: cannot parse
    return { timestampSec: null, ambiguous: false };
}

async function postEventEmbed({ message, title, desc, targetChannel, hostId, timestampSec, whenRaw }) {
    const fields = [];
    if (timestampSec) {
        fields.push({ name: '🕒 When (UTC)', value: `<t:${timestampSec}:F>`, inline: true });
        fields.push({ name: '⏳ Countdown', value: `<t:${timestampSec}:R>`, inline: true });
    } else {
        fields.push({ name: '🕒 When', value: whenRaw, inline: true });
    }
    fields.push({ name: '📍 Where', value: targetChannel.toString(), inline: true });
    fields.push({ name: '👥 Host', value: `<@${hostId}>`, inline: true });

    const embed = new EmbedBuilder()
        .setColor('#00b0f4')
        .setTitle(`📅 ${title}`)
        .setDescription(desc)
        .addFields(fields)
        .setFooter({ text: 'Suggest By davidbarnett0587 • UTC time' })
        .setTimestamp();

    await targetChannel.send({ embeds: [embed] });
    if (targetChannel.id !== message.channel.id) {
        await message.reply(`✅ Event posted in ${targetChannel}`);
    }
}
