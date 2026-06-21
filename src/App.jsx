import { useState, useEffect, useRef, useCallback } from "react";
import { store } from "./store";

const THEMES = [
  "The fear of the Lord is the beginning of knowledge",
  "Seek wisdom like hidden treasure",
  "Trust in the Lord with all your heart",
  "Get wisdom; guard your heart above all",
  "Faithfulness and the cost of folly",
  "The ant, the sluggard, and seven things the Lord hates",
  "Guarding the heart against temptation",
  "Wisdom calls aloud in the streets",
  "Wisdom's feast and Folly's table",
  "The wise and the foolish, side by side",
  "Integrity, generosity, and righteousness",
  "Words that heal, work that endures",
  "Discipline, riches, and good company",
  "The wise build; the foolish tear down",
  "A soft answer turns away wrath",
  "Commit your works to the Lord",
  "A friend loves at all times",
  "The power of the tongue",
  "Better the poor who walks in integrity",
  "Honesty in dealings, patience in spirit",
  "The king's heart is in the Lord's hand",
  "A good name is better than riches",
  "Warnings on greed, drink, and discipline",
  "Wisdom builds a house",
  "Restraint, mercy, and self-control",
  "The fool, the sluggard, and the gossip",
  "Iron sharpens iron; faithful are a friend's wounds",
  "The righteous are bold as a lion",
  "Where there is no vision, the people perish",
  "The words of Agur: wonder and humility",
  "The virtuous woman, worth far above rubies",
];

const ADMIN_NAME = "Vincent";
const MOTIVATIONS = [
  "Well done, {name}! Wisdom is taking root in you.",
  "Another step closer to a wiser heart, {name}.",
  "Beautiful reflection, {name} — keep building the habit.",
  "You showed up today, {name}. That's faithfulness.",
  "\"The wise in heart accept commands\" — and you just did, {name}.",
  "Great job, {name}! Consistency like this is its own kind of wisdom.",
  "One more chapter, one more treasure stored up, {name}.",
  "Keep going, {name} — wisdom is calling, and you're listening.",
  "Your faithfulness today is shaping who you become, {name}.",
  "That reflection mattered, {name}. Proud of you for showing up.",
  "Small daily steps, {name} — this is how wisdom is built.",
  "You're not just reading Proverbs, {name} — you're living it.",
];
const isAdminUser = (me) => me && me.name.trim().toLowerCase() === ADMIN_NAME.trim().toLowerCase();
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "reader";
const palette = ["#b0833f","#6b7f5e","#9c5a45","#5e6f86","#8a6e9c","#a07b54"];
const REACTIONS = ["🙏","❤️","🔥","🌿","✨","🙌","😊","😢","💯","👏","🕊️","☀️","🌟","💛","🤍","🎶","📖","🫶","😇","💪","🥹","🤩"];
const STICKY_BG = ["#fef3c7","#fde2e4","#e2f0d9","#dbeafe","#ede9fe","#fbe8d3"];
const STICKY_ANGLE = [-2.5,2,-1.5,2.8,-2.2,1.6];
const genCode = () => Math.random().toString(36).slice(2,8).toUpperCase();

function todayChapter() {
  const d = new Date();
  return d.getMonth() === 6 ? d.getDate() : null;
}

// First chapter not yet marked read — used for sequential unlocking.
function firstUnread(entries) {
  const e = entries || {};
  for (let c = 1; c <= 31; c++) if (!(e[c] && e[c].read)) return c;
  return 31;
}

// ── PDF ───────────────────────────────────────────────────────────────────────
async function downloadPDF(me, entries) {
  if (!window.jspdf) {
    await new Promise((res,rej) => {
      const s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
      s.onload = res; s.onerror = rej; document.head.appendChild(s);
    });
  }
  const {jsPDF} = window.jspdf;
  const doc = new jsPDF({unit:"mm",format:"a4"});
  const W=210,L=25,R=25,cW=W-L-R;
  const ink=[30,24,14],soft=[100,88,65],gold=[160,115,50];
  const months=["January","February","March","April","May","June","July","August","September","October","November","December"];
  const dateStr=`${months[new Date().getMonth()]} ${new Date().getFullYear()}`;
  const completed=Object.keys(entries).filter(c=>entries[c]?.read).length;
  doc.setFillColor(252,248,238); doc.rect(0,0,W,297,"F");
  doc.setFillColor(...gold); doc.rect(0,0,18,297,"F");
  doc.setTextColor(...soft); doc.setFontSize(9); doc.setFont("helvetica","normal");
  doc.text("PERSONAL DEVOTIONAL JOURNAL",L+2,44);
  doc.setFontSize(36); doc.setFont("helvetica","bold"); doc.setTextColor(...ink);
  doc.text("Proverbs",L+2,78);
  doc.setFontSize(22); doc.setFont("helvetica","normal"); doc.setTextColor(...gold);
  doc.text("A 31-Day Journey Through Wisdom",L+2,90);
  doc.setDrawColor(210,195,160); doc.setLineWidth(0.5); doc.line(L+2,97,L+122,97);
  doc.setFontSize(14); doc.setFont("helvetica","bold"); doc.setTextColor(...ink);
  doc.text(me.name,L+2,112);
  doc.setFontSize(10); doc.setFont("helvetica","normal"); doc.setTextColor(...soft);
  doc.text(dateStr,L+2,121);
  doc.text(`${completed} of 31 chapters completed`,L+2,130);
  doc.setFontSize(11); doc.setFont("helvetica","italic"); doc.setTextColor(...soft);
  const cv=doc.splitTextToSize('"The fear of the Lord is the beginning of wisdom."',cW);
  doc.text(cv,L+2,215); doc.text("— Proverbs 9:10",L+2,225);
  THEMES.forEach((theme,idx)=>{
    const ch=idx+1,e=entries[ch]||{};
    const verse=e.verse?.trim()||"",meaning=e.meaning?.trim()||"";
    doc.addPage();
    doc.setFillColor(252,248,238); doc.rect(0,0,W,297,"F");
    doc.setFillColor(...gold); doc.rect(0,0,18,297,"F");
    for(let ly=100;ly<270;ly+=8){doc.setDrawColor(230,220,200);doc.setLineWidth(0.2);doc.line(L+2,ly,W-R,ly);}
    let y=28;
    doc.setFontSize(9); doc.setFont("helvetica","normal"); doc.setTextColor(...soft);
    doc.text(`Day ${ch} of 31`,W-R,y,{align:"right"});
    doc.setFontSize(20); doc.setFont("helvetica","bold"); doc.setTextColor(...ink);
    doc.text(`Proverbs ${ch}`,L+2,y+2); y+=10;
    doc.setFontSize(10); doc.setFont("helvetica","italic"); doc.setTextColor(...gold);
    const tl=doc.splitTextToSize(theme,cW); doc.text(tl,L+2,y); y+=tl.length*5.5+4;
    doc.setDrawColor(210,195,160); doc.setLineWidth(0.4); doc.line(L+2,y,W-R,y); y+=8;
    doc.setFontSize(7.5); doc.setFont("helvetica","bold"); doc.setTextColor(...gold);
    doc.text("FAVOURITE VERSE",L+2,y); y+=5;
    if(verse){
      doc.setFontSize(12); doc.setFont("helvetica","italic"); doc.setTextColor(...ink);
      const vl=doc.splitTextToSize(`"${verse}"`,cW); doc.text(vl,L+2,y); y+=vl.length*6.5+6;
    } else {
      for(let i=0;i<3;i++){doc.setDrawColor(200,188,165);doc.setLineWidth(0.3);doc.line(L+2,y+i*8,W-R,y+i*8);}
      y+=30;
    }
    doc.setFontSize(7.5); doc.setFont("helvetica","bold"); doc.setTextColor(...gold);
    doc.text("WHAT THIS MEANS TO ME",L+2,y); y+=5;
    if(meaning){
      doc.setFontSize(11); doc.setFont("helvetica","normal"); doc.setTextColor(...ink);
      const ml=doc.splitTextToSize(meaning,cW); doc.text(ml,L+2,y); y+=ml.length*6+8;
    } else {
      for(let i=0;i<5;i++){doc.setDrawColor(200,188,165);doc.setLineWidth(0.3);doc.line(L+2,y+i*8,W-R,y+i*8);}
      y+=48;
    }
    doc.setFontSize(7.5); doc.setFont("helvetica","bold"); doc.setTextColor(...gold);
    doc.text("PRAYER",L+2,y); y+=5;
    doc.setFontSize(10); doc.setFont("helvetica","italic"); doc.setTextColor(...soft);
    const pl=doc.splitTextToSize(`Lord, open my heart to the wisdom of Proverbs ${ch} today. Amen.`,cW);
    doc.text(pl,L+2,y);
    doc.setFontSize(8); doc.setFont("helvetica","normal"); doc.setTextColor(...soft);
    doc.text(`${ch}`,W/2,289,{align:"center"});
  });
  doc.save(`${me.name.replace(/\s+/g,"-")}-Proverbs-Journal.pdf`);
}

// ── Audio ─────────────────────────────────────────────────────────────────────
function AudioPlayer({chapter}) {
  const [playing,setPlaying]=useState(false);
  const [progress,setProgress]=useState(0);
  const [duration,setDuration]=useState(0);
  const [currentTime,setCurrTime]=useState(0);
  const audioRef=useRef(null);
  const fmt=s=>`${Math.floor(s/60)}:${Math.floor(s%60).toString().padStart(2,"0")}`;
  useEffect(()=>{setPlaying(false);setProgress(0);setCurrTime(0);setDuration(0);},[chapter]);
  return (
    <div className="pv-audio">
      <audio ref={audioRef} src={`https://audio.esv.org/hw/mq/Prov.${chapter}.mp3`}
        onTimeUpdate={e=>{setCurrTime(e.target.currentTime);setProgress(duration?(e.target.currentTime/duration)*100:0);}}
        onLoadedMetadata={e=>setDuration(e.target.duration)}
        onEnded={()=>setPlaying(false)}/>
      <button className="pv-playbtn" onClick={()=>{
        const a=audioRef.current; if(!a) return;
        if(playing){a.pause();setPlaying(false);}
        else a.play().then(()=>setPlaying(true)).catch(()=>{});
      }}>{playing?"⏸":"▶"}</button>
      <div className="pv-ainfo">
        <div className="pv-atitle">Proverbs {chapter} — Listen</div>
        <input type="range" className="pv-aprog" min="0" max="100" value={progress}
          onChange={e=>{const a=audioRef.current;if(a&&duration){a.currentTime=(e.target.value/100)*duration;setProgress(+e.target.value);}}}/>
        <div className="pv-atime">{fmt(currentTime)} / {fmt(duration||0)}</div>
      </div>
    </div>
  );
}

// ── Bible Reader ──────────────────────────────────────────────────────────────
function BibleReader({chapter, onUseVerse}) {
  const [verses,setVerses]=useState([]);
  const [loading,setLoading]=useState(false);
  const [picked,setPicked]=useState(null);
  useEffect(()=>{
    setPicked(null); setLoading(true); setVerses([]);
    fetch(`https://bible-api.com/proverbs+${chapter}?translation=web`)
      .then(r=>r.json()).then(d=>{setVerses(d.verses||[]);setLoading(false);}).catch(()=>setLoading(false));
  },[chapter]);
  return (
    <div>
      <AudioPlayer chapter={chapter}/>
      {picked&&(
        <div className="pv-selvbanner">
          <div className="pv-selvlbl">Selected verse</div>
          <div className="pv-selvtxt">"{picked.text}"</div>
          <div className="pv-selvref">— Proverbs {chapter}:{picked.num}</div>
          <button className="pv-usebtn" onClick={()=>{onUseVerse(picked.text);setPicked(null);}}>Use as my favourite verse ✓</button>
        </div>
      )}
      <div className="pv-vhint">Tap a verse to select it</div>
      {loading&&<div className="pv-loading">Loading Proverbs {chapter}…</div>}
      {verses.map(v=>(
        <div key={v.verse} className={"pv-verserow"+(picked?.num===v.verse?" picked":"")}
          onClick={()=>setPicked(picked?.num===v.verse?null:{num:v.verse,text:v.text.trim()})}>
          <span className="pv-vn">{v.verse}</span>
          <span className="pv-vt">{v.text.trim()}</span>
        </div>
      ))}
    </div>
  );
}

