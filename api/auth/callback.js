import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

export default async function handler(req, res) {
    const { code } = req.query;
    if (!code) return res.status(400).send('Chybí autorizační kód.');

    try {
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
        const userResponse = await fetch('https://discord.com/api/users/@me', {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
        });
        const userData = await userResponse.json();

        // --- ÚPRAVA: Kontrola v Supabase tabulce 'zamestnanci' ---
        const { data: zamestnanec, error } = await supabase
            .from('zamestnanci')
            .select('*')
            .eq('user_id', userData.id)
            .single();

        if (!zamestnanec) {
            return res.status(403).send(`Přístup odepřen: ID ${userData.id} není v databázi kartelu.`);
        }

        // Získání rolí pro dashboard
        const guildId = "1417241414693031988";
        const memberRes = await fetch(`https://discord.com/api/users/@me/guilds/${guildId}/member`, {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
        });
        const memberData = await memberRes.json();

        const userEncoded = encodeURIComponent(zamestnanec.jmeno_prijmeni);
        const rolesEncoded = (memberData.roles || []).join(',');
        
        // Posíláme i discord_id pro sčítání drog
        res.redirect(`/dashboard.html?user=${userEncoded}&roles=${rolesEncoded}&id=${userData.id}`);

    } catch (err) {
        res.status(500).send("Chyba: " + err.message);
    }
}
