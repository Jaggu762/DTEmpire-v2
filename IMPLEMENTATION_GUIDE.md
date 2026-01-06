# 🔨 DTEmpire v2 - Implementation Guide

> Detailed implementation suggestions for high-priority features

---

## Table of Contents

1. [Slash Commands Migration](#slash-commands-migration)
2. [Web Dashboard](#web-dashboard)
3. [Mini-Games System](#mini-games-system)
4. [AI Moderation](#ai-moderation)
5. [Custom Commands](#custom-commands)
6. [Achievement System](#achievement-system)
7. [Advanced Analytics](#advanced-analytics)
8. [Performance Optimization](#performance-optimization)

---

## Slash Commands Migration

### Overview
Migrate from prefix-based commands (`^command`) to Discord's native slash commands for improved UX and discoverability.

### Implementation Steps

#### 1. Setup Command Builder (1 day)

```javascript
// utils/commandBuilder.js
const { SlashCommandBuilder } = require('discord.js');

class CommandBuilder {
    static createCommand(name, description, options = []) {
        const command = new SlashCommandBuilder()
            .setName(name)
            .setDescription(description);
        
        options.forEach(opt => {
            switch(opt.type) {
                case 'string':
                    command.addStringOption(option =>
                        option.setName(opt.name)
                            .setDescription(opt.description)
                            .setRequired(opt.required || false)
                    );
                    break;
                case 'user':
                    command.addUserOption(option =>
                        option.setName(opt.name)
                            .setDescription(opt.description)
                            .setRequired(opt.required || false)
                    );
                    break;
                // Add more types as needed
            }
        });
        
        return command;
    }
}

module.exports = CommandBuilder;
```

#### 2. Register Commands (1 day)

```javascript
// utils/deployCommands.js
const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

async function deployCommands(clientId, guildId = null) {
    const commands = [];
    const commandsPath = path.join(__dirname, '../commands');
    
    // Load all command files
    const loadCommands = (dir) => {
        const files = fs.readdirSync(dir);
        files.forEach(file => {
            const filePath = path.join(dir, file);
            if (fs.statSync(filePath).isDirectory()) {
                loadCommands(filePath);
            } else if (file.endsWith('.js')) {
                const command = require(filePath);
                if (command.data) {
                    commands.push(command.data.toJSON());
                }
            }
        });
    };
    
    loadCommands(commandsPath);
    
    const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);
    
    try {
        console.log(`Registering ${commands.length} slash commands...`);
        
        if (guildId) {
            // Guild-specific (faster for testing)
            await rest.put(
                Routes.applicationGuildCommands(clientId, guildId),
                { body: commands }
            );
        } else {
            // Global commands
            await rest.put(
                Routes.applicationCommands(clientId),
                { body: commands }
            );
        }
        
        console.log('✅ Commands registered successfully!');
    } catch (error) {
        console.error('Error registering commands:', error);
    }
}

module.exports = deployCommands;
```

#### 3. Update Command Structure (2-3 weeks)

```javascript
// commands/utility/help.js - Example conversion
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    // New slash command structure
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Shows all available commands')
        .addStringOption(option =>
            option.setName('command')
                .setDescription('Get help for a specific command')
                .setRequired(false)
        ),
    
    async execute(interaction, client) {
        const commandName = interaction.options.getString('command');
        
        if (commandName) {
            // Show specific command help
            const command = client.commands.get(commandName);
            if (!command) {
                return interaction.reply({
                    content: `Command \`${commandName}\` not found!`,
                    ephemeral: true
                });
            }
            
            const embed = new EmbedBuilder()
                .setTitle(`Help: /${command.data.name}`)
                .setDescription(command.data.description)
                .setColor('#5865F2');
            
            return interaction.reply({ embeds: [embed] });
        }
        
        // Show all commands
        const embed = createHelpEmbed(client);
        await interaction.reply({ embeds: [embed] });
    },
    
    // Keep legacy prefix support (temporary)
    name: 'help',
    description: 'Shows all available commands',
    aliases: ['h', 'commands'],
    category: 'utility',
    
    async executeLegacy(message, args, client, db) {
        // Handle old prefix command
        const embed = createHelpEmbed(client);
        await message.reply({ embeds: [embed] });
    }
};

function createHelpEmbed(client) {
    const categories = {};
    
    client.commands.forEach(cmd => {
        const category = cmd.category || 'Other';
        if (!categories[category]) categories[category] = [];
        categories[category].push(cmd.data ? cmd.data.name : cmd.name);
    });
    
    const embed = new EmbedBuilder()
        .setTitle('🤖 DTEmpire Help')
        .setDescription('Use `/help <command>` for detailed information')
        .setColor('#5865F2');
    
    Object.entries(categories).forEach(([category, commands]) => {
        embed.addFields({
            name: `📁 ${category}`,
            value: commands.join(', '),
            inline: false
        });
    });
    
    return embed;
}
```

#### 4. Interaction Handler Update (1 day)

```javascript
// Add to index.js
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    
    const command = client.commands.get(interaction.commandName);
    
    if (!command) {
        return interaction.reply({
            content: 'This command no longer exists!',
            ephemeral: true
        });
    }
    
    // Permission checks
    if (command.permissions) {
        if (!interaction.member.permissions.has(command.permissions)) {
            return interaction.reply({
                content: '❌ You don\'t have permission to use this command!',
                ephemeral: true
            });
        }
    }
    
    // Cooldown handling
    const { cooldowns } = client;
    if (!cooldowns.has(command.data.name)) {
        cooldowns.set(command.data.name, new Collection());
    }
    
    const now = Date.now();
    const timestamps = cooldowns.get(command.data.name);
    const cooldownAmount = (command.cooldown || 3) * 1000;
    
    if (timestamps.has(interaction.user.id)) {
        const expirationTime = timestamps.get(interaction.user.id) + cooldownAmount;
        
        if (now < expirationTime) {
            const timeLeft = (expirationTime - now) / 1000;
            return interaction.reply({
                content: `⏰ Please wait ${timeLeft.toFixed(1)} seconds before using this command again.`,
                ephemeral: true
            });
        }
    }
    
    timestamps.set(interaction.user.id, now);
    setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);
    
    try {
        await command.execute(interaction, client, client.db);
    } catch (error) {
        console.error('Command error:', error);
        
        const errorMessage = {
            content: '❌ An error occurred while executing this command!',
            ephemeral: true
        };
        
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp(errorMessage);
        } else {
            await interaction.reply(errorMessage);
        }
    }
});
```

### Migration Checklist

- [ ] Create command builder utility
- [ ] Set up command deployment script
- [ ] Convert 10 most-used commands first
- [ ] Test in development server
- [ ] Deploy to production gradually
- [ ] Update documentation
- [ ] Notify users of changes
- [ ] Keep prefix commands for 3 months (deprecation period)
- [ ] Monitor usage and feedback
- [ ] Remove prefix commands after transition

---

## Web Dashboard

### Overview
Create a web-based control panel for server administrators.

### Tech Stack

```
Frontend: React 18 + TypeScript
UI Library: Material-UI v5
State Management: Redux Toolkit
Routing: React Router v6
API Calls: Axios
Charts: Chart.js + react-chartjs-2

