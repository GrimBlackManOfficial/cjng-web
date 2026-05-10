export default async function handler(req, res) {
    const { code } = req.query;
    if (!code) return res.status(400).send('Chybí kód');

    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
        method: 'POST',
        body: new URLSearchParams({
            client_id: process.env.DISCORD_CLIENT_ID,
            client_secret: process.env.DISCORD_CLIENT_SECRET,
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: process.env.DISCORD_REDIRECT_URI,
        }),
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    const tokens = await tokenResponse.json();

    const guildId = 1417241414693031988; 
    const memberResponse = await fetch(`https://discord.com/api/users/@me/guilds/${guildId}/member`, {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const memberData = await memberResponse.json();

    // Pošleme data na dashboard
    res.redirect(`/dashboard.html?user=${memberData.user.username}&roles=${memberData.roles.join(',')}`);
}
