import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Enable larger payloads for base64 image streams
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ limit: "20mb", extended: true }));

let ai: GoogleGenAI | null = null;

// Lazy initialization of Gemini Client to prevent startup crashes when API keys are pending
function getGeminiClient(): GoogleGenAI {
  if (!ai) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not defined");
    }
    ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return ai;
}

// Endpoint to analyze face snapshot
app.post("/api/analyze-face", async (req, res) => {
  try {
    const { image, calibrationMode } = req.body; // base64 data string + calibration mode
    if (!image) {
      return res.status(400).json({ error: "No image data provided" });
    }

    // Clean base64 string
    const match = image.match(/^data:(image\/\w+);base64,(.+)$/);
    let mimeType = "image/jpeg";
    let base64Data = image;

    if (match) {
      mimeType = match[1];
      base64Data = match[2];
    }

    const client = getGeminiClient();

    // Set prompt dynamic instructions based on calibration tuning to avoid overestimating ages due to webcam artefacts
    let calibrationInstruction = "";
    if (calibrationMode === "teens_gen_z") {
      calibrationInstruction = "CRITICAL BIAS ADJUSTMENT: The subject claims to be young/young adult / teen. Under typical laptop/webcam hardware or dim room overhead lighting, subtle forehead lines, glare, skin textures, and under-eye shadow lines are highly exaggerated. You MUST focus intensely on genuine youthful structural indicators. Ensure you estimate age with conservative accuracy, leaning young rather than older.";
    } else if (calibrationMode === "under_25" || calibrationMode === "youthful") {
      calibrationInstruction = "CALIBRATION SETTING - Youth/Preservation Tuning: The user is utilizing a standard computer front-facing camera. Webcam configurations heavily distort skin tone, introduce digital grain, and create deep shadows around the nose and eyes, which can artificially age the face. Carefully differentiate between actual mature aging and common camera environment shadows/grain. Prefer estimating a precise, realistic, and youthful age.";
    } else {
      calibrationInstruction = "CALIBRATION SETTING - Standard: Analyze the visual demographic indicators neutrally and objectively, estimating the true visual age of the face.";
    }

    const prompt = `Analyze this face image. Locate all human faces in the image.
For each face, detect the precise bounding box enclosing structural landmarks (eyes, nose, mouth, cheeks, and chin).
Return the results in the requested schema.
The coordinates 'ymin', 'xmin', 'ymax', 'xmax' must reflect raw percentages normalized as floats from 0.0 to 1.0 where (ymin=0, xmin=0) represents the top-left and (ymax=1, xmax=1) represents the bottom-right of the image.

${calibrationInstruction}

Provide the estimated age, gender (e.g. Female, Male, Non-binary), mood/expression (e.g. Serious, Joyful, Thoughtful, Neutral), and dynamic, context-aware personalized lifestyle, skincare, and style suggestions.`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        {
          inlineData: {
            mimeType: mimeType,
            data: base64Data,
          },
        },
        {
          text: prompt,
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            faces: {
              type: Type.ARRAY,
              description: "List of all human faces detected in the image",
              items: {
                type: Type.OBJECT,
                properties: {
                  box: {
                    type: Type.OBJECT,
                    description: "Bounding box enclosing the face landmarks from 0.0 to 1.0.",
                    properties: {
                      ymin: { type: Type.NUMBER, description: "Top bounds (0.0=top, 1.0=bottom)" },
                      xmin: { type: Type.NUMBER, description: "Left bounds (0.0=left, 1.0=right)" },
                      ymax: { type: Type.NUMBER, description: "Bottom bounds (0.0=top, 1.0=bottom)" },
                      xmax: { type: Type.NUMBER, description: "Right bounds (0.0=left, 1.0=right)" },
                    },
                    required: ["ymin", "xmin", "ymax", "xmax"],
                  },
                  age: { type: Type.INTEGER, description: "Estimated age in years" },
                  gender: { type: Type.STRING, description: "Inferred gender demographic" },
                  confidence: { type: Type.NUMBER, description: "Estimation confidence level from 0.0 to 1.0" },
                  mood: { type: Type.STRING, description: "Estimated mood or facial expression details" },
                  recommendations: {
                    type: Type.OBJECT,
                    properties: {
                      skincare: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                        description: "3 highly tailored skincare advice points appropriate for this age and gender context",
                      },
                      style: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                        description: "3 personalized style, haircut, jewelry, structure, or fashion aesthetic choices",
                      },
                      lifestyle: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                        description: "3 wellness, hydration, stress, or posture practices for their age/demographic group",
                      },
                    },
                    required: ["skincare", "style", "lifestyle"],
                  },
                },
                required: ["box", "age", "gender", "confidence", "mood", "recommendations"],
              },
            },
          },
          required: ["faces"],
        },
      },
    });

    const outputText = response.text;
    if (!outputText) {
      throw new Error("Empty analysis response received from Gemini.");
    }

    const data = JSON.parse(outputText.trim());
    return res.json(data);
  } catch (error: any) {
    console.error("Analysis Exception:", error);
    return res.status(500).json({
      error: error.message || "An unexpected error occurred during face demographic ingestion.",
    });
  }
});

// Serve frontend assets
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Live Face Demographic server listening on node port ${PORT}`);
  });
}

startServer();
