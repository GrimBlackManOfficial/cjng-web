export default async function handler(req, res) {
    const { code } = req.query;
    if (!code) return res.status(400).send('Chybí autorizační kód z Discordu.');

    try {
        // 1. Výměna kódu za Token
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
        
        if (!tokens.access_token) {
            return res.status(500).json({ 
                error: "Chyba autentizace", 
                message: "Nepodařilo se získat přístupový klíč od Discordu. Zkontroluj CLIENT_SECRET ve Vercelu.",
                details: tokens 
            });
        }

        // 2. Získání informací o uživateli (Základní data)
        const userResponse = await fetch('https://discord.com/api/users/@me', {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
        });
        const userData = await userResponse.json();

        // 3. Získání dat člena konkrétního serveru (pro přezdívku a role)
        const guildId = "1417241414693031988"; 
        
        const memberResponse = await fetch(`https://discord.com/api/users/@me/guilds/${guildId}/member`, {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
        });

        const memberData = await memberResponse.json();

        // Pokud uživatel není na serveru
        if (memberResponse.status === 404) {
            return res.status(403).send(`Přístup odepřen: Uživatel ${userData.username} není členem CJNG serveru.`);
        }

        if (!memberData.roles) {
            return res.status(500).send("Nepodařilo se načíst tvoje role. Zkus se přihlásit znovu.");
        }

        // --- LOGIKA PRO PŘEZDÍVKU ---
        // 1. memberData.nick (přezdívka na serveru)
        // 2. userData.global_name (nové Discord jméno)
        // 3. userData.username (starý Discord handle)
        const finalNickname = memberData.nick || userData.global_name || userData.username;

        // 4. Úspěch -> Směr Dashboard
        // Předáme přezdívku a role v URL adrese
        const userEncoded = encodeURIComponent(finalNickname);
        const rolesEncoded = memberData.roles.join(',');
        
        res.redirect(`/dashboard.html?user=${userEncoded}&roles=${rolesEncoded}`);

    } catch (err) {
        res.status(500).send("Kritická chyba systému: " + err.message);
    }
}
