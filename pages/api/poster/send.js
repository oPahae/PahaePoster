import axios from "axios";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Methode non autorisee" });
  }

  const { method = "GET", url, headers = {}, body } = req.body || {};
  if (!url) return res.status(400).json({ error: "URL requise" });

  const start = Date.now();
  try {
    const response = await axios.request({
      method,
      url,
      headers,
      data: body ? body : undefined,
      validateStatus: () => true,
      timeout: 30000
    });
    const durationMs = Date.now() - start;
    return res.status(200).json({
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      data: response.data,
      durationMs
    });
  } catch (error) {
    const durationMs = Date.now() - start;
    return res.status(200).json({
      status: 0,
      statusText: "Erreur reseau",
      headers: {},
      data: { error: error.message },
      durationMs
    });
  }
}