Backend: Node.js + Express
Authentication: Passport.js (Discord OAuth2)
Database: PostgreSQL (or current DB)
WebSockets: Socket.io
Session: express-session + Redis
```

### Project Structure

```
dashboard/
├── backend/
│   ├── routes/
│   │   ├── auth.js
│   │   ├── servers.js
│   │   ├── economy.js
│   │   ├── moderation.js
│   │   └── analytics.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── permissions.js
│   ├── controllers/
│   └── server.js
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Sidebar.tsx
    │   │   ├── ServerSelector.tsx
    │   │   └── ...
    │   ├── pages/
    │   │   ├── Dashboard.tsx
    │   │   ├── Economy.tsx
    │   │   ├── Moderation.tsx
    │   │   └── Settings.tsx
    │   ├── hooks/
    │   ├── utils/
    │   └── App.tsx
    └── public/
```

### Key Features Implementation

#### 1. Authentication (Week 1)

```javascript
// backend/routes/auth.js
const express = require('express');
const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;

passport.use(new DiscordStrategy({
    clientID: process.env.DISCORD_CLIENT_ID,
    clientSecret: process.env.DISCORD_CLIENT_SECRET,
    callbackURL: process.env.CALLBACK_URL,
    scope: ['identify', 'guilds']
}, (accessToken, refreshToken, profile, done) => {
    // Save or update user in database
    return done(null, profile);
}));

const router = express.Router();

router.get('/login', passport.authenticate('discord'));

router.get('/callback', 
    passport.authenticate('discord', { failureRedirect: '/' }),
    (req, res) => {
        res.redirect('/dashboard');
    }
);

