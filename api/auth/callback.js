// ŽÁDNÉ IMPORTY - Vercel si s tím poradí sám
export default async function handler(req, res) {
    const { code } = req.query;

    if (!code) {
        return res.status(400).send('Chybí autorizační kód z Discordu.');
    }

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
            return res.status(500).json({ error: "Chyba autentizace", details: tokens });
        }

        // 2. Získání dat o uživateli (ID)
        const userRes = await fetch('https://discord.com/api/users/@me', {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
        });
        const userData = await userRes.json();

        // 3. Kontrola v Supabase přes REST API (abychom nemuseli importovat supabase-js)
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_ANON_KEY;

        const dbRes = await fetch(`${supabaseUrl}/rest/v1/zamestnanci?user_id=eq.${userData.id}&select=*`, {
            headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`
            }
        });

        const zamestnanci = await dbRes.json();
        const zamestnanec = zamestnanci[0];

        if (!zamestnanec) {
            return res.status(403).send(`PŘÍSTUP ODEPŘEN: ID ${userData.id} není v databázi kartelu.`);
        }

        // 4. Získání členství na serveru (role)
        const guildId = "1417241414693031988";
        const memberRes = await fetch(`https://discord.com/api/users/@me/guilds/${guildId}/member`, {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
        });
        const memberData = await memberRes.json();

        // 5. Příprava dat pro Dashboard
        const finalNickname = zamestnanec.jmeno_prijmeni || userData.username;
        const userEncoded = encodeURIComponent(finalNickname);
        const rolesEncoded = (memberData.roles || []).join(',');
        
        // PŘESMĚROVÁNÍ NA DASHBOARD
        return res.redirect(`/dashboard.html?user=${userEncoded}&roles=${rolesEncoded}&id=${userData.id}`);

    } catch (err) {
        return res.status(500).send("Kritická chyba: " + err.message);
    }
}
