export default async () => {
  const siteUrl = process.env.URL ?? process.env.DEPLOY_PRIME_URL;
  const secret = process.env.CRON_SECRET;

  if (!siteUrl) {
    console.error("URL nicht gesetzt — Sync übersprungen");
    return { statusCode: 500 };
  }

  const headers = secret ? { Authorization: `Bearer ${secret}` } : {};

  try {
    const res = await fetch(`${siteUrl}/api/cron/sync-results`, { headers });
    const body = await res.text();
    console.log(`Sync ${res.status}: ${body}`);
    return { statusCode: res.ok ? 200 : res.status };
  } catch (e) {
    console.error("Sync fehlgeschlagen:", e);
    return { statusCode: 500 };
  }
};
