export const botConfig = {
  token: process.env.DISCORD_BOT_TOKEN || 'YOUR_BOT_TOKEN',
  clientId: process.env.DISCORD_CLIENT_ID || 'YOUR_CLIENT_ID',
  guildId: process.env.DISCORD_GUILD_ID || 'YOUR_GUILD_ID',
  activity: 'Test Activity',
  adminUserId: 'YOUR_ADMIN_USER_ID',
  environment: 'development',
};

export default botConfig;
