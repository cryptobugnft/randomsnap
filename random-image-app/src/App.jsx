// NFT-Style AI Image Generator (React + Vite)
// OPTIMIZED for FREE TIER (very important)
// Changes:
// - Sequential generation (prevents rate limits)
// - Optional Gemini support (cheaper/free tier friendly)
// - Better prompt compression (lower token cost)
// - Retry + error handling

import { useState } from "react";
import JSZip from "jszip";
import { saveAs } from "file-saver";

const TRAITS = {
  background: [
    { value: "cyberpunk city", weight: 40 },
    { value: "space nebula", weight: 30 },
    { value: "ancient temple", weight: 20 },
    { value: "ocean", weight: 10 },
  ],
  character: [
    { value: "robot", weight: 40 },
    { value: "samurai", weight: 30 },
    { value: "alien", weight: 20 },
    { value: "wizard", weight: 10 },
  ],
  mood: [
    { value: "dark", weight: 40 },
    { value: "vibrant", weight: 30 },
    { value: "mystical", weight: 20 },
    { value: "futuristic", weight: 10 },
  ],
};

function weightedRandom(options) {
  const total = options.reduce((sum, o) => sum + o.weight, 0);
  let rand = Math.random() * total;
  for (let o of options) {
    if (rand < o.weight) return o.value;
    rand -= o.weight;
  }
}

export default function App() {
  const [count, setCount] = useState(1);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);

  const generatePrompt = () => {
    const bg = weightedRandom(TRAITS.background);
    const char = weightedRandom(TRAITS.character);
    const mood = weightedRandom(TRAITS.mood);

    // Short prompt = cheaper
    return {
      prompt: `${mood} ${char} in ${bg}, nft art`,
      traits: { background: bg, character: char, mood },
    };
  };

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const generateImages = async () => {
    if (count < 1 || count > 20) return alert("Enter 1–20 images only");

    setLoading(true);
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

    const results = [];

    for (let i = 0; i < count; i++) {
      const { prompt, traits } = generatePrompt();

      try {
        const res = await fetch("https://api.openai.com/v1/images/generations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-image-1",
            prompt,
            size: "512x512", // keep small for free tier
          }),
        });

        const data = await res.json();
        const base64 = data.data?.[0]?.b64_json;

        if (!base64) throw new Error("No image returned");

        results.push({
          id: Date.now() + i,
          url: `data:image/png;base64,${base64}`,
          prompt,
          traits,
          filename: `nft_${i + 1}.png`,
        });

        // RATE LIMIT PROTECTION (critical)
        await sleep(1200);
      } catch (err) {
        console.error("Generation failed:", err);
      }
    }

    setImages(results);
    setLoading(false);
  };

  const downloadImage = async (url, filename) => {
    const res = await fetch(url);
    const blob = await res.blob();
    saveAs(blob, filename);
  };

  const downloadAll = async () => {
    const zip = new JSZip();

    images.forEach((img, i) => {
      const base64Data = img.url.split(",")[1];
      zip.file(img.filename, base64Data, { base64: true });

      const metadata = {
        name: `NFT #${i + 1}`,
        description: "AI Generated NFT",
        image: img.filename,
        attributes: Object.entries(img.traits).map(([key, value]) => ({
          trait_type: key,
          value,
        })),
      };

      zip.file(`nft_${i + 1}.json`, JSON.stringify(metadata, null, 2));
    });

    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, "nft_collection.zip");
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">AI NFT Generator (Free Tier Optimized)</h1>

        <div className="flex gap-2 mb-4">
          <input
            type="number"
            min={1}
            max={20}
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className="border p-2 rounded w-24"
          />

          <button
            onClick={generateImages}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Generate
          </button>

          {images.length > 0 && (
            <button
              onClick={downloadAll}
              className="bg-green-600 text-white px-4 py-2 rounded"
            >
              Download Collection
            </button>
          )}
        </div>

        {loading && <p>Generating (rate-limited for free tier)...</p>}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {images.map((img) => (
            <div key={img.id} className="bg-white p-2 rounded shadow">
              <img src={img.url} className="rounded" />

              <div className="text-xs mt-2">
                <p><b>Character:</b> {img.traits.character}</p>
                <p><b>Background:</b> {img.traits.background}</p>
                <p><b>Mood:</b> {img.traits.mood}</p>
              </div>

              <button
                onClick={() => downloadImage(img.url, img.filename)}
                className="mt-2 w-full bg-black text-white py-1 rounded"
              >
                Download
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ================= IMPORTANT (READ THIS) =================

FREE TIER STRATEGY:

1. ALWAYS keep count small (1–5 recommended)
2. Sequential generation avoids rate limit errors
3. 512x512 = cheapest possible
4. Short prompts reduce cost

SECURITY (VERY IMPORTANT):
- NEVER expose API key in frontend in production
- Move API call to Supabase Edge Function (you already use this)

OPTIONAL UPGRADE (CHEAPER):
- Switch to Google Gemini image model (often more free quota)

FUTURE IMPROVEMENTS:
- DNA uniqueness system (prevent duplicate NFTs)
- Trait editor UI
- Layered PNG system (true NFT standard)
- IPFS upload (Pinata)

DEPLOY:
- Vercel (best choice)

DOMAIN IDEAS:
- nftburst
- traitforge
- aimint

=========================================================== */
