const { Client, GatewayIntentBits, Events } = require('discord.js');
const mysql = require('mysql2');
const { token } = require('./config.json');

const dbConnection = mysql.createConnection({
    host: '*',
    user: '*',
    password: '*',
    database: '*'
});

// 連接到 MySQL 數據庫
dbConnection.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL database!');
});

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
    ],
});

client.once(Events.ClientReady, readyClient => {
    console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

client.on(Events.MessageCreate, async (message) => {
    if (message.content.startsWith('!')) {
        const userInput = message.content.slice('!'.length).trim();
        const query = 'SELECT spongebob_id, name, url FROM spongebob WHERE name LIKE ?';
        const queryParams = [`%${userInput}%`];

        try {
            const rows = await new Promise((resolve, reject) => {
                dbConnection.query(query, queryParams, (err, rows) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve(rows);
                });
            });
            if(rows.length == 1){
                const result = rows[0];
                const url = result.url;

                // 使用 channel.send 方法，回應給觸發指令的用戶
                message.channel.send(`${url}`);
            }
            else{
                if (rows.length > 0) {
                    let index = 0;
                    let resultString = '';
    
                    while (index < rows.length) {
                        const result = rows[index];
                        const id = result.spongebob_id;
                        const name = result.name;
    
                        resultString += `${id}: ${name}\n`;
                        index++;
                    }
    
                    // 使用 reply 方法，僅將整個字串回應給觸發指令的用戶，並且唯讀
                    const replyMessage = await message.reply(resultString, { allowedMentions: { repliedUser: true } });
    
                    // 設定唯讀
                    replyMessage.suppressEmbeds(true);
                } else {
                    // 使用 reply 方法，僅將結果回應給觸發指令的用戶，並且唯讀
                    const replyMessage = await message.reply(`No match found for ${userInput}`, { allowedMentions: { repliedUser: true } });
    
                    // 設定唯讀
                    replyMessage.suppressEmbeds(true);
                }
            }
            
            
        } catch (err) {
            console.error('Error querying MySQL:', err);
        }
    }
});


client.on(Events.MessageCreate, async (message) => {
    if (message.content.startsWith(';')) {
        const userInput = message.content.slice(';'.length).trim();
        const query = 'SELECT url FROM spongebob WHERE spongebob_id = ?';
        const queryParams = [userInput]; // 直接使用用戶輸入的內容作為id參數

        try {
            const rows = await new Promise((resolve, reject) => {
                dbConnection.query(query, queryParams, (err, rows) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve(rows);
                });
            });

            if (rows.length > 0) {
                const result = rows[0];
                const url = result.url;

                // 使用 channel.send 方法，回應給觸發指令的用戶
                message.channel.send(`${url}`);

            } else {
                // 使用 channel.send 方法，回應給觸發指令的用戶
                message.channel.send(`No match found for ID ${userInput}`, { allowedMentions: { repliedUser: true } });
            }
        } catch (err) {
            console.error('Error querying MySQL:', err);
        }
    }
});

client.login(token);
