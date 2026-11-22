const HEADERS = {
  "content-type": "application/json; charset=utf-8"
};


function json(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...HEADERS, ...extra }
  });
}

function cors(request, env) {
  const origin = request.headers.get("Origin") || "";
  const allowed = (env.ALLOWED_ORIGIN || "")
    .split(",")
    .map(x => x.trim())
    .filter(Boolean);

  const permitted = allowed.includes("*") || allowed.includes(origin);

  return {
    "access-control-allow-origin": permitted
      ? (allowed.includes("*") ? "*" : origin)
      : "null",
    "access-control-allow-methods": "GET, POST, OPTIONS",
    "access-control-allow-headers": "Content-Type",
    "vary": "Origin"
  };
}

async function openAI(prompt, env) {
  if (!env.OPENAI_API_KEY) {
    throw new Error("OpenAI API Key belum dipasang.");
  }

  if (!env.OPENAI_MODEL) {
    throw new Error("OPENAI_MODEL belum dikonfigurasi.");
  }

  const response = await fetch(
    "https://api.openai.com/v1/responses",
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: env.OPENAI_MODEL,
        instructions:
          "Kamu adalah AI Assistant PIKIRKALA STUDIO. " +
          "Bantu pekerjaan kreatif, riset, penulisan, " +
          "storytelling, dokumenter, visual, dan produksi konten.",
        input: prompt
      })
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error?.message || "OpenAI API mengalami kesalahan."
    );
  }

  const text = (data.output || [])
    .flatMap(item => item.content || [])
    .filter(item => item.type === "output_text")
    .map(item => item.text)
    .join("\n");

  if (!text) {
    throw new Error("OpenAI tidak menghasilkan teks.");
  }

  return {
    provider: "openai",
    model: data.model || env.OPENAI_MODEL,
    text
  };
}

async function geminiAI(prompt, env) {
  if (!env.GEMINI_API_KEY) {
    throw new Error("Gemini API Key belum dipasang.");
  }

  if (!env.GEMINI_MODEL) {
    throw new Error("GEMINI_MODEL belum dikonfigurasi.");
  }

  const url =
    "https://generativelanguage.googleapis.com/v1beta/models/" +
    encodeURIComponent(env.GEMINI_MODEL) +
    ":generateContent";

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "x-goog-api-key": env.GEMINI_API_KEY,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }]
        }
      ],
      systemInstruction: {
        parts: [{
          text:
            "Kamu adalah AI Assistant PIKIRKALA STUDIO. " +
            "Bantu pekerjaan kreatif, riset, penulisan, " +
            "storytelling, dokumenter, visual, dan produksi konten."
        }]
      }
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error?.message || "Gemini API mengalami kesalahan."
    );
  }

  const text = (data.candidates?.[0]?.content?.parts || [])
    .map(part => part.text || "")
    .filter(Boolean)
    .join("\n");

  if (!text) {
    throw new Error("Gemini tidak menghasilkan teks.");
  }

  return {
    provider: "gemini",
    model: env.GEMINI_MODEL,
    text
  };
}

export default {
  async fetch(request, env) {
    const headers = cors(request, env);
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers
      });
    }

    if (url.pathname === "/health" && request.method === "GET") {
      return json({
        ok: true,
        service: "pikirkala-ai-gateway",
        version: "0.1.0"
      }, 200, headers);
    }

    if (
      url.pathname === "/api/ai/providers" &&
      request.method === "GET"
    ) {
      return json({
        providers: [
          {
            id: "openai",
            configured: Boolean(env.OPENAI_API_KEY)
          },
          {
            id: "gemini",
            configured: Boolean(env.GEMINI_API_KEY)
          }
        ]
      }, 200, headers);
    }

    if (
      url.pathname !== "/api/ai/generate" ||
      request.method !== "POST"
    ) {
      return json({
        error: "Endpoint tidak ditemukan."
      }, 404, headers);
    }

    if (headers["access-control-allow-origin"] === "null") {
      return json({
        error: "Origin tidak diizinkan."
      }, 403, headers);
    }

    try {
      const length = Number(
        request.headers.get("content-length") || 0
      );

      if (length > 100000) {
        return json({
          error: "Permintaan terlalu besar."
        }, 413, headers);
      }

      const body = await request.json();
      const provider = body.provider;
      const prompt = typeof body.prompt === "string"
        ? body.prompt.trim()
        : "";

      if (!["openai", "gemini"].includes(provider)) {
        return json({
          error: "Provider harus openai atau gemini."
        }, 400, headers);
      }

      if (!prompt) {
        return json({
          error: "Prompt tidak boleh kosong."
        }, 400, headers);
      }

      if (prompt.length > 80000) {
        return json({
          error: "Prompt melebihi batas 80.000 karakter."
        }, 413, headers);
      }

      const result = provider === "openai"
        ? await openAI(prompt, env)
        : await geminiAI(prompt, env);

      return json({
        ok: true,
        ...result
      }, 200, headers);

    } catch (error) {
      return json({
        ok: false,
        error: error.message || "Terjadi kesalahan."
      }, 502, headers);
    }
  }
};
