import { getSession, changeStage } from "@/lib/data/crm";
import { PIPELINE_STAGES } from "@/lib/types";
import { z } from "zod";

const schema = z.object({
  stage: z.enum(PIPELINE_STAGES),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid stage" }, { status: 400 });
  }

  const contact = await changeStage(id, parsed.data.stage, {
    id: session.user.id,
    name: session.profile?.full_name ?? session.user.email,
  });
  if (!contact) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ contact });
}
