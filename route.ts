import OpenAI from 'openai';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/lib/mongodb';
import { scoreOpportunity } from '@/lib/match';
import type { ApplicantProfile, Opportunity } from '@/lib/types';

export const runtime = 'nodejs';
export const maxDuration = 60;
const inputSchema = z.object({ profile: z.object({ nationality: z.string().min(1), residenceCountry: z.string().min(1), degreeTitle: z.string().min(1), university: z.string(), graduationYear: z.string(), grade: z.string(), gradingScale: z.string(), preferredFields: z.array(z.string()), preferredCountries: z.array(z.string()), languages: z.array(z.string()), englishTest: z.string(), experience: z.string(), achievements: z.string(), fundingNeeds: z.array(z.string()), careerGoal: z.string(), fullName: z.string() }), instructions: z.string().optional() });
const outputSchema = z.object({ opportunities: z.array(z.object({ title: z.string(), institution: z.string(), country: z.string(), degreeLevel: z.string(), subjectFit: z.string(), fundingCoverage: z.array(z.string()), eligibilitySummary: z.string(), matchScore: z.number().min(0).max(100), deadline: z.string(), status: z.enum(['discovered','review','preparing','ready_for_approval','submitted','rejected','result_received']).default('discovered'), officialUrl: z.string(), applicationUrl: z.string(), applicationFee: z.string(), languageRequirements: z.string(), documentsRequired: z.array(z.string()), nextAction: z.string(), verificationNotes: z.string(), sourceCheckedAt: z.string() })) });

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) return NextResponse.json({ error: 'OPENAI_API_KEY is missing. Add it to .env.local to enable live AI scholarship research.' }, { status: 503 });
    const parsed = inputSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: 'Please complete the required applicant profile fields before researching.' }, { status: 400 });
    const { profile, instructions } = parsed.data;
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const prompt = `You are a careful international scholarship researcher. Find up to 12 REAL master's scholarships or funded master's admissions opportunities worldwide matching this applicant. Use web search and prioritise official university, government, or scholarship-provider sources. Do not fabricate opportunities, deadlines, funding, application fees, or URLs. Do not count tuition-free public education as a scholarship unless relevant funding is explicitly described. Distinguish tuition waiver from full funding. Nigerian applicant eligibility must be supported by a source or clearly marked unconfirmed. Prefer open or upcoming calls; if status is unclear, say so in verificationNotes. Do not assume the applicant's grade meets requirements if unknown. Give a match score based on available facts, and penalise unknown eligibility. Return ONLY valid JSON matching this shape: {"opportunities":[{"title":"","institution":"","country":"","degreeLevel":"Master's","subjectFit":"","fundingCoverage":[""],"eligibilitySummary":"","matchScore":0,"deadline":"YYYY-MM-DD or 'Not stated'","status":"discovered","officialUrl":"https://...","applicationUrl":"https://... or empty string","applicationFee":"Free / amount / Not verified","languageRequirements":"","documentsRequired":[""],"nextAction":"","verificationNotes":"Include what official page was checked, whether the call is open/upcoming, and any unconfirmed claims.","sourceCheckedAt":"${new Date().toISOString().slice(0,10)}"}]}. officialUrl must be an official provider source, not an aggregator. Never claim a scholarship is open unless the official source supports it. If you cannot verify enough, return fewer results rather than inventing data. Applicant profile: ${JSON.stringify(profile)}. Research instructions: ${instructions || 'Find the best matches globally.'}`;
    const response = await openai.responses.create({ model: process.env.OPENAI_MODEL || 'gpt-5.4', tools: [{ type: 'web_search' }], input: prompt });
    const raw = response.output_text;
    const start = raw.indexOf('{'); const end = raw.lastIndexOf('}');
    if (start < 0 || end <= start) throw new Error('The research model returned no structured opportunity data. Please try again.');
    const decoded = outputSchema.safeParse(JSON.parse(raw.slice(start, end + 1)));
    if (!decoded.success) throw new Error('The research result did not pass data validation. Try again with a narrower search.');
    const opportunities: Opportunity[] = decoded.data.opportunities.map(item => ({ ...item, status: 'discovered', matchScore: Math.max(0, Math.min(100, Math.round(item.matchScore))), officialUrl: item.officialUrl.trim() })).filter(item => item.officialUrl.startsWith('https://')).map(item => ({ ...item, matchScore: item.matchScore || scoreOpportunity(profile as ApplicantProfile, item) }));
    // Persistence is useful but research results are still returned if MongoDB has not been configured.
    let saved = false; let storageWarning = '';
    try {
      const db = await getDb(); const now = new Date();
      for (const item of opportunities) await db.collection('opportunities').updateOne({ officialUrl: item.officialUrl }, { $set: { ...item, updatedAt: now }, $setOnInsert: { createdAt: now } }, { upsert: true });
      saved = true;
    } catch (e) { storageWarning = e instanceof Error ? e.message : 'Database not configured; results were not saved.'; }
    return NextResponse.json({ opportunities, saved, storageWarning, note: 'Research results are leads. Verify every official call and eligibility condition before applying.' });
  } catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : 'Scholarship research failed' }, { status: 500 }); }
}
