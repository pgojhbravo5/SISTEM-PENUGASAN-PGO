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
  
      const systemInstruction = `Anda ialah Tupai Bomba, pembantu AI mesra, ringkas dan profesional untuk anggota Pusat Gerakan Operasi (PGO) Bomba Johor.
  Gunakan Bahasa Melayu yang santai tapi sopan. Jawab padat (2-5 ayat kecuali diminta terperinci).
  Gunakan data langsung aplikasi di bawah untuk menjawab soalan tentang syif, rehat, stesen, atau anggota bertugas:
  
  ${konteks || 'Tiada data langsung.'}`;
  
      const contents = [
        ...(Array.isArray(sejarah) ? sejarah.slice(-6) : []),
        { role: 'user', parts: [{ text: soalan }] },
      ];
  
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
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