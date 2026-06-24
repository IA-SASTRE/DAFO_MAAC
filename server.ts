import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("La variable de entorno GEMINI_API_KEY no está configurada.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Endpoint para generar DAFO inteligente con Gemini
app.post("/api/generar-dafo", async (req, res) => {
  try {
    const { contexto, normas, misionVision } = req.body;

    if (!contexto) {
      return res.status(400).json({ error: "El contexto es requerido." });
    }

    const ai = getAiClient();
    const normaStr = Array.isArray(normas) ? normas.join(", ") : (normas || "ISO 9001:2018");
    const mvStr = misionVision ? `Misión/Visión del cliente: "${misionVision}"` : "No se especificó Misión o Visión.";

    const prompt = `Actúa como un Consultor Experto en Sistemas de Gestión de Calidad (normas: ${normaStr}) e ISO 31000 de Gestión de Riesgos.
Analiza el siguiente contexto organizacional y genera una matriz DAFO estructurada con exactamente 5 ejemplos muy realistas para cada una de las 4 categorías: Fortalezas, Oportunidades, Debilidades y Amenazas.

Contexto de la organización:
"${contexto}"

${mvStr}

Instrucciones críticas:
1. Genera exactamente 5 ítems de alta calidad y muy específicos por cada categoría (fortalezas, oportunidades, debilidades, amenazas).
2. Si se proporcionó Misión y Visión, alinea la generación con ellas. Si no, ignora ese aspecto.
3. Para cada ítem generado, clasifícalo en una de las siguientes categorías de riesgo (tipo de riesgo):
   - 'Estratégico'
   - 'Operativo'
   - 'Financiero'
   - 'Regulatorio'
   - 'Global'
   - 'Conflicto de interés'
4. La respuesta debe ser un objeto JSON con la estructura indicada en la configuración de respuesta.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["fortalezas", "oportunidades", "debilidades", "amenazas"],
          properties: {
            fortalezas: {
              type: Type.ARRAY,
              description: "Lista de 5 fortalezas internas con su tipo de riesgo asociado.",
              items: {
                type: Type.OBJECT,
                required: ["text", "tipo"],
                properties: {
                  text: { type: Type.STRING, description: "Descripción de la fortaleza." },
                  tipo: {
                    type: Type.STRING,
                    description: "Clasificación de riesgo: 'Estratégico', 'Operativo', 'Financiero', 'Regulatorio', 'Global' o 'Conflicto de interés'.",
                  },
                },
              },
            },
            oportunidades: {
              type: Type.ARRAY,
              description: "Lista de 5 oportunidades externas con su tipo de riesgo asociado.",
              items: {
                type: Type.OBJECT,
                required: ["text", "tipo"],
                properties: {
                  text: { type: Type.STRING, description: "Descripción de la oportunidad." },
                  tipo: {
                    type: Type.STRING,
                    description: "Clasificación de riesgo: 'Estratégico', 'Operativo', 'Financiero', 'Regulatorio', 'Global' o 'Conflicto de interés'.",
                  },
                },
              },
            },
            debilidades: {
              type: Type.ARRAY,
              description: "Lista de 5 debilidades internas con su tipo de riesgo asociado.",
              items: {
                type: Type.OBJECT,
                required: ["text", "tipo"],
                properties: {
                  text: { type: Type.STRING, description: "Descripción de la debilidad." },
                  tipo: {
                    type: Type.STRING,
                    description: "Clasificación de riesgo: 'Estratégico', 'Operativo', 'Financiero', 'Regulatorio', 'Global' o 'Conflicto de interés'.",
                  },
                },
              },
            },
            amenazas: {
              type: Type.ARRAY,
              description: "Lista de 5 amenazas externas con su tipo de riesgo asociado.",
              items: {
                type: Type.OBJECT,
                required: ["text", "tipo"],
                properties: {
                  text: { type: Type.STRING, description: "Descripción de la amenaza." },
                  tipo: {
                    type: Type.STRING,
                    description: "Clasificación de riesgo: 'Estratégico', 'Operativo', 'Financiero', 'Regulatorio', 'Global' o 'Conflicto de interés'.",
                  },
                },
              },
            },
          },
        },
      },
    });

    const jsonText = response.text?.trim() || "{}";
    const parsedData = JSON.parse(jsonText);
    res.json(parsedData);
  } catch (error: any) {
    console.error("Error al generar DAFO:", error);
    res.status(500).json({ error: error?.message || "Ocurrió un error inesperado al generar el DAFO." });
  }
});

// Setup Vite middleware in dev or serve static files in production
async function setupServer() {
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
    console.log(`Servidor iniciado en http://localhost:${PORT}`);
  });
}

setupServer().catch((err) => {
  console.error("Error al iniciar el servidor:", err);
});
