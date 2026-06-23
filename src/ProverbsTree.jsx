import { useState } from "react";

/* The Tree of Proverbs — study map, built on the SDA Bible Commentary's
   seven-part outline. Drops into Proverbs Challenge as a panel.
   Usage:  {showTree && <ProverbsTree onClose={()=>setShowTree(false)} />}      */

const TIERS = [
  {
    key: "roots", label: "Roots", color: "#7a5a33",
    gloss: "The foundation — read this first; it's the lens for everything.",
    nodes: [{
      id: "r1", ref: "1:1–7", title: "Title, Purpose & Basis of Knowledge",
      sub: "Why the book exists and where all wisdom begins.",
      structure: [
        { r: "1:1", t: "Title — the proverbs of Solomon" },
        { r: "1:2–6", t: "The purpose — for the simple, young, and wise alike" },
        { r: "1:7", t: "The basis of all knowledge — the fear of the LORD" },
      ],
      note: "Three words run the whole book: chokmah (wisdom — character & conduct), binah (understanding — to evaluate & organize), da'ath (knowledge — the facts). \"Beginning\" (re'shith) means both the first step and the principal part.",
      handle: "Memorize 1:7 and hold it over everything after. The theme: diligence, honesty, thrift, temperance, purity — \"a treasury of practical wisdom.\"",
    }],
  },
  {
    key: "trunk", label: "Trunk · The Wisdom Section", color: "#3E4A24",
    gloss: "1:8 – 9:18 · long speeches & Wisdom personified. The WHY before the proverbs.",
    nodes: [{
      id: "t1", ref: "1:8–9:18", title: "The Father's Discourses & Lady Wisdom",
      sub: "Two paths, two women, two banquets — an appeal to choose wisdom.",
      structure: [
        { r: "1:8–19", t: "Warning against the enticement of sinners" },
        { r: "1:20–33", t: "The call of wisdom — she cries in the streets" },
        { r: "2:1–7:27", t: "Admonitions — incl. the fourfold \"strange woman\"" },
        { r: "8:1–36", t: "The call & work of wisdom — present at creation" },
        { r: "9:1–18", t: "Wisdom and folly — the two banquets" },
      ],
      note: "Wisdom is a noble woman (chokmoth, plural of intensity); Folly calls just as loudly. The \"strange woman\" ('ishshah zarah) recurs at 2:16; 5:3; 6:24; 7:5. And 3:18 gives the book its image: wisdom is \"a tree of life.\" The fear of the LORD returns at 9:10, closing the section as 1:7 opened it.",
      handle: "Read these as whole speeches, not single verses. This section makes you want wisdom before the next tells you what it looks like.",
    }],
  },
  {
    key: "branches", label: "Branches · The Collections", color: "#5A6A36",
    gloss: "10:1 – 29:27 · hundreds of short sayings for daily life. Read by theme, not storyline.",
    nodes: [
      {
        id: "b1", ref: "10:1–22:16", title: "Proverbs of Solomon — the Main Collection",
        sub: "Two-line proverbs in measured parallelism, mostly antithetical.",
        note: "The heart of the book: terse, self-contained sayings built on contrast — righteous vs. wicked, wise vs. fool. Two words for \"fool\" ('ewil, kesil) recur constantly.",
        handle: "Don't read for plot. Take a few at a time, weigh each contrast, and collect by topic — tongue, money, diligence, pride.",
      },
      {
        id: "b2", ref: "22:17–24:34", title: "A Series of Maxims — \"the Words of the Wise\"",
        sub: "Longer, connected admonitions — a change of voice.",
        note: "Direct address returns — \"incline thine ear\" (22:17) — running on in paragraphs. 22:20 speaks of \"thirty sayings\"; the commentary notes parallels with the Egyptian Instruction of Amenemope (Solomon's is the older).",
        handle: "Read in groups, as short essays of counsel — manners before a ruler, the trap of envy, the sluggard's overgrown field (24:30–34).",
      },
      {
        id: "b3", ref: "25:1–29:27", title: "Proverbs Collected for Hezekiah",
        sub: "A second Solomon collection, transcribed generations later.",
        note: "\"Copied out\" by Hezekiah's men (25:1) — Isaiah, Shebna, Joah may have helped. Rich in comparison: \"apples of gold in pictures of silver\" (25:11). 29:27 makes a fitting close.",
        handle: "Watch the \"like… so…\" form and let the pictures teach. This is Solomon's wisdom worth copying down.",
      },
    ],
  },
  {
    key: "fruit", label: "Fruit · Agur & Lemuel", color: "#C2862C",
    gloss: "30:1 – 31:31 · wisdom gathered from other voices, then embodied in a person.",
    nodes: [
      {
        id: "f1", ref: "30:1–33", title: "The Words of Agur",
        sub: "A humble confession, a balanced prayer, and the numerical sayings.",
        note: "Agur confesses he has not attained wisdom alone (30:2–3) — humility as the gate. He guards the pure Word (\"add thou not,\" 30:6) and prays \"give me neither poverty nor riches\" (30:7–9). Then the numerical sayings — \"three things, yea, four\" — insatiable, wonderful, small-but-wise (ant, coney, locust, lizard), and stately.",
        handle: "Use the numbered lists to train pattern-noticing — what do these four share? Wisdom begins by admitting how little we know.",
      },
      {
        id: "f2", ref: "31:1–31", title: "The Words of Lemuel & the Woman of Worth",
        sub: "A mother's counsel to a king, then the closing acrostic — the book's crown.",
        structure: [
          { r: "31:1–9", t: "A mother's instruction — guard against drink; plead for the poor" },
          { r: "31:10–31", t: "Acrostic poem to the virtuous woman" },
        ],
        note: "The close is an acrostic — 22 verses on the 22 Hebrew letters. The \"virtuous woman\" is eshet chayil, \"a woman of power.\" The last word lands on the first theme: \"a woman that feareth the LORD\" (31:30).",
        handle: "Read it as the book coming full circle. Lady Wisdom who called in chapter 1 now walks the earth in chapter 31. The abstract becomes flesh.",
      },
    ],
  },
];

