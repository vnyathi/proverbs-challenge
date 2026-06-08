import React, { useState, useEffect, useRef, useCallback } from "react";
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

const slug = (s) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "reader";
const palette = ["#b0833f", "#6b7f5e", "#9c5a45", "#5e6f86", "#8a6e9c", "#a07b54"];
const REACTIONS = ["🙏","❤️","🔥","🌿","✨","🙌","😊","😢","💯","👏","🕊️","☀️","🌟","💛","🤍","🎶","📖","🫶","😇","💪","🥹","🤩"];
const STICKY_BG = ["#fef3c7","#fde2e4","#e2f0d9","#dbeafe","#ede9fe","#fbe8d3"];
const STICKY_ANGLE = [-2.5, 2, -1.5, 2.8, -2.2, 1.6];

function todayChapter() {
  const d = new Date();
  return d.getMonth() === 6 ? d.getDate() : null;
}

export default function ProverbsChallenge() {
  const [me, setMe] = useState(null);
  const [nameInput, setNameInput] = useState("");
  const [myEntries, setMyEntries] = useState({});
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(null);
  const [saving, setSaving] = useState(false);
  const [pinFor, setPinFor] = useState(null);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");
  const [pinTries, setPinTries] = useState(0);
  const [newPin, setNewPin] = useState("");
  const [joinError, setJoinError] = useState("");
  const [viewing, setViewing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [social, setSocial] = useState({});
  const [noteIdx, setNoteIdx] = useState(0);
  const [commentDraft, setCommentDraft] = useState("");
  const [paused, setPaused] = useState(false);
  const [picker, setPicker] = useState(null);
  const saveTimer = useRef(null);
  const rowRefs = useRef({});

  // ── Storage (Firebase) ────────────────────────────────────────────────────
  // Replace window.storage calls below with your store.* shim.
  // See src/store.js in the deployment guide.

  const loadParticipants = useCallback(async () => {
    try {
      const listing = await store.list("user:", true);
      const keys = (listing && listing.keys) || [];
      const out = [];
      for (const k of keys) {
        try {
          const r = await store.get(k, true);
          if (r && r.value) out.push(JSON.parse(r.value));
        } catch (e) {}
      }
      out.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
      setParticipants(out);
    } catch (e) { setParticipants([]); }
  }, []);

  const loadSocial = useCallback(async () => {
    try {
      const listing = await store.list("social:", true);
      const keys = (listing && listing.keys) || [];
      const map = {};
      for (const k of keys) {
        try {
          const r = await store.get(k, true);
          if (r && r.value) map[k.slice("social:".length)] = JSON.parse(r.value);
        } catch (e) {}
      }
      setSocial(map);
    } catch (e) { setSocial({}); }
  }, []);

  const sKey = (aid, ch) => aid + ":" + ch;
  const getSocial = (aid, ch) => social[sKey(aid, ch)] || { reactions: {}, comments: [] };

  const saveSocial = async (aid, ch, data) => {
    setSocial((s) => ({ ...s, [sKey(aid, ch)]: data }));
    try { await store.set("social:" + aid + ":" + ch, JSON.stringify(data), true); } catch (e) {}
  };

  const toggleReaction = async (aid, ch, emoji) => {
    if (!me) return;
    const cur = getSocial(aid, ch);
    const reactions = { ...(cur.reactions || {}) };
    const arr = new Set(reactions[emoji] || []);
    arr.has(me.id) ? arr.delete(me.id) : arr.add(me.id);
    reactions[emoji] = Array.from(arr);
    await saveSocial(aid, ch, { ...cur, reactions });
  };

  const addComment = async (aid, ch, text) => {
    if (!me || !text.trim()) return;
    const cur = getSocial(aid, ch);
    const comments = [
      ...(cur.comments || []),
      { id: Date.now() + "-" + Math.random().toString(36).slice(2, 5), byId: me.id, byName: me.name, text: text.trim(), ts: Date.now() },
    ];
    await saveSocial(aid, ch, { ...cur, comments });
  };

  useEffect(() => {
    (async () => {
      try {
        const r = await store.get("me", false);
        if (r && r.value) {
          const parsed = JSON.parse(r.value);
          setMe(parsed);
          try {
            const mine = await store.get("user:" + parsed.id, true);
            if (mine && mine.value) setMyEntries(JSON.parse(mine.value).entries || {});
          } catch (e) {}
        }
      } catch (e) {}
      await loadParticipants();
      await loadSocial();
      setOpen(todayChapter() || 1);
      setLoading(false);
    })();
  }, [loadParticipants, loadSocial]);

  useEffect(() => { setNoteIdx(0); setCommentDraft(""); setPicker(null); }, [open]);

  useEffect(() => {
    if (open === null || paused || picker) return;
    const id = setInterval(() => setNoteIdx((i) => i + 1), 5000);
    return () => clearInterval(id);
  }, [open, paused, picker]);

  useEffect(() => {
    const id = setInterval(() => { loadParticipants(); loadSocial(); }, 20000);
    return () => clearInterval(id);
  }, [loadParticipants, loadSocial]);

  const persist = useCallback((entries, person) => {
    setSaving(true);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        await store.set(
          "user:" + person.id,
          JSON.stringify({ ...person, entries, updatedAt: Date.now() }),
          true
        );
        await loadParticipants();
      } catch (e) {}
      setSaving(false);
    }, 700);
  }, [loadParticipants]);

  const hashPin = async (id, pin) => {
    const s = id + ":" + pin;
    try {
      const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
      return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
    } catch (e) {
      let h = 0;
      for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
      return "f" + (h >>> 0).toString(16);
    }
  };

  const resume = async (person) => {
    const p = { id: person.id, name: person.name, pinHash: person.pinHash };
    setMe(p); setMyEntries(person.entries || {}); setOpen(todayChapter() || 1);
    try { await store.set("me", JSON.stringify(p), false); } catch (e) {}
  };

  const askPin = (person) => { setPinFor(person); setPinInput(""); setPinError(""); };

  const confirmPin = async () => {
    const person = pinFor; if (!person) return;
    if (!person.pinHash) { setPinFor(null); resume(person); return; }
    const h = await hashPin(person.id, pinInput.trim());
    if (h === person.pinHash) { setPinFor(null); resume(person); }
    else { setPinError("Incorrect PIN. Try again."); setPinInput(""); setPinTries((t) => t + 1); }
  };

  const join = async () => {
    const name = nameInput.trim(); if (!name) return;
    const existing = participants.find((p) => p.name.toLowerCase() === name.toLowerCase());
    if (existing) { setNameInput(""); setNewPin(""); askPin(existing); return; }
    const pin = newPin.trim();
    if (!/^\d{4,8}$/.test(pin)) { setJoinError("Choose a PIN of 4–8 digits."); return; }
    const id = slug(name) + "-" + Math.random().toString(36).slice(2, 6);
    const pinHash = await hashPin(id, pin);
    const person = { id, name, pinHash };
    setMe(person); setMyEntries({}); setOpen(todayChapter() || 1);
    try {
      await store.set("me", JSON.stringify(person), false);
      await store.set("user:" + id, JSON.stringify({ ...person, entries: {}, updatedAt: Date.now() }), true);
      loadParticipants();
    } catch (e) {}
  };

  const update = (chapter, field, value) => {
    const next = { ...myEntries, [chapter]: { ...myEntries[chapter], [field]: value } };
    setMyEntries(next);
    if (me) persist(next, me);
  };

  const switchReader = async () => {
    try { await store.delete("me", false); } catch (e) {}
    setMe(null); setMyEntries({}); setNameInput(""); setNewPin(""); setViewing(null);
  };

  const deleteMe = async () => {
    if (!me) return;
    try { await store.delete("user:" + me.id, true); } catch (e) {}
    try { await store.delete("me", false); } catch (e) {}
    setConfirmDelete(false);
    setMe(null); setMyEntries({}); setNameInput(""); setNewPin(""); setViewing(null);
    loadParticipants();
  };

  const tc = todayChapter();

  const jumpToToday = () => {
    if (!tc) return;
    setOpen(tc);
    setTimeout(() => rowRefs.current[tc]?.scrollIntoView({ behavior: "smooth", block: "center" }), 60);
  };

  // ── Styles ────────────────────────────────────────────────────────────────
  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Spectral:ital,wght@0,300;0,400;0,500;1,400;1,500&display=swap');
    .pv-root *{box-sizing:border-box;-webkit-tap-highlight-color:transparent;}
    .pv-root{
      --ink:#2c2417;--soft:#7b6c50;--gold:#b0833f;--gold-d:#8c6224;
      --card:#fbf6e8;--card2:#f6edd6;--line:#ddcca6;
      font-family:'Spectral',Georgia,serif;color:var(--ink);min-height:100vh;padding:0 0 60px;
      background:radial-gradient(900px 480px at 80% -12%,rgba(176,131,63,.14),transparent 60%),
                 radial-gradient(700px 480px at -10% 18%,rgba(107,127,94,.10),transparent 55%),
                 linear-gradient(180deg,#f6eed9,#ece0c2);
    }
    .pv-wrap{max-width:680px;margin:0 auto;padding:0 16px;}
    .pv-hero{text-align:center;padding:46px 12px 18px;}
    .pv-kicker{font-family:'Fraunces',serif;letter-spacing:.36em;text-transform:uppercase;font-size:11px;color:var(--gold-d);font-weight:600;}
    .pv-title{font-family:'Fraunces',serif;font-weight:600;line-height:.96;margin:12px 0 4px;font-size:clamp(38px,12vw,64px);}
    .pv-title em{font-style:italic;color:var(--gold-d);}
    .pv-sub{font-style:italic;color:var(--soft);font-size:16px;max-width:430px;margin:8px auto 0;}
    .pv-rule{width:60px;height:1px;background:var(--gold);margin:18px auto 0;position:relative;}
    .pv-rule:before,.pv-rule:after{content:"";position:absolute;top:-2px;width:5px;height:5px;border-radius:50%;background:var(--gold);}
    .pv-rule:before{left:-10px;}.pv-rule:after{right:-10px;}
    .pv-detail{display:inline-flex;gap:8px;align-items:center;margin:16px auto 0;font-family:'Fraunces',serif;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--gold-d);border:1px solid var(--line);border-radius:20px;padding:7px 15px;background:var(--card);}
    .pv-hint{text-align:center;font-style:italic;color:var(--soft);font-size:13px;margin:2px 2px 14px;}
    .pv-notice{background:var(--card);border:1px solid var(--line);border-left:3px solid var(--gold);border-radius:8px;padding:13px 15px;margin:20px auto 0;max-width:430px;text-align:left;font-size:13.5px;line-height:1.5;}
    .pv-notice b{font-family:'Fraunces',serif;font-weight:600;color:var(--gold-d);}
    .pv-steps{display:grid;gap:10px;max-width:430px;margin:22px auto 0;text-align:left;}
    .pv-step{display:flex;gap:12px;align-items:flex-start;background:var(--card);border:1px solid var(--line);border-radius:8px;padding:12px 14px;}
    .pv-snum{font-family:'Fraunces',serif;font-weight:600;color:#fff;background:var(--gold);width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;flex:0 0 auto;margin-top:1px;}
    .pv-stext{font-size:15px;line-height:1.4;}.pv-stext b{font-family:'Fraunces',serif;font-weight:600;}
    .pv-join{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:22px 18px;margin:22px auto 0;max-width:430px;}
    .pv-label{font-family:'Fraunces',serif;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--soft);margin-bottom:9px;}
    .pv-input{width:100%;background:transparent;border:none;border-bottom:1.5px solid var(--line);font-family:'Spectral',serif;font-size:20px;color:var(--ink);padding:8px 2px;outline:none;}
    .pv-input:focus{border-color:var(--gold);}
    .pv-btn{margin-top:18px;width:100%;background:var(--ink);color:#f6eed9;border:none;font-family:'Fraunces',serif;font-weight:600;letter-spacing:.08em;text-transform:uppercase;font-size:14px;padding:15px;border-radius:6px;cursor:pointer;}
    .pv-btn:active{transform:translateY(1px);}
    .pv-returning{margin:22px auto 0;max-width:430px;}
    .pv-rbtns{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-top:10px;}
    .pv-rbtn{display:flex;align-items:center;gap:8px;background:var(--card);border:1px solid var(--line);border-radius:22px;padding:6px 14px 6px 7px;cursor:pointer;font-family:'Fraunces',serif;font-size:14px;color:var(--ink);}
    .pv-or{text-align:center;font-style:italic;color:var(--soft);font-size:13px;margin:18px 0 0;}
    .pv-err{color:#9c5a45;font-size:13px;margin-top:9px;text-align:center;font-style:italic;font-weight:500;}
    .pv-modal{position:fixed;inset:0;background:rgba(44,36,23,.5);display:flex;align-items:center;justify-content:center;padding:20px;z-index:60;}
    .pv-modalcard{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:24px 20px;max-width:330px;width:100%;text-align:center;}
    .pv-modalcard .pv-input{text-align:center;letter-spacing:.4em;font-size:24px;}
    .pv-status{display:flex;align-items:center;gap:12px;background:var(--card);border:1px solid var(--line);border-radius:10px;padding:12px 14px;margin:6px 0;flex-wrap:wrap;}
    .pv-reader{display:flex;align-items:center;gap:9px;}
    .pv-chip{cursor:pointer;font-size:12px;color:var(--gold-d);font-family:'Fraunces',serif;border:1px solid var(--line);border-radius:18px;padding:4px 11px;background:transparent;}
    .pv-prog{flex:1;min-width:150px;}
    .pv-ptrack{height:8px;background:var(--card2);border:1px solid var(--line);border-radius:6px;overflow:hidden;}
    .pv-pfill{height:100%;background:linear-gradient(90deg,var(--gold),var(--gold-d));transition:width .5s;}
    .pv-pnum{font-family:'Fraunces',serif;font-size:12px;color:var(--soft);margin-top:5px;display:flex;justify-content:space-between;}
    .pv-av{width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-family:'Fraunces',serif;font-size:12px;font-weight:600;flex:0 0 auto;box-shadow:0 2px 6px rgba(60,40,15,.25);}
    .pv-todaybtn{display:block;width:100%;margin:0 0 14px;background:var(--gold-d);color:#fff;border:none;font-family:'Fraunces',serif;font-size:14px;padding:12px;border-radius:8px;cursor:pointer;}
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
    .pv-dot.done{background:var(--gold);border-color:var(--gold);}
    .pv-dbody{padding:2px 14px 16px;border-top:1px solid var(--line);}
    .pv-field{margin-top:14px;}
    .pv-flabel{font-family:'Fraunces',serif;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--gold-d);margin-bottom:7px;display:flex;align-items:center;gap:7px;}
    .pv-flabel:before{content:"";width:14px;height:1px;background:var(--gold);}
    .pv-ta{width:100%;border:1px solid var(--line);background:#fffdf6;border-radius:8px;resize:none;outline:none;overflow:hidden;font-family:'Spectral',serif;font-size:16px;line-height:1.55;color:var(--ink);min-height:52px;padding:11px 12px;}
    .pv-ta.verse{font-style:italic;}
    .pv-ta:focus{border-color:var(--gold);}
    .pv-ta::placeholder{color:#bcae8e;font-style:italic;}
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
    .pv-cmtin:focus{border-color:var(--gold);}
    .pv-cmtbtn{background:var(--gold-d);color:#fff;border:none;border-radius:16px;padding:0 13px;font-family:'Fraunces',serif;font-size:12px;cursor:pointer;}
    .pv-pill{display:inline-flex;align-items:center;gap:6px;cursor:pointer;background:var(--card);border:1px solid var(--line);border-radius:20px;padding:3px 11px 3px 3px;font-size:13px;font-family:'Fraunces',serif;color:var(--ink);}
    .pv-pill.active{border-color:var(--gold);box-shadow:0 0 0 1px var(--gold);}
    .pv-people{display:flex;align-items:center;gap:7px;flex-wrap:wrap;margin:4px 2px 14px;}
    .pv-people .pv-lead{font-style:italic;color:var(--soft);font-size:13px;font-family:'Spectral',serif;width:100%;margin-bottom:2px;}
    .pv-viewbar{display:flex;align-items:center;justify-content:space-between;gap:10px;background:#efe4c8;border:1px solid var(--gold);border-radius:10px;padding:10px 14px;margin:6px 0 12px;}
    .pv-viewbar .vt{font-family:'Fraunces',serif;font-size:14px;color:var(--gold-d);display:flex;align-items:center;gap:8px;}
    .pv-viewbar .vt small{font-style:italic;font-family:'Spectral',serif;color:var(--soft);font-weight:400;}
    .pv-foot{text-align:center;color:var(--soft);font-style:italic;font-size:14px;margin-top:26px;}
    .pv-credit{text-align:center;font-family:'Fraunces',serif;font-size:11px;letter-spacing:.22em;text-transform:uppercase;color:var(--gold-d);margin-top:10px;opacity:.85;}
    .pv-credit:before,.pv-credit:after{content:"·";margin:0 9px;color:var(--gold);}
    .pv-leave{display:block;margin:22px auto 0;background:none;border:none;cursor:pointer;font-family:'Spectral',serif;font-size:12px;color:var(--soft);text-decoration:underline;text-underline-offset:3px;}
  `;

  const Avatar = ({ name, i }) => (
    <span className="pv-av" style={{ background: palette[i % palette.length] }}>
      {name.trim().charAt(0).toUpperCase()}
    </span>
  );

  const grow = (e) => { e.target.style.height = "auto"; e.target.style.height = e.target.scrollHeight + "px"; };

  if (loading) return <div className="pv-root"><style>{css}</style><div className="pv-hero"><div className="pv-kicker">Opening the scroll…</div></div></div>;

  // ── Welcome screen ────────────────────────────────────────────────────────
  if (!me) return (
    <div className="pv-root">
      <style>{css}</style>
      <div className="pv-wrap">
        <div className="pv-hero">
          <div className="pv-kicker">A 31-Day Reading · July</div>
          <h1 className="pv-title"><em>Proverbs</em><br />Challenge</h1>
          <p className="pv-sub">Welcome! You've been invited to read the Book of Proverbs together — one chapter a day, all month.</p>
          <div className="pv-rule" />
          <div className="pv-detail">Begins July 1 · about 5 minutes a day</div>
          <div className="pv-steps">
            <div className="pv-step"><div className="pv-snum">1</div><div className="pv-stext"><b>Read a chapter a day.</b> Proverbs 1 on July 1, through Proverbs 31 on the 31st.</div></div>
            <div className="pv-step"><div className="pv-snum">2</div><div className="pv-stext"><b>Pick your favourite verse</b> from that chapter and write what it means to you.</div></div>
            <div className="pv-step"><div className="pv-snum">3</div><div className="pv-stext"><b>Do it with friends.</b> Everyone here shares this page — you can read each other's reflections.</div></div>
          </div>
          {participants.length > 0 && (
            <div className="pv-returning">
              <div className="pv-label" style={{ textAlign: "center", marginTop: 22 }}>Returning? Tap your name</div>
              <div className="pv-rbtns">{participants.map((p, i) => <button key={p.id} className="pv-rbtn" onClick={() => askPin(p)}><Avatar name={p.name} i={i} />{p.name}</button>)}</div>
              <div className="pv-or">— or join as someone new —</div>
            </div>
          )}
          <div className="pv-join">
            <div className="pv-label">{participants.length > 0 ? "New here? Enter your name" : "Enter your name to join"}</div>
            <input className="pv-input" value={nameInput} onChange={e => { setNameInput(e.target.value); setJoinError(""); }} onKeyDown={e => e.key === "Enter" && join()} placeholder="Your name" autoFocus />
            <div className="pv-label" style={{ marginTop: 16 }}>Create a PIN (4–8 digits)</div>
            <input className="pv-input" value={newPin} type="password" inputMode="numeric" maxLength={8} onChange={e => { setNewPin(e.target.value.replace(/\D/g, "")); setJoinError(""); }} onKeyDown={e => e.key === "Enter" && join()} placeholder="••••" />
            {joinError && <div className="pv-err">{joinError}</div>}
            <button className="pv-btn" onClick={join}>Begin the journey</button>
          </div>
          <div className="pv-notice"><b>A shared reading.</b> Everything you write — verses, reflections, reactions and comments — can be seen by everyone who joins. Please don't share anything private here.</div>
          <p className="pv-credit">Created by Vincent Nyathi</p>
        </div>
      </div>
      {pinFor && (
        <div className="pv-modal" onClick={e => { if (e.target === e.currentTarget) { setPinFor(null); setPinError(""); } }}>
          <div className="pv-modalcard">
            <Avatar name={pinFor.name} i={participants.findIndex(x => x.id === pinFor.id)} />
            <div className="pv-label" style={{ marginTop: 12 }}>Enter {pinFor.name}'s PIN</div>
            <input className="pv-input" value={pinInput} type="password" inputMode="numeric" maxLength={8} autoFocus onChange={e => { setPinInput(e.target.value.replace(/\D/g, "")); setPinError(""); }} onKeyDown={e => e.key === "Enter" && confirmPin()} placeholder="••••" />
            {pinError && <div className="pv-err" key={pinTries}>{pinError}</div>}
            <button className="pv-btn" onClick={confirmPin}>Continue</button>
            <button className="pv-chip" style={{ marginTop: 12 }} onClick={() => { setPinFor(null); setPinError(""); }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );

  // ── Main app ──────────────────────────────────────────────────────────────
  const readOnly = !!viewing;
  const activeEntries = viewing ? (viewing.entries || {}) : myEntries;
  const activeDone = Object.keys(activeEntries).filter(c => activeEntries[c] && (activeEntries[c].verse?.trim() || activeEntries[c].meaning?.trim())).length;

  return (
    <div className="pv-root">
      <style>{css}</style>
      <div className="pv-wrap">
        <div className="pv-hero" style={{ paddingBottom: 10 }}>
          <div className="pv-kicker">31 Days · July</div>
          <h1 className="pv-title"><em>Proverbs</em> Challenge</h1>
          <div className="pv-rule" />
        </div>
        <div className="pv-status">
          <div className="pv-reader"><Avatar name={me.name} i={0} /><span style={{ fontFamily: "'Fraunces',serif", fontWeight: 600 }}>{me.name}</span><button className="pv-chip" onClick={switchReader}>Sign out</button></div>
          <div className="pv-prog">
            <div className="pv-ptrack"><div className="pv-pfill" style={{ width: `${(activeDone / 31) * 100}%` }} /></div>
            <div className="pv-pnum"><span>{activeDone} of 31 chapters</span><span>{readOnly ? "read only" : saving ? "Saving…" : "Saved"}</span></div>
          </div>
        </div>
        {participants.length > 0 && (
          <div className="pv-people">
            <span className="pv-lead">Tap a name to read their page · tap yours to write</span>
            {participants.map((p, i) => {
              const isMe = p.id === me.id;
              const active = isMe ? !viewing : viewing && viewing.id === p.id;
              return <button key={p.id} className={"pv-pill" + (active ? " active" : "")} onClick={() => setViewing(isMe ? null : p)}><Avatar name={p.name} i={i} />{p.name}{isMe ? " (you)" : ""}</button>;
            })}
          </div>
        )}
        {readOnly && (
          <div className="pv-viewbar">
            <span className="vt"><Avatar name={viewing.name} i={participants.findIndex(x => x.id === viewing.id)} />{viewing.name}'s page <small>· read only</small></span>
            <button className="pv-chip" onClick={() => setViewing(null)}>Back to mine</button>
          </div>
        )}
        {tc && <button className="pv-todaybtn" onClick={jumpToToday}>Go to today · Proverbs {tc}</button>}
        {!readOnly && <div className="pv-hint">Tap any day to open it and write your verse</div>}
        {THEMES.map((theme, idx) => {
          const chapter = idx + 1, entry = activeEntries[chapter] || {};
          const hasEntry = entry.verse?.trim() || entry.meaning?.trim();
          const friends = participants.filter(p => p.id !== me.id && p.entries && p.entries[chapter] && (p.entries[chapter].verse?.trim() || p.entries[chapter].meaning?.trim()));
          const isOpen = open === chapter;
          return (
            <div className={"pv-day" + (tc === chapter ? " today" : "")} key={chapter} ref={el => rowRefs.current[chapter] = el}>
              <button className="pv-drow" onClick={() => { setOpen(isOpen ? null : chapter); setNoteIdx(0); setCommentDraft(""); setPicker(null); }}>
                <div className="pv-badge">{chapter}<small>Jul {chapter}</small></div>
                <div className="pv-dmid">
                  <div className="pv-dch">Proverbs {chapter}{tc === chapter && <span className="pv-tag">Today</span>}</div>
                  <div className="pv-dtheme">{theme}</div>
                </div>
                <div className={"pv-dot" + (hasEntry ? " done" : "")}>{hasEntry ? "✓" : ""}</div>
              </button>
              {isOpen && (
                <div className="pv-dbody">
                  {readOnly ? (
                    <>
                      <div className="pv-field"><div className="pv-flabel">{viewing.name}'s favourite</div>
                        {entry.verse?.trim() ? <div className="pv-ro verse">"{entry.verse}"</div> : <div className="pv-ro empty">No verse chosen yet.</div>}
                      </div>
                      {entry.meaning?.trim() && <div className="pv-field"><div className="pv-flabel">What it means to {viewing.name}</div><div className="pv-ro">{entry.meaning}</div></div>}
                    </>
                  ) : (
                    <>
                      <div className="pv-field"><div className="pv-flabel">My favourite from this chapter</div>
                        <textarea className="pv-ta verse" value={entry.verse || ""} placeholder="Write your favourite verse…" onFocus={grow} onChange={e => { grow(e); update(chapter, "verse", e.target.value); }} />
                      </div>
                      <div className="pv-field"><div className="pv-flabel">What it means to me</div>
                        <textarea className="pv-ta" value={entry.meaning || ""} placeholder="Write your reflection…" onFocus={grow} onChange={e => { grow(e); update(chapter, "meaning", e.target.value); }} />
                      </div>
                      {friends.length > 0 && (() => {
                        const f = friends[noteIdx % friends.length], fi = participants.findIndex(x => x.id === f.id);
                        const fe = f.entries[chapter], soc = getSocial(f.id, chapter), sk = sKey(f.id, chapter);
                        return (
                          <div className="pv-stack">
                            <div className="pv-stackhd"><span>{friends.length} {friends.length === 1 ? "friend shared" : "friends shared"}</span>{friends.length > 1 && <em>tap note for next</em>}</div>
                            <div className="pv-sticky" style={{ background: STICKY_BG[fi % STICKY_BG.length], transform: `rotate(${STICKY_ANGLE[fi % STICKY_ANGLE.length]}deg)` }} onClick={() => friends.length > 1 && setNoteIdx(i => i + 1)}>
                              {fe.verse?.trim() && <div className="pv-snverse">"{fe.verse}"</div>}
                              {fe.meaning?.trim() && <div className="pv-snmean">{fe.meaning}</div>}
                              <div className="pv-snwho"><Avatar name={f.name} i={fi} />{f.name}</div>
                              <div className="pv-rxrow" onClick={e => e.stopPropagation()}>
                                {Object.entries(soc.reactions || {}).filter(([, ids]) => ids && ids.length > 0).map(([em, ids]) => (
                                  <button key={em} className={"pv-rxbubble" + (ids.includes(me.id) ? " on" : "")} onClick={() => toggleReaction(f.id, chapter, em)}><span>{em}</span><b>{ids.length}</b></button>
                                ))}
                                <span className="pv-picker">
                                  <button className="pv-addrx" onClick={() => setPicker(picker === sk ? null : sk)}>＋</button>
                                  {picker === sk && <div className="pv-pickpop">{REACTIONS.map(em => <button key={em} onClick={() => { toggleReaction(f.id, chapter, em); setPicker(null); }}>{em}</button>)}</div>}
                                </span>
                              </div>
                              <div className="pv-cmts" onClick={e => e.stopPropagation()}>
                                {(soc.comments || []).map(c => <div className="pv-cmt" key={c.id}><b>{c.byName}:</b> {c.text}</div>)}
                                <div className="pv-cmtform">
                                  <input className="pv-cmtin" value={commentDraft} placeholder={"Encourage " + f.name + "…"} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)} onChange={e => setCommentDraft(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { addComment(f.id, chapter, commentDraft); setCommentDraft(""); } }} />
                                  <button className="pv-cmtbtn" onClick={() => { addComment(f.id, chapter, commentDraft); setCommentDraft(""); }}>Send</button>
                                </div>
                              </div>
                              {friends.length > 1 && <div className="pv-dots" onClick={e => e.stopPropagation()}>{friends.map((_, di) => <button key={di} className={"pv-dotn" + ((noteIdx % friends.length) === di ? " on" : "")} onClick={() => setNoteIdx(di)} />)}</div>}
                            </div>
                          </div>
                        );
                      })()}
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
        <p className="pv-foot">"The fear of the Lord is the beginning of wisdom." — Proverbs 9:10</p>
        <p className="pv-credit">Created by Vincent Nyathi</p>
        {!readOnly && <button className="pv-leave" onClick={() => setConfirmDelete(true)}>leave the challenge</button>}
      </div>
      {confirmDelete && (
        <div className="pv-modal" onClick={e => { if (e.target === e.currentTarget) setConfirmDelete(false); }}>
          <div className="pv-modalcard">
            <div className="pv-label" style={{ letterSpacing: ".08em" }}>Leave the challenge?</div>
            <p style={{ fontSize: 14, color: "var(--soft)", margin: "10px 0 4px", lineHeight: 1.45 }}>This permanently deletes {me.name}'s page and all your verses. This can't be undone.</p>
            <button className="pv-btn" style={{ background: "#9c5a45" }} onClick={deleteMe}>Delete my page</button>
            <button className="pv-chip" style={{ marginTop: 12 }} onClick={() => setConfirmDelete(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}