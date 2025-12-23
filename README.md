# 🤖 DTEmpire v2 Discord Bot

A feature-rich, multi-purpose Discord bot with AI capabilities, moderation tools, music streaming, economy system, and much more. Designed for modern Discord servers looking for an all-in-one solution.

---

## ✨ Features

### 📁 **AI Integration** (4 commands)
- **aichat** - Chat with various AI models
- **imagegen** - Generate AI-powered images
- **tts** - Convert text to speech
- **videogen** - Generate videos using AI

### 📁 **Admin Tools** (2 commands)
- **setchannel** - Set various channel configurations for the server
- **setlogs** - Automatically create essential log channels in a specified category

### 📁 **Config** (1 command)
- **setguildjoin** - Set a channel to see new servers the bot is joining

### 📁 **Economy System** (1 command)
- **economy** - Advanced economy system with properties, jobs, and lottery

### 📁 **Fun & Games** (3 commands)
- **giveaway** - Manage giveaways in your server
- **snipe** - Show recently deleted/edited messages and ghost pings
- **sticky** - Manage sticky messages in channels

### 📁 **Information** (2 commands)
- **getguilds** - Display info about multiple servers
- **servers** - Display all servers the bot is in

### 📁 **Leveling System** (1 command)
- **level** - Level system - check your rank and progress

### 📁 **Moderation** (3 commands)
- **cleanup** - Cleanup and message management commands
- **mod** - Moderation commands for server management
- **welcome** - Configure welcome/leave messages

### 📁 **Owner Tools** (1 command)
- **globalbadwords** - Bot owner only - Manage global bad words for all servers

### 📁 **Ticket System** (1 command)
- **ticket** - Complete ticket system commands for support management

### 📁 **Utility** (11 commands)
- **announce** - Create beautiful announcements like in the example image
- **autoroom** - Setup automatic voice channel creation
- **dm** - Send a direct message to a user
- **help** - Shows all available commands
- **info** - Shows information about the bot
- **invite** - Get bot invite links and support server
- **restart** - Restart the bot (Owner only)
- **serverstats** - Get detailed statistics about the server
- **uptime** - Shows bot uptime and system resource usage
- **whois** - Get information about a user
- **youtube** - Setup YouTube notifications for your channel

### 📁 **Music System** (9 commands)
- **music** - Show music commands help
- **nowplaying** - Show information about the current song
- **pause** - Pause the current song
- **play** - Play music from YouTube, Spotify, etc.
- **queue** - Show the current music queue
- **resume** - Resume the paused song
- **skip** - Skip the current song
- **stop** - Stop the music and clear the queue
- **volume** - Adjust the music volume

---

## 🚀 Quick Setup