router.get('/user', (req, res) => {
    if (req.isAuthenticated()) {
        res.json(req.user);
    } else {
        res.status(401).json({ error: 'Not authenticated' });
    }
});

router.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/');
});

module.exports = router;
```

#### 2. Server Management (Week 2)

```typescript
// frontend/src/pages/Dashboard.tsx
import React, { useEffect, useState } from 'react';
import { Grid, Card, CardContent, Typography } from '@mui/material';
import axios from 'axios';

interface ServerStats {
    memberCount: number;
    messageCount: number;
    commandsUsed: number;
    economyTransactions: number;
}

const Dashboard: React.FC = () => {
    const [stats, setStats] = useState<ServerStats | null>(null);
    
    useEffect(() => {
        fetchStats();
    }, []);
    
    const fetchStats = async () => {
        try {
            const response = await axios.get('/api/stats');
            setStats(response.data);
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        }
    };
    
    return (
        <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
                <Card>
                    <CardContent>
                        <Typography variant="h6">Members</Typography>
                        <Typography variant="h4">
                            {stats?.memberCount || 0}
                        </Typography>
                    </CardContent>
                </Card>
            </Grid>
            {/* More stat cards */}
        </Grid>
    );
};

export default Dashboard;
```

#### 3. Real-time Updates (Week 3)

```javascript
// backend/websocket.js
const socketIO = require('socket.io');

function setupWebSocket(server, client) {
    const io = socketIO(server, {
        cors: {
            origin: process.env.FRONTEND_URL,
            credentials: true
        }
    });
    
    io.on('connection', (socket) => {
        console.log('Client connected:', socket.id);
        
        socket.on('subscribe:server', (guildId) => {
            // Check if user has permission
            socket.join(`server:${guildId}`);
        });
        
        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
        });
    });
    
    // Emit events from Discord bot
    client.on('messageCreate', (message) => {
        io.to(`server:${message.guild.id}`).emit('message', {
            author: message.author.tag,
            content: message.content,
            channel: message.channel.name
        });
    });
    
    return io;
}

module.exports = setupWebSocket;
```

### Development Timeline

**Week 1-2:** Project setup, authentication, basic layout  
**Week 3-4:** Server statistics, basic controls  
**Week 5-6:** Economy management interface  
**Week 7-8:** Moderation tools  
**Week 9-10:** Analytics and charts  
**Week 11-12:** Testing, polish, deployment

---

## Mini-Games System

### Overview
Interactive games to increase server engagement.

### Architecture

```
commands/games/
├── trivia.js
├── wordsearch.js
├── hangman.js
├── reaction.js
├── rps.js
└── manager.js

utils/games/
├── TriviaGame.js
├── WordGame.js
├── ReactionGame.js
└── GameManager.js
```

### Implementation Example: Trivia System

```javascript
// utils/games/TriviaGame.js
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

class TriviaGame {
    constructor(channel, options = {}) {
        this.channel = channel;
        this.category = options.category || 'general';
        this.difficulty = options.difficulty || 'medium';
        this.timeLimit = options.timeLimit || 30000; // 30 seconds
        this.reward = options.reward || 100;
        this.players = new Map();
        this.currentQuestion = null;
        this.isActive = false;
    }
    
    async start() {
        this.isActive = true;
        this.currentQuestion = await this.fetchQuestion();
        await this.displayQuestion();
        
        // Start timer
        setTimeout(() => {
            this.endRound();
        }, this.timeLimit);
    }
    
    async fetchQuestion() {
        // Fetch from trivia API or database
        const questions = await this.getQuestionsFromDB();
        return questions[Math.floor(Math.random() * questions.length)];
    }
    
    async getQuestionsFromDB() {
        // Example questions structure
        return [
            {
                question: "What is the capital of France?",
                answers: ["Paris", "London", "Berlin", "Madrid"],
                correct: 0,
                category: "geography"
            },
            // More questions...
        ];
    }
    
