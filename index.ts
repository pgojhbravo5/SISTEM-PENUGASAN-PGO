// Supabase Edge Function: hantar-push
// Dicetuskan oleh Database Webhook (INSERT pada jadual "notifikasi"), hantar Web Push kepada semua langganan.
import { createClient } from 'npm:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';

// TUKAR ikut jadual/lajur sebenar yang diisi oleh fungsi RPC daftar_push anda
const TABLE = 'push_langganan';
const COL = { endpoint: 'endpoint', p256dh: 'p256dh', auth: 'kunci' };

webpush.setVapidDetails(
  'mailto:admin@pgo.local',
  Deno.env.get('VAPID_PUBLIC')!,
  Deno.env.get('VAPID_PRIVATE')!,
);

Deno.serve(async (req) => {
  try {
    const { record: n } = await req.json();
    if (!n?.mesej) return new Response('skip');

    const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: subs, error } = await sb.from(TABLE).select('*');
    if (error) throw error;

    const alarm = n.jenis === 'alarm';
    // Hantar semua medan supaya sesuai dengan sw.js lama (tajuk, mesej, alarm) dan baharu (jenis, mesej, dari)
    const payload = JSON.stringify({
      tajuk: alarm ? 'ALARM' : 'Notifikasi',
      mesej: n.mesej,
      dari: n.dari,
      jenis: n.jenis,
      alarm,
    });
    const mati: string[] = [];

    await Promise.all((subs ?? []).map(async (s: any) => {
      try {
        await webpush.sendNotification(
          { endpoint: s[COL.endpoint], keys: { p256dh: s[COL.p256dh], auth: s[COL.auth] } },
          payload,
          { TTL: 300, urgency: 'high' },
        );
      } catch (e: any) {
        if (e.statusCode === 404 || e.statusCode === 410) mati.push(s[COL.endpoint]);
        else console.error('push gagal', e.statusCode, e.body);
      }
    }));

    if (mati.length) await sb.from(TABLE).delete().in(COL.endpoint, mati);
    return new Response(JSON.stringify({ dihantar: (subs?.length ?? 0) - mati.length, dibuang: mati.length }));
  } catch (e) {
    console.error(e);
    return new Response(String(e), { status: 500 });
  }
});