import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

export default async function handler(req, res) {
    const { code } = req.query;
    if (!code) return res.status(400).send('Chybí kód.');

    try {
        // 1. Token z Discordu
        const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
            method: 'POST',
            body: new URLSearchParams({
                client_id: process.env.DISCORD_CLIENT_ID,
                client_secret: process.env.DISCORD_CLIENT_SECRET,
                grant_type: 'authorization_code',
                code,
                redirect_uri: process.env.DISCORD_REDIRECT_URI,
            }),
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });
        const tokens = await tokenResponse.json();

        // 2. Info o uživateli z Discordu (získáme jeho ID)
        const userResponse = await fetch('https://discord.com/api/users/@me', {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
        });
        const discordUser = await userResponse.json();

        // 3. Kontrola v tabulce zamestnanci podle user_id
        const { data: zamestnanec } = await supabase
            .from('zamestnanci')
            .select('jmeno_prijmeni, prezdivka')
            .eq('user_id', discordUser.id)
            .single();

        if (!zamestnanec) {
            return res.status(403).send("Nejsi v databázi kartelu. Kontaktuj Maestra.");
        }

        // 4. Získání rolí na serveru (pro přístup do admin sekce)
        const guildId = "1417241414693031988";
        const memberResponse = await fetch(`https://discord.com/api/users/@me/guilds/${guildId}/member`, {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
        });
        const memberData = await memberResponse.json();
        const roles = (memberData.roles || []).join(',');

        // Přesměrování na dashboard s parametry
        const name = encodeURIComponent(zamestnanec.jmeno_prijmeni);
        const nick = encodeURIComponent(zamestnanec.prezdivka || "");
        res.redirect(`/dashboard.html?id=${discordUser.id}&name=${name}&nick=${nick}&roles=${roles}`);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}