    async displayQuestion() {
        const q = this.currentQuestion;
        
        const embed = new EmbedBuilder()
            .setTitle('🎯 Trivia Time!')
            .setDescription(q.question)
            .setColor('#FFA500')
            .addFields(
                q.answers.map((ans, i) => ({
                    name: `${['🇦', '🇧', '🇨', '🇩'][i]} Option ${i + 1}`,
                    value: ans,
                    inline: true
                }))
            )
            .setFooter({ text: `⏰ ${this.timeLimit / 1000} seconds to answer | Reward: $${this.reward}` });
        
        const row = new ActionRowBuilder()
            .addComponents(
                q.answers.map((_, i) => 
                    new ButtonBuilder()
                        .setCustomId(`trivia_answer_${i}`)
                        .setLabel(['🇦', '🇧', '🇨', '🇩'][i])
                        .setStyle(ButtonStyle.Primary)
                )
            );
        
        this.message = await this.channel.send({
            embeds: [embed],
            components: [row]
        });
        
        // Set up button collector
        const collector = this.message.createMessageComponentCollector({
            time: this.timeLimit
        });
        
        collector.on('collect', async (interaction) => {
            if (this.players.has(interaction.user.id)) {
                return interaction.reply({
                    content: '❌ You already answered!',
                    ephemeral: true
                });
            }
            
            const answer = parseInt(interaction.customId.split('_')[2]);
            this.players.set(interaction.user.id, {
                user: interaction.user,
                answer: answer,
                time: Date.now()
            });
            
            await interaction.reply({
                content: '✅ Answer recorded!',
                ephemeral: true
            });
        });
        
        collector.on('end', () => {
            this.endRound();
        });
    }
    
    async endRound() {
        if (!this.isActive) return;
        this.isActive = false;
        
        const correctAnswer = this.currentQuestion.correct;
        const winners = [];
        
        for (const [userId, data] of this.players) {
            if (data.answer === correctAnswer) {
                winners.push(data);
            }
        }
        
        // Sort by response time
        winners.sort((a, b) => a.time - b.time);
        
        // Build results embed
        const embed = new EmbedBuilder()
            .setTitle('🎉 Round Complete!')
            .setDescription(`**Correct Answer:** ${this.currentQuestion.answers[correctAnswer]}`)
            .setColor(winners.length > 0 ? '#00FF00' : '#FF0000');
        
        if (winners.length > 0) {
            embed.addFields({
                name: '🏆 Winners',
                value: winners.map((w, i) => 
                    `${i + 1}. ${w.user.tag} - $${this.reward * (1 / (i + 1))}` // First place gets full reward
                ).join('\n')
            });
            
            // Award rewards (integrate with economy)
            for (let i = 0; i < Math.min(3, winners.length); i++) {
                const reward = Math.floor(this.reward * (1 / (i + 1)));
                // await client.db.addMoney(winners[i].user.id, guildId, reward);
            }
        } else {
            embed.addFields({
                name: '😢 No Winners',
                value: 'Nobody answered correctly!'
            });
        }
        
        embed.addFields({
            name: '📊 Stats',
            value: `Total Participants: ${this.players.size}\nCorrect: ${winners.length}\nIncorrect: ${this.players.size - winners.length}`
        });
        
        // Disable buttons
        const disabledRow = ActionRowBuilder.from(this.message.components[0]);
        disabledRow.components.forEach(button => button.setDisabled(true));
        
        await this.message.edit({
            embeds: [embed],
            components: [disabledRow]
        });
    }
}

module.exports = TriviaGame;
```

### Command Implementation

```javascript
// commands/games/trivia.js
const { SlashCommandBuilder } = require('discord.js');
const TriviaGame = require('../../utils/games/TriviaGame');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('trivia')
        .setDescription('Start a trivia game')
        .addStringOption(option =>
            option.setName('category')
                .setDescription('Trivia category')
                .addChoices(
                    { name: 'General', value: 'general' },
                    { name: 'Gaming', value: 'gaming' },
                    { name: 'Science', value: 'science' },
                    { name: 'History', value: 'history' }
                )
        )
        .addStringOption(option =>
            option.setName('difficulty')
                .setDescription('Difficulty level')
                .addChoices(
                    { name: 'Easy', value: 'easy' },
                    { name: 'Medium', value: 'medium' },
                    { name: 'Hard', value: 'hard' }
                )
        ),
    
    async execute(interaction, client, db) {
        const category = interaction.options.getString('category') || 'general';
        const difficulty = interaction.options.getString('difficulty') || 'medium';
        
        await interaction.reply('🎯 Starting trivia game...');
        
        const game = new TriviaGame(interaction.channel, {
            category,
            difficulty,
            reward: 100
        });
        
        await game.start();
    }
};
```

---

## AI Moderation

### Overview
Intelligent content moderation using AI to detect toxic behavior, spam, and inappropriate content.

### Implementation

```javascript
// utils/aiModeration.js
const axios = require('axios');