// ── Comments Thread ───────────────────────────────────────────────────────────
function CommentsThread({soc, me, onComment, onReply, onReactToComment, onEditComment, onDeleteComment, isAdmin}) {
  const [draft,setDraft]=useState("");
  const [replyTo,setReplyTo]=useState(null);
  const [commentPicker,setCommentPicker]=useState(null);
  const [editingId,setEditingId]=useState(null);
  const [editDraft,setEditDraft]=useState("");
  const handleSend=()=>{
    if(!draft.trim()) return;
    if(replyTo) onReply(replyTo,draft);
    else onComment(draft);
    setDraft(""); setReplyTo(null);
  };
  const startEdit=(c)=>{setEditingId(c.id);setEditDraft(c.text);};
  const saveEdit=()=>{if(editDraft.trim())onEditComment(editingId,editDraft);setEditingId(null);};
  return (
    <div className="pv-mythread">
      <div className="pv-myreactions">
        {Object.entries(soc.reactions||{}).filter(([,ids])=>ids&&ids.length>0).map(([em,ids])=>(
          <span key={em} className="pv-rxcount">{em} <b>{ids.length}</b></span>
        ))}
        {Object.keys(soc.reactions||{}).filter(k=>(soc.reactions[k]||[]).length>0).length===0&&(
          <span className="pv-noreact">No reactions yet</span>
        )}
      </div>
      {(soc.comments||[]).length>0&&(
        <div className="pv-threadlist">
          {(soc.comments||[]).map(c=>{
            const isMine=c.byId===me.id;
            const cReactions=c.reactions||{};
            return (
              <div key={c.id} className={"pv-threaditem"+(c.replyTo?" reply":"")}>
                <div className="pv-threadwho">
                  <b>{c.byName}</b>
                  {c.replyTo&&<span className="pv-replytag">↩ reply</span>}
                  {(isMine||isAdmin)&&(
                    <span className="pv-cmt-actions">
                      {isMine&&<button className="pv-cmtaction" onClick={()=>startEdit(c)}>✏️</button>}
                      <button className="pv-cmtaction del" onClick={()=>onDeleteComment(c.id)}>🗑️</button>
                    </span>
                  )}
                </div>
                {editingId===c.id?(
                  <div className="pv-cmtform" style={{marginTop:6}}>
                    <input className="pv-cmtin" value={editDraft} onChange={e=>setEditDraft(e.target.value)}
                      onKeyDown={e=>{if(e.key==="Enter")saveEdit();if(e.key==="Escape")setEditingId(null);}}/>
                    <button className="pv-cmtbtn" onClick={saveEdit}>Save</button>
                    <button className="pv-cmtbtn" style={{background:"var(--soft)",marginLeft:4}} onClick={()=>setEditingId(null)}>✕</button>
                  </div>
                ):(
                  <div className="pv-threadtxt">{c.text}{c.edited&&<span className="pv-edited"> (edited)</span>}</div>
                )}
                <div className="pv-cmtreacts">
                  {Object.entries(cReactions).filter(([,ids])=>ids&&ids.length>0).map(([em,ids])=>{
                    const on=(ids||[]).includes(me.id);
                    return <button key={em} className={"pv-cmtrx"+(on?" on":"")} onClick={()=>onReactToComment(c.id,em)}>{em}<b>{ids.length}</b></button>;
                  })}
                  <span style={{position:"relative",display:"inline-flex"}}>
                    <button className="pv-cmtaddrx" onClick={()=>setCommentPicker(commentPicker===c.id?null:c.id)}>＋</button>
                    {commentPicker===c.id&&(
                      <div className="pv-pickpop" style={{bottom:28,left:0}}>
                        {REACTIONS.map(em=><button key={em} onClick={()=>{onReactToComment(c.id,em);setCommentPicker(null);}}>{em}</button>)}
                      </div>
                    )}
                  </span>
                  <button className="pv-replylink" onClick={()=>setReplyTo(replyTo===c.id?null:c.id)}>
                    {replyTo===c.id?"Cancel":"Reply"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {replyTo&&<div className="pv-replyingto">Replying <button onClick={()=>setReplyTo(null)}>✕</button></div>}
      <div className="pv-cmtform" style={{marginTop:10}}>
        <input className="pv-cmtin" value={draft} placeholder="Add a comment…"
          onChange={e=>setDraft(e.target.value)}
          onKeyDown={e=>{if(e.key==="Enter")handleSend();}}/>
        <button className="pv-cmtbtn" onClick={handleSend}>Send</button>
      </div>
    </div>
  );
}

// ── Notification Panel ────────────────────────────────────────────────────────
function NotifPanel({notifs, participants, onClose, onMarkRead}) {
  return (
    <div className="pv-notifs">
      <div className="pv-nhead">
        <span className="pv-ntitle">🔔 Notifications</span>
        <button className="pv-nclose" onClick={onClose}>✕</button>
      </div>
      {notifs.length===0
        ? <div className="pv-nempty">No new notifications yet.<br/>When friends react or comment on your verses, they'll appear here.</div>
        : <>
            {notifs.map((n,i)=>(
              <div key={i} className="pv-nitem">
                <span className="pv-nicon">{n.type==="reaction"?n.emoji:"💬"}</span>
                <div>
                  <div className="pv-ntext">
                    {n.type==="reaction"
                      ? <><b>{n.byName||"Someone"}</b> reacted {n.emoji} to your Proverbs {n.ch} verse</>
                      : <><b>{n.byName}</b> {n.replyTo?"replied":"commented"}: "{n.text?.length>60?n.text.slice(0,60)+"…":n.text}"</>
                    }
                  </div>
                  <div className="pv-nch">Proverbs {n.ch}</div>
                </div>
              </div>
            ))}
            <button className="pv-nmark" onClick={onMarkRead}>Mark all as read</button>
          </>
      }
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ProverbsChallenge() {
  const [me,setMe]=useState(null);
  const [nameInput,setNameInput]=useState("");
  const [myEntries,setMyEntries]=useState({});
  const [participants,setParticipants]=useState([]);
  const [groups,setGroups]=useState([]); // all groups
  const [myGroups,setMyGroups]=useState([]); // groups I belong to
  const [activeGroup,setActiveGroup]=useState(null); // null = public view
  const [showGroupPanel,setShowGroupPanel]=useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [groupCode, setGroupCode] = useState("");
  const [groupName, setGroupName] = useState("");
  const [joinCode,setJoinCode]=useState("");
  const [groupError,setGroupError]=useState("");
  const [loading,setLoading]=useState(true);
  const [open,setOpen]=useState(null);
  const [activeTab,setActiveTab]=useState({});
  const [editing,setEditing]=useState({});
  const [saving,setSaving]=useState(false);
  const [pinFor,setPinFor]=useState(null);
  const [pinInput,setPinInput]=useState("");
  const [pinError,setPinError]=useState("");
  const [pinTries,setPinTries]=useState(0);
  const [newPin,setNewPin]=useState("");
  const [joinError,setJoinError]=useState("");
  const [viewing,setViewing]=useState(null);
  const [confirmDelete,setConfirmDelete]=useState(false);
  const [renaming,setRenaming]=useState(false);
  const [renameDraft,setRenameDraft]=useState("");
  const [readErr,setReadErr]=useState({});
  const [social,setSocial]=useState({});
  const [noteIdx,setNoteIdx]=useState(0);
  const [commentDraft,setCommentDraft]=useState("");
  const [paused,setPaused]=useState(false);
  const [picker,setPicker]=useState(null);
  const [notifications,setNotifications]=useState([]);
  const [showNotifs,setShowNotifs]=useState(false);
  const [isPrivate,setIsPrivate]=useState(false);
  const [showLeaderboard,setShowLeaderboard]=useState(false);
  const [lbChapter,setLbChapter]=useState(null);
  const [toast,setToast]=useState(null);
  const [showAllDone,setShowAllDone]=useState(false);
  const saveTimer=useRef(null);
  const rowRefs=useRef({});

  const getTab=ch=>activeTab[ch]||"read";
  const setTab=(ch,t)=>setActiveTab(a=>({...a,[ch]:t}));
  const isEditing=ch=>editing[ch]||false;
  const setEditMode=(ch,v)=>setEditing(e=>({...e,[ch]:v}));

  // ── Groups helpers ──────────────────────────────────────────────────────────
  const loadGroups = useCallback(async (currentMe) => {
    if (!currentMe) return;
    try {
      const listing = await store.list("group:", true);
      const keys = (listing&&listing.keys)||[];
      const all = [];
      for (const k of keys) {
        try { const r=await store.get(k,true); if(r&&r.value) all.push(JSON.parse(r.value)); } catch(e){}
      }
      setGroups(all);
      setMyGroups(all.filter(g=>(g.members||[]).includes(currentMe.id)));
    } catch(e){}
  },[]);

  const postAnnouncement = async (g) => {
    if (!announcement.trim()) return;
    const updated = {...g, announcements: [...(g.announcements||[]), {
      id: Date.now()+"-"+Math.random().toString(36).slice(2,5),
      text: announcement.trim(),
      byName: me.name,
      ts: Date.now()
    }]};
    try {
      await store.set("group:"+g.id, JSON.stringify(updated), true);
      setGroups(gs=>gs.map(x=>x.id===g.id?updated:x));
      setMyGroups(gs=>gs.map(x=>x.id===g.id?updated:x));
      setAnnouncement("");
    } catch(e){}
  };

  const deleteAnnouncement = async (g, annoId) => {
    const updated = {...g, announcements: (g.announcements||[]).filter(a=>a.id!==annoId)};
    try {
      await store.set("group:"+g.id, JSON.stringify(updated), true);
      setGroups(gs=>gs.map(x=>x.id===g.id?updated:x));
      setMyGroups(gs=>gs.map(x=>x.id===g.id?updated:x));
    } catch(e){}
  };

  const createGroup = async () => {
    if (!groupName.trim()) { setGroupError("Enter a group name."); return; }
    const rawCode = groupCode.trim().toUpperCase().replace(/[^A-Z0-9]/g,"");
    if (rawCode.length < 4 || rawCode.length > 8) { setGroupError("Code must be 4–8 characters (letters and numbers)."); return; }
    const existing = groups.find(g=>g.code===rawCode);
    if (existing) { setGroupError("That code is already taken. Choose another."); return; }
    const g = { id:"grp-"+Date.now(), name:groupName.trim(), code:rawCode, creatorId:me.id, members:[me.id], createdAt:Date.now() };
    try {
      await store.set("group:"+g.id, JSON.stringify(g), true);
      setGroups(gs=>[...gs,g]);
      setMyGroups(gs=>[...gs,g]);
      setGroupName(""); setGroupCode(""); setGroupError("");
      setActiveGroup(g);
    } catch(e){ setGroupError("Failed to create group."); }
  };

  const joinGroup = async () => {
    const code = joinCode.trim().toUpperCase();
    const g = groups.find(g=>g.code===code);
    if (!g) { setGroupError("Invalid invite code."); return; }
    if ((g.members||[]).includes(me.id)) { setGroupError("You're already in this group."); return; }
    const updated = {...g, members:[...(g.members||[]),me.id]};
    try {
      await store.set("group:"+g.id, JSON.stringify(updated), true);
      setGroups(gs=>gs.map(x=>x.id===g.id?updated:x));
      setMyGroups(gs=>[...gs,updated]);
      setJoinCode(""); setGroupError("");
      setActiveGroup(updated);
    } catch(e){ setGroupError("Failed to join group."); }
  };

  const leaveGroup = async (g) => {
    const updated = {...g, members:(g.members||[]).filter(id=>id!==me.id)};
    try {
      await store.set("group:"+g.id, JSON.stringify(updated), true);
      setGroups(gs=>gs.map(x=>x.id===g.id?updated:x));
      setMyGroups(gs=>gs.filter(x=>x.id!==g.id));
      if (activeGroup?.id===g.id) setActiveGroup(null);
    } catch(e){}
  };

  const removeMember = async (g, memberId) => {
    const updated = {...g, members:(g.members||[]).filter(id=>id!==memberId)};
    try {
      await store.set("group:"+g.id, JSON.stringify(updated), true);
      setGroups(gs=>gs.map(x=>x.id===g.id?updated:x));
      setMyGroups(gs=>gs.map(x=>x.id===g.id?updated:x));
    } catch(e){}
  };

  // ── Participants filtered by active group ───────────────────────────────────
  const visibleParticipants = activeGroup
    ? participants.filter(p=>(activeGroup.members||[]).includes(p.id))
    : participants.filter(p=>!p.isPrivate || p.id===me?.id);

  // ── Completion tracking — a chapter counts as done only when the reader
  //    has ticked "I have read" (which itself requires both reflections). ──────
  const chapterDone = (entries, ch) => {
    const e = entries && entries[ch];
    return !!(e && e.read);
  };
  const chapterCount = (p) => {
    let n = 0; for (let ch = 1; ch <= 31; ch++) if (chapterDone(p.entries, ch)) n++; return n;
  };
  const chapterCompleters = (ch) =>
    visibleParticipants.filter(p => chapterDone(p.entries, ch)).sort((a,b)=>a.name.localeCompare(b.name));

  // ── Stricter completion check (verse AND reflection) — used to trigger the
  //    celebratory toast / all-done message, separate from the looser
  //    chapterDone used for the public Progress panel.
  const bothFieldsDone = (entries, ch) => {
    const e = entries && entries[ch];
    return !!(e && e.verse?.trim() && e.meaning?.trim());
  };

  // ── Load ────────────────────────────────────────────────────────────────────
  const loadParticipants = useCallback(async () => {
    try {
      const listing=await store.list("user:",true);
      const keys=(listing&&listing.keys)||[];
      const out=[];
      for(const k of keys){try{const r=await store.get(k,true);if(r&&r.value)out.push(JSON.parse(r.value));}catch(e){}}
      out.sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0));
      setParticipants(out);
    } catch(e){setParticipants([]);}
  },[]);

  const loadSocial = useCallback(async () => {
    try {
      const listing=await store.list("social:",true);
      const keys=(listing&&listing.keys)||[];
      const map={};
      for(const k of keys){try{const r=await store.get(k,true);if(r&&r.value)map[k.slice("social:".length)]=JSON.parse(r.value);}catch(e){}}
      setSocial(map);
    } catch(e){setSocial({});}
  },[]);

  const loadNotifications = useCallback(async (currentMe) => {
    if (!currentMe) return;
    try {
      const snapKey="rx-snap-"+currentMe.id;
      const prevSnap=JSON.parse(localStorage.getItem(snapKey)||"{}");
      const lastSeen=+(localStorage.getItem("notif-seen-"+currentMe.id)||0);
      const listing=await store.list("social:",true);
      const keys=(listing&&listing.keys)||[];
      const notifs=[];
      const newSnap={...prevSnap};
      for(const k of keys){
        try {
          const parts=k.replace("social:","").split(":");
          if(parts.length<2) continue;
          const authorId=parts[0],ch=+parts[1];
          if(authorId!==currentMe.id) continue;
          const r=await store.get(k,true);
          if(!r||!r.value) continue;
          const data=JSON.parse(r.value);
          const snapK=String(ch);
          const prevRx=prevSnap[snapK]||{};
          Object.entries(data.reactions||{}).forEach(([emoji,ids])=>{
            const prevIds=prevRx[emoji]||[];
            (ids||[]).filter(id=>id!==currentMe.id&&!prevIds.includes(id)).forEach(()=>{
              notifs.push({type:"reaction",emoji,ch,ts:Date.now()});
            });
          });
          newSnap[snapK]=data.reactions||{};
          (data.comments||[]).forEach(c=>{
            if(c.byId===currentMe.id) return;
            if(c.ts>lastSeen) notifs.push({type:"comment",byName:c.byName,text:c.text,ch,ts:c.ts,replyTo:c.replyTo||null});
          });
        } catch(e){}
      }
      localStorage.setItem(snapKey,JSON.stringify(newSnap));
      notifs.sort((a,b)=>b.ts-a.ts);
      setNotifications(notifs);
    } catch(e){}
  },[]);

  const sKey=(aid,ch)=>aid+":"+ch;
  const getSocial=(aid,ch)=>social[sKey(aid,ch)]||{reactions:{},comments:[]};
  const saveSocial=async(aid,ch,data)=>{
    setSocial(s=>({...s,[sKey(aid,ch)]:data}));
    try{await store.set("social:"+aid+":"+ch,JSON.stringify(data),true);}catch(e){}
  };
  const toggleReaction=async(aid,ch,emoji)=>{
    if(!me) return;
    const cur=getSocial(aid,ch),reactions={...(cur.reactions||{})};
    const arr=new Set(reactions[emoji]||[]);
    arr.has(me.id)?arr.delete(me.id):arr.add(me.id);
    reactions[emoji]=Array.from(arr);
    await saveSocial(aid,ch,{...cur,reactions});
  };
  const addComment=async(aid,ch,text,replyTo=null)=>{
    if(!me||!text.trim()) return;
    const cur=getSocial(aid,ch);
    const comments=[...(cur.comments||[]),{id:Date.now()+"-"+Math.random().toString(36).slice(2,5),byId:me.id,byName:me.name,text:text.trim(),ts:Date.now(),replyTo,reactions:{}}];
    await saveSocial(aid,ch,{...cur,comments});
  };
  const reactToComment=async(aid,ch,commentId,emoji)=>{
    if(!me) return;
    const cur=getSocial(aid,ch);
    const comments=(cur.comments||[]).map(c=>{
      if(c.id!==commentId) return c;
      const reactions={...(c.reactions||{})};
      const arr=new Set(reactions[emoji]||[]);
      arr.has(me.id)?arr.delete(me.id):arr.add(me.id);
      reactions[emoji]=Array.from(arr);
      return {...c,reactions};
    });
    await saveSocial(aid,ch,{...cur,comments});
  };
  const editComment=async(aid,ch,commentId,newText)=>{
    if(!me||!newText.trim()) return;
    const cur=getSocial(aid,ch);
    const comments=(cur.comments||[]).map(c=>c.id===commentId?{...c,text:newText.trim(),edited:true}:c);
    await saveSocial(aid,ch,{...cur,comments});
  };
  const deleteComment=async(aid,ch,commentId)=>{
    if(!me) return;
    const cur=getSocial(aid,ch);
    const comments=(cur.comments||[]).filter(c=>c.id!==commentId);
    await saveSocial(aid,ch,{...cur,comments});
  };

  useEffect(()=>{
    (async()=>{
      let loadedEntries={};
      try {
        const saved=localStorage.getItem("me");
        if(saved){
          const p=JSON.parse(saved); setMe(p);
          setIsPrivate(p.isPrivate||false);
          try{const m=await store.get("user:"+p.id,true);if(m&&m.value){const d=JSON.parse(m.value);loadedEntries=d.entries||{};setMyEntries(loadedEntries);}}catch(e){}
          await loadNotifications(p);
          await loadGroups(p);
        }
      }catch(e){}
      await loadParticipants(); await loadSocial();
      setOpen(firstUnread(loadedEntries)); setLoading(false);
    })();
  },[loadParticipants,loadSocial,loadNotifications,loadGroups]);

  useEffect(()=>{setNoteIdx(0);setCommentDraft("");setPicker(null);},[open]);
  useEffect(()=>{
    if(!toast) return;
    const t=setTimeout(()=>setToast(null),4500);
    return()=>clearTimeout(t);
  },[toast]);
  useEffect(()=>{
    if(open===null||paused||picker) return;
    const id=setInterval(()=>setNoteIdx(i=>i+1),5000); return()=>clearInterval(id);
  },[open,paused,picker]);
  useEffect(()=>{
    const id=setInterval(async()=>{
      await loadParticipants(); await loadSocial();
      const saved=localStorage.getItem("me");
      if(saved){await loadNotifications(JSON.parse(saved));await loadGroups(JSON.parse(saved));}
    },20000);
    return()=>clearInterval(id);
  },[loadParticipants,loadSocial,loadNotifications,loadGroups]);

  const persist=useCallback((entries,person,priv)=>{
    setSaving(true); if(saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current=setTimeout(async()=>{
      try{
        const data={...person,entries,isPrivate:priv??person.isPrivate??false,updatedAt:Date.now()};
        await store.set("user:"+person.id,JSON.stringify(data),true);
        await loadParticipants();
      }catch(e){}
      setSaving(false);
    },700);
  },[loadParticipants]);

  const hashPin=async(id,pin)=>{
    const s=id+":"+pin;
    try{const buf=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(s));return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,"0")).join("");}
    catch(e){let h=0;for(let i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))|0;return"f"+(h>>>0).toString(16);}
  };

  const resume=async person=>{
    const p={id:person.id,name:person.name,pinHash:person.pinHash,isPrivate:person.isPrivate||false};
    setMe(p); setMyEntries(person.entries||{}); setIsPrivate(p.isPrivate);
    setOpen(firstUnread(person.entries||{}));
    localStorage.setItem("me",JSON.stringify(p));
    localStorage.setItem("pv-lastUser",p.id);
    await loadGroups(p);
  };
  const askPin=person=>{setPinFor(person);setPinInput("");setPinError("");};
  const confirmPin=async()=>{
    const person=pinFor; if(!person) return;
    if(!person.pinHash){setPinFor(null);resume(person);return;}
    const h=await hashPin(person.id,pinInput.trim());
    if(h===person.pinHash){setPinFor(null);resume(person);}
    else{setPinError("Incorrect PIN. Try again.");setPinInput("");setPinTries(t=>t+1);}
  };
  const join=async()=>{
    const name=nameInput.trim(); if(!name) return;
    const existing=participants.find(p=>p.name.toLowerCase()===name.toLowerCase());
    if(existing){setJoinError(`"${existing.name}" is already taken. If that's you, tap your name above to sign in — otherwise please choose a different name.`);return;}
    const pin=newPin.trim();
    if(!/^\d{4,8}$/.test(pin)){setJoinError("Choose a PIN of 4–8 digits.");return;}
    const id=slug(name)+"-"+Math.random().toString(36).slice(2,6);
    const pinHash=await hashPin(id,pin);
    const person={id,name,pinHash,isPrivate:false};
    setMe(person); setMyEntries({}); setOpen(1); setIsPrivate(false);
    localStorage.setItem("me",JSON.stringify(person));
    localStorage.setItem("pv-lastUser",id);
    try{await store.set("user:"+id,JSON.stringify({...person,entries:{},updatedAt:Date.now()}),true);loadParticipants();}catch(e){}
  };
  const update=(chapter,field,value)=>{
    const next={...myEntries,[chapter]:{...myEntries[chapter],[field]:value}};
    setMyEntries(next); if(me) persist(next,me,isPrivate);
    if(readErr[chapter]) setReadErr(e=>({...e,[chapter]:""}));
  };
  const toggleRead=(chapter)=>{
    const cur=myEntries[chapter]||{};
    if(cur.read){ // un-mark
      const next={...myEntries,[chapter]:{...cur,read:false}};
      setMyEntries(next); if(me) persist(next,me,isPrivate);
      return;
    }
    // Strict rule: can't mark read until BOTH reflections are written
    if(!(cur.verse?.trim()&&cur.meaning?.trim())){
      setReadErr(e=>({...e,[chapter]:"Finish your reflection first — add your favourite verse and what it means to you before marking this chapter as read."}));
      return;
    }
    setReadErr(e=>({...e,[chapter]:""}));
    const next={...myEntries,[chapter]:{...cur,read:true}};
    setMyEntries(next); if(me) persist(next,me,isPrivate);
    let totalDone=0; for(let c=1;c<=31;c++) if(next[c]?.read) totalDone++;
    if(totalDone===31){ setShowAllDone(true); }
    else { const raw=MOTIVATIONS[Math.floor(Math.random()*MOTIVATIONS.length)]; setToast({chapter,message:raw.replace("{name}",me.name)}); }
  };
  const togglePrivacy=async()=>{
    const priv=!isPrivate; setIsPrivate(priv);
    const updated={...me,isPrivate:priv};
    setMe(updated); localStorage.setItem("me",JSON.stringify(updated));
    persist(myEntries,updated,priv);
  };
  const saveName=()=>{
    const name=renameDraft.trim();
    if(!name){setRenaming(false);return;}
    if(name===me.name){setRenaming(false);return;}
    const updated={...me,name};
    setMe(updated); localStorage.setItem("me",JSON.stringify(updated));
    persist(myEntries,updated,isPrivate); // same id → PIN, entries, groups all preserved
    setRenaming(false);
  };
  const switchReader=async()=>{
    localStorage.removeItem("me");
    setMe(null);setMyEntries({});setNameInput("");setNewPin("");setViewing(null);setNotifications([]);setMyGroups([]);setActiveGroup(null);
  };
  const deleteMe=async()=>{
    if(!me) return;
    try{await store.delete("user:"+me.id,true);}catch(e){}
    localStorage.removeItem("me");
    setConfirmDelete(false);setMe(null);setMyEntries({});setNameInput("");setNewPin("");setViewing(null);setNotifications([]);
    loadParticipants();
  };

  const tc=todayChapter();
  const Avatar=({name,i})=><span className="pv-av" style={{background:palette[i%palette.length]}}>{name.trim()[0].toUpperCase()}</span>;
  const grow=e=>{e.target.style.height="auto";e.target.style.height=e.target.scrollHeight+"px";};

  const css=`
    @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Spectral:ital,wght@0,400;0,500;1,400&display=swap');
    .pv-root{--ink:#2c2417;--soft:#7b6c50;--gold:#b0833f;--gold-d:#8c6224;--card:#fbf6e8;--card2:#f6edd6;--line:#ddcca6;
      font-family:'Spectral',Georgia,serif;color:var(--ink);min-height:100vh;padding:0 0 60px;
      background:linear-gradient(180deg,#f6eed9,#ece0c2);}
    .pv-root *{box-sizing:border-box;}
    .pv-wrap{max-width:680px;margin:0 auto;padding:0 16px;}
    /* Welcome */
    .pv-hero{text-align:center;padding:46px 12px 18px;}
    .pv-kicker{font-family:'Fraunces',serif;letter-spacing:.36em;text-transform:uppercase;font-size:11px;color:var(--gold-d);font-weight:600;}
    .pv-title{font-family:'Fraunces',serif;font-weight:700;line-height:.96;margin:12px 0 4px;font-size:clamp(38px,12vw,64px);}
    .pv-title em{font-style:italic;color:var(--gold-d);}
    .pv-sub{font-style:italic;color:var(--soft);font-size:16px;max-width:430px;margin:8px auto 0;}
    .pv-rule{width:60px;height:1px;background:var(--gold);margin:18px auto 0;position:relative;}
    .pv-rule:before,.pv-rule:after{content:"";position:absolute;top:-2px;width:5px;height:5px;border-radius:50%;background:var(--gold);}
    .pv-rule:before{left:-10px;}.pv-rule:after{right:-10px;}
    .pv-steps{display:grid;gap:10px;max-width:430px;margin:22px auto 0;text-align:left;}
    .pv-step{display:flex;gap:12px;align-items:flex-start;background:var(--card);border:1px solid var(--line);border-radius:8px;padding:12px 14px;}
    .pv-snum{font-family:'Fraunces',serif;font-weight:600;color:#fff;background:var(--gold);width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;flex:0 0 auto;margin-top:1px;}
    .pv-stext{font-size:15px;line-height:1.4;}.pv-stext b{font-family:'Fraunces',serif;font-weight:600;}
    .pv-join{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:22px 18px;margin:22px auto 0;max-width:430px;}
    .pv-label{font-family:'Fraunces',serif;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--soft);margin-bottom:9px;}
    .pv-input{width:100%;background:transparent;border:none;border-bottom:1.5px solid var(--line);font-family:'Spectral',serif;font-size:20px;color:var(--ink);padding:8px 2px;outline:none;}
    .pv-input:focus{border-color:var(--gold);}
    .pv-btn{margin-top:18px;width:100%;background:var(--ink);color:#f6eed9;border:none;font-family:'Fraunces',serif;font-weight:600;letter-spacing:.08em;text-transform:uppercase;font-size:14px;padding:15px;border-radius:6px;cursor:pointer;}
    .pv-returning{margin:22px auto 0;max-width:430px;}
    .pv-rbtns{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px;}
    .pv-rbtn{display:flex;align-items:center;gap:9px;width:100%;min-width:0;text-align:left;background:var(--card);border:1px solid var(--line);border-radius:22px;padding:8px 14px 8px 8px;cursor:pointer;font-family:'Fraunces',serif;font-size:14px;color:var(--ink);transition:border-color .15s,transform .05s;}
    .pv-rbtn:hover{border-color:var(--soft);}
    .pv-rbtn:active{transform:scale(.98);}
    .pv-rbtn-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0;}
    .pv-rbtn-last{order:-1;background:#ece6f5;border:2px solid #8a6e9c;box-shadow:0 2px 10px rgba(138,110,156,.22);font-weight:600;}
    .pv-name{font-family:'Fraunces',serif;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:5px;}
    .pv-name:hover{color:var(--gold-d);}
    .pv-nameedit{font-size:11px;opacity:.55;}
    .pv-renamein{font-family:'Fraunces',serif;font-size:14px;font-weight:600;color:var(--ink);border:1px solid var(--line);border-radius:8px;padding:4px 10px;width:150px;outline:none;background:var(--card);}
    .pv-renamein:focus{border-color:#8a6e9c;}
    .pv-readcheck{display:inline-flex;align-items:center;gap:9px;margin-top:14px;padding:9px 14px;border:1.5px solid var(--line);border-radius:12px;cursor:pointer;font-family:'Fraunces',serif;font-size:14px;color:var(--ink);user-select:none;transition:all .15s;}
    .pv-readcheck:hover{border-color:var(--gold-d);}
    .pv-readcheck.on{background:#eef3e9;border-color:#6b7f5e;color:#43543a;font-weight:600;}
    .pv-readbox{width:20px;height:20px;border-radius:6px;border:1.5px solid var(--soft);display:flex;align-items:center;justify-content:center;font-size:13px;color:#fff;flex:0 0 auto;}
    .pv-readcheck.on .pv-readbox{background:#6b7f5e;border-color:#6b7f5e;}
    .pv-readerr{margin-top:8px;font-family:'Fraunces',serif;font-size:13px;color:#9c5a45;background:#f6ece8;border:1px solid #e3cabf;border-radius:10px;padding:8px 12px;}
    .pv-lbrow.me{background:#f3eede;border-radius:8px;margin:2px -8px;padding-left:8px;padding-right:8px;}
    .pv-or{text-align:center;font-style:italic;color:var(--soft);font-size:13px;margin:24px 0 2px;}
    .pv-err{color:#9c5a45;font-size:13px;margin-top:9px;text-align:center;font-style:italic;font-weight:500;}
    .pv-notice{background:var(--card);border:1px solid var(--line);border-left:3px solid var(--gold);border-radius:8px;padding:13px 15px;margin:20px auto 0;max-width:430px;font-size:13.5px;line-height:1.5;}
    .pv-notice b{font-family:'Fraunces',serif;font-weight:600;color:var(--gold-d);}
    .pv-credit{text-align:center;font-size:12px;letter-spacing:.06em;color:var(--gold-d);margin-top:16px;font-family:'Fraunces',serif;}
    /* Modal */
    .pv-modal{position:fixed;inset:0;background:rgba(44,36,23,.5);display:flex;align-items:center;justify-content:center;padding:20px;z-index:60;}
    .pv-modalcard{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:24px 20px;max-width:330px;width:100%;text-align:center;}
    .pv-modalcard .pv-input{text-align:center;letter-spacing:.4em;font-size:24px;}
    /* Status */
    .pv-status{display:flex;align-items:center;gap:10px;background:var(--card);border:1px solid var(--line);border-radius:10px;padding:11px 13px;margin:6px 0;flex-wrap:wrap;}
    .pv-reader{display:flex;align-items:center;gap:8px;flex:1;}
    .pv-chip{cursor:pointer;font-size:12px;color:var(--gold-d);font-family:'Fraunces',serif;border:1px solid var(--line);border-radius:18px;padding:4px 11px;background:transparent;}
    .pv-chip.priv{background:#fff8e6;border-color:var(--gold);}
    .pv-prog{flex:1;min-width:140px;}
    .pv-ptrack{height:7px;background:var(--card2);border:1px solid var(--line);border-radius:6px;overflow:hidden;}
    .pv-pfill{height:100%;background:linear-gradient(90deg,var(--gold),var(--gold-d));transition:width .5s;}
    .pv-pnum{font-family:'Fraunces',serif;font-size:11px;color:var(--soft);margin-top:4px;display:flex;justify-content:space-between;}
    .pv-bell{position:relative;cursor:pointer;background:none;border:none;font-size:22px;padding:2px 4px;line-height:1;flex:0 0 auto;}
    .pv-badgecount{position:absolute;top:-3px;right:-3px;background:#e53e3e;color:#fff;border-radius:50%;width:17px;height:17px;font-size:9px;font-weight:700;display:flex;align-items:center;justify-content:center;}
    .pv-av{width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-family:'Fraunces',serif;font-size:12px;font-weight:600;flex:0 0 auto;}
    /* Group bar */
    .pv-groupbar{display:flex;align-items:center;gap:8px;margin:6px 0;flex-wrap:wrap;}
    .pv-grpbtn{display:inline-flex;align-items:center;gap:5px;background:var(--card);border:1px solid var(--line);border-radius:20px;padding:5px 12px;font-family:'Fraunces',serif;font-size:13px;color:var(--ink);cursor:pointer;}
    .pv-grpbtn.active{background:var(--gold-d);color:#fff;border-color:var(--gold-d);}
    .pv-grpbtn.manage{background:transparent;border-style:dashed;color:var(--gold-d);}
    /* Group panel */
    .pv-grouppanel{position:fixed;inset:0;background:rgba(44,36,23,.5);display:flex;align-items:flex-end;justify-content:center;z-index:65;padding:0;}
    .pv-groupcard{background:var(--card);border-radius:20px 20px 0 0;width:100%;max-width:680px;padding:24px 20px 40px;max-height:85vh;overflow-y:auto;}
    .pv-gphead{display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;}
    .pv-gptitle{font-family:'Fraunces',serif;font-weight:700;font-size:18px;}
    .pv-gpclose{background:none;border:none;font-size:22px;cursor:pointer;color:var(--soft);}
    .pv-gpsect{margin-bottom:20px;}
    .pv-gpsect h4{font-family:'Fraunces',serif;font-size:13px;letter-spacing:.1em;text-transform:uppercase;color:var(--gold-d);margin-bottom:10px;}
    .pv-gpinput{width:100%;background:var(--card2);border:1px solid var(--line);border-radius:8px;padding:10px 12px;font-family:'Spectral',serif;font-size:16px;color:var(--ink);outline:none;margin-bottom:8px;}
    .pv-gpinput:focus{border-color:var(--gold);}
    .pv-gpbtn{background:var(--gold-d);color:#fff;border:none;border-radius:6px;padding:10px 18px;font-family:'Fraunces',serif;font-size:13px;cursor:pointer;}
    .pv-gperr{color:#9c5a45;font-size:13px;margin-top:6px;font-style:italic;}
    .pv-gpgroup{background:var(--card2);border:1px solid var(--line);border-radius:10px;padding:12px 14px;margin-bottom:8px;}
    .pv-gpgname{font-family:'Fraunces',serif;font-weight:600;font-size:15px;margin-bottom:4px;}
    .pv-gpcode{font-size:12px;color:var(--soft);margin-bottom:8px;}
    .pv-gpcode b{font-family:'Fraunces',serif;font-size:14px;color:var(--gold-d);letter-spacing:.2em;}
    .pv-gpmembers{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px;}
    .pv-gpmember{display:inline-flex;align-items:center;gap:5px;background:var(--card);border:1px solid var(--line);border-radius:16px;padding:3px 10px;font-size:12px;}
    .pv-gpkick{background:none;border:none;cursor:pointer;color:#9c5a45;font-size:11px;margin-left:3px;}
    .pv-annolist{display:flex;flex-direction:column;gap:8px;margin:0 0 14px;}
    .pv-anno{display:flex;align-items:flex-start;gap:10px;background:#fff8e6;border:1.5px solid var(--gold);border-radius:10px;padding:11px 13px;}
    .pv-anno-icon{font-size:18px;flex:0 0 auto;margin-top:1px;}
    .pv-anno-body{flex:1;min-width:0;}
    .pv-anno-text{font-size:14px;line-height:1.5;color:var(--ink);}
    .pv-anno-who{font-size:11px;color:var(--soft);font-style:italic;margin-top:3px;}
    .pv-anno-del{background:none;border:none;cursor:pointer;color:var(--soft);font-size:14px;flex:0 0 auto;padding:0;}
    .pv-anno-del:hover{color:#9c5a45;}
    .pv-sharebtn{background:var(--gold-d);color:#fff;border:none;border-radius:6px;padding:4px 10px;font-family:'Fraunces',serif;font-size:11px;cursor:pointer;margin-left:10px;}
    .pv-gpleave{background:none;border:1px solid #9c5a45;color:#9c5a45;border-radius:6px;padding:5px 12px;font-family:'Fraunces',serif;font-size:12px;cursor:pointer;}
    /* Leaderboard / Progress panel */
    .pv-lbrow{display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid var(--line);}
    .pv-lbrow:last-child{border-bottom:none;}
    .pv-lbrank{font-family:'Fraunces',serif;font-weight:700;font-size:13px;color:var(--gold-d);width:22px;text-align:center;flex:0 0 auto;}
    .pv-lbname{font-family:'Fraunces',serif;font-size:14px;flex:0 0 auto;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:110px;}
    .pv-lbbar{flex:1;height:7px;background:var(--card2);border:1px solid var(--line);border-radius:6px;overflow:hidden;min-width:50px;}
    .pv-lbfill{height:100%;background:linear-gradient(90deg,var(--gold),var(--gold-d));}
    .pv-lbcount{font-family:'Fraunces',serif;font-size:11px;color:var(--soft);flex:0 0 auto;width:42px;text-align:right;}
    .pv-lbcrownnote{font-size:12px;color:var(--soft);font-style:italic;margin-top:8px;text-align:center;}
    .pv-lbchips{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px;}
    .pv-lbchip{font-family:'Fraunces',serif;font-size:12px;background:var(--card2);border:1px solid var(--line);border-radius:8px;padding:6px 4px;width:38px;cursor:pointer;color:var(--ink);display:flex;flex-direction:column;align-items:center;}
    .pv-lbchip small{font-size:9px;color:var(--soft);margin-top:2px;}
    .pv-lbchip.on{background:var(--gold-d);color:#fff;border-color:var(--gold-d);}
    .pv-lbchip.on small{color:#f6eed9;}
    .pv-lbdetail{background:var(--card2);border:1px solid var(--line);border-radius:10px;padding:12px 14px;}
    .pv-lbdetailhd{font-family:'Fraunces',serif;font-weight:600;font-size:13px;color:var(--gold-d);margin-bottom:8px;}
    .pv-lbnames{display:flex;flex-wrap:wrap;gap:6px;}
    /* Chapter-complete toast */
    .pv-toast{position:fixed;bottom:24px;left:50%;max-width:380px;width:calc(100% - 32px);background:var(--ink);color:#f6eed9;border-radius:12px;padding:14px 16px;display:flex;align-items:flex-start;gap:10px;box-shadow:0 8px 24px rgba(0,0,0,.3);z-index:80;cursor:pointer;animation:pv-toast-in .35s ease forwards;}
    .pv-toast-icon{font-size:20px;flex:0 0 auto;line-height:1.3;}
    .pv-toast-title{font-family:'Fraunces',serif;font-weight:600;font-size:14px;}
    .pv-toast-msg{font-size:13px;color:#e8dcc0;margin-top:2px;font-style:italic;line-height:1.4;}
    @keyframes pv-toast-in{from{opacity:0;transform:translate(-50%,14px);}to{opacity:1;transform:translate(-50%,0);}}
    /* People */
    .pv-people{display:flex;align-items:center;gap:7px;flex-wrap:wrap;margin:4px 2px 14px;}
    .pv-people .pv-lead{font-style:italic;color:var(--soft);font-size:13px;font-family:'Spectral',serif;width:100%;margin-bottom:2px;}
    .pv-pill{display:inline-flex;align-items:center;gap:6px;cursor:pointer;background:var(--card);border:1px solid var(--line);border-radius:20px;padding:3px 11px 3px 3px;font-size:13px;font-family:'Fraunces',serif;color:var(--ink);}
    .pv-pill.active{border-color:var(--gold);box-shadow:0 0 0 1px var(--gold);}
    .pv-viewbar{display:flex;align-items:center;justify-content:space-between;gap:10px;background:#efe4c8;border:1px solid var(--gold);border-radius:10px;padding:10px 14px;margin:6px 0 12px;}
    .pv-viewbar .vt{font-family:'Fraunces',serif;font-size:14px;color:var(--gold-d);display:flex;align-items:center;gap:8px;}
    /* Reminder */
    .pv-reminder{display:flex;align-items:center;gap:12px;background:#fff8e6;border:1.5px solid var(--gold);border-radius:10px;padding:13px 14px;margin:0 0 14px;flex-wrap:wrap;}
    .pv-reminder.done{background:#f0faf0;border-color:#6b9e6b;}
    .pv-reminder-icon{font-size:24px;flex:0 0 auto;}
    .pv-reminder-text{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px;}
    .pv-reminder-text b{font-family:'Fraunces',serif;font-weight:600;font-size:14px;}
    .pv-reminder-text span{font-size:12px;color:var(--soft);font-style:italic;}
    .pv-reminder-btn{background:var(--gold-d);color:#fff;border:none;border-radius:6px;padding:8px 14px;font-family:'Fraunces',serif;font-size:13px;cursor:pointer;}
    .pv-prevremind{display:flex;align-items:center;gap:11px;background:#f4eef9;border:1.5px solid #c9b6dd;border-radius:10px;padding:11px 13px;margin:0 0 14px;flex-wrap:wrap;}
    .pv-prevremind-icon{font-size:20px;flex:0 0 auto;}
    .pv-prevremind-text{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px;}
    .pv-prevremind-text b{font-family:'Fraunces',serif;font-weight:600;font-size:14px;color:#5a4470;}
    .pv-prevremind-text span{font-size:12px;color:var(--soft);font-style:italic;}
    .pv-prevremind-btn{background:#8a6e9c;color:#fff;border:none;border-radius:6px;padding:8px 14px;font-family:'Fraunces',serif;font-size:13px;cursor:pointer;}
    .pv-todaybtn{display:block;width:100%;margin:0 0 14px;background:var(--gold-d);color:#fff;border:none;font-family:'Fraunces',serif;font-size:14px;padding:12px;border-radius:8px;cursor:pointer;font-weight:600;}
    .pv-hint{text-align:center;font-style:italic;color:var(--soft);font-size:13px;margin:2px 2px 14px;}
    /* Days */
    .pv-day{background:var(--card);border:1px solid var(--line);border-radius:10px;margin-bottom:10px;overflow:hidden;}
    .pv-day.today{border-color:var(--gold);box-shadow:0 0 0 1px var(--gold);}
    .pv-drow{display:flex;align-items:center;gap:12px;padding:13px 14px;cursor:pointer;width:100%;text-align:left;background:transparent;border:none;font-family:inherit;}
    .pv-badge{font-family:'Fraunces',serif;font-weight:600;font-size:13px;color:var(--gold-d);background:var(--card2);border:1px solid var(--line);border-radius:8px;padding:6px 0;width:54px;text-align:center;flex:0 0 auto;line-height:1.15;}
    .pv-badge small{display:block;font-weight:500;color:var(--soft);font-size:10px;}
    .pv-dmid{flex:1;min-width:0;}
    .pv-dch{font-family:'Fraunces',serif;font-weight:600;font-size:16px;display:flex;align-items:center;gap:7px;}
    .pv-tag{font-family:'Fraunces',serif;font-size:9px;letter-spacing:.12em;text-transform:uppercase;color:#fff;background:var(--gold-d);border-radius:10px;padding:2px 7px;}
    .pv-dtheme{font-style:italic;color:var(--soft);font-size:13px;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
    .pv-dot{width:22px;height:22px;border-radius:50%;flex:0 0 auto;border:1.5px solid var(--line);display:flex;align-items:center;justify-content:center;color:#fff;font-size:13px;}
    .pv-drow.locked{opacity:.5;}
    .pv-drow.locked .pv-badge{filter:grayscale(.6);}
    .pv-dot.locked{border:none;background:transparent;font-size:15px;}
    .pv-dot.done{background:var(--gold);border-color:var(--gold);}
    .pv-dbody{padding:2px 14px 16px;border-top:1px solid var(--line);}
    /* Tabs */
    .pv-tabs{display:flex;gap:6px;margin:12px 0 10px;}
    .pv-tab{flex:1;padding:9px;border:1px solid var(--line);border-radius:8px;background:var(--card2);font-family:'Fraunces',serif;font-size:13px;color:var(--soft);cursor:pointer;text-align:center;}
    .pv-tab.on{background:var(--gold-d);color:#fff;border-color:var(--gold-d);}
    /* Audio */
    .pv-audio{display:flex;align-items:center;gap:10px;background:rgba(176,131,63,.1);border:1px solid var(--line);border-radius:8px;padding:10px 12px;margin-bottom:10px;}
    .pv-playbtn{width:36px;height:36px;border-radius:50%;background:var(--gold-d);border:none;color:#fff;font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex:0 0 auto;}
    .pv-ainfo{flex:1;min-width:0;}
    .pv-atitle{font-family:'Fraunces',serif;font-size:12px;font-weight:600;color:var(--ink);}
    .pv-aprog{width:100%;height:3px;background:var(--card2);border-radius:3px;margin-top:5px;cursor:pointer;border:none;padding:0;appearance:none;}
    .pv-aprog::-webkit-slider-thumb{appearance:none;width:10px;height:10px;border-radius:50%;background:var(--gold-d);cursor:pointer;}
    .pv-atime{font-size:10px;color:var(--soft);margin-top:2px;}
    /* Verse picker */
    .pv-vhint{font-size:12px;color:var(--soft);font-style:italic;text-align:center;margin:6px 0;}
    .pv-verserow{display:flex;gap:8px;padding:6px 8px;border-radius:6px;cursor:pointer;}
    .pv-verserow:hover{background:rgba(176,131,63,.08);}
    .pv-verserow.picked{background:rgba(176,131,63,.18);border-left:3px solid var(--gold);padding-left:5px;}
    .pv-vn{font-family:'Fraunces',serif;font-weight:600;font-size:11px;color:var(--gold-d);min-width:20px;padding-top:3px;flex:0 0 auto;}
    .pv-vt{font-size:14px;line-height:1.6;color:var(--ink);}
    .pv-selvbanner{background:#efe4c8;border:1px solid var(--gold);border-radius:8px;padding:10px 12px;margin:8px 0;}
    .pv-selvlbl{font-family:'Fraunces',serif;font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--gold-d);margin-bottom:4px;}
    .pv-selvtxt{font-style:italic;font-size:14px;line-height:1.5;}
    .pv-selvref{font-size:11px;color:var(--soft);margin-top:3px;}
    .pv-usebtn{margin-top:8px;background:var(--gold-d);color:#fff;border:none;border-radius:6px;padding:7px 14px;font-family:'Fraunces',serif;font-size:12px;cursor:pointer;}
    .pv-loading{text-align:center;padding:24px;font-style:italic;color:var(--soft);}
    /* Fields */
    .pv-field{margin-top:14px;}
    .pv-flabel{font-family:'Fraunces',serif;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--gold-d);margin-bottom:7px;display:flex;align-items:center;gap:7px;}
    .pv-flabel:before{content:"";width:14px;height:1px;background:var(--gold);}
    .pv-ta{width:100%;border:1px solid var(--line);background:#fffdf6;border-radius:8px;resize:none;outline:none;overflow:hidden;font-family:'Spectral',serif;font-size:16px;line-height:1.55;color:var(--ink);min-height:52px;padding:11px 12px;}
    .pv-ta.verse{font-style:italic;}
    .pv-ta:focus{border-color:var(--gold);}
    .pv-ta::placeholder{color:#bcae8e;font-style:italic;}
    /* Finished card */
    .pv-finished{background:var(--card2);border:1px solid var(--line);border-radius:10px;padding:14px 16px;margin-top:12px;}
    .pv-fin-verse{font-style:italic;font-size:16px;line-height:1.6;color:var(--ink);border-left:3px solid var(--gold);padding-left:12px;margin-bottom:10px;}
    .pv-fin-meaning{font-size:14px;color:var(--soft);line-height:1.55;margin-bottom:12px;}
    .pv-editbtn{background:transparent;border:1px solid var(--line);border-radius:16px;padding:5px 14px;font-family:'Fraunces',serif;font-size:12px;color:var(--gold-d);cursor:pointer;}
    /* Comments */
    .pv-mythread{margin-top:12px;border-top:1px dashed var(--line);padding-top:12px;}
    .pv-myreactions{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px;align-items:center;}
    .pv-rxcount{display:inline-flex;align-items:center;gap:4px;background:rgba(255,255,255,.7);border:1px solid var(--line);border-radius:14px;padding:3px 9px;font-size:14px;}
    .pv-rxcount b{font-size:11px;color:var(--gold-d);font-family:'Fraunces',serif;font-weight:600;}
    .pv-noreact{font-size:12px;color:var(--soft);font-style:italic;}
    .pv-threadlist{display:flex;flex-direction:column;gap:8px;margin-bottom:10px;}
    .pv-threaditem{background:#fff;border:1px solid var(--line);border-radius:8px;padding:9px 12px;}
    .pv-threaditem.reply{margin-left:16px;border-left:3px solid var(--gold);}
    .pv-threadwho{font-family:'Fraunces',serif;font-size:12px;font-weight:600;color:var(--ink);margin-bottom:2px;display:flex;align-items:center;gap:7px;}
    .pv-replytag{font-size:10px;color:var(--soft);font-weight:400;font-style:italic;}
    .pv-cmt-actions{display:inline-flex;gap:4px;margin-left:auto;}
    .pv-cmtaction{background:none;border:none;cursor:pointer;font-size:13px;padding:0 2px;opacity:.6;}
    .pv-cmtaction:hover{opacity:1;}
    .pv-threadtxt{font-size:14px;color:var(--ink);line-height:1.45;}
    .pv-edited{font-size:10px;color:var(--soft);font-style:italic;}
    .pv-cmtreacts{display:flex;gap:5px;flex-wrap:wrap;align-items:center;margin-top:6px;}
    .pv-cmtrx{display:inline-flex;align-items:center;gap:3px;background:rgba(255,255,255,.6);border:1px solid rgba(140,98,36,.2);border-radius:12px;padding:2px 7px;cursor:pointer;font-size:13px;}
    .pv-cmtrx b{font-size:10px;color:var(--gold-d);font-weight:700;}
    .pv-cmtrx.on{background:#fff;border-color:var(--gold);}
    .pv-cmtaddrx{width:22px;height:22px;border-radius:50%;border:1px dashed rgba(140,98,36,.4);background:transparent;cursor:pointer;font-size:12px;display:inline-flex;align-items:center;justify-content:center;color:var(--gold-d);}
    .pv-replylink{background:none;border:none;cursor:pointer;font-size:11px;color:var(--gold-d);font-family:'Fraunces',serif;padding:0;text-decoration:underline;}
    .pv-replyingto{font-size:12px;color:var(--soft);font-style:italic;margin-bottom:6px;display:flex;align-items:center;gap:8px;}
    .pv-replyingto button{background:none;border:none;cursor:pointer;color:#9c5a45;font-size:12px;}
    /* Sticky notes */
    .pv-ro{font-family:'Spectral',serif;font-size:16px;line-height:1.55;color:var(--ink);white-space:pre-wrap;padding:2px;}
    .pv-ro.verse{font-style:italic;}.pv-ro.empty{color:#bcae8e;font-style:italic;}
    .pv-stack{margin-top:16px;}
    .pv-stackhd{font-family:'Fraunces',serif;font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--soft);margin-bottom:10px;display:flex;justify-content:space-between;gap:10px;align-items:center;}
    .pv-stackhd em{font-style:italic;text-transform:none;letter-spacing:0;font-family:'Spectral',serif;font-size:12px;}
    .pv-sticky{position:relative;border-radius:3px;padding:13px 14px 11px;margin:8px 0 0 auto;width:270px;max-width:100%;box-shadow:0 12px 24px -16px rgba(60,40,15,.5);cursor:pointer;}
    .pv-sticky:before{content:"";position:absolute;top:-8px;left:50%;width:56px;height:16px;transform:translateX(-50%) rotate(-3deg);background:rgba(176,131,63,.45);border:1px solid rgba(140,98,36,.35);}
    .pv-snverse{font-family:'Spectral',serif;font-style:italic;font-size:14px;line-height:1.45;color:#3a2f1c;}
    .pv-snmean{font-size:12.5px;color:#5c4a2c;margin-top:6px;line-height:1.45;}
    .pv-snwho{display:flex;align-items:center;gap:7px;font-family:'Fraunces',serif;font-size:12px;font-weight:600;color:#3a2f1c;margin-top:10px;}
    .pv-snwho .pv-av{width:22px;height:22px;font-size:11px;}
    .pv-dots{display:flex;gap:6px;justify-content:center;margin-top:11px;}
    .pv-dotn{width:7px;height:7px;border-radius:50%;background:rgba(140,98,36,.3);border:none;padding:0;cursor:pointer;}
    .pv-dotn.on{background:var(--gold-d);}
    .pv-rxrow{display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-top:11px;}
    .pv-rxbubble{display:inline-flex;align-items:center;gap:4px;background:rgba(255,255,255,.6);border:1px solid rgba(140,98,36,.25);border-radius:14px;padding:3px 8px;cursor:pointer;font-size:14px;}
    .pv-rxbubble.on{background:#fff;border-color:var(--gold);box-shadow:0 0 0 1px var(--gold);}
    .pv-rxbubble b{font-family:'Fraunces',serif;font-size:11px;color:var(--gold-d);font-weight:600;}
    .pv-picker{position:relative;display:inline-flex;}
    .pv-addrx{width:28px;height:28px;border-radius:50%;border:1px dashed rgba(140,98,36,.45);background:rgba(255,255,255,.45);cursor:pointer;font-size:15px;display:inline-flex;align-items:center;justify-content:center;color:var(--gold-d);}
    .pv-pickpop{position:absolute;z-index:40;bottom:36px;left:0;background:#fff;border:1px solid var(--line);border-radius:16px;padding:8px;box-shadow:0 18px 36px -14px rgba(60,40,15,.55);display:flex;flex-wrap:wrap;gap:2px;width:236px;}
    .pv-pickpop button{background:none;border:none;font-size:21px;cursor:pointer;padding:5px;border-radius:8px;}
    .pv-cmts{margin-top:12px;border-top:1px dashed rgba(140,98,36,.35);padding-top:10px;}
    .pv-cmt{font-size:12.5px;color:#4a3c22;margin-top:5px;line-height:1.4;}
    .pv-cmt b{font-family:'Fraunces',serif;font-weight:600;}
    .pv-cmtform{display:flex;gap:7px;margin-top:10px;}
    .pv-cmtin{flex:1;min-width:0;border:1px solid rgba(140,98,36,.3);border-radius:16px;padding:7px 11px;background:rgba(255,255,255,.65);font-family:'Spectral',serif;font-size:13px;color:#3a2f1c;outline:none;}
    .pv-cmtbtn{background:var(--gold-d);color:#fff;border:none;border-radius:16px;padding:0 13px;font-family:'Fraunces',serif;font-size:12px;cursor:pointer;}
    /* Notifications */
    .pv-notifs{position:fixed;top:0;right:0;width:min(340px,100vw);height:100vh;background:var(--card);border-left:1px solid var(--line);z-index:70;overflow-y:auto;box-shadow:-8px 0 30px rgba(44,36,23,.18);}
    .pv-nhead{display:flex;align-items:center;justify-content:space-between;padding:16px 16px 12px;border-bottom:1px solid var(--line);}
    .pv-ntitle{font-family:'Fraunces',serif;font-weight:700;font-size:16px;}
    .pv-nclose{background:none;border:none;font-size:20px;cursor:pointer;color:var(--soft);}
    .pv-nitem{display:flex;gap:10px;padding:12px 16px;border-bottom:1px solid var(--line);align-items:flex-start;}
    .pv-nicon{font-size:20px;flex:0 0 auto;margin-top:2px;}
    .pv-ntext{font-size:13px;line-height:1.45;color:var(--ink);}
    .pv-ntext b{font-family:'Fraunces',serif;font-weight:600;}
    .pv-nch{font-size:11px;color:var(--soft);font-style:italic;margin-top:2px;}
    .pv-nempty{text-align:center;padding:40px 20px;font-style:italic;color:var(--soft);font-size:14px;}
    .pv-nmark{display:block;width:calc(100% - 32px);margin:12px 16px;background:var(--gold-d);color:#fff;border:none;border-radius:6px;padding:10px;font-family:'Fraunces',serif;font-size:13px;cursor:pointer;}
    /* Download & footer */
    .pv-dl{display:block;width:100%;margin:24px 0 8px;background:var(--gold);color:#fff;border:none;font-family:'Fraunces',serif;font-weight:600;font-size:14px;padding:13px;border-radius:8px;cursor:pointer;letter-spacing:.04em;}
    .pv-dl:hover{background:var(--gold-d);}
    .pv-foot{text-align:center;color:var(--soft);font-style:italic;font-size:14px;margin-top:26px;}
    .pv-leave{display:block;margin:22px auto 0;background:none;border:none;cursor:pointer;font-family:'Spectral',serif;font-size:12px;color:var(--soft);text-decoration:underline;text-underline-offset:3px;}
  `;

  if(loading) return <div className="pv-root"><style>{css}</style><div style={{textAlign:"center",padding:"60px 20px",fontStyle:"italic",color:"#7b6c50"}}>Opening the scroll…</div></div>;

  // ── Welcome ─────────────────────────────────────────────────────────────────
  if(!me){
  const lastUserId=localStorage.getItem("pv-lastUser");
  const orderedParticipants=participants
    .map((p,idx)=>({p,idx}))
    .sort((a,b)=>{ if(a.p.id===lastUserId)return -1; if(b.p.id===lastUserId)return 1; return a.p.name.localeCompare(b.p.name); });
  return (
    <div className="pv-root"><style>{css}</style>
    <div className="pv-wrap">
      <div className="pv-hero">
        <div className="pv-kicker">A 31-Day Reading · July</div>
        <h1 className="pv-title"><em>Proverbs</em><br/>Challenge</h1>
        <p className="pv-sub">Read, listen, and reflect — one chapter a day with friends.</p>
        <div className="pv-rule"/>
        <div className="pv-steps">
          <div className="pv-step"><div className="pv-snum">1</div><div className="pv-stext"><b>Read or listen</b> to one chapter a day — Proverbs 1 on July 1 through Proverbs 31 on the 31st.</div></div>
          <div className="pv-step"><div className="pv-snum">2</div><div className="pv-stext"><b>Pick your favourite verse</b> and write what it means to you.</div></div>
          <div className="pv-step"><div className="pv-snum">3</div><div className="pv-stext"><b>Share with friends</b> — join a group or read together publicly.</div></div>
        </div>
        <div className="pv-join">
          <div className="pv-label">{participants.length>0?"New here? Enter your name":"Enter your name to join"}</div>
          <input className="pv-input" value={nameInput} onChange={e=>{setNameInput(e.target.value);setJoinError("");}} onKeyDown={e=>e.key==="Enter"&&join()} placeholder="Your name"/>
          <div className="pv-label" style={{marginTop:16}}>Create a PIN (4–8 digits)</div>
          <input className="pv-input" value={newPin} type="password" inputMode="numeric" maxLength={8} onChange={e=>{setNewPin(e.target.value.replace(/\D/g,""));setJoinError("");}} onKeyDown={e=>e.key==="Enter"&&join()} placeholder="••••"/>
          {joinError&&<div className="pv-err">{joinError}</div>}
          <button className="pv-btn" onClick={join}>Begin the journey</button>
        </div>
        {participants.length>0&&(
          <div className="pv-returning">
            <div className="pv-or">— already joined? tap your name —</div>
            <div className="pv-rbtns">{orderedParticipants.map(({p,idx})=><button key={p.id} className={"pv-rbtn"+(p.id===lastUserId?" pv-rbtn-last":"")} onClick={()=>askPin(p)}><Avatar name={p.name} i={idx}/><span className="pv-rbtn-name">{p.name}</span></button>)}</div>
          </div>
        )}
        <div className="pv-notice"><b>A shared reading.</b> By default your entries are public. You can switch to private or join a group anytime after signing in.</div>
        <p className="pv-credit">Created by Vincent Nyathi</p>
      </div>
    </div>
    {pinFor&&(
      <div className="pv-modal" onClick={e=>{if(e.target===e.currentTarget){setPinFor(null);setPinError("");}}}>
        <div className="pv-modalcard">
          <Avatar name={pinFor.name} i={participants.findIndex(x=>x.id===pinFor.id)}/>
          <div className="pv-label" style={{marginTop:12}}>Enter {pinFor.name}'s PIN</div>
          <input className="pv-input" value={pinInput} type="password" inputMode="numeric" maxLength={8} autoFocus onChange={e=>{setPinInput(e.target.value.replace(/\D/g,""));setPinError("");}} onKeyDown={e=>e.key==="Enter"&&confirmPin()} placeholder="••••"/>
          {pinError&&<div className="pv-err" key={pinTries}>{pinError}</div>}
          <button className="pv-btn" onClick={confirmPin}>Continue</button>
          <button className="pv-chip" style={{marginTop:12}} onClick={()=>{setPinFor(null);setPinError("");}}>Cancel</button>
        </div>
      </div>
    )}
    </div>
  );
  }

  const readOnly=!!viewing;
  const activeEntries=viewing?(viewing.entries||{}):myEntries;
  const activeDone=Object.keys(activeEntries).filter(c=>activeEntries[c]&&activeEntries[c].read).length;

  // ── Main ────────────────────────────────────────────────────────────────────
  return (
    <div className="pv-root"><style>{css}</style>
    <div className="pv-wrap">
      <div className="pv-hero" style={{paddingBottom:10}}>
        <div className="pv-kicker">31 Days · July</div>
        <h1 className="pv-title"><em>Proverbs</em> Challenge</h1>
        <div className="pv-rule"/>
      </div>

      {/* Status bar */}
      <div className="pv-status">
        <div className="pv-reader">
          <Avatar name={me.name} i={0}/>
          {renaming?(
            <>
              <input className="pv-renamein" value={renameDraft} autoFocus maxLength={40}
                onChange={e=>setRenameDraft(e.target.value)}
                onKeyDown={e=>{if(e.key==="Enter")saveName();if(e.key==="Escape")setRenaming(false);}}/>
              <button className="pv-chip" onClick={saveName}>Save</button>
              <button className="pv-chip" onClick={()=>setRenaming(false)}>✕</button>
            </>
          ):(
            <>
              <span className="pv-name" onClick={()=>{setRenameDraft(me.name);setRenaming(true);}} title="Tap to edit your name">{me.name} <span className="pv-nameedit">✏️</span></span>
              <button className="pv-chip" onClick={switchReader}>Sign out</button>
              <button className={`pv-chip${isPrivate?" priv":""}`} onClick={togglePrivacy} title={isPrivate?"Switch to Public":"Switch to Private"}>
                {isPrivate?"🔒 Private":"🌐 Public"}
              </button>
            </>
          )}
        </div>
        <div className="pv-prog">
          <div className="pv-ptrack"><div className="pv-pfill" style={{width:`${(activeDone/31)*100}%`}}/></div>
          <div className="pv-pnum"><span>{activeDone} of 31 chapters</span><span>{readOnly?"read only":saving?"Saving…":"Saved"}</span></div>
        </div>
        <button className="pv-bell" onClick={()=>setShowNotifs(true)}>
          🔔{notifications.length>0&&<span className="pv-badgecount">{notifications.length}</span>}
        </button>
      </div>

      {/* Group bar */}
      <div className="pv-groupbar">
        <button className={`pv-grpbtn${!activeGroup?" active":""}`} onClick={()=>{setActiveGroup(null);setViewing(null);}}>
          🌍 Everyone
        </button>
        {myGroups.map(g=>(
          <button key={g.id} className={`pv-grpbtn${activeGroup?.id===g.id?" active":""}`} onClick={()=>{setActiveGroup(g);setViewing(null);}}>
            👥 {g.name}
          </button>
        ))}
        <button className="pv-grpbtn manage" onClick={()=>setShowGroupPanel(true)}>＋ Groups</button>
        <button className="pv-grpbtn manage" onClick={()=>setShowLeaderboard(true)}>🏆 Progress</button>
      </div>

      {showNotifs&&(
        <NotifPanel notifs={notifications} participants={participants} onClose={()=>setShowNotifs(false)}
          onMarkRead={()=>{localStorage.setItem("notif-seen-"+me.id,Date.now());setNotifications([]);setShowNotifs(false);}}/>
      )}

      {/* Group management panel */}
      {showGroupPanel&&(
        <div className="pv-grouppanel" onClick={e=>{if(e.target===e.currentTarget)setShowGroupPanel(false);}}>
          <div className="pv-groupcard">
            <div className="pv-gphead">
              <span className="pv-gptitle">👥 Groups</span>
              <button className="pv-gpclose" onClick={()=>setShowGroupPanel(false)}>✕</button>
            </div>

            {/* Create group */}
            <div className="pv-gpsect">
              <h4>Create a new group</h4>
              <input className="pv-gpinput" value={groupName} placeholder="Group name (e.g. Family, Church Cell)"
                onChange={e=>{setGroupName(e.target.value);setGroupError("");}}
                onKeyDown={e=>e.key==="Enter"&&createGroup()}/>
              <input className="pv-gpinput" value={groupCode} placeholder="Your invite code (4–8 letters/numbers, e.g. FAMILY24)"
                maxLength={8}
                onChange={e=>{setGroupCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,""));setGroupError("");}}
                onKeyDown={e=>e.key==="Enter"&&createGroup()}
                style={{letterSpacing:".15em",fontFamily:"'Fraunces',serif"}}/>
              <button className="pv-gpbtn" onClick={createGroup}>Create group</button>
            </div>

            {/* Join group */}
            <div className="pv-gpsect">
              <h4>Join with invite code</h4>
              <input className="pv-gpinput" value={joinCode} placeholder="Enter 6-character code"
                onChange={e=>setJoinCode(e.target.value.toUpperCase())} maxLength={6} onKeyDown={e=>e.key==="Enter"&&joinGroup()}/>
              <button className="pv-gpbtn" onClick={joinGroup}>Join group</button>
            </div>

            {groupError&&<div className="pv-gperr">{groupError}</div>}

            {/* My groups */}
            {myGroups.length>0&&(
              <div className="pv-gpsect">
                <h4>My groups</h4>
                {myGroups.map(g=>(
                  <div key={g.id} className="pv-gpgroup">
                    <div className="pv-gpgname">{g.name}</div>
                    <div className="pv-gpcode">
                      Invite code: <b>{g.code}</b>
                      <button className="pv-sharebtn" onClick={()=>{
                        const url = window.location.href;
                        const msg = `Join my "${g.name}" Proverbs Challenge group!\n\nInvite code: ${g.code}\n\nOpen the app and tap ＋ Groups → Join with invite code.\n\n${url}`;
                        if(navigator.share){
                          navigator.share({title:`Join ${g.name} — Proverbs Challenge`,text:msg});
                        } else {
                          navigator.clipboard.writeText(msg).then(()=>alert("Invite message copied to clipboard!"));
                        }
                      }}>📤 Share invite</button>
                    </div>
                    {/* Announcements */}
                  {(g.announcements||[]).length > 0 && (
                    <div style={{marginBottom:8}}>
                      {(g.announcements||[]).slice().reverse().map(a=>(
                        <div key={a.id} className="pv-anno" style={{marginBottom:6}}>
                          <span className="pv-anno-icon">📢</span>
                          <div className="pv-anno-body">
                            <div className="pv-anno-text">{a.text}</div>
                            <div className="pv-anno-who">{a.byName} · {new Date(a.ts).toLocaleDateString()}</div>
                          </div>
                          {(isAdminUser(me)||g.creatorId===me.id)&&(
                            <button className="pv-anno-del" onClick={()=>deleteAnnouncement(g,a.id)}>✕</button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Post announcement — creator only */}
                  {g.creatorId===me.id&&(
                    <div className="pv-cmtform" style={{marginBottom:10}}>
                      <input className="pv-cmtin" value={announcement}
                        placeholder="Post an announcement to the group…"
                        onChange={e=>setAnnouncement(e.target.value)}
                        onKeyDown={e=>e.key==="Enter"&&postAnnouncement(g)}/>
                      <button className="pv-cmtbtn" onClick={()=>postAnnouncement(g)}>📢</button>
                    </div>
                  )}
                  <div className="pv-gpmembers">
                      {(g.members||[]).map(mid=>{
                        const mp=participants.find(p=>p.id===mid);
                        const mname=mp?.name||(mid===me.id?me.name:"Unknown");
                        const mi=participants.findIndex(p=>p.id===mid);
                        return (
                          <span key={mid} className="pv-gpmember">
                            <Avatar name={mname} i={mi>=0?mi:0}/>{mname}
                            {g.creatorId===me.id&&mid!==me.id&&(
                              <button className="pv-gpkick" onClick={()=>removeMember(g,mid)}>✕</button>
                            )}
                          </span>
                        );
                      })}
                    </div>
                    <button className="pv-gpleave" onClick={()=>leaveGroup(g)}>Leave group</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Progress / leaderboard panel */}
      {showLeaderboard&&(
        <div className="pv-grouppanel" onClick={e=>{if(e.target===e.currentTarget){setShowLeaderboard(false);setLbChapter(null);}}}>
          <div className="pv-groupcard">
            <div className="pv-gphead">
              <span className="pv-gptitle">🏆 Progress — {activeGroup?activeGroup.name:"Everyone"}</span>
              <button className="pv-gpclose" onClick={()=>{setShowLeaderboard(false);setLbChapter(null);}}>✕</button>
            </div>

            {/* Overall leaderboard */}
            <div className="pv-gpsect">
              <h4>Overall completion</h4>
              {visibleParticipants.length===0&&<div className="pv-ro empty">No one to show yet.</div>}
              {(()=>{
                const ranked=[...visibleParticipants]
                  .map(p=>({p,count:chapterCount(p)}))
                  .sort((a,b)=>b.count-a.count||a.p.name.localeCompare(b.p.name))
                  .map((x,i)=>({...x,rank:i+1}));
                const meFirst=[...ranked].sort((a,b)=>(a.p.id===me.id?-1:b.p.id===me.id?1:0));
                return meFirst.map(({p,count,rank})=>(
                  <div key={p.id} className={"pv-lbrow"+(p.id===me.id?" me":"")}>
                    <span className="pv-lbrank">{count===31?"👑":rank}</span>
                    <Avatar name={p.name} i={participants.findIndex(x=>x.id===p.id)}/>
                    <span className="pv-lbname">{p.name}{p.id===me.id?" (you)":""}</span>
                    <div className="pv-lbbar"><div className="pv-lbfill" style={{width:`${(count/31)*100}%`}}/></div>
                    <span className="pv-lbcount">{count}/31</span>
                  </div>
                ));
              })()}
              {visibleParticipants.some(p=>chapterCount(p)===31)&&(
                <div className="pv-lbcrownnote">👑 Finished all 31 chapters</div>
              )}
            </div>

            {/* By chapter */}
            <div className="pv-gpsect">
              <h4>Who's completed each chapter</h4>
              <div className="pv-lbchips">
                {THEMES.map((_,idx)=>{
                  const ch=idx+1;
                  const n=chapterCompleters(ch).length;
                  return (
                    <button key={ch} className={"pv-lbchip"+(lbChapter===ch?" on":"")} onClick={()=>setLbChapter(lbChapter===ch?null:ch)}>
                      {ch}<small>{n}</small>
                    </button>
                  );
                })}
              </div>
              {lbChapter&&(
                <div className="pv-lbdetail">
                  <div className="pv-lbdetailhd">Proverbs {lbChapter} — {chapterCompleters(lbChapter).length} completed</div>
                  {chapterCompleters(lbChapter).length>0?(
                    <div className="pv-lbnames">
                      {chapterCompleters(lbChapter).map(p=>(
                        <span key={p.id} className="pv-gpmember"><Avatar name={p.name} i={participants.findIndex(x=>x.id===p.id)}/>{p.name}{p.id===me.id?" (you)":""}</span>
                      ))}
                    </div>
                  ):<div className="pv-ro empty">No one yet — be the first!</div>}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Announcements banner for active group */}
      {activeGroup && (activeGroup.announcements||[]).length > 0 && (
        <div className="pv-annolist">
          {(activeGroup.announcements||[]).slice().reverse().map(a=>(
            <div key={a.id} className="pv-anno">
              <span className="pv-anno-icon">📢</span>
              <div className="pv-anno-body">
                <div className="pv-anno-text">{a.text}</div>
                <div className="pv-anno-who">{a.byName} · {new Date(a.ts).toLocaleDateString()}</div>
              </div>
              {isAdminUser(me)||activeGroup.creatorId===me.id?(
                <button className="pv-anno-del" onClick={()=>deleteAnnouncement(activeGroup,a.id)}>✕</button>
              ):null}
            </div>
          ))}
        </div>
      )}

      {/* People pills */}
      {visibleParticipants.filter(p=>p.id!==me.id).length>0&&(
        <div className="pv-people">
          <span className="pv-lead">{activeGroup?`👥 ${activeGroup.name}`:"🌍 Everyone"} · Tap a name to read their page</span>
          {[...visibleParticipants].map((p,i)=>{
            const isMe=p.id===me.id;
            if(isMe) return null;
            const active=viewing&&viewing.id===p.id;
            return <button key={p.id} className={"pv-pill"+(active?" active":"")} onClick={()=>setViewing(active?null:p)}><Avatar name={p.name} i={i}/>{p.name}{p.isPrivate?" 🔒":""}</button>;
          })}
          {!readOnly&&<button className={"pv-pill"+(viewing===null?" active":"")} onClick={()=>setViewing(null)}><Avatar name={me.name} i={0}/>{me.name} (you)</button>}
        </div>
      )}

      {readOnly&&(
        <div className="pv-viewbar">
          <span className="vt"><Avatar name={viewing.name} i={participants.findIndex(x=>x.id===viewing.id)}/>{viewing.name}'s page <small>· read only</small></span>
          <button className="pv-chip" onClick={()=>setViewing(null)}>Back to mine</button>
        </div>
      )}

      {tc&&(()=>{const target=(tc>1&&!myEntries[tc-1]?.read)?firstUnread(myEntries):tc;return <button className="pv-todaybtn" onClick={()=>{setOpen(target);setTimeout(()=>rowRefs.current[target]?.scrollIntoView({behavior:"smooth",block:"center"}),60);}}>{target===tc?`Go to today · Proverbs ${tc}`:`Continue · Proverbs ${target}`}</button>;})()}

      {tc&&!readOnly&&!myEntries[tc]?.read&&(
        <div className="pv-reminder">
          <span className="pv-reminder-icon">📖</span>
          <div className="pv-reminder-text"><b>Today's reading is waiting!</b><span>You haven't completed Proverbs {tc} yet.</span></div>
          <button className="pv-reminder-btn" onClick={()=>{const target=(tc>1&&!myEntries[tc-1]?.read)?firstUnread(myEntries):tc;setOpen(target);setTimeout(()=>rowRefs.current[target]?.scrollIntoView({behavior:"smooth",block:"center"}),60);}}>Read now →</button>
        </div>
      )}
      {tc&&!readOnly&&myEntries[tc]?.read&&(
        <div className="pv-reminder done">
          <span className="pv-reminder-icon">✅</span>
          <div className="pv-reminder-text"><b>Proverbs {tc} complete!</b><span>Well done — you've read today's chapter.</span></div>
        </div>
      )}

      {!readOnly&&<div className="pv-hint">Tap any day to open it</div>}

      {THEMES.map((theme,idx)=>{
        const chapter=idx+1;
        const entry=readOnly?(viewing.entries?.[chapter]||{}):(myEntries[chapter]||{});
        const hasEntry=entry.verse?.trim()||entry.meaning?.trim();
        const isOpen=open===chapter,tab=getTab(chapter);
        const locked=!readOnly&&chapter>1&&!myEntries[chapter-1]?.read;
        const mySoc=getSocial(me.id,chapter);
        const friends=readOnly?[]:visibleParticipants.filter(p=>{
          try{return p.id!==me.id&&!p.isPrivate&&p.entries&&p.entries[chapter]&&(p.entries[chapter].verse?.trim()||p.entries[chapter].meaning?.trim());}catch(e){return false;}
        });

        return (
          <div className={"pv-day"+(tc===chapter?" today":"")+(locked?" locked":"")} key={chapter} ref={el=>rowRefs.current[chapter]=el}>
            <button className={"pv-drow"+(locked?" locked":"")} onClick={()=>{
              if(locked){
                const fu=firstUnread(myEntries);
                setToast({title:"Chapter locked",icon:"🔒",message:`Finish Proverbs ${chapter-1} first to unlock Proverbs ${chapter}.`});
                setOpen(fu);setNoteIdx(0);setCommentDraft("");setPicker(null);
                setTimeout(()=>rowRefs.current[fu]?.scrollIntoView({behavior:"smooth",block:"center"}),60);
                return;
              }
              setOpen(isOpen?null:chapter);setNoteIdx(0);setCommentDraft("");setPicker(null);
            }}>
              <div className="pv-badge">{chapter}<small>Jul {chapter}</small></div>
              <div className="pv-dmid">
                <div className="pv-dch">Proverbs {chapter}{tc===chapter&&<span className="pv-tag">Today</span>}</div>
                <div className="pv-dtheme">{theme}</div>
              </div>
              <div className={"pv-dot"+(entry.read?" done":"")+(locked?" locked":"")}>{entry.read?"✓":locked?"🔒":""}</div>
            </button>

            {isOpen&&!locked&&(
              <div className="pv-dbody">
                {readOnly?(
                  <>
                    <div className="pv-field"><div className="pv-flabel">{viewing.name}'s favourite</div>
                      {entry.verse?.trim()?<div className="pv-ro verse">"{entry.verse}"</div>:<div className="pv-ro empty">No verse chosen yet.</div>}
                    </div>
                    {entry.meaning?.trim()&&<div className="pv-field"><div className="pv-flabel">What it means to {viewing.name}</div><div className="pv-ro">{entry.meaning}</div></div>}
                    <div className="pv-mythread" style={{marginTop:14}}>
                      <div className="pv-myreactions">
                        {Object.entries(getSocial(viewing.id,chapter).reactions||{}).filter(([,ids])=>ids&&ids.length>0).map(([em,ids])=>{
                          const on=(ids||[]).includes(me.id);
                          return <button key={em} className={"pv-cmtrx"+(on?" on":"")} onClick={()=>toggleReaction(viewing.id,chapter,em)}>{em}<b>{ids.length}</b></button>;
                        })}
                        <span style={{position:"relative",display:"inline-flex"}}>
                          <button className="pv-cmtaddrx" onClick={()=>setPicker(picker===sKey(viewing.id,chapter)?null:sKey(viewing.id,chapter))}>＋</button>
                          {picker===sKey(viewing.id,chapter)&&(
                            <div className="pv-pickpop" style={{bottom:28,left:0}}>
                              {REACTIONS.map(em=><button key={em} onClick={()=>{toggleReaction(viewing.id,chapter,em);setPicker(null);}}>{em}</button>)}
                            </div>
                          )}
                        </span>
                      </div>
                      <div className="pv-threadlist">
                        {(getSocial(viewing.id,chapter).comments||[]).map(c=>(
                          <div key={c.id} className={"pv-threaditem"+(c.replyTo?" reply":"")}>
                            <div className="pv-threadwho">
                              <b>{c.byName}</b>
                              {c.replyTo&&<span className="pv-replytag">↩ reply</span>}
                              {isAdminUser(me)&&(
                                <span className="pv-cmt-actions">
                                  <button className="pv-cmtaction del" onClick={()=>deleteComment(viewing.id,chapter,c.id)}>🗑️</button>
                                </span>
                              )}
                            </div>
                            <div className="pv-threadtxt">{c.text}</div>
                          </div>
                        ))}
                      </div>
                      <div className="pv-cmtform" style={{marginTop:8}}>
                        <input className="pv-cmtin" value={commentDraft} placeholder={`Encourage ${viewing.name}…`}
                          onChange={e=>setCommentDraft(e.target.value)}
                          onKeyDown={e=>{if(e.key==="Enter"){addComment(viewing.id,chapter,commentDraft);setCommentDraft("");}}}/>
                        <button className="pv-cmtbtn" onClick={()=>{addComment(viewing.id,chapter,commentDraft);setCommentDraft("");}}>Send</button>
                      </div>
                    </div>
                  </>
                ):(
                  <>
                    {chapter>1&&!myEntries[chapter-1]?.read&&(()=>{
                      const pv=chapter-1, pe=myEntries[pv]||{};
                      const reflDone=pe.verse?.trim()&&pe.meaning?.trim();
                      return (
                        <div className="pv-prevremind">
                          <span className="pv-prevremind-icon">{reflDone?"📌":"✍️"}</span>
                          <div className="pv-prevremind-text">
                            <b>{reflDone?`Don't forget Proverbs ${pv}`:`Finish Proverbs ${pv} first`}</b>
                            <span>{reflDone?"You haven't marked it as read yet.":"Complete your reflection — your verse and what it means — before moving on."}</span>
                          </div>
                          <button className="pv-prevremind-btn" onClick={()=>{setOpen(pv);setTimeout(()=>rowRefs.current[pv]?.scrollIntoView({behavior:"smooth",block:"center"}),60);}}>{reflDone?"Go back →":"Complete it →"}</button>
                        </div>
                      );
                    })()}
                    {hasEntry&&!isEditing(chapter)?(
                      <div>
                        <div className="pv-finished">
                          {entry.verse?.trim()&&<div className="pv-fin-verse">"{entry.verse}"</div>}
                          {entry.meaning?.trim()&&<div className="pv-fin-meaning">{entry.meaning}</div>}
                          <div className={"pv-readcheck"+(entry.read?" on":"")} onClick={()=>toggleRead(chapter)} role="checkbox" aria-checked={!!entry.read}>
                            <span className="pv-readbox">{entry.read?"✓":""}</span>
                            <span>{entry.read?`Read — Proverbs ${chapter} complete`:`I have read Proverbs ${chapter}`}</span>
                          </div>
                          {readErr[chapter]&&<div className="pv-readerr">{readErr[chapter]}</div>}
                          <button className="pv-editbtn" onClick={()=>setEditMode(chapter,true)}>✏️ Edit</button>
                          <CommentsThread
                            soc={mySoc} me={me} isAdmin={isAdminUser(me)}
                            onComment={text=>addComment(me.id,chapter,text)}
                            onReply={(replyTo,text)=>addComment(me.id,chapter,text,replyTo)}
                            onReactToComment={(cid,emoji)=>reactToComment(me.id,chapter,cid,emoji)}
                            onEditComment={(cid,txt)=>editComment(me.id,chapter,cid,txt)}
                            onDeleteComment={cid=>deleteComment(me.id,chapter,cid)}
                          />
                        </div>
                        {/* Sticky notes */}
                        {friends.length>0&&(()=>{
                          const fidx=noteIdx%friends.length;
                          const f=friends[fidx];
                          if(!f?.entries?.[chapter]) return null;
                          const fe=f.entries[chapter];
                          if(!fe.verse?.trim()&&!fe.meaning?.trim()) return null;
                          const fi=participants.findIndex(x=>x.id===f.id);
                          const soc=getSocial(f.id,chapter),sk=sKey(f.id,chapter);
                          return (
                            <div className="pv-stack">
                              <div className="pv-stackhd"><span>{friends.length} {friends.length===1?"friend shared":"friends shared"}</span>{friends.length>1&&<em>tap for next</em>}</div>
                              <div className="pv-sticky" style={{background:STICKY_BG[fi%STICKY_BG.length],transform:`rotate(${STICKY_ANGLE[fi%STICKY_ANGLE.length]}deg)`}} onClick={()=>friends.length>1&&setNoteIdx(i=>i+1)}>
                                {fe.verse?.trim()&&<div className="pv-snverse">"{fe.verse}"</div>}
                                {fe.meaning?.trim()&&<div className="pv-snmean">{fe.meaning}</div>}
                                <div className="pv-snwho"><Avatar name={f.name} i={fi}/>{f.name}</div>
                                <div className="pv-rxrow" onClick={e=>e.stopPropagation()}>
                                  {Object.entries(soc.reactions||{}).filter(([,ids])=>ids&&ids.length>0).map(([em,ids])=>(
                                    <button key={em} className={"pv-rxbubble"+(ids.includes(me.id)?" on":"")} onClick={()=>toggleReaction(f.id,chapter,em)}><span>{em}</span><b>{ids.length}</b></button>
                                  ))}
                                  <span className="pv-picker">
                                    <button className="pv-addrx" onClick={()=>setPicker(picker===sk?null:sk)}>＋</button>
                                    {picker===sk&&<div className="pv-pickpop">{REACTIONS.map(em=><button key={em} onClick={()=>{toggleReaction(f.id,chapter,em);setPicker(null);}}>{em}</button>)}</div>}
                                  </span>
                                </div>
                                <div className="pv-cmts" onClick={e=>e.stopPropagation()}>
                                  {(soc.comments||[]).map(c=><div className="pv-cmt" key={c.id}><b>{c.byName}:</b> {c.text}</div>)}
                                  <div className="pv-cmtform">
                                    <input className="pv-cmtin" value={commentDraft} placeholder={"Encourage "+f.name+"…"} onFocus={()=>setPaused(true)} onBlur={()=>setPaused(false)} onChange={e=>setCommentDraft(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){addComment(f.id,chapter,commentDraft);setCommentDraft("");}}}/>
                                    <button className="pv-cmtbtn" onClick={()=>{addComment(f.id,chapter,commentDraft);setCommentDraft("");}}>Send</button>
                                  </div>
                                </div>
                                {friends.length>1&&<div className="pv-dots" onClick={e=>e.stopPropagation()}>{friends.map((_,di)=><button key={di} className={"pv-dotn"+((noteIdx%friends.length)===di?" on":"")} onClick={()=>setNoteIdx(di)}/>)}</div>}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    ):(
                      <div>
                        <div className="pv-tabs">
                          <button className={"pv-tab"+(tab==="read"?" on":"")} onClick={()=>setTab(chapter,"read")}>📖 Read & Listen</button>
                          <button className={"pv-tab"+(tab==="journal"?" on":"")} onClick={()=>setTab(chapter,"journal")}>✍️ My Reflection</button>
                        </div>
                        {tab==="read"&&<BibleReader chapter={chapter} onUseVerse={v=>{update(chapter,"verse",v);setTab(chapter,"journal");}}/>}
                        {tab==="journal"&&(
                          <div>
                            <div className="pv-field"><div className="pv-flabel">My favourite verse</div>
                              <textarea className="pv-ta verse" value={entry.verse||""} placeholder="Write or paste your favourite verse…" onFocus={grow} onChange={e=>{grow(e);update(chapter,"verse",e.target.value);}}/>
                            </div>
                            <div className="pv-field"><div className="pv-flabel">What it means to me</div>
                              <textarea className="pv-ta" value={entry.meaning||""} placeholder="Write your reflection…" onFocus={grow} onChange={e=>{grow(e);update(chapter,"meaning",e.target.value);}}/>
                            </div>
                            <div className={"pv-readcheck"+(entry.read?" on":"")} onClick={()=>toggleRead(chapter)} role="checkbox" aria-checked={!!entry.read}>
                              <span className="pv-readbox">{entry.read?"✓":""}</span>
                              <span>{entry.read?`Read — Proverbs ${chapter} complete`:`I have read Proverbs ${chapter}`}</span>
                            </div>
                            {readErr[chapter]&&<div className="pv-readerr">{readErr[chapter]}</div>}
                            {isEditing(chapter)&&(
                              <button className="pv-editbtn" style={{marginTop:10,background:"var(--gold-d)",color:"#fff",border:"none"}} onClick={()=>setEditMode(chapter,false)}>✓ Done editing</button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        );
      })}

      {!readOnly&&<button className="pv-dl" onClick={()=>downloadPDF(me,myEntries)}>⬇ Download My 31-Day Devotional (PDF)</button>}
      <p className="pv-foot">"Your word is a lamp to my feet and a light to my path." — Psalm 119:105</p>
      <p className="pv-credit">Created by Vincent Nyathi</p>
      {!readOnly&&<button className="pv-leave" onClick={()=>setConfirmDelete(true)}>leave the challenge</button>}
    </div>

    {confirmDelete&&(
      <div className="pv-modal" onClick={e=>{if(e.target===e.currentTarget)setConfirmDelete(false);}}>
        <div className="pv-modalcard">
          <div className="pv-label" style={{letterSpacing:".08em"}}>Leave the challenge?</div>
          <p style={{fontSize:14,color:"var(--soft)",margin:"10px 0 4px",lineHeight:1.45}}>This permanently deletes {me.name}'s page. This can't be undone.</p>
          <button className="pv-btn" style={{background:"#9c5a45"}} onClick={deleteMe}>Delete my page</button>
          <button className="pv-chip" style={{marginTop:12}} onClick={()=>setConfirmDelete(false)}>Cancel</button>
        </div>
      </div>
    )}

    {showAllDone&&(
      <div className="pv-modal" onClick={e=>{if(e.target===e.currentTarget)setShowAllDone(false);}}>
        <div className="pv-modalcard">
          <div style={{fontSize:42,lineHeight:1}}>🎉</div>
          <div className="pv-label" style={{letterSpacing:".08em",marginTop:10}}>All 31 chapters complete, {me.name}!</div>
          <p style={{fontSize:14,color:"var(--soft)",margin:"10px 0 4px",lineHeight:1.45}}>
            You've walked through the whole book of Proverbs, {me.name}. Keep this journey close — download your personal devotional journal as a keepsake of these 31 days.
          </p>
          <button className="pv-btn" onClick={()=>{downloadPDF(me,myEntries);setShowAllDone(false);}}>⬇ Download My Devotional Journal</button>
          <button className="pv-chip" style={{marginTop:12}} onClick={()=>setShowAllDone(false)}>Maybe later</button>
        </div>
      </div>
    )}

    {toast&&(
      <div className="pv-toast" onClick={()=>setToast(null)}>
        <span className="pv-toast-icon">{toast.icon||"✨"}</span>
        <div className="pv-toast-body">
          <div className="pv-toast-title">{toast.title||`Proverbs ${toast.chapter} complete!`}</div>
          <div className="pv-toast-msg">{toast.message}</div>
        </div>
      </div>
    )}
    </div>
  );
}