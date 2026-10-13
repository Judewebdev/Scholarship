import type { ApplicantProfile, Opportunity } from './types';

export function scoreOpportunity(profile: ApplicantProfile, item: Partial<Opportunity>): number {
  let score = 0;
  const fields = profile.preferredFields.map(x => x.toLowerCase());
  const fit = `${item.title || ''} ${item.subjectFit || ''} ${item.eligibilitySummary || ''}`.toLowerCase();
  if (fields.some(f => f && fit.includes(f))) score += 25;
  if ((item.eligibilitySummary || '').toLowerCase().includes(profile.nationality.toLowerCase())) score += 20;
  if ((item.fundingCoverage || []).some(x => /tuition/i.test(x))) score += 15;
  if ((item.fundingCoverage || []).some(x => /stipend|living|maintenance/i.test(x))) score += 15;
  if ((item.officialUrl || '').startsWith('https://')) score += 10;
  if ((item.deadline || '').match(/^\d{4}-\d{2}-\d{2}$/)) score += 5;
  if ((item.eligibilitySummary || '').toLowerCase().includes('bachelor')) score += 10;
  return Math.min(100, score);
}