class AIModeration {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.cache = new Map();
    }
    
    async analyzeMessage(content) {
        // Check cache first
        const cacheKey = this.hashContent(content);
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }
        
        try {
            // Use AI API for analysis
            const response = await axios.post('https://api.openai.com/v1/moderations', {
                input: content
            }, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });
            
            const result = {
                toxic: response.data.results[0].flagged,
                categories: response.data.results[0].categories,
                scores: response.data.results[0].category_scores
            };
            
            // Cache result for 1 hour
            this.cache.set(cacheKey, result);
            setTimeout(() => this.cache.delete(cacheKey), 3600000);
            
            return result;
        } catch (error) {
            console.error('AI Moderation error:', error);
            return null;
        }
    }
    
    async detectSpam(messages) {
        // Analyze message patterns for spam
        const patterns = this.analyzePatterns(messages);
        
        return {
            isSpam: patterns.repetition > 0.7 || patterns.speed > 5, // 5 messages per second
            confidence: Math.max(patterns.repetition, patterns.speed / 10),
            reason: patterns.repetition > 0.7 ? 'Repetitive content' : 'Message spam'
        };
    }
    
    analyzePatterns(messages) {
        // Calculate repetition score
        const contents = messages.map(m => m.content.toLowerCase());
        const unique = new Set(contents);
        const repetition = 1 - (unique.size / contents.length);
        
        // Calculate message speed
        if (messages.length < 2) return { repetition, speed: 0 };
        
        const timeSpan = messages[messages.length - 1].timestamp - messages[0].timestamp;
        const speed = messages.length / (timeSpan / 1000); // messages per second
        
        return { repetition, speed };
    }
    
    hashContent(content) {
        // Simple hash function for caching
        let hash = 0;
        for (let i = 0; i < content.length; i++) {
            const char = content.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString();
    }
}

module.exports = AIModeration;
```

### Integration with Message Handler

```javascript
// Add to index.js messageCreate event
const AIModeration = require('./utils/aiModeration');
const aiMod = new AIModeration(process.env.OPENAI_API_KEY);

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;
    
    // Check if AI moderation is enabled
    const config = await client.db.getGuildConfig(message.guild.id);
    if (!config?.ai_moderation_enabled) return;
    
    // Skip admins
    if (message.member.permissions.has('Administrator')) return;
    
    // Analyze message
    const analysis = await aiMod.analyzeMessage(message.content);
    
    if (analysis && analysis.toxic) {
        const highestScore = Math.max(...Object.values(analysis.scores));
        const threshold = config.ai_moderation_sensitivity || 0.7;
        
        if (highestScore > threshold) {
            // Delete message
            await message.delete().catch(console.error);
            
            // Warn user
            const category = Object.entries(analysis.categories)
                .find(([_, value]) => value)[0];
            
            await message.channel.send({
                content: `⚠️ ${message.author}, your message was removed by AI moderation.\nReason: ${category}`,
                allowedMentions: { users: [message.author.id] }
            }).then(msg => setTimeout(() => msg.delete(), 5000));
            
            // Log incident
            await client.db.logModeration({
                guildId: message.guild.id,
                userId: message.author.id,
                action: 'ai_delete',
                reason: category,
                content: message.content,
                confidence: highestScore
            });
            
            // Auto-timeout for repeat offenders
            const recentOffenses = await client.db.getRecentOffenses(
                message.guild.id,
                message.author.id,
                24 * 60 * 60 * 1000 // 24 hours
            );
            
            if (recentOffenses >= 3) {
                await message.member.timeout(
                    60 * 60 * 1000, // 1 hour
                    'Repeated AI moderation violations'
                ).catch(console.error);
            }
        }
    }
    
    // Check for spam
    const recentMessages = await message.channel.messages.fetch({ limit: 10 });
    const userMessages = recentMessages.filter(m => 
        m.author.id === message.author.id &&
        Date.now() - m.createdTimestamp < 5000 // Last 5 seconds
    );
    
    if (userMessages.size >= 5) {
        const spamAnalysis = await aiMod.detectSpam(Array.from(userMessages.values()));
        
        if (spamAnalysis.isSpam) {
            // Delete messages
            await message.channel.bulkDelete(userMessages);
            
            // Timeout user
            await message.member.timeout(
                10 * 60 * 1000, // 10 minutes
                'Spam detected by AI'
            ).catch(console.error);
            
            await message.channel.send({
                content: `🚫 ${message.author} has been timed out for spamming.`,
                allowedMentions: { users: [] }
            }).then(msg => setTimeout(() => msg.delete(), 10000));
        }
    }
});
```

---

## Custom Commands

### Database Schema

```sql
CREATE TABLE custom_commands (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT NOT NULL,
    name TEXT NOT NULL,
    response TEXT NOT NULL,
    embed_data TEXT, -- JSON string
    permissions TEXT, -- Comma-separated role IDs
    cooldown INTEGER DEFAULT 0,
    usage_count INTEGER DEFAULT 0,
    created_by TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    UNIQUE(guild_id, name)
);
```

### Implementation

```javascript
// utils/customCommands.js
class CustomCommandManager {
    constructor(db) {
        this.db = db;
        this.cache = new Map(); // guild_id -> Map of commands
    }
    
