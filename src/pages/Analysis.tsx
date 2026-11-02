import { useEffect,useState } from 'react'
import { api,SessionRow } from '../api'
import { LineChart,Line,XAxis,YAxis,Tooltip,ResponsiveContainer,CartesianGrid } from 'recharts'
export default function Analysis(){
 const [rows,setRows]=useState<SessionRow[]>([])
 useEffect(()=>{api<SessionRow[]>('/sessions/my?limit=100').then(setRows).catch(()=>setRows([]))},[])
 const durationLabel=(seconds:number)=>seconds<60?`${seconds} sec`:`${Math.floor(seconds/60)} min ${seconds%60} sec`
 const data=[...rows].reverse().map(s=>({date:new Date(s.created_at).toLocaleDateString(),score:s.score_pct,reps:s.reps_completed??0,minutes:Math.round(s.duration_secs/60)}))
 const avg=rows.length?Math.round(rows.reduce((a,s)=>a+s.score_pct,0)/rows.length):0
 const reps=rows.reduce((a,s)=>a+(s.reps_completed??0),0)
 return <><div className="page-head"><h1>Progress analysis</h1><span className="muted small">Your recorded sessions</span></div>
 <div className="stats-grid"><div className="card"><span className="muted small">Sessions</span><strong>{rows.length}</strong></div><div className="card"><span className="muted small">Average score</span><strong>{avg}%</strong></div><div className="card"><span className="muted small">Total reps</span><strong>{reps}</strong></div></div>
 <div className="card"><h2>Session score trend</h2>{data.length?<div style={{height:280}}><ResponsiveContainer width="100%" height="100%"><LineChart data={data}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="date"/><YAxis domain={[0,100]}/><Tooltip/><Line type="monotone" dataKey="score" name="Score %" stroke="#1d5c73" strokeWidth={2}/></LineChart></ResponsiveContainer></div>:<p className="muted">Complete a session to see your trend.</p>}</div>
 <div className="card"><h2>Session history</h2>{rows.length===0?<p className="muted">No recorded sessions yet.</p>:<table><thead><tr><th>Date</th><th>Exercise</th><th>Reps</th><th>Duration</th><th>Score</th><th>Pain after</th></tr></thead><tbody>{rows.map(s=><tr key={s.id}><td>{new Date(s.created_at).toLocaleDateString()}</td><td>{s.exercise_name}</td><td>{s.reps_completed??'–'}</td><td>{durationLabel(s.duration_secs)}</td><td>{Math.round(s.score_pct)}%</td><td>{s.pain_after??'–'}</td></tr>)}</tbody></table>}</div>
 <p className="muted small">These are activity measurements, not a diagnosis or proof of clinical recovery. Interpret trends with your treating clinician.</p></>
}
