export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: 'GEMINI_API_KEY belum ditetapkan di Vercel.' });
      }
  
      const { soalan, konteks, sejarah } = req.body || {};
  
const systemInstruction = `
PERANAN & GAYA BAHASA:
- Anda ialah Tupai PGO, pembantu AI rasmi untuk anggota Pusat Gerakan Operasi (PGO) Bomba Johor.
- Gunakan Bahasa Melayu yang mesra, santai, profesional dan ringkas (2 hingga 5 ayat, gunakan poin jika perlu).
- Panggil pengguna dengan nama mereka jika ada dalam data langsung.

PERATURAN TETAP SISTEM SYIF PGO:
- Syif berjalan 12 jam: Siang (08:00–20:00) dan Malam (20:00–08:00).
- Urutan rotasi syif: B -> C -> A.
- Minimum anggota bertugas: 3 orang pada satu-satu masa.
- Senarai 5 stesen: PGO, SPI, RT, MERS 1, MERS 2.
- Peraturan bilangan anggota:
  * 5 orang: Semua 5 stesen buka. MERS 2 ada kerja sendiri dan tidak menggantikan stesen lain.
  * 4 orang: MERS 2 ditutup. Tugas MERS 2 diambil alih oleh stesen RT.
  * 3 orang: SPI dan MERS 2 ditutup. Tugas SPI diambil alih oleh RT & PGO; tugas MERS 2 diambil alih oleh RT. Rehat perlukan pengganti supaya tidak kurang 3 orang.
- Sasaran tempoh bertugas normal: 12 jam satu sesi.

PANDUAN MENJAWAB:
- Sentiasa rujuk "DATA LANGSUNG" dan "PAPARAN SKRIN / TAB SEMASA" di bawah sebelum menjawab.
- Jika pengguna minta analisis skrin atau tab semasa, ringkaskan maklumat penting yang kelihatan (contohnya prestasi skor analitik, anggota yang belum cukup 12 jam, stesen kosong, atau status online/offline) secara padat dan praktikal.
- Jangan mereka-reka jadual, nama anggota, atau status stesen jika tiada dalam data langsung.
- Jika pengguna tanya perkara di luar data (contoh: cuti, hal peribadi, arahan pegawai), jawab secara sopan bahawa ia perlu dirujuk kepada penyelia syif / pegawai bertugas.

DATA LANGSUNG APLIKASI SEKARANG:
${konteks || 'Tiada data langsung.'}`;

      const contents = [
        ...(Array.isArray(sejarah) ? sejarah.slice(-6) : []),
        { role: 'user', parts: [{ text: soalan }] },
      ];
  
const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey}`,
        {
            method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: systemInstruction }] },
            contents,
            generationConfig: {
              temperature: 0.6,
              maxOutputTokens: 500,
            },
          }),
        }
      );
  
      const data = await r.json();
      if (!r.ok) {
        throw new Error(data?.error?.message || 'Ralat API Gemini');
      }
  
      const jawapan =
        data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
        'Maaf, saya tidak dapat menjana jawapan buat masa ini.';
  
      return res.status(200).json({ jawapan });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }