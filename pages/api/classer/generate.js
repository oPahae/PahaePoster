import axios from "axios";
import { AI_SYNTAX_PROMPT } from "../../../lib/classDiagramSyntax";

function extractText(payload) {
  if (typeof payload === "string") return payload;
  if (payload && typeof payload === "object") {
    if (typeof payload.response === "string") return payload.response;
    if (typeof payload.result === "string") return payload.result;
    if (typeof payload.text === "string") return payload.text;
    if (typeof payload.message === "string") return payload.message;
    if (typeof payload.answer === "string") return payload.answer;
    if (payload.choices && payload.choices[0] && payload.choices[0].message) {
      return payload.choices[0].message.content || "";
    }
    return JSON.stringify(payload);
  }
  return String(payload || "");
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Methode non autorisee" });
  }

  const { context } = req.body || {};
  if (!context || !context.trim()) {
    return res.status(400).json({ error: "Contexte requis" });
  }

  try {
    const { data } = await axios.get("https://pahae-utils.vercel.app/api/responseAI", {
      params: { data: context, prompt: AI_SYNTAX_PROMPT },
      timeout: 60000
    });
    const raw = extractText(data);
    return res.status(200).json({ raw });
  } catch (error) {
    const message = error.response ? `Erreur API IA (${error.response.status})` : error.message;
    return res.status(400).json({ error: message });
  }
}