    async loadGuildCommands(guildId) {
        const commands = await this.db.getCustomCommands(guildId);
        const commandMap = new Map();
        
        commands.forEach(cmd => {
            commandMap.set(cmd.name, cmd);
        });
        
        this.cache.set(guildId, commandMap);
        return commandMap;
    }
    
    async createCommand(guildId, data) {
        const command = {
            guild_id: guildId,
            name: data.name.toLowerCase(),
            response: data.response,
            embed_data: data.embedData ? JSON.stringify(data.embedData) : null,
            permissions: data.permissions?.join(',') || null,
            cooldown: data.cooldown || 0,
            created_by: data.createdBy,
            created_at: Date.now(),
            updated_at: Date.now(),
            usage_count: 0
        };
        
        await this.db.createCustomCommand(command);
        
        // Update cache
        const guildCommands = this.cache.get(guildId) || new Map();
        guildCommands.set(command.name, command);
        this.cache.set(guildId, guildCommands);
        
        return command;
    }
    
    async getCommand(guildId, name) {
        const guildCommands = this.cache.get(guildId);
        if (!guildCommands) {
            await this.loadGuildCommands(guildId);
            return this.getCommand(guildId, name);
        }
        
        return guildCommands.get(name.toLowerCase());
    }
    
    async executeCommand(message, commandName) {
        const command = await this.getCommand(message.guild.id, commandName);
        if (!command) return false;
        
        // Check permissions
        if (command.permissions) {
            const allowedRoles = command.permissions.split(',');
            const hasPermission = message.member.roles.cache.some(role =>
                allowedRoles.includes(role.id)
            );
            
            if (!hasPermission && !message.member.permissions.has('Administrator')) {
                await message.reply('❌ You don\'t have permission to use this command!');
                return true;
            }
        }
        
        // Check cooldown
        if (command.cooldown > 0) {
            const cooldownKey = `${message.guild.id}:${command.name}:${message.author.id}`;
            const lastUsed = this.db.getCooldown(cooldownKey);
            
            if (lastUsed && Date.now() - lastUsed < command.cooldown * 1000) {
                const remaining = Math.ceil((command.cooldown * 1000 - (Date.now() - lastUsed)) / 1000);
                await message.reply(`⏰ Cooldown: ${remaining}s`);
                return true;
            }
            
            this.db.setCooldown(cooldownKey, Date.now());
        }
        
        // Execute command
        if (command.embed_data) {
            const embedData = JSON.parse(command.embed_data);
            const embed = new EmbedBuilder(embedData);
            await message.reply({ embeds: [embed] });
        } else {
            // Parse variables
            let response = command.response;
            response = response.replace(/{user}/g, message.author.username);
            response = response.replace(/{mention}/g, `<@${message.author.id}>`);
            response = response.replace(/{server}/g, message.guild.name);
            response = response.replace(/{membercount}/g, message.guild.memberCount);
            
            await message.reply(response);
        }
        
        // Increment usage count
        await this.db.incrementCommandUsage(message.guild.id, command.name);
        
        return true;
    }
    
    async deleteCommand(guildId, name) {
        await this.db.deleteCustomCommand(guildId, name);
        
        const guildCommands = this.cache.get(guildId);
        if (guildCommands) {
            guildCommands.delete(name.toLowerCase());
        }
    }
    
    async listCommands(guildId) {
        const guildCommands = this.cache.get(guildId);
        if (!guildCommands) {
            await this.loadGuildCommands(guildId);
            return this.listCommands(guildId);
        }
        
        return Array.from(guildCommands.values());
    }
}

