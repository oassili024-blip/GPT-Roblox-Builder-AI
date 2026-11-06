هimport express from "express";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json({ limit: "12kb" }));

const PORT = Number(process.env.PORT || 3000);
const API_KEY = process.env.OPENAI_API_KEY;
const BRIDGE_TOKEN = process.env.BRIDGE_TOKEN;
const MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";

if (!API_KEY || !BRIDGE_TOKEN) {
  console.error("Missing OPENAI_API_KEY or BRIDGE_TOKEN in environment.");
  process.exit(1);
}

const schema = {
  type: "object",
  additionalProperties: false,
  properties: {
    message: { type: "string" },
    parts: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: { type: "string" },
          shape: { type: "string", enum: ["block", "ball", "cylinder"] },
          size: {
            type: "object",
            additionalProperties: false,
            properties: {
              x: { type: "number" },
              y: { type: "number" },
              z: { type: "number" }
            },
            required: ["x", "y", "z"]
          },
          offset: {
            type: "object",
            additionalProperties: false,
            properties: {
              x: { type: "number" },
              y: { type: "number" },
              z: { type: "number" }
            },
            required: ["x", "y", "z"]
          },
          color: {
            type: "object",
            additionalProperties: false,
            properties: {
              r: { type: "number" },
              g: { type: "number" },
              b: { type: "number" }
            },
            required: ["r", "g", "b"]
          },
          material: {
            type: "string",
            enum: [
              "SmoothPlastic", "Concrete", "Wood", "WoodPlanks",
              "Brick", "Slate", "Grass", "Sand", "Metal",
              "Glass", "Neon", "Marble"
            ]
          }
        },
        required: ["name", "shape", "size", "offset", "color", "material"]
      }
    }
  },
  required: ["message", "parts"]
};

const instructions = `
You are GPT Roblox Builder, a scene planner for a Roblox building game.
The user describes a harmless place or structure in Arabic or another language.
Return ONLY a JSON object matching the supplied schema.
Create a visually coherent scene from simple anchored Roblox Parts.
All offsets are relative to a point in front of the player's character.
Use offsets x and z within -120..120 and y within 0..100.
Each size dimension must be between 1 and 80.
Use no more than 45 parts. Prefer a small number of carefully arranged parts.
Use only the allowed shapes and materials from the schema.
Colors are normalized RGB values from 0 to 1.
For buildings, create floors, walls, roofs, doors and windows from parts.
For roads, create flat dark parts and lighter lane markings.
For a city or large scene, create a compact representative first section rather than claiming to create an unlimited world.
Never return scripts, Lua code, URLs, external assets, or instructions to execute code.
Do not create weapons, traps, harmful devices, or realistic dangerous mechanisms.
If the request is unclear or unsafe, return an empty parts array and a short polite message.
`;

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "GPT Roblox Builder Bridge" });
});

app.post("/build", async (req, res) => {
  if (req.get("x-bridge-token") !== BRIDGE_TOKEN) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const prompt = req.body?.prompt;
  if (typeof prompt !== "string" || prompt.trim().length < 1 || prompt.length > 400) {
    return res.status(400).json({ error: "Prompt must be 1-400 characters." });
  }

  try {
    const apiResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: MODEL,
        instructions,
        input: prompt.trim(),
        max_output_tokens: 5000,
        text: {
          format: {
            type: "json_schema",
            name: "roblox_build_plan",
            strict: true,
            schema
          }
        }
      })
    });

    const payload = await apiResponse.json();

    if (!apiResponse.ok) {
      console.error("OpenAI API error:", payload);
      return res.status(502).json({ error: "The AI service returned an error." });
    }

    let outputText = "";
    for (const item of payload.output || []) {
      if (item.type === "message") {
        for (const content of item.content || []) {
          if (content.type === "output_text") outputText += content.text;
        }
      }
    }

    if (!outputText) {
      return res.status(502).json({ error: "The AI returned no build plan." });
    }

    const plan = JSON.parse(outputText);
    if (!Array.isArray(plan.parts)) {
      return res.status(502).json({ error: "Invalid build plan." });
    }

    // Defense in depth: never send more than 45 parts to Roblox.
    plan.parts = plan.parts.slice(0, 45);
    return res.json(plan);
  } catch (error) {
    console.error("Bridge error:", error);
    return res.status(500).json({ error: "Bridge could not create a build plan." });
  }
});

app.listen(PORT, () => {
  console.log(`GPT Roblox Builder Bridge listening on port ${PORT}`);
});
