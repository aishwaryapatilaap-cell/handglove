import { FormEvent, useEffect, useState } from 'react'
import { api } from '../api'

type Msg = { id:number; sender_id:number; body:string; created_at:string }
export default function Messages({ peerId, currentUserId }: { peerId:number; currentUserId:number }) {
  const [items,setItems]=useState<Msg[]>([])
  const [body,setBody]=useState('')
  const [error,setError]=useState('')
  async function load(){ try { setItems(await api<Msg[]>(`/messages/${peerId}`)) } catch(e){setError((e as Error).message)} }
  useEffect(()=>{ void load(); const id=setInterval(()=>void load(),5000); return ()=>clearInterval(id) },[peerId])
  async function send(e:FormEvent){e.preventDefault(); if(!body.trim())return; try{await api(`/messages/${peerId}`,'POST',{body});setBody('');setError('');await load()}catch(e){setError((e as Error).message)}}
  return <section className="card">
    <h2>Messages</h2><div className="message-list">{items.map(m=><div key={m.id} className={'message '+(m.sender_id===currentUserId?'mine':'')}><p>{m.body}</p><small>{new Date(m.created_at).toLocaleString()}</small></div>)}</div>
    {error&&<p className="bad small">{error}</p>}
    <form onSubmit={send} className="message-compose"><input aria-label="Message" placeholder="Write a message…" value={body} onChange={e=>setBody(e.target.value)} maxLength={2000}/><button className="btn">Send</button></form>
  </section>
}