module.exports = CustomCommandManager;
```

### Command Interface

```javascript
// commands/utility/custom.js
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('custom')
        .setDescription('Manage custom commands')
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription('Create a custom command')
                .addStringOption(option =>
                    option.setName('name')
                        .setDescription('Command name')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('response')
                        .setDescription('Command response')
                        .setRequired(true)
                )
                .addIntegerOption(option =>
                    option.setName('cooldown')
                        .setDescription('Cooldown in seconds')
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('delete')
                .setDescription('Delete a custom command')
                .addStringOption(option =>
                    option.setName('name')
                        .setDescription('Command name')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List all custom commands')
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
    
    async execute(interaction, client, db) {
        const subcommand = interaction.options.getSubcommand();
        
        if (!client.customCommands) {
            const CustomCommandManager = require('../../utils/customCommands');
            client.customCommands = new CustomCommandManager(db);
        }
        
        switch (subcommand) {
            case 'create': {
                const name = interaction.options.getString('name');
                const response = interaction.options.getString('response');
                const cooldown = interaction.options.getInteger('cooldown') || 0;
                
                // Validate name
                if (!/^[a-z0-9-_]+$/i.test(name)) {
                    return interaction.reply({
                        content: '❌ Command name can only contain letters, numbers, hyphens, and underscores!',
                        ephemeral: true
                    });
                }
                
                // Check if command already exists
                const existing = await client.customCommands.getCommand(interaction.guild.id, name);
                if (existing) {
                    return interaction.reply({
                        content: `❌ Custom command \`${name}\` already exists!`,
                        ephemeral: true
                    });
                }
                
                // Create command
                await client.customCommands.createCommand(interaction.guild.id, {
                    name,
                    response,
                    cooldown,
                    createdBy: interaction.user.id
                });
                
                await interaction.reply({
                    content: `✅ Created custom command: \`${name}\`\nUse it with: \`^${name}\``,
                    ephemeral: true
                });
                break;
            }
            
            case 'delete': {
                const name = interaction.options.getString('name');
                
                const command = await client.customCommands.getCommand(interaction.guild.id, name);
                if (!command) {
                    return interaction.reply({
                        content: `❌ Custom command \`${name}\` not found!`,
                        ephemeral: true
                    });
                }
                
                await client.customCommands.deleteCommand(interaction.guild.id, name);
                
                await interaction.reply({
                    content: `✅ Deleted custom command: \`${name}\``,
                    ephemeral: true
                });
                break;
            }
            
            case 'list': {
                const commands = await client.customCommands.listCommands(interaction.guild.id);
                
                if (commands.length === 0) {
                    return interaction.reply({
                        content: '📝 No custom commands created yet!',
                        ephemeral: true
                    });
                }
                
                const embed = new EmbedBuilder()
                    .setTitle(`📝 Custom Commands (${commands.length})`)
                    .setColor('#5865F2')
                    .setDescription(
                        commands.map(cmd =>
                            `\`^${cmd.name}\` - Used ${cmd.usage_count} times${cmd.cooldown ? ` (${cmd.cooldown}s cooldown)` : ''}`
                        ).join('\n')
                    )
                    .setFooter({ text: `Use /custom create to add more` });
                
                await interaction.reply({ embeds: [embed], ephemeral: true });
                break;
            }
        }
    }
};
```

---

## Performance Optimization

### 1. Database Optimization

```javascript
// utils/database.js improvements
class Database {
    constructor() {
        this.db = null;
        this.cache = new Map();
        this.cacheExpiry = new Map();
    }
    
    // Add connection pooling
    async initialize() {
        const sqlite3 = require('sqlite3').verbose();
        const { open } = require('sqlite');
        
        this.db = await open({
            filename: './data/database.db',
            driver: sqlite3.Database
        });
        
        // Enable WAL mode for better concurrent performance
        await this.db.exec('PRAGMA journal_mode = WAL');
        await this.db.exec('PRAGMA synchronous = NORMAL');
        await this.db.exec('PRAGMA cache_size = -64000'); // 64MB cache
        await this.db.exec('PRAGMA temp_store = MEMORY');
        
        // Create indexes for better query performance
        await this.createIndexes();
        
        return this;
    }
    
    async createIndexes() {
        // Add indexes on frequently queried columns
        await this.db.exec(`
            CREATE INDEX IF NOT EXISTS idx_economy_user_guild 
            ON economy(user_id, guild_id);
            
            CREATE INDEX IF NOT EXISTS idx_messages_guild_user 
            ON messages(guild_id, user_id);
            
            CREATE INDEX IF NOT EXISTS idx_moderation_guild_time 
            ON moderation_logs(guild_id, timestamp DESC);
        `);
    }
    
    // Implement caching for frequently accessed data
    async getCachedGuildConfig(guildId) {
        const cacheKey = `config:${guildId}`;
        
        // Check cache
        if (this.cache.has(cacheKey)) {
            const expiry = this.cacheExpiry.get(cacheKey);
            if (Date.now() < expiry) {
                return this.cache.get(cacheKey);
            }
        }
        
        // Fetch from database
        const config = await this.getGuildConfig(guildId);
        
        // Cache for 5 minutes
        this.cache.set(cacheKey, config);
        this.cacheExpiry.set(cacheKey, Date.now() + 300000);
        
        return config;
    }
    
    // Batch operations
    async batchUpdateEconomy(updates) {
        await this.db.run('BEGIN TRANSACTION');
        
        try {
            for (const update of updates) {
                await this.db.run(
                    'UPDATE economy SET balance = balance + ? WHERE user_id = ? AND guild_id = ?',
                    [update.amount, update.userId, update.guildId]
                );
            }
            
            await this.db.run('COMMIT');
        } catch (error) {
            await this.db.run('ROLLBACK');
            throw error;
        }
    }
}
```

### 2. Memory Management

```javascript
// utils/memoryManager.js
class MemoryManager {
    constructor(client) {
        this.client = client;
        this.lastCleanup = Date.now();
    }
    
    startMonitoring() {
        // Monitor memory every 5 minutes
        setInterval(() => {
            this.checkMemoryUsage();
        }, 300000);
    }
    
    checkMemoryUsage() {
        const usage = process.memoryUsage();
        const usedMB = Math.round(usage.heapUsed / 1024 / 1024);
        
        console.log(`Memory usage: ${usedMB} MB`);
        
        // If using more than 400MB, trigger cleanup
        if (usedMB > 400) {
            this.performCleanup();
        }
    }
    
    performCleanup() {
        console.log('Performing memory cleanup...');
        
        // Clear old caches
        const now = Date.now();
        const maxAge = 3600000; // 1 hour
        
        // Clear TTS cache
        for (const [key, value] of this.client.ttsCache) {
            if (now - value.timestamp > maxAge) {
                this.client.ttsCache.delete(key);
            }
        }
        
        // Clear snipe cache
        for (const [channelId, snipes] of this.client.snipes) {
            const filtered = snipes.filter(s => now - s.timestamp < maxAge);
            if (filtered.length === 0) {
                this.client.snipes.delete(channelId);
            } else {
                this.client.snipes.set(channelId, filtered);
            }
        }
        
        // Force garbage collection if available
        if (global.gc) {
            global.gc();
        }
        
        const newUsage = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
        console.log(`✅ Cleanup complete. New usage: ${newUsage} MB`);
    }
}

module.exports = MemoryManager;
```

### 3. Rate Limiting

```javascript
// utils/rateLimiter.js
class RateLimiter {
    constructor() {
        this.limits = new Map(); // key -> { count, resetAt }
    }
    
    check(key, maxRequests, windowMs) {
        const now = Date.now();
        const limit = this.limits.get(key);
        
        if (!limit || now > limit.resetAt) {
            // New window
            this.limits.set(key, {
                count: 1,
                resetAt: now + windowMs
            });
            return { allowed: true, remaining: maxRequests - 1 };
        }
        
        if (limit.count >= maxRequests) {
            return {
                allowed: false,
                remaining: 0,
                resetIn: limit.resetAt - now
            };
        }
        
        limit.count++;
        return {
            allowed: true,
            remaining: maxRequests - limit.count
        };
    }
    
    reset(key) {
        this.limits.delete(key);
    }
}

module.exports = RateLimiter;
```

---

## Next Steps

1. Review this implementation guide
2. Prioritize features based on FEATURE_PRIORITIES.md
3. Start with Quick Win features
4. Set up development environment for dashboard
5. Create detailed tickets for each feature
6. Begin implementation sprints
7. Regular testing and feedback gathering

**Questions or suggestions?** Open a GitHub discussion!

---

**Last Updated:** January 6, 2026  
**Version:** 1.0
