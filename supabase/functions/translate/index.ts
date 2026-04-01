// @ts-nocheck
// Proxy para DeepL API — evita CORS en el navegador (PWA)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DEEPL_API_URL = 'https://api-free.deepl.com/v2/translate';
const DEEPL_API_KEY = Deno.env.get('DEEPL_API_KEY') || '';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { text, source_lang, target_lang } = await req.json();

    if (!text || !source_lang || !target_lang) {
      return new Response(
        JSON.stringify({ error: 'Missing fields: text, source_lang, target_lang' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!DEEPL_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'DeepL API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // DeepL API v2 — usa Authorization header (auth_key en body está deprecado)
    const deeplResponse = await fetch(DEEPL_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `DeepL-Auth-Key ${DEEPL_API_KEY}`,
      },
      body: JSON.stringify({
        text: [text],
        source_lang: source_lang.toUpperCase(),
        target_lang: target_lang.toUpperCase(),
      }),
    });

    if (!deeplResponse.ok) {
      const errorText = await deeplResponse.text();
      return new Response(
        JSON.stringify({ error: `DeepL error ${deeplResponse.status}`, detail: errorText }),
        { status: deeplResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await deeplResponse.json();
    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
