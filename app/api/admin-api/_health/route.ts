import { jsonUtf8 } from '../../../../src/lib/responses';

export async function GET() {
  return jsonUtf8({ ok: true }, { status: 200 });
}
