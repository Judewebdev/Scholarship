'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ApplicantProfile, Opportunity } from '@/lib/types';

const emptyProfile: ApplicantProfile = {
  fullName: '', nationality: 'Nigerian', residenceCountry: 'Nigeria', degreeTitle: 'BA in Theatre and Media Arts', university: '', graduationYear: '', grade: '', gradingScale: '',
  preferredFields: ['Communication and Media Studies', 'Theatre and Performance Studies', 'Creative Industries', 'Cultural Studies', 'Digital Media', 'Education', 'Anthropology'],
  preferredCountries: [], languages: ['English'], englishTest: '', experience: '', achievements: '', fundingNeeds: ['Tuition', 'Monthly living stipend', 'Travel'], careerGoal: ''
};
const statusLabels: Record<Opportunity['status'], string> = {
  discovered: 'Discovered', review: 'Needs review', preparing: 'Preparing', ready_for_approval: 'Ready for approval', submitted: 'Submitted', rejected: 'Not pursuing', result_received: 'Result received'
};

export default function Home() {
  const [profile, setProfile] = useState<ApplicantProfile>(emptyProfile);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [tab, setTab] = useState<'overview' | 'profile' | 'opportunities'>('overview');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [researchPrompt, setResearchPrompt] = useState('Find fully funded master’s scholarships worldwide that accept Nigerian applicants with a BA in Theatre and Media Arts. Prioritise active or upcoming official application calls.');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetch('/api/profile').then(r => r.json()).then(d => { if (d.profile) setProfile(d.profile); }).catch(() => {});
    fetch('/api/opportunities').then(r => r.json()).then(d => { if (Array.isArray(d.opportunities)) setOpportunities(d.opportunities); }).catch(() => {});
  }, []);

  const update = (key: keyof ApplicantProfile, value: string | string[]) => setProfile(p => ({ ...p, [key]: value }));
  const listValue = (key: 'preferredFields' | 'preferredCountries' | 'languages' | 'fundingNeeds', value: string) => update(key, value.split(',').map(s => s.trim()).filter(Boolean));
  const visible = useMemo(() => filter === 'all' ? opportunities : opportunities.filter(o => o.status === filter), [opportunities, filter]);

  async function saveProfile() {
    setSaving(true); setError(''); setMessage('');
    try {
      const res = await fetch('/api/profile', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(profile) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not save profile');
      setMessage('Applicant profile saved.');
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not save profile'); }
    finally { setSaving(false); }
  }

  async function runResearch() {
    setLoading(true); setError(''); setMessage(''); setTab('opportunities');
    try {
      const res = await fetch('/api/research', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ profile, instructions: researchPrompt }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Research failed');
      setOpportunities(data.opportunities || []);
      setMessage(`Research completed: ${data.opportunities?.length || 0} opportunities returned. Verify every result against its official notice before applying.`);
    } catch (e) { setError(e instanceof Error ? e.message : 'Research failed'); }
    finally { setLoading(false); }
  }

  async function changeStatus(item: Opportunity, status: Opportunity['status']) {
    setError('');
    try {
      const res = await fetch('/api/opportunities', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ officialUrl: item.officialUrl, status }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unable to update status');
      setOpportunities(prev => prev.map(o => o.officialUrl === item.officialUrl ? { ...o, status } : o));
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to update status'); }
  }

  return <main className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark">SA</div><div><strong>Scholarship Agent</strong><span>GLOBAL FUNDING WORKSPACE</span></div></div>
      <div className="workspace-label">WORKSPACE</div>
      <nav>
        <button className={tab === 'overview' ? 'nav-item active' : 'nav-item'} onClick={() => setTab('overview')}><span>◫</span> Overview</button>
        <button className={tab === 'profile' ? 'nav-item active' : 'nav-item'} onClick={() => setTab('profile')}><span>◎</span> Applicant profile</button>
        <button className={tab === 'opportunities' ? 'nav-item active' : 'nav-item'} onClick={() => setTab('opportunities')}><span>⌕</span> Opportunities <b>{opportunities.length}</b></button>
      </nav>
      <div className="sidebar-bottom"><div className="security-dot" /> <div><strong>Human-approved workflow</strong><p>No application is submitted automatically by this MVP.</p></div></div>
    </aside>

    <section className="main-panel">
      <header className="topbar"><div><div className="eyebrow">SCHOLARSHIP OPERATIONS / 2027 INTAKE</div><h1>{tab === 'overview' ? 'Funding command centre' : tab === 'profile' ? 'Applicant profile' : 'Scholarship opportunities'}</h1></div><div className="top-actions"><span className="live-pill"><i /> AI research workspace</span><button className="button button-dark" onClick={() => setTab('profile')}>Edit applicant ↗</button></div></header>
      {(message || error) && <div className={error ? 'notice error' : 'notice success'}>{error || message}<button onClick={() => { setMessage(''); setError(''); }}>×</button></div>}

      {tab === 'overview' && <>
        <section className="hero-card"><div className="hero-copy"><div className="tag">YOUR SCHOLARSHIP COPILOT</div><h2>Find the right funding.<br /><em>Make every application count.</em></h2><p>Research official scholarship calls, match requirements to the applicant profile, and manage every opportunity from discovery to decision.</p><button className="button button-lime" onClick={runResearch} disabled={loading}>{loading ? <><span className="spinner" /> Research in progress…</> : 'Start global scholarship research →'}</button><div className="hero-note">Uses live web research when API credentials are configured.</div></div><div className="hero-art"><div className="orbit orbit-one"/><div className="orbit orbit-two"/><div className="globe">✳</div><div className="float-card card-top"><span>ELIGIBILITY</span><strong>Profile matching</strong><small>Degree · Country · Funding</small></div><div className="float-card card-bottom"><span>APPLICATION FLOW</span><strong>Discover → Review → Apply</strong><small>Human approval built in</small></div></div></section>
        <div className="metric-grid"><div className="metric-card"><span>OPPORTUNITIES TRACKED</span><strong>{opportunities.length.toString().padStart(2, '0')}</strong><small>Saved in this workspace</small></div><div className="metric-card"><span>READY FOR REVIEW</span><strong>{opportunities.filter(o => o.status === 'ready_for_approval').length.toString().padStart(2, '0')}</strong><small>Require your approval</small></div><div className="metric-card"><span>APPLICATIONS SUBMITTED</span><strong>{opportunities.filter(o => o.status === 'submitted').length.toString().padStart(2, '0')}</strong><small>Track confirmation details separately</small></div><div className="metric-card accent"><span>PROFILE COMPLETENESS</span><strong>{Math.round(([profile.fullName, profile.university, profile.graduationYear, profile.grade, profile.careerGoal].filter(Boolean).length / 5) * 100)}%</strong><small><button onClick={() => setTab('profile')}>Complete applicant profile ↗</button></small></div></div>
        <div className="content-grid"><section className="panel research-panel"><div className="panel-heading"><div><div className="eyebrow">RESEARCH ENGINE</div><h3>Tell the agent what to find</h3></div><span className="small-chip">LIVE SEARCH</span></div><label className="field-label">Research objective</label><textarea value={researchPrompt} onChange={e => setResearchPrompt(e.target.value)} rows={4}/><div className="quick-tags"><span>Fully funded</span><span>Master's degree</span><span>Nigerian applicants</span><span>Official sources only</span></div><button className="button button-dark full-width" onClick={runResearch} disabled={loading}>{loading ? 'Searching official sources…' : 'Research scholarships now →'}</button><p className="fine-print">The agent should return evidence and official links. Search results are leads, not proof of eligibility or admission.</p></section><section className="panel checklist-panel"><div className="panel-heading"><div><div className="eyebrow">GET APPLICATION-READY</div><h3>Applicant checklist</h3></div><span className="check-icon">✓</span></div>{[{title:'Degree certificate and transcript',sub:'Prepare clear scans and confirm translation rules.'},{title:'Academic profile',sub:'CGPA, grading scale, university and graduation year.'},{title:'Core application narrative',sub:'Career goal, achievements, leadership and projects.'},{title:'Language evidence',sub:'English test or programme-specific language requirements.'}].map((x,i)=><div className="check-row" key={x.title}><div className="check-number">0{i+1}</div><div><strong>{x.title}</strong><p>{x.sub}</p></div></div>)}<button className="text-button" onClick={() => setTab('profile')}>Complete the applicant profile <span>→</span></button></section></div>
      </>}

      {tab === 'profile' && <section className="panel profile-panel"><div className="panel-heading"><div><div className="eyebrow">APPLICANT RECORD</div><h3>One profile, tailored applications</h3><p className="section-desc">Use verified information only. This is a working profile, not a place to store passwords or bank details.</p></div><span className="small-chip">PROFILE</span></div><div className="form-grid">
        <Field label="Full legal name" value={profile.fullName} onChange={v => update('fullName',v)} placeholder="As shown on passport"/><Field label="Nationality" value={profile.nationality} onChange={v => update('nationality',v)}/><Field label="Country of residence" value={profile.residenceCountry} onChange={v => update('residenceCountry',v)}/><Field label="Degree title" value={profile.degreeTitle} onChange={v => update('degreeTitle',v)}/><Field label="University attended" value={profile.university} onChange={v => update('university',v)}/><Field label="Graduation year" value={profile.graduationYear} onChange={v => update('graduationYear',v)} placeholder="e.g. 2024"/><Field label="CGPA / final grade" value={profile.grade} onChange={v => update('grade',v)} placeholder="e.g. 3.4"/><Field label="Grading scale" value={profile.gradingScale} onChange={v => update('gradingScale',v)} placeholder="e.g. 5.0 scale"/>
        <Field wide label="Preferred fields (comma-separated)" value={profile.preferredFields.join(', ')} onChange={v => listValue('preferredFields',v)}/><Field wide label="Preferred countries (blank = worldwide)" value={profile.preferredCountries.join(', ')} onChange={v => listValue('preferredCountries',v)} placeholder="Brazil, Germany, Canada"/><Field wide label="Languages" value={profile.languages.join(', ')} onChange={v => listValue('languages',v)} placeholder="English, Portuguese"/><Field label="English test / score" value={profile.englishTest} onChange={v => update('englishTest',v)} placeholder="Not taken / IELTS score"/><Field label="Funding needed" value={profile.fundingNeeds.join(', ')} onChange={v => listValue('fundingNeeds',v)}/><Field wide label="Work and relevant experience" value={profile.experience} onChange={v => update('experience',v)} multiline/><Field wide label="Leadership, volunteering, awards and creative projects" value={profile.achievements} onChange={v => update('achievements',v)} multiline/><Field wide label="Career goal after the master's" value={profile.careerGoal} onChange={v => update('careerGoal',v)} multiline/>
      </div><div className="form-footer"><p>Saving requires a configured MongoDB connection. Do not enter passport numbers or other sensitive identifiers in this initial build.</p><button className="button button-dark" onClick={saveProfile} disabled={saving}>{saving ? 'Saving…' : 'Save applicant profile →'}</button></div></section>}

      {tab === 'opportunities' && <section className="panel opportunities-panel"><div className="panel-heading"><div><div className="eyebrow">DISCOVERY RESULTS</div><h3>Matched scholarship opportunities</h3><p className="section-desc">Always verify current eligibility, deadlines, and funding on the official page.</p></div><button className="button button-dark" onClick={runResearch} disabled={loading}>{loading ? 'Researching…' : '+ Run new search'}</button></div><div className="filters"><span>{opportunities.length} results</span><select value={filter} onChange={e => setFilter(e.target.value)}><option value="all">All statuses</option>{Object.entries(statusLabels).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></div>{visible.length === 0 ? <div className="empty-state"><div className="empty-icon">⌕</div><h4>No opportunities yet</h4><p>Run the research engine to discover scholarship leads matched to this applicant.</p><button className="button button-lime" onClick={runResearch} disabled={loading}>{loading ? 'Researching…' : 'Start scholarship search →'}</button></div> : <div className="opportunity-list">{visible.map((o,i)=><article className="opportunity-card" key={o.officialUrl || `${o.title}-${i}`}><div className="opportunity-top"><div><span className="country-label">{o.country || 'Country to verify'} · {o.degreeLevel || "Master's"}</span><h4>{o.title}</h4><p className="institution">{o.institution}</p></div><div className="score"><strong>{o.matchScore ?? '—'}</strong><span>MATCH</span></div></div><p className="summary">{o.eligibilitySummary}</p><div className="pill-row">{(o.fundingCoverage || []).map(x=><span key={x} className="funding-pill">{x}</span>)}</div><div className="opportunity-meta"><div><span>DEADLINE</span><strong>{o.deadline || 'Verify on official page'}</strong></div><div><span>APPLICATION FEE</span><strong>{o.applicationFee || 'Verify'}</strong></div><div><span>LANGUAGE</span><strong>{o.languageRequirements || 'Verify'}</strong></div></div>{o.verificationNotes && <div className="verification-note"><strong>Verification note:</strong> {o.verificationNotes}</div>}<div className="opportunity-footer"><div className="link-group">{o.officialUrl && <a href={o.officialUrl} target="_blank" rel="noreferrer">Official source ↗</a>}{o.applicationUrl && <a href={o.applicationUrl} target="_blank" rel="noreferrer">Application portal ↗</a>}</div><select value={o.status || 'discovered'} onChange={e => changeStatus(o,e.target.value as Opportunity['status'])}>{Object.entries(statusLabels).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></div></article>)}</div>}</section>}
      <footer className="footer"><span>Scholarship Agent · MVP 0.1</span><span>Evidence first. Human approval before submission.</span></footer>
    </section>
  </main>;
}

function Field({label,value,onChange,placeholder,wide,multiline}:{label:string;value:string;onChange:(v:string)=>void;placeholder?:string;wide?:boolean;multiline?:boolean}) {
  return <label className={`field ${wide ? 'wide' : ''}`}><span>{label}</span>{multiline ? <textarea value={value} onChange={e=>onChange(e.target.value)} rows={3} placeholder={placeholder}/> : <input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}/>}</label>;
}
