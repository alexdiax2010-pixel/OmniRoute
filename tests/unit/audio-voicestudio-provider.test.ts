import test from "node:test";
import assert from "node:assert/strict";

const { handleAudioSpeech } = await import("../../open-sse/handlers/audioSpeech.ts");
const { handleAudioTranscription } = await import("../../open-sse/handlers/audioTranscription.ts");
const {
  getSpeechProvider,
  getTranscriptionProvider,
  getTranslationProvider,
  parseSpeechModel,
  parseTranscriptionModel,
  getAllAudioModels,
} = await import("../../open-sse/config/audioRegistry.ts");

type CapturedRequest = { url: string; headers: Record<string, string>; body: unknown };

test("VoiceStudio is registered as a keyless local provider on all three audio surfaces", () => {
  const speech = getSpeechProvider("voicestudio");
  const stt = getTranscriptionProvider("voicestudio");
  const translation = getTranslationProvider("voicestudio");

  assert.equal(speech?.baseUrl, "http://localhost:3900/v1/audio/speech");
  assert.equal(stt?.baseUrl, "http://localhost:3900/v1/audio/transcriptions");
  assert.equal(translation?.baseUrl, "http://localhost:3900/v1/audio/translations");
  for (const provider of [speech, stt, translation]) {
    assert.equal(provider?.authType, "none");
  }

  assert.equal(parseSpeechModel("voicestudio/tts-1").provider, "voicestudio");
  assert.equal(parseTranscriptionModel("voicestudio/whisper-1").provider, "voicestudio");

  const ids = getAllAudioModels().map((m) => m.id);
  assert.ok(ids.includes("voicestudio/tts-1"));
  assert.ok(ids.includes("voicestudio/whisper-1"));
});

test("handleAudioSpeech proxies voicestudio/* to the local backend without credentials", async () => {
  const originalFetch = globalThis.fetch;
  let captured: CapturedRequest | undefined;

  globalThis.fetch = (async (url: string | URL, options: RequestInit = {}) => {
    captured = {
      url: String(url),
      headers: (options.headers || {}) as Record<string, string>,
      body: JSON.parse(String(options.body || "{}")),
    };
    return new Response(new Uint8Array([1, 2, 3]), {
      status: 200,
      headers: { "Content-Type": "audio/wav" },
    });
  }) as typeof fetch;

  try {
    const response = await handleAudioSpeech({
      body: {
        model: "voicestudio/tts-1",
        input: "Every voice has a story.",
        voice: "my-profile",
        response_format: "wav",
      },
      credentials: null,
    });

    assert.equal(response.status, 200);
    assert.equal(captured?.url, "http://localhost:3900/v1/audio/speech");
    assert.equal(captured?.headers.Authorization, undefined);
    assert.deepEqual(captured?.body, {
      model: "tts-1",
      input: "Every voice has a story.",
      voice: "my-profile",
      response_format: "wav",
      speed: 1.0,
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("handleAudioTranscription proxies voicestudio/* to the local backend without credentials", async () => {
  const originalFetch = globalThis.fetch;
  let capturedUrl = "";
  let capturedAuth: string | undefined;

  globalThis.fetch = (async (url: string | URL, options: RequestInit = {}) => {
    capturedUrl = String(url);
    const headers = (options.headers || {}) as Record<string, string>;
    capturedAuth = headers.Authorization;
    return new Response(JSON.stringify({ text: "hola, esto es mi voz" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }) as typeof fetch;

  try {
    const formData = new FormData();
    formData.append("model", "voicestudio/whisper-1");
    formData.append("file", new Blob([new Uint8Array([1, 2, 3])], { type: "audio/wav" }), "a.wav");

    const response = await handleAudioTranscription({ formData, credentials: null });
    const payload = (await response.json()) as { text?: string };

    assert.equal(response.status, 200);
    assert.equal(capturedUrl, "http://localhost:3900/v1/audio/transcriptions");
    assert.equal(capturedAuth, undefined);
    assert.equal(payload.text, "hola, esto es mi voz");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
