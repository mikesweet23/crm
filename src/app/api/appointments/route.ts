import { getSession, createAppointment } from "@/lib/data/crm";
import { z } from "zod";

const schema = z.object({
  contact_id: z.string().min(1),
  start_time: z.string().datetime(),
  end_time: z.string().datetime(),
  appointment_type: z.string().optional(),
  meeting_method: z.enum(["telephone", "online", "in_person"]).optional(),
  administrative_note: z.string().optional(),
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid appointment" }, { status: 400 });
  }

  const appointment = await createAppointment({
    ...parsed.data,
    user: {
      id: session.user.id,
      name: session.profile?.full_name ?? session.user.email,
    },
  });

  return Response.json({ appointment });
}