### Invite the Bot:
[![Invite DTEmpire](https://img.shields.io/badge/Invite-DTEmpire-blue?style=for-the-badge&logo=discord)](https://dsc.gg/dtempirev2)

### Support Server:
[![Support Server](https://img.shields.io/badge/Support-Server-purple?style=for-the-badge&logo=discord)](https://discord.gg/eVuKw3VrvX)

### Prefix: `^`
### Version: 2.6.9
### Total Commands: 39

---

## 📋 Detailed Command Guide

### 🤖 **AI Commands**
| Command | Description | Usage |
|---------|-------------|-------|
| `^aichat` | Chat with AI using different models | `^aichat <your message>` |
| `^imagegen` | Generate images using AI | `^imagegen <prompt>` |
| `^tts` | Convert text to speech | `^tts <text>` |
| `^videogen` | Generate videos using AI | `^videogen <prompt>` |

### ⚙️ **Admin Commands**
| Command | Description | Usage |
|---------|-------------|-------|
| `^setchannel` | Set various channel configurations | `^setchannel <type> <#channel>` |
| `^setlogs` | Auto-create essential log channels | `^setlogs [category-name]` |

### 🔧 **Config Commands**
| Command | Description | Usage |
|---------|-------------|-------|
| `^setguildjoin` | Set channel for new server notifications | `^setguildjoin <#channel>` |

### 💰 **Economy Commands**
| Command | Description | Usage |
|---------|-------------|-------|
| `^economy` | Advanced economy system | `^economy balance`<br>`^economy work`<br>`^economy properties`<br>`^economy lottery` |

### 🎮 **Fun Commands**
| Command | Description | Usage |
|---------|-------------|-------|
| `^giveaway` | Manage giveaways | `^giveaway create <time> <winners> <prize>` |
| `^snipe` | Show deleted/edited messages | `^snipe` |
| `^sticky` | Manage sticky messages | `^sticky set <message>`<br>`^sticky remove` |

### ℹ️ **Info Commands**
| Command | Description | Usage |
|---------|-------------|-------|
| `^getguilds` | Display info about multiple servers | `^getguilds` |
| `^servers` | Display all servers bot is in | `^servers` |

### 📊 **Leveling Commands**
| Command | Description | Usage |
|---------|-------------|-------|
| `^level` | Check rank and progress | `^level`<br>`^level [@user]` |

### 🛡️ **Moderation Commands**
| Command | Description | Usage |
|---------|-------------|-------|
| `^cleanup` | Cleanup messages | `^cleanup <amount>` |
| `^mod` | Moderation commands | `^mod kick @user`<br>`^mod ban @user`<br>`^mod mute @user` |
| `^welcome` | Configure welcome messages | `^welcome setup` |

### 👑 **Owner Commands**
| Command | Description | Usage |
|---------|-------------|-------|
| `^globalbadwords` | Manage global bad words | `^globalbadwords add <word>`<br>`^globalbadwords list` |

### 🎫 **Ticket Commands**
| Command | Description | Usage |
|---------|-------------|-------|
| `^ticket` | Ticket system | `^ticket setup`<br>`^ticket close`<br>`^ticket add @user` |

### 🛠️ **Utility Commands**
| Command | Description | Usage |
|---------|-------------|-------|
| `^announce` | Create announcements | `^announce <title> \| <description>` |
| `^autoroom` | Setup auto voice channels | `^autoroom setup <channel>` |
| `^dm` | Send DM to user | `^dm @user <message>` |
| `^help` | Show commands | `^help [category]` |
| `^info` | Bot information | `^info` |
| `^invite` | Invite links | `^invite` |
| `^restart` | Restart bot (Owner) | `^restart` |
| `^serverstats` | Server statistics | `^serverstats` |
| `^uptime` | Bot uptime | `^uptime` |
| `^whois` | User information | `^whois [@user]` |
| `^youtube` | YouTube notifications | `^youtube setup <channel_id>` |

### 🎵 **Music Commands**
| Command | Description | Usage |
|---------|-------------|-------|
| `^music` | Music help | `^music` |
| `^nowplaying` | Current song info | `^nowplaying` |
| `^pause` | Pause song | `^pause` |
| `^play` | Play music | `^play <song/url>` |
| `^queue` | Show queue | `^queue` |
| `^resume` | Resume song | `^resume` |
| `^skip` | Skip song | `^skip` |
| `^stop` | Stop music | `^stop` |
| `^volume` | Adjust volume | `^volume <1-100>` |

---

## ⚙️ Configuration Guide

### Setting Up Log Channels
```bash
^setlogs
```
Automatically creates essential log channels in a specified category including:
- Moderation logs
- Message logs
- Member logs
- Server logs

### Channel Configuration
```bash
^setchannel welcome #welcome-channel
^setchannel logs #mod-logs
^setchannel music #music-commands
```
Configure specific channels for different bot functions.

### Ticket System Setup
```bash
^ticket setup
```
Creates a ticket system with:
- Ticket creation panel
- Support team management
- Transcript logging

### Auto Room Setup
```bash
^autoroom setup #voice-lobby
```
Creates automatic voice channels when users join the lobby channel.

---

## 🎮 Economy System Features

### **Properties System**
- Buy and sell virtual properties
- Property upgrades and management
- Rental income system

### **Job System**
- Complete jobs to earn currency
- Different job types with varying rewards
- Cooldown management

### **Lottery System**
- Regular lottery drawings
- Ticket purchases
- Jackpot prizes

### **Banking Features**
- Secure currency storage
- Interest system
- Transaction history

---

## 🎵 Music System Features

### **Supported Sources:**
- YouTube (videos, playlists, live streams)
- Spotify (tracks, albums, playlists)
- SoundCloud
- Direct audio links

### **Quality Features:**
- High-quality audio playback
- Queue management (shuffle, clear, remove)
- Lyrics display (if available)
- 24/7 radio mode

---

## 🛡️ Moderation System

### **Automated Features:**
- Welcome/leave messages
- Auto-moderation with bad word filtering
- Mass message cleanup
- User warning system

### **Manual Controls:**
- Kick/ban with reason logging
- Temporary mutes
- User information lookup
- Server lockdown capabilities

---

## 🔧 Requirements

- **Node.js**: v16.9.0 or higher
- **Discord.js**: v14 or higher
- **Permissions**: Administrator recommended for full functionality
- **Python**: Required for AI features (optional)

### **Bot Permissions Required:**
```
- Administrator (recommended)
OR
- Manage Channels
- Manage Messages  
- Kick/Ban Members
- Manage Roles
- Connect/Speak in Voice Channels
- Embed Links
- Attach Files
- Read Message History
```

---

## 🛠️ Self-Hosting

1. **Clone the repository:**
```bash
git clone https://github.com/yourusername/DTEmpire.git
cd DTEmpire
```

2. **Install dependencies:**
```bash
npm install
```

3. **Configure environment variables:**
Create a `.env` file:
```env
DISCORD_TOKEN=your_bot_token_here
SPOTIFY_CLIENT_ID=your_spotify_id
SPOTIFY_CLIENT_SECRET=your_spotify_secret
OPENAI_API_KEY=your_openai_key
DATABASE_URL=your_database_url
```

4. **Start the bot:**
```bash
npm start
# or for development
npm run dev
```

---

## 📊 Statistics & Performance

- **Version**: 2.6.9
- **Total Commands**: 39
- **Categories**: 12
- **Uptime**: 99.8%+
- **Response Time**: < 100ms
- **Memory Usage**: Optimized for large servers

---

## 🤝 Support & Community

### **Official Support Channels:**
- **Discord**: [DTEmpire Support Server](https://discord.gg/eVuKw3VrvX)
- **Documentation**: [Full Documentation](https://docs.ankitgupta.com.np/)
- **GitHub**: [Issues & Features](https://github.com/hyperdargo/DTEmpire-v2/issues)

### **Getting Help:**
1. Check `^help` for command information
2. Visit the support server
3. Read the documentation
4. Submit bug reports on GitHub

---

## 🔄 Update Log

### **What's New in v2.6.9:**
- 39 total commands across 12 categories
- Enhanced AI capabilities
- Improved music system stability
- Bug fixes and performance improvements

### **Planned Features:**
- More AI model integrations
- Advanced economy trading
- Custom command creation
- Dashboard web interface

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👤 Author & Credits

**Created by DargoTamber**
- GitHub: [@hyperdargo](https://github.com/hyperdargo)
- Discord: DargoTamber
- Website: [ankitgupta.com.np](https://ankitgupta.com.np)

### **Contributors:**
- Open source community
- Beta testers
- Feature suggestors

---

*Last Updated: DTEmpire v2.6.9 | Created with ❤️ for the Discord community*

**Prefix:** `^` | **Commands:** 39 | **Categories:** 12