export default function ProverbsTree({ onClose }) {
  const [open, setOpen] = useState(() => new Set());
  const toggle = (id) =>
    setOpen((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  return (
    <div className="pv-grouppanel" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="pv-groupcard">
        <div className="pv-gphead">
          <span className="pv-gptitle">🌳 The Tree of Proverbs</span>
          <button className="pv-gpclose" onClick={onClose}>✕</button>
        </div>

        <div className="pvtree">
          <p className="pvt-spine">
            One root feeds the whole book: <b>the fear of the LORD</b>
            <span> — named at 1:7 · 9:10 · 31:30 (its beginning, middle & last word)</span>
          </p>

          {TIERS.map((tier) => (
            <div key={tier.key} className="pvt-tier">
              <div className="pvt-tierhead">
                <span className="pvt-dot" style={{ background: tier.color }} />
                <span className="pvt-tierlabel">{tier.label}</span>
              </div>
              <p className="pvt-gloss">{tier.gloss}</p>

              {tier.nodes.map((n) => {
                const isOpen = open.has(n.id);
                return (
                  <div key={n.id} className={"pvt-node" + (isOpen ? " open" : "")}>
                    <button className="pvt-summary" onClick={() => toggle(n.id)} aria-expanded={isOpen}>
                      <span className="pvt-ref">{n.ref}</span>
                      <span className="pvt-title">{n.title}</span>
                      <span className="pvt-chev">{isOpen ? "−" : "+"}</span>
                      <span className="pvt-sub">{n.sub}</span>
                    </button>

                    {isOpen && (
                      <div className="pvt-body">
                        {n.structure && (
                          <ul className="pvt-structure">
                            {n.structure.map((s, i) => (
                              <li key={i}><span className="pvt-r">{s.r}</span>{s.t}</li>
                            ))}
                          </ul>
                        )}
                        {n.note && <p className="pvt-note">{n.note}</p>}
                        {n.handle && (
                          <div className="pvt-handle"><b>How to read it: </b>{n.handle}</div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}

          <div className="pvt-inclusio">
            <b>The frame that holds it all</b>
            <p>
              Wisdom-as-a-woman opens the book (Lady Wisdom, ch. 1 & 8–9) and closes it
              (the Woman of Worth, ch. 31), and "the fear of the LORD" is named at the
              beginning, center, and very end. The middle is a treasury of sayings; the
              frame is a single arc — from wisdom <i>proclaimed</i> to wisdom <i>lived</i>.
            </p>
          </div>

          <p className="pvt-src">
            Structure & notes from the Seventh-day Adventist Bible Commentary on Proverbs.
          </p>
        </div>
      </div>

      <style>{`
        .pvtree{padding:4px 2px 8px;color:var(--ink,#2b2218);}
        .pvt-spine{font-style:italic;text-align:center;color:var(--soft,#6e6450);
          font-size:14px;line-height:1.5;margin:2px 0 18px;}
        .pvt-spine b{font-style:normal;color:#C2862C;}
        .pvt-spine span{display:block;font-size:12px;margin-top:4px;opacity:.85;}
        .pvt-tier{margin-top:20px;}
        .pvt-tierhead{display:flex;align-items:center;gap:8px;}
        .pvt-dot{width:11px;height:11px;border-radius:50%;flex:none;}
        .pvt-tierlabel{font-weight:700;font-size:12px;letter-spacing:.14em;text-transform:uppercase;}
        .pvt-gloss{font-style:italic;color:var(--soft,#6e6450);font-size:13.5px;margin:5px 0 10px;line-height:1.45;}
        .pvt-node{border:1px solid rgba(120,100,60,.22);border-radius:12px;
          margin:9px 0;overflow:hidden;background:rgba(255,255,255,.45);}
        .pvt-summary{width:100%;text-align:left;background:none;border:none;cursor:pointer;
          padding:13px 14px;display:grid;grid-template-columns:auto 1fr auto;gap:8px 10px;align-items:center;font:inherit;}
        .pvt-ref{font-family:ui-monospace,Menlo,monospace;font-size:11.5px;font-weight:600;
          color:#fff;background:#3E4A24;padding:3px 8px;border-radius:6px;white-space:nowrap;}
        .pvt-title{font-weight:600;font-size:15.5px;line-height:1.2;}
        .pvt-chev{font-size:20px;color:#5A6A36;line-height:1;width:18px;text-align:center;}
        .pvt-sub{grid-column:1 / -1;color:var(--soft,#6e6450);font-size:13px;line-height:1.4;margin-top:1px;}
        .pvt-body{padding:0 14px 15px;border-top:1px solid rgba(120,100,60,.18);margin-top:2px;}
        .pvt-structure{list-style:none;margin:12px 0 0;padding:0;}
        .pvt-structure li{position:relative;padding:5px 0 5px 16px;font-size:13.5px;line-height:1.4;
          border-bottom:1px dotted rgba(120,100,60,.25);}
        .pvt-structure li:last-child{border-bottom:none;}
        .pvt-structure li:before{content:"";position:absolute;left:1px;top:11px;width:6px;height:6px;
          background:#5A6A36;transform:rotate(45deg);border-radius:1px;}
        .pvt-r{font-family:ui-monospace,Menlo,monospace;font-size:12px;color:#9E4B2E;margin-right:7px;}
        .pvt-note{font-size:14px;line-height:1.55;margin:12px 0 0;}
        .pvt-handle{margin-top:13px;padding:11px 13px;border-left:3px solid #C2862C;
          background:rgba(194,134,44,.08);border-radius:0 9px 9px 0;font-size:13.5px;line-height:1.5;}
        .pvt-handle b{color:#C2862C;}
        .pvt-inclusio{margin-top:24px;padding:16px;border:1px solid rgba(120,100,60,.22);
          border-radius:12px;background:rgba(194,134,44,.05);text-align:center;}
        .pvt-inclusio b{font-size:15px;}
        .pvt-inclusio p{font-style:italic;color:var(--soft,#6e6450);font-size:13.5px;line-height:1.55;margin:8px 0 0;}
        .pvt-src{text-align:center;font-size:11.5px;color:var(--soft,#6e6450);margin-top:18px;opacity:.85;}
      `}</style>
    </div>
  );
}
