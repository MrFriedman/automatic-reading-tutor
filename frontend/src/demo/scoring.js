export const SCORED_KEY = "art-demo-scored-sentences";

let silentClipUrl = null;

export function clearScoredSentences() {
  try {
    sessionStorage.removeItem(SCORED_KEY);
  } catch (err) {
    /* ignore */
  }
}

function readScored() {
  try {
    const raw = sessionStorage.getItem(SCORED_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch (err) {
    return new Set();
  }
}

function writeScored(seen) {
  try {
    sessionStorage.setItem(SCORED_KEY, JSON.stringify(Array.from(seen)));
  } catch (err) {
    /* ignore */
  }
}

export function syllables(word) {
  const cleaned = String(word || "")
    .toLowerCase()
    .replace(/[^a-z]/g, "");
  if (!cleaned) return "";
  const groups = cleaned.match(/[^aeiouy]*[aeiouy]+(?:[^aeiouy]*$|[^aeiouy](?=[^aeiouy]))?/g);
  const parts = groups && groups.length ? groups : [cleaned];
  return parts.join("-");
}

/**
 * A valid silent WAV so the feedback player has a source.
 * The spoken model word is played separately with speech synthesis.
 */
export function silentWavDataUri() {
  if (silentClipUrl) return silentClipUrl;
  const sampleRate = 8000;
  const samples = Math.floor(sampleRate * 0.35);
  const dataSize = samples * 2;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);
  const write = (offset, text) => {
    for (let i = 0; i < text.length; i += 1) {
      view.setUint8(offset + i, text.charCodeAt(i));
    }
  };
  write(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  write(8, "WAVE");
  write(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  write(36, "data");
  view.setUint32(40, dataSize, true);
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  silentClipUrl = `data:audio/wav;base64,${btoa(binary)}`;
  return silentClipUrl;
}

function tokens(sentence) {
  return String(sentence || "")
    .trim()
    .split(/\s+/)
    .map((word) => word.replace(/[^a-zA-Z']/g, ""))
    .filter(Boolean);
}

function misread(word, duration) {
  const display = String(word).replace(/[^a-zA-Z]/g, "") || String(word);
  return {
    results: [
      {
        word: display,
        audio_url: silentWavDataUri(),
        syllable_string: syllables(display),
        duration_audio_file: duration,
      },
    ],
  };
}

/**
 * Canned scoring. The first full sentence in a session is marked wrong on one
 * word. Repeating that single word fails once, then passes, so the feedback
 * screen is reachable without a microphone. Every later sentence passes.
 */
export function scoreSentence(sentence) {
  const words = tokens(sentence);
  if (words.length === 0) {
    return { results: "pass", duration_audio_file: 3 };
  }

  const seen = readScored();
  if (words.length === 1) {
    const key = `word:${words[0].toLowerCase()}`;
    if (!seen.has(key)) {
      seen.add(key);
      writeScored(seen);
      return misread(words[0], 2);
    }
    return { results: "pass", duration_audio_file: 2 };
  }

  const sentenceKey = `sentence:${words.join(" ").toLowerCase()}`;
  if (seen.has(sentenceKey) || seen.has("session:feedback-shown")) {
    seen.add(sentenceKey);
    writeScored(seen);
    return { results: "pass", duration_audio_file: 3 };
  }
  seen.add(sentenceKey);
  seen.add("session:feedback-shown");
  writeScored(seen);

  const choice =
    words.find((word, index) => index > 0 && word.replace(/[^a-zA-Z]/g, "").length >= 6) ||
    words[words.length - 1];
  return misread(choice, 4);
}
