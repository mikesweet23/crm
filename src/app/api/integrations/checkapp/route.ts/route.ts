import { z } from "zod";
import { submitEnquiry } from "@/lib/data/crm";

const resultSchema = z.object({
  overall: z.number().min(0).max(100),
  band: z.object({
    label: z.string().max(160),
    title: z.string().max(240),
  }),
  categoryScores: z.record(z.string(), z.number().min(0).max(100)).default({}),
});

const payloadSchema = z.object({
  event: z.literal("assessment.completed"),
  source: z.literal("absolute-mind-checkapp"),
  attemptId: z.string().max(160),
  contactId: z.string().max(160).optional(),
  contact: z.object({
    firstName: z.string().trim().min(1).max(80),
    lastName: z.string().trim().min(1).max(80),
    email: z.string().trim().email().max(160),
  }),
  assessment: z.object({
    slug: z.string().max(160),
    name: z.string().max(240),
    shortName: z.string().max(160),
  }),
  result: resultSchema,
});

function isAuthorised(request: Request) {
  const expected = process.env.CHECKAPP_WEBHOOK_SECRET;
  if (!expected) return false;
  return request.headers.get("authorization") === "Bearer " + expected;
}

export async function POST(request: Request) {
  if (!isAuthorised(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid assessment payload" }, { status: 400 });
  }

  const { contact, assessment, result, attemptId } = parsed.data;
  const categorySummary = Object.entries(result.categoryScores)
    .map(([category, score]) => category + ": " + score + "%")
    .join(", ");

  try {
    const saved = await submitEnquiry({
      first_name: contact.firstName,
      last_name: contact.lastName,
      email: contact.email,
      lead_source: "Assessment: " + assessment.shortName,
      help_category: assessment.shortName,
      landing_page: "checkapp:" + assessment.slug,
      message: [
        "Completed assessment: " + assessment.name,
        "Overall score: " + result.overall + "/100",
        "Result: " + result.band.label + " — " + result.band.title,
        categorySummary ? "Category scores: " + categorySummary : "",
        "Checkapp attempt: " + attemptId,
      ].filter(Boolean).join("\n"),
      marketing_email: false,
    });

    return Response.json({
      ok: true,
      contactId: saved.contact.id,
      enquiryId: saved.enquiry.id,
    }, { status: 201 });
  } catch (error) {
    console.error("Could not save Checkapp assessment in CRM", error);
    return Response.json({ error: "Could not save the assessment" }, { status: 500 });
  }
}
