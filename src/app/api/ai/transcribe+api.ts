import { requireEligibleUser } from '@/lib/server/eligibility';
import { getAIProvider } from '@/lib/server/ai-provider';

const maxAudioBytes = 8 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    await requireEligibleUser(request);
    const form = await request.formData();
    const audio = (form as unknown as { get(name: string): FormDataEntryValue | null }).get('audio');
    if (!(audio instanceof File) || !audio.type.startsWith('audio/')) {
      return Response.json({ error: 'A short audio recording is required.' }, { status: 400 });
    }
    if (audio.size > maxAudioBytes) return Response.json({ error: 'Audio must be smaller than 8 MB.' }, { status: 413 });
    const text = await getAIProvider().transcribe({ file: audio });
    // The uploaded File is intentionally not persisted. Serverless request cleanup removes it after this response.
    return Response.json({ text });
  } catch (error) {
    if (error instanceof Response) return error;
    return Response.json({ error: error instanceof Error ? error.message : 'Unable to transcribe audio.' }, { status: 400 });
  }
}
