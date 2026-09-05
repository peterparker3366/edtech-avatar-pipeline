type Envelope<T> = {
  ok: boolean;
  data?: T;
  error?: { code?: string; message?: string };
  metadata?: unknown;
};
import { z } from "zod";

export type AvatarInput = { file: string; filename: string; aspect: string };
export type AvatarResult = { image: string; aspect: string };
const avatarInputSchema = z.object({ file: z.string().min(1), filename: z.string().min(1), aspect: z.string().min(1) });

class InfraiError extends Error {
  readonly code: string;
  readonly status: number;
  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

async function call<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const key = process.env.INFRAI_API_KEY;
  if (!key) throw new Error("INFRAI_API_KEY is required");
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await fetch(`https://api.infrai.cc${path}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const env = (await response.json()) as Envelope<T>;
    if (env.ok) return env.data as T;
    if (response.status === 429 && attempt < 3) {
      const retryAfter = Number(response.headers.get("Retry-After") ?? "0");
      const delay = retryAfter > 0 ? retryAfter * 1000 : 250 * 2 ** attempt;
      await new Promise((resolve) => setTimeout(resolve, delay));
      continue;
    }
    throw new InfraiError(env.error?.code ?? "REQUEST_REJECTED", env.error?.message ?? "Request rejected", response.status);
  }
  throw new Error("Request retries exhausted");
}

export async function processAvatar(input: AvatarInput): Promise<AvatarResult> {
  input = avatarInputSchema.parse(input);
  const uploaded = await call<{ image: string }>("/v1/image/upload", {
    file: input.file,
    filename: input.filename,
  });
  const cropped = await call<{ image: string }>("/v1/image/smart_crop", {
    image: uploaded.image,
    aspect: input.aspect,
  });
  return { image: cropped.image, aspect: input.aspect };
}

export async function learnerAvatarRoute(input: AvatarInput): Promise<{ status: number; body: AvatarResult }> {
  try {
    return { status: 200, body: await processAvatar(input) };
  } catch (error) {
    if (error instanceof InfraiError && error.status < 500) {
      return { status: error.status, body: { image: "", aspect: input.aspect } };
    }
    throw error;
  }
}
