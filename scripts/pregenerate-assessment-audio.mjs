import { createHash } from 'node:crypto';
import { mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

async function loadEnvFile(filePath) {
  try {
    const contents = await readFile(filePath, 'utf8');
    for (const rawLine of contents.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;

      const separatorIndex = line.indexOf('=');
      if (separatorIndex === -1) continue;

      const key = line.slice(0, separatorIndex).trim();
      const value = line.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, '');

      if (key && !(key in process.env)) {
        process.env[key] = value;
      }
    }
  } catch {
    // Missing env files are okay.
  }
}

await loadEnvFile(path.join(process.cwd(), '.env.local'));
await loadEnvFile(path.join(process.cwd(), '.env'));

const DEFAULT_API_BASE_URL = 'https://api.nevolearning.com/api/v1';
const apiBaseUrl =
  process.env.API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  DEFAULT_API_BASE_URL;
const yarnApiKey = process.env.YARNGPT_API_KEY;

const publicDir = path.join(process.cwd(), 'public');
const audioDir = path.join(publicDir, 'assessment-audio');
const manifestPath = path.join(audioDir, 'manifest.json');

function log(message) {
  process.stdout.write(`[assessment-audio] ${message}\n`);
}

function buildNarrationText(question) {
  const optionsText = Array.isArray(question.options)
    ? question.options.map((option, index) => `Option ${index + 1}. ${option}.`).join(' ')
    : '';

  return `${question.text || ''} ${optionsText}`.trim();
}

function hashText(text) {
  return createHash('sha1').update(text).digest('hex').slice(0, 12);
}

async function readExistingManifest() {
  try {
    const raw = await readFile(manifestPath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function fileExists(targetPath) {
  try {
    await stat(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function fetchQuestions() {
  const response = await fetch(`${apiBaseUrl}/assessments/questions`, {
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Question fetch failed with ${response.status}`);
  }

  const payload = await response.json().catch(() => ({}));
  return Array.isArray(payload?.questions) ? payload.questions : [];
}

async function fetchAudioBuffer(text) {
  const response = await fetch('https://yarngpt.ai/api/v1/tts', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${yarnApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: text.slice(0, 2000),
      voice: 'Idera',
      response_format: 'mp3',
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`YarnGPT failed with ${response.status}${detail ? `: ${detail}` : ''}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function main() {
  await mkdir(audioDir, { recursive: true });

  if (!yarnApiKey) {
    log('Skipped: YARNGPT_API_KEY is not set.');
    await writeFile(manifestPath, JSON.stringify({}, null, 2));
    return;
  }

  let questions = [];
  try {
    questions = await fetchQuestions();
  } catch (error) {
    log(error instanceof Error ? error.message : 'Failed to fetch assessment questions.');
    return;
  }

  const existingManifest = await readExistingManifest();
  const nextManifest = {};
  const keepFiles = new Set(['manifest.json']);

  for (const question of questions) {
    if (!question?.id || !question?.text) continue;

    const narrationText = buildNarrationText(question);
    const hash = hashText(narrationText);
    const filename = `question-${question.id}-${hash}.mp3`;
    const filePath = path.join(audioDir, filename);
    const publicUrl = `/assessment-audio/${filename}`;

    keepFiles.add(filename);

    const existingEntry = existingManifest[String(question.id)];
    const canReuse =
      existingEntry?.hash === hash &&
      existingEntry?.url === publicUrl &&
      (await fileExists(filePath));

    if (!canReuse) {
      log(`Generating audio for question ${question.id}...`);
      const buffer = await fetchAudioBuffer(narrationText);
      await writeFile(filePath, buffer);
    }

    nextManifest[String(question.id)] = {
      url: publicUrl,
      hash,
      text: narrationText,
    };
  }

  try {
    const currentFiles = await stat(audioDir).then(() => true).catch(() => false);
    if (currentFiles) {
      const { readdir } = await import('node:fs/promises');
      const files = await readdir(audioDir);
      await Promise.all(
        files
          .filter((file) => !keepFiles.has(file))
          .map((file) => rm(path.join(audioDir, file), { force: true })),
      );
    }
  } catch {
    // Ignore cleanup failures; fresh files are already written.
  }

  await writeFile(manifestPath, JSON.stringify(nextManifest, null, 2));
  log(`Ready: ${Object.keys(nextManifest).length} assessment audio files available.`);
}

main().catch((error) => {
  log(error instanceof Error ? error.message : 'Unexpected failure.');
  process.exitCode = 0;
});
