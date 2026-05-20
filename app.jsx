import { useState, useEffect, useRef } from "react";
// Biblioteca do Supabase importada de forma limpa
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = "sb_publishable_uEQ-9pRhWLMIO6zus9Znnw_w_VYI2Be";
const SUPABASE_KEY = "sb_secret_iQtTmy4AAijYFVtQm322tA_S_inGijV";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/* ─── CORES ─────────────────────────────────────────────────────────────── */
const C={bg:"#0f0f0f",surf:"#161616",card:"#1c1c1c",bord:"#2a2a2a",
  gold:"#d4af37",goldS:"#d4af3714",goldB:"#f0d060",green:"#3ecf8e",
  blue:"#6ea8fe",purple:"#e879f9",red:"#f87171",warn:"#fbbf24",
  teal:"#2dd4bf",orange:"#fb923c",txt:"#f0f0f0",muted:"#777",dim:"#444"};

/* ─── LEAD TIME ──────────────────────────────────────────────────────────── */
const SP=7,SPA=7,SM=35,SS=20,SA=4;          // etapas em dias
const LEAD_F=SP+SPA+SM+SS+SA;               // 73 dias fábrica
const LEAD_P=20;                             // 20 dias pronto
const EVT_BUF=30;                            // buffer evento comemorativo

/* ─── HELPERS (todos null-safe) ─────────────────────────────────────────── */
const gid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2);
const safe=(v,fb=0)=>(!v||isNaN(Number(v)))?fb:Number(v);
const fmt=d=>{if(!d||d==="null")return"—";try{return new Date(d+"T12:00:00").toLocaleDateString("pt-BR")}catch{return"—"}};
const fmtR=v=>safe(v).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const addD=(ds,n)=>{if(!ds)return null;try{const d=new Date(ds+"T12:00:00");d.setDate(d.getDate()+n);return d.toISOString().split("T")[0]}catch{return null}};
const dUntil=ds=>{if(!ds)return 0;const d=Math.ceil((new Date(ds+"T12:00:00")-new Date())/86400000);return isNaN(d)?0:d};
const today=()=>new Date().toISOString().split("T")[0];
const prodTotal=p=>(p?.produtos||[]).reduce((a,x)=>a+safe(x?.qtd,1)*safe(x?.valor),0);
const calcDue=p=>{const t=prodTotal(p);const f=p?.fin||{};return (p?.tipoEntrega==="fabrica"||p?.tipo_entrega==="fabrica")?(f.finalPaymentDate?0:f.downPaymentDate?t*0.7:t):(f.paymentDate?0:t)};
const dlDate=(dd,tipo,isEvt=false)=>{let l=tipo==="fabrica"?LEAD_F:LEAD_P;if(tipo==="fabrica"&&isEvt)l+=EVT_BUF;return addD(dd,-l)};

/* ─── EVENTOS COMEMORATIVAS ─────────────────────────────────────────────── */
const EVENTOS=[
  {id:"mulher",nome:"Dia da Mulher",data:"2026-03-08",icone:"👩",desc:"Dourado, rosê, peças femininas",prior:"alta"},
  {id:"pascoa",nome:"Páscoa",data:"2026-04-05",icone:"🐣",desc:"Pastéis, kunzita, ametista lavanda",prior:"média"},
  {id:"maes",nome:"Dia das Mães",data:"2026-05-10",icone:"🌸",desc:"Pérolas, clássicos, conjuntos premium",prior:"alta"},
  {id:"namorados",nome:"Dia dos Namorados",data:"2026-06-12",icone:"💕",desc:"Corações, rubi, rose, romântico",prior:"alta"},
  {id:"junina",nome:"Festa Junina / Inverno",data:"2026-06-21",icone:"🌽",desc:"Âmbar, citrino, yellow fancy",prior:"média"},
  {id:"colecao",nome:"Virada Inverno→Primavera",data:"2026-07-01",icone:"🌿",desc:"Renovação de mix: peridoto, verde, cristal",prior:"alta",destaque:"Evento de Moda"},
  {id:"avos",nome:"Dia dos Avós",data:"2026-07-26",icone:"👵",desc:"Pérolas, ouro, clássicos atemporais",prior:"média"},
  {id:"pais",nome:"Dia dos Pais",data:"2026-08-09",icone:"👔",desc:"Unissex, pulseiras, kits presente",prior:"média"},
  {id:"primavera",nome:"Primavera",data:"2026-09-22",icone:"🌺",desc:"Verde, esmeralda, apple green, floral",prior:"média"},
  {id:"outubrorosa",nome:"Outubro Rosa",data:"2026-10-01",icone:"🎀",desc:"Rosa, laços, delicados",prior:"média"},
  {id:"criancas",nome:"Dia das Crianças",data:"2026-10-12",icone:"🎈",desc:"Coloridos, piercing fake, mini conjuntos",prior:"média"},
  {id:"bijoias",nome:"Feira Bijoias",data:"2026-11-12",icone:"💎",desc:"Maior feira do setor. Catálogos, lookbooks, amostras.",prior:"alta",destaque:"Feira de Negócios"},
  {id:"black",nome:"Black Friday",data:"2026-11-27",icone:"🖤",desc:"Best-sellers, kits especiais, giro máximo",prior:"alta"},
  {id:"natal",nome:"Natal & Réveillon",data:"2026-12-20",icone:"🎄",desc:"Cristal, dourado, prata, conjuntos festa",prior:"alta"},
];

/* ─── SKUs (163 produtos — Curva ABC 19/05/2026) ─────────────────────────── */
const SKUS_DEF=[
  {codigo:"3237049",nome:"Anel Ródio Ponto de Luz 8MM Colors Ajustável",cor:"CORES",cat:"Anel",vendas:61,valor:99},
  {codigo:"3237099",nome:"Brinco Ródio Trio Ponto de Luz Colors",cor:"CORES",cat:"Brinco",vendas:36,valor:99.83},
  {codigo:"3236988",nome:"Pingente Prata Filhos Moissanite",cor:"MENINO",cat:"Pingente",vendas:28,valor:364.71},
  {codigo:"3236698",nome:"Pulseira Ródio Riviera 3 Pontas Cristal",cor:"CRISTAL",cat:"Pulseira",vendas:25,valor:78.05},
  {codigo:"3236987",nome:"Pingente Prata Filhos Moissanite",cor:"MENINA",cat:"Pingente",vendas:24,valor:367.33},
  {codigo:"3235361",nome:"Brinco Prata Ponto de Luz Moissanite 8MM",cor:"CRISTAL",cat:"Brinco",vendas:23,valor:499},
  {codigo:"3237213",nome:"Anel Ródio Quadrado Cravejado Lateral Rose Cut",cor:"TURMALINA",cat:"Anel",vendas:23,valor:110.21},
  {codigo:"3237044",nome:"Conjunto Ródio Ponto de Luz 8mm",cor:"KUNZITA",cat:"Conjunto",vendas:22,valor:189},
  {codigo:"3236805",nome:"Colar Ródio Riviera 3 Pontas Cristal",cor:"RUBELITA",cat:"Colar",vendas:21,valor:399},
  {codigo:"3237207",nome:"Colar Ródio Quadrado Cravejado Lateral Rose Cut",cor:"TURMALINA",cat:"Colar",vendas:21,valor:129.13},
  {codigo:"3237212",nome:"Brinco Ródio Quadrado Cravejado Lateral Rose Cut",cor:"TURMALINA",cat:"Brinco",vendas:20,valor:137.63},
  {codigo:"3236631",nome:"Colar Ródio Riviera 3 Pontas Cristal",cor:"CRISTAL",cat:"Colar",vendas:18,valor:399},
  {codigo:"3235184",nome:"Pulseira Ródio Fio Faca Ponto de Luz Cristal",cor:"CRISTAL",cat:"Pulseira",vendas:18,valor:299},
  {codigo:"3237308",nome:"Pulseira Ródio Fio Faca Separador Ponto de Luz",cor:"CRISTAL",cat:"Pulseira",vendas:18,valor:189},
  {codigo:"3236567",nome:"Conjunto Ródio Ponto de Luz 8mm",cor:"PERIDOTO",cat:"Conjunto",vendas:17,valor:189},
  {codigo:"3236636",nome:"Colar Ródio Riviera 3 Pontas Cristal",cor:"TANGERINA",cat:"Colar",vendas:16,valor:399},
  {codigo:"3237214",nome:"Anel Ródio Quadrado Cravejado Lateral Rose Cut",cor:"LAVANDA",cat:"Anel",vendas:16,valor:100.55},
  {codigo:"3236801",nome:"Colar Ródio Riviera 3 Pontas Cristal",cor:"TURMALINA",cat:"Colar",vendas:16,valor:399},
  {codigo:"3236933",nome:"Colar Ródio Riviera 3 Pontas Cristal",cor:"AMETISTA",cat:"Colar",vendas:16,valor:399},
  {codigo:"3237045",nome:"Conjunto Ródio Ponto de Luz 8mm",cor:"AMETISTA",cat:"Conjunto",vendas:16,valor:189},
  {codigo:"3236803",nome:"Colar Ródio Riviera 3 Pontas Cristal",cor:"TANZANITA",cat:"Colar",vendas:15,valor:399},
  {codigo:"3236654",nome:"Pulseira Ródio Corações Cristais e Kunzita",cor:"-",cat:"Pulseira",vendas:15,valor:199},
  {codigo:"3237288",nome:"Colar Ródio Riviera Cushion Ovais 42CM",cor:"SAFIRA",cat:"Colar",vendas:14,valor:232.93},
  {codigo:"3236913",nome:"Colar Ouro Riviera 4 Garras Cristais 45CM",cor:"KUNZITA",cat:"Colar",vendas:14,valor:419},
  {codigo:"3236632",nome:"Colar Ródio Riviera 3 Pontas Cristal",cor:"PERIDOTO",cat:"Colar",vendas:14,valor:399},
  {codigo:"3236946",nome:"Conjunto Ródio Mini Coração Cravejado Color 3 Pcs",cor:"-",cat:"Conjunto",vendas:14,valor:199},
  {codigo:"3237315",nome:"Pulseira Ouro Mini Bolinhas Cristais Peridoto",cor:"-",cat:"Pulseira",vendas:14,valor:64.57},
  {codigo:"3236727",nome:"Piercing Fake Cristal Riviera",cor:"CRISTAL",cat:"Piercing",vendas:14,valor:64.07},
  {codigo:"3237314",nome:"Pulseira Ródio Mini Bolinhas Cristais",cor:"-",cat:"Pulseira",vendas:14,valor:58.99},
  {codigo:"3235771",nome:"Anel Prata Solitário Moissanite 8MM Ajustável",cor:"CRISTAL",cat:"Anel",vendas:13,valor:509},
  {codigo:"3235770",nome:"Colar Prata Ponto de Luz Moissanite 8MM",cor:"CRISTAL",cat:"Colar",vendas:13,valor:519},
  {codigo:"3236568",nome:"Conjunto Ródio Ponto de Luz 8mm",cor:"CITRINO",cat:"Conjunto",vendas:13,valor:189},
  {codigo:"3237043",nome:"Conjunto Ródio Ponto de Luz 8mm",cor:"ÂMBAR",cat:"Conjunto",vendas:13,valor:189},
  {codigo:"3234352",nome:"Colar Ródio Riviera Mini 4 Garras Cristal 40CM",cor:"CRISTAL",cat:"Colar",vendas:12,valor:499},
  {codigo:"3237257",nome:"Pulseira Ródio Corações Cristais Color",cor:"KUNZITA",cat:"Pulseira",vendas:12,valor:117.14},
  {codigo:"3237312",nome:"Conjunto Ródio Cristal Kunzita Ponto Luz",cor:"CRISTAL",cat:"Conjunto",vendas:12,valor:91.66},
  {codigo:"3236696",nome:"Pulseira Ródio Riviera 3 Pontas Cristal",cor:"ÂMBAR",cat:"Pulseira",vendas:12,valor:169},
  {codigo:"3237289",nome:"Colar Ródio Riviera Cushion Ovais 42CM",cor:"SKY BLUE",cat:"Colar",vendas:11,valor:246.49},
  {codigo:"3237286",nome:"Colar Ouro Fio Faca Médio Ponto de Luz",cor:"ÂMBAR",cat:"Colar",vendas:11,valor:182.52},
  {codigo:"3237282",nome:"Colar Ródio Fio Faca Médio Ponto de Luz",cor:"KUNZITA",cat:"Colar",vendas:11,valor:171.56},
  {codigo:"3237215",nome:"Anel Ródio Quadrado Cravejado Lateral Rose Cut",cor:"TOPÁZIO",cat:"Anel",vendas:11,valor:110.8},
  {codigo:"3236427",nome:"Brinco Ródio Redondo Princesa Cristal",cor:"-",cat:"Brinco",vendas:11,valor:83.78},
  {codigo:"3236718",nome:"Anel Ródio Meia Aliança Cristal Ajustável",cor:"CRISTAL",cat:"Anel",vendas:11,valor:259},
  {codigo:"3236680",nome:"Conjunto Ródio Ponto de Luz 8mm",cor:"SKY BLUE",cat:"Conjunto",vendas:11,valor:189},
  {codigo:"3237013",nome:"Brinco Ródio Oval Médio Cravejado Cristal Colors",cor:"KUNZITA",cat:"Brinco",vendas:11,valor:51.42},
  {codigo:"3236744",nome:"Brinco Ouro Duplo Bola Lisa e Cravejado",cor:"-",cat:"Brinco",vendas:10,valor:175.48},
  {codigo:"3237209",nome:"Colar Ródio Quadrado Cravejado Lateral Rose Cut",cor:"TOPÁZIO",cat:"Colar",vendas:10,valor:130.83},
  {codigo:"3237264",nome:"Pulseira Ródio Corações Cravejados Cristais",cor:"CRISTAL",cat:"Pulseira",vendas:10,valor:121.7},
  {codigo:"3237386",nome:"Pulseira Ródio Cristais Cushion Color 6MM",cor:"PERIDOTO",cat:"Pulseira",vendas:10,valor:116.42},
  {codigo:"3236915",nome:"Pulseira Ródio Gotas Ametista Pontos Cristal",cor:"-",cat:"Pulseira",vendas:10,valor:92},
  {codigo:"3237170",nome:"Anel Ródio Ponto de Luz 8MM Cristal Ajustável",cor:"-",cat:"Anel",vendas:10,valor:57.48},
  {codigo:"3237021",nome:"Anel Ródio Cravejado Base Alta Cristal Redondo",cor:"KUNZITA",cat:"Anel",vendas:10,valor:51.1},
  {codigo:"3236719",nome:"Anel Ródio Meia Aliança Cristal Ajustável",cor:"ÂMBAR",cat:"Anel",vendas:10,valor:259},
];

/* ─── ATOMS ──────────────────────────────────────────────────────────────── */
const CATS=["Colar","Pulseira","Brinco","Anel","Conjunto","Pingente","Bracelete","Piercing","Outro","Pedido"];
const TYMAP={semanal:{l:"Weekly",c:C.green},mensal:{l:"Monthly",c:C.blue},trimestral:{l:"Seasonal",c:C.purple}};
const ST={planned:"Planejado",prep:"Preparando",payment:"Pagamento",production:"Fabricando 🏭",transit:"Viajando ✈️",ammi:"Na Ammi 🏠",received:"Entregue ✅"};
const STCOL={planned:C.muted,prep:C.blue,payment:C.warn,production:C.purple,transit:C.gold,ammi:C.teal,received:C.green};
const iST=s=>({label:ST[s]||"Planned",color:STCOL[s]||C.muted});
const LS={display:"block",color:C.muted,fontSize:11,fontWeight:700,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:5};
const ip=(ex={})=>({style:{background:C.bg,border:`1px solid ${C.bord}`,borderRadius:6,color:C.txt,padding:"8px 12px",fontSize:13,outline:"none",width:"100%",boxSizing:"border-box",...ex}});

function TypeBadge({type}){const x=TYMAP[type]||TYMAP.semanal;return <span style={{background:x.c+"22",color:x.c,border:`1px solid ${x.c}44`,borderRadius:4,padding:"2px 8px",fontSize:11,fontWeight:700}}>{x.l}</span>;}
function Chip({label,color}){return <span style={{background:color+"22",color,border:`1px solid ${color}44`,borderRadius:4,padding:"2px 8px",fontSize:11,fontWeight:700}}>{label}</span>;}
function AvatarChip({name,color=C.purple}){if(!name||!name.trim())return null;const ini=(name.trim().split(/[\s/]+/).map(w=>w[0]||"").slice(0,2).join("").toUpperCase())||"?";return <span style={{display:"inline-flex",alignItems:"center",gap:5,background:color+"22",border:`1px solid ${color}44`,borderRadius:20,padding:"2px 9px 2px 4px",fontSize:11,fontWeight:700,color}}><span style={{background:color,borderRadius:"50%",width:18,height:18,display:"inline-flex",alignItems:"center",justifyContent:"center",color:"#000",fontSize:9,fontWeight:900}}>{ini}</span>{name}</span>;}

function StatusBadge({status,onChange}){
  const[o,sO]=useState(false);const cc=iST(status);
  return <div style={{position:"relative"}}>
    <button onClick={()=>sO(v=>!v)} style={{background:cc.color+"22",color:cc.color,border:`1px solid ${cc.color}44`,borderRadius:4,padding:"3px 10px",fontSize:11,fontWeight:700,cursor:"pointer"}}>{cc.label} ▾</button>
    {o&&<div style={{position:"absolute",top:"110%",right:0,zIndex:300,background:C.card,border:`1px solid ${C.bord}`,borderRadius:8,minWidth:160,boxShadow:"0 8px 24px #000a",overflow:"hidden"}}>
      {Object.entries(ST).map(([k,l])=><button key={k} onClick={()=>{onChange(k);sO(false);}} style={{display:"block",width:"100%",textAlign:"left",padding:"8px 14px",background:"transparent",color:STCOL[k]||C.muted,fontSize:12,fontWeight:600,cursor:"pointer",border:"none"}} onMouseEnter={e=>e.currentTarget.style.background=C.bord} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>{l}</button>)}
    </div>}
  </div>;
}

/* ─── TIMELINE ───────────────────────────────────────────────────────────── */
const SFAB=[
  {key:"created",label:"Criado",sub:"",icon:"📋",color:C.muted,cum:0},
  {key:"prep",label:"Confecção",sub:`${SP}d`,icon:"📝",color:C.blue,cum:SP},
  {key:"payment",label:"Pagamento",sub:`${SPA}d`,icon:"💳",color:C.warn,cum:SP+SPA},
  {key:"manuf",label:"Fabricação",sub:`${SM}d`,icon:"🏭",color:C.purple,cum:SP+SPA+SM},
  {key:"ship",label:"Envio Aéreo",sub:`${SS}d`,icon:"✈️",color:C.gold,cum:SP+SPA+SM+SS},
  {key:"ammi",label:"Ammi",sub:`${SA}d`,icon:"🏠",color:C.teal,cum:LEAD_F},
  {key:"received",label:"Recebido",sub:"",icon:"✅",color:C.green,cum:LEAD_F},
];
const SPRT=[
  {key:"created",label:"Criado",sub:"",icon:"📋",color:C.muted},
  {key:"payment",label:"Pagamento",sub:"100%",icon:"💳",color:C.teal},
  {key:"transit",label:"Trânsito",sub:`${LEAD_P}d`,icon:"✈️",color:C.gold},
  {key:"ammi",label:"Ammi",sub:"",icon:"🏠",color:C.teal},
  {key:"received",label:"Recebido",sub:"",icon:"✅",color:C.green},
];

function Timeline({pedido}){
  const tipoEntrega = pedido.tipoEntrega || pedido.tipo_entrega;
  const fab=tipoEntrega==="fabrica";
  const stages=fab?SFAB:SPRT;
  const fin=pedido.fin||{};
  const st=pedido.status||"planned";
  const si=key=>{const i=stages.findIndex(s=>s.key===key);return i>=0?i:1;};
  let cur=1;
  if(st==="received")cur=stages.length-1;
  else if(st==="ammi")cur=si("ammi");
  else if(st==="transit"||st==="ship")cur=fab?si("ship"):si("transit");
  else if(st==="production"||st==="manuf")cur=fab?si("manuf"):2;
  else if(st==="payment")cur=si("payment");
  else if(st==="prep")cur=si("prep");
  else cur=0;
  cur=Math.max(0,Math.min(cur,stages.length-1));

  const created=pedido.criadoEm || pedido.criado_em ? (pedido.criadoEm || pedido.criado_em).split("T")[0] : null;
  const dates={};
  if(created&&fab)SFAB.forEach(s=>{dates[s.key]=addD(created,s.cum);});
  if(fin.paymentDate&&!fab){dates.payment=fin.paymentDate;dates.transit=addD(fin.paymentDate,2);dates.ammi=addD(fin.paymentDate,LEAD_P-2);dates.received=pedido.dataDesejada || pedido.data_desejada;}

  return <div>
    <div style={{display:"flex",alignItems:"flex-start",overflowX:"auto",paddingBottom:8,gap:0}}>
      {stages.map((s,i)=>{
        const done=i<cur,active=i===cur;
        const col=done||active?s.color:C.dim;
        return <div key={s.key} style={{display:"flex",alignItems:"flex-start",flex:i<stages.length-1?1:"none"}}>
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",minWidth:64}}>
            <div style={{width:32,height:32,borderRadius:"50%",background:done?s.color+"33":active?s.color+"1a":C.bord,border:`2px solid ${col}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,boxShadow:active?`0 0 8px ${s.color}55`:"none"}}>{done?"✓":s.icon}</div>
            <div style={{marginTop:4,textAlign:"center",fontSize:9,color:active?s.color:done?C.muted:C.dim,fontWeight:active?700:400,lineHeight:1.3,maxWidth:60}}>{s.label}</div>
            {s.sub&&<div style={{fontSize:8,color:C.dim,textAlign:"center",maxWidth:60}}>{s.sub}</div>}
            {dates[s.key]&&<div style={{fontSize:8,color:active?s.color:C.muted,marginTop:1}}>{fmt(dates[s.key])}</div>}
          </div>
          {i<stages.length-1&&<div style={{flex:1,height:2,background:i<cur?s.color+"99":C.bord,marginTop:14,minWidth:6}}/>}
        </div>;
      })}
    </div>
    {fab&&created&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginTop:8}}>
      {[["Iniciado em",fmt(created),C.muted],["Chega na Ammi",fmt(addD(created,LEAD_F)),C.teal],["Chegada desejada",fmt(pedido.dataDesejada || pedido.data_desejada),C.gold],["Deadline início",fmt(pedido.deadline),dUntil(pedido.deadline||"9999-01-01")<14?C.red:C.muted]].map(([l,v,c])=>
        <div key={l} style={{background:C.bg,borderRadius:6,padding:"7px 10px",border:`1px solid ${C.bord}`}}><div style={{color:C.muted,fontSize:9,textTransform:"uppercase",fontWeight:700}}>{l}</div><div style={{color:c,fontWeight:700,fontSize:12,marginTop:2}}>{v}</div></div>)}
    </div>}
    {!fab&&fin.paymentDate&&<div style={{background:C.blue+"11",border:`1px solid ${C.blue}33`,borderRadius:7,padding:"7px 12px",marginTop:8,fontSize:12}}>
      ✈️ Chegada estimada: <strong style={{color:C.blue}}>{fmt(addD(fin.paymentDate,LEAD_P))}</strong><span style={{color:C.muted,marginLeft:8}}>({dUntil(addD(fin.paymentDate,LEAD_P)||today())}d)</span>
    </div>}
  </div>;
}

/* ─── FINANCIAL PANEL ─────────────────────────────────────────────── */
function FinPanel({pedido,onUpdate}){
  const tipoEntrega = pedido.tipoEntrega || pedido.tipo_entrega;
  const fab=tipoEntrega==="fabrica";
  const fin=pedido.fin||{};
  const total=prodTotal(pedido);
  const dv=total*0.3,bv=total*0.7;
  const paid=fab?(fin.downPaymentDate?dv+(fin.finalPaymentDate?bv:0):0):(fin.paymentDate?total:0);
  const due=total-paid;
  const mark=(f,d)=>onUpdate({...pedido,fin:{...fin,[f]:d||today()}});
  const unmark=f=>onUpdate({...pedido,fin:{...fin,[f]:null}});
  const Row=({label,valor,datePaid,field,color,sub})=><div style={{padding:"11px 14px",background:datePaid?color+"0d":C.bg,border:`1px solid ${datePaid?color+"33":C.bord}`,borderRadius:8,marginBottom:6}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
      <div style={{flex:1}}><div style={{color:datePaid?color:C.txt,fontWeight:700,fontSize:13}}>{label}</div>{sub&&<div style={{color:C.muted,fontSize:11,marginTop:1}}>{sub}</div>}{datePaid&&<div style={{color:C.muted,fontSize:11,marginTop:2}}>✓ Pago em {fmt(datePaid)}</div>}</div>
      <div style={{display:"flex",alignItems:"center",gap:10}}><span style={{color,fontWeight:800,fontSize:16}}>{fmtR(valor)}</span>{!datePaid?<button onClick={()=>mark(field)} style={{background:color+"22",border:`1px solid ${color}44`,borderRadius:6,color,padding:"5px 12px",fontSize:11,fontWeight:700,cursor:"pointer"}}>Marcar pago</button>:<button onClick={()=>unmark(field)} style={{background:"none",border:"none",color:C.dim,fontSize:11,cursor:"pointer"}}>desfazer</button>}</div>
    </div>
    {datePaid&&<div style={{marginTop:6,display:"flex",alignItems:"center",gap:8}}>
      <span style={{color:C.muted,fontSize:11}}>Data:</span>
      <input type="date" value={datePaid} onChange={e=>mark(field,e.target.value)} style={{background:C.bg,border:`1px solid ${C.bord}`,borderRadius:5,color:C.txt,padding:"3px 8px",fontSize:12,outline:"none"}}/>
    </div>}
  </div>;
  return <div>
    {pedido.responsavel&&<div style={{background:C.purple+"0d",border:`1px solid ${C.purple}22`,borderRadius:7,padding:"7px 12px",marginBottom:10,display:"flex",alignItems:"center",gap:8}}><span style={{color:C.muted,fontSize:12}}>Responsável:</span><AvatarChip name={pedido.responsavel} color={C.purple}/></div>}
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:7,marginBottom:10}}>
      {[["Total",total,C.goldB],["Pago",paid,C.green],["Saldo",due,due>0?C.red:C.green]].map(([l,v,c])=><div key={l} style={{background:C.surf,borderRadius:7,padding:"9px 11px",border:`1px solid ${c}22`}}><div style={{color:C.muted,fontSize:9,textTransform:"uppercase",fontWeight:700}}>{l}</div><div style={{color:c,fontSize:14,fontWeight:800,marginTop:2}}>{fmtR(v)}</div></div>)}
    </div>
    {fab?<><Row label="💳 Entrada — 30%" valor={dv} datePaid={fin.downPaymentDate} field="downPaymentDate" color={C.warn} sub="Pagar para iniciar produção"/><Row label="✅ Saldo — 70%" valor={bv} datePaid={fin.finalPaymentDate} field="finalPaymentDate" color={C.teal} sub={fin.downPaymentDate?`Na entrega · est. ${fmt(addD(fin.downPaymentDate,SM+SS+SA))}`:undefined}/></>:<Row label="💳 Pagamento total — 100%" valor={total} datePaid={fin.paymentDate} field="paymentDate" color={C.teal} sub="Pronta entrega · chega em 20 dias"/>}
  </div>;
}

/* ─── FILES PANEL ────────────────────────────────────────────────────────── */
function FilesPanel({pedido,onUpdate}){
  const arq=pedido.arquivos||{};const xlR=useRef();const imgR=useRef();
  const readF=f=>new Promise(res=>{const r=new FileReader();r.onload=e=>res({name:f.name,type:f.type,size:f.size,data:e.target.result});r.readAsDataURL(f);});
  const hXl=async e=>{const f=e.target.files[0];if(!f||f.size>3e6)return;onUpdate({...pedido,arquivos:{...arq,excel:await readF(f)}});e.target.value="";};
  const hImg=async e=>{const fs=Array.from(e.target.files);const pg=[...(arq.pagamentos||[])];for(const f of fs){if(f.size>2e6)continue;pg.push({...await readF(f),id:gid(),addedAt:new Date().toLocaleDateString("pt-BR")});}onUpdate({...pedido,arquivos:{...arq,pagamentos:pg}});e.target.value="";};
  const rmI=id=>onUpdate({...pedido,arquivos:{...arq,pagamentos:(arq.pagamentos||[]).filter(p=>p.id!==id)}});
  return <div>
    <div style={{marginBottom:14}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}><label style={LS}>📊 Planilha do Pedido</label><button onClick={()=>xlR.current.click()} style={{background:C.green+"22",border:`1px solid ${C.green}44`,borderRadius:6,color:C.green,padding:"5px 12px",fontSize:11,fontWeight:700,cursor:"pointer"}}>{arq.excel?"🔄 Trocar":"⬆ Anexar"}</button></div>
      <input ref={xlR} type="file" accept=".xlsx,.xls,.csv" style={{display:"none"}} onChange={hXl}/>
      {arq.excel?<div style={{background:C.green+"0d",border:`1px solid ${C.green}33`,borderRadius:8,padding:"9px 13px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:20}}>📊</span><div><div style={{color:C.txt,fontWeight:700,fontSize:12}}>{arq.excel.name}</div><div style={{color:C.muted,fontSize:10}}>{(arq.excel.size/1024).toFixed(1)} KB</div></div></div>
        <div style={{display:"flex",gap:6}}><button onClick={()=>{const a=document.createElement("a");a.href=arq.excel.data;a.download=arq.excel.name;a.click();}} style={{background:C.green+"22",border:`1px solid ${C.green}44`,borderRadius:6,color:C.green,padding:"4px 10px",fontSize:11,cursor:"pointer"}}>⬇</button><button onClick={()=>onUpdate({...pedido,arquivos:{...arq,excel:null}})} style={{background:"none",border:"none",color:C.dim,cursor:"pointer"}}>🗑</button></div>
      </div>:<div onClick={()=>xlR.current.click()} style={{border:`2px dashed ${C.bord}`,borderRadius:8,padding:14,textAlign:"center",color:C.dim,fontSize:12,cursor:"pointer"}}>Clique para anexar Excel / CSV</div>}
    </div>
    <div>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}><label style={LS}>📷 Comprovantes</label><button onClick={()=>imgR.current.click()} style={{background:C.gold+"22",border:`1px solid ${C.gold}44`,borderRadius:6,color:C.gold,padding:"5px 12px",fontSize:11,fontWeight:700,cursor:"pointer"}}>⬆ Foto</button></div>
      <input ref={imgR} type="file" accept="image/*" multiple style={{display:"none"}} onChange={hImg}/>
      {(arq.pagamentos||[]).length===0?<div onClick={()=>imgR.current.click()} style={{border:`2px dashed ${C.bord}`,borderRadius:8,padding:14,textAlign:"center",color:C.dim,fontSize:12,cursor:"pointer"}}>Adicionar comprovantes de pagamento</div>:<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(110px,1fr))",gap:7}}>
        {(arq.pagamentos||[]).map(img=><div key={img.id} style={{position:"relative",borderRadius:7,overflow:"hidden",border:`1px solid ${C.bord}`}}>
          <img src={img.data} alt="" style={{width:"100%",height:90,objectFit:"cover",display:"block"}}/>
          <div style={{padding:"2px 6px",fontSize:9,color:C.muted}}>{img.addedAt}</div>
          <button onClick={()=>rmI(img.id)} style={{position:"absolute",top:3,right:3,background:"#000a",border:"none",borderRadius:"50%",width:18,height:18,color:"#fff",cursor:"pointer",fontSize:10}}>✕</button>
        </div>)}
        <div onClick={()=>imgR.current.click()} style={{border:`2px dashed ${C.bord}`,borderRadius:7,height:90,display:"flex",alignItems:"center",justifyContent:"center",color:C.dim,fontSize:22,cursor:"pointer"}}>+</div>
      </div>}
    </div>
  </div>;
}

/* ─── ORDER CARD ─────────────────────────────────────────────────────────── */
function OrderCard({pedido,onUpdate,onDelete}){
  const[ex,setEx]=useState(false);
  const[tab,setTab]=useState("timeline");
  const fin=pedido.fin||{};
  const tipoEntrega = pedido.tipoEntrega || pedido.tipo_entrega;
  const fab=tipoEntrega==="fabrica";
  const total=prodTotal(pedido);
  const paid=fab?(fin.downPaymentDate?total*0.3+(fin.finalPaymentDate?total*0.7:0):0):(fin.paymentDate?total:0);
  const due=total-paid;
  const isEvt=pedido.tipo==="trimestral";
  const lead=fab?(isEvt?LEAD_F+EVT_BUF:LEAD_F):LEAD_P;
  const urg=pedido.deadline&&dUntil(pedido.deadline)<14&&pedido.status!=="received";
  const prods=pedido.produtos||[];

  function exportar(){
    let t=`PEDIDO: ${pedido.nome}\nFornecedor: ${pedido.fornecedor||"—"} | Responsável: ${pedido.responsavel||"—"}\nChegada: ${fmt(pedido.dataDesejada || pedido.data_desejada)} | Deadline início: ${fmt(pedido.deadline)}\nTOTAL: ${fmtR(total)}\n\nCÓDIGO\tPRODUTO\tCOR\tQTD\tUNIT\tTOTAL\n`;
    prods.forEach(p=>{t+=`${p.codigo||""}\t${p.nome||""}\t${p.cor||""}\t${p.qtd||1}\tR$${safe(p.valor).toFixed(2)}\tR$${(safe(p.qtd,1)*safe(p.valor)).toFixed(2)}\n`;});
    t+=`\nTOTAL: ${fmtR(total)}\n`;
    const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([t],{type:"text/plain;charset=utf-8"}));a.download=`pedido_${pedido.nome.replace(/\s+/g,"_")}.txt`;a.click();
  }

  const TABS=[{k:"timeline",l:"🕐 Timeline"},{k:"products",l:"📦 Produtos"},{k:"financial",l:"💰 Financeiro"},{k:"files",l:"📎 Arquivos"}];

  return <div style={{background:C.card,border:`1px solid ${urg?C.warn+"55":C.bord}`,borderRadius:12,overflow:"hidden",marginBottom:10}}>
    {/* Header */}
    <div style={{padding:"12px 16px",display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
      <button onClick={()=>setEx(e=>!e)} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:14,padding:"0 4px"}}>{ex?"▾":"▸"}</button>
      <div style={{flex:1,minWidth:0}}>
        <div style={{display:"flex",alignItems:"center",gap:7,flexWrap:"wrap",marginBottom:3}}>
          <span style={{color:C.txt,fontWeight:700,fontSize:14}}>{pedido.nome}</span>
          <TypeBadge type={pedido.tipo}/>
          {pedido.responsavel&&<AvatarChip name={pedido.responsavel} color={C.purple}/>}
        </div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
          {pedido.deadline&&pedido.status!=="received"&&<Chip label={dUntil(pedido.deadline)<0?"⚠️ Iniciar já!":("📅 "+dUntil(pedido.deadline)+"d")} color={dUntil(pedido.deadline)<7?C.red:dUntil(pedido.deadline)<14?C.warn:C.green}/>}
          {fab&&<Chip label={`⏱ ${lead}d`} color={C.purple}/>}
          <span style={{color:C.muted,fontSize:11}}>📅 {fmt(pedido.dataDesejada || pedido.data_desejada)}</span>
          {pedido.fornecedor&&<span style={{color:C.muted,fontSize:11}}>🏭 {pedido.fornecedor}</span>}
          <span style={{color:C.gold,fontSize:12,fontWeight:700}}>{fmtR(total)}</span>
          {due>0?<Chip label={fmtR(due)} color={C.red}/>:(total>0&&<Chip label="✅ Pago" color={C.green}/>)}
        </div>
      </div>
      <StatusBadge status={pedido.status} onChange={s=>onUpdate({...pedido,status:s})}/>
      <button onClick={exportar} style={{background:C.goldS,border:`1px solid ${C.gold}44`,borderRadius:6,color:C.gold,padding:"5px 9px",fontSize:11,cursor:"pointer",fontWeight:600}}>⬇</button>
      <button onClick={()=>onDelete(pedido.id)} style={{background:"none",border:"none",color:C.dim,cursor:"pointer",fontSize:12}}>🗑</button>
    </div>
    {/* Expanded */}
    {ex&&<div style={{borderTop:`1px solid ${C.bord}`}}>
      <div style={{display:"flex",borderBottom:`1px solid ${C.bord}`,padding:"0 16px",overflowX:"auto"}}>
        {TABS.map(t=><button key={t.k} onClick={()=>setTab(t.k)} style={{background:"none",border:"none",borderBottom:tab===t.k?`2px solid ${C.gold}`:"2px solid transparent",color:tab===t.k?C.gold:C.muted,padding:"10px 13px",fontSize:12,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap"}}>{t.l}</button>)}
      </div>
      <div style={{padding:"16px 18px"}}>
        {tab==="timeline"&&<Timeline pedido={pedido}/>}
        {tab==="products"&&(prods.length>0?
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead><tr>{["Código","Produto","Cor","Qtd","Unitário","Total"].map(h=><th key={h} style={{padding:"5px 8px",color:C.muted,textAlign:"left",fontSize:11}}>{h}</th>)}</tr></thead>
            <tbody>{prods.map((p,i)=><tr key={i} style={{borderTop:`1px solid ${C.bord}`}}>
              <td style={{padding:"6px 8px",color:C.dim,fontFamily:"monospace",fontSize:11}}>{p.codigo}</td>
              <td style={{padding:"6px 8px",color:C.txt}}>{p.nome}</td>
              <td style={{padding:"6px 8px",color:C.muted}}>{p.cor}</td>
              <td style={{padding:"6px 8px",color:C.txt,fontWeight:700}}>{p.qtd||1}</td>
              <td style={{padding:"6px 8px",color:C.muted}}>{fmtR(p.valor)}</td>
              <td style={{padding:"6px 8px",color:C.gold,fontWeight:700}}>{fmtR(safe(p.qtd,1)*safe(p.valor))}</td>
            </tr>)}</tbody>
          </table>
          :<p style={{color:C.dim,fontSize:12}}>Sem produtos cadastrados.</p>
        )}
        {tab==="financial"&&<FinPanel pedido={pedido} onUpdate={onUpdate}/>}
        {tab==="files"&&<FilesPanel pedido={pedido} onUpdate={onUpdate}/>}
      </div>
    </div>}
  </div>;
}

/* ─── NEW ORDER MODAL ────────────────────────────────────────────────────── */
function NewOrderModal({onClose,onSave,tipoProp,skus}){
  const[nome,setNome]=useState("");const[tipo,setTipo]=useState(tipoProp||"semanal");
  const[supl,setSupl]=useState("");const[resp,setResp]=useState("");
  const[te,setTe]=useState("pronto");const[dt,setDt]=useState("");
  const[col,setCol]=useState("");const[prods,setProds]=useState([]);
  const[search,setSearch]=useState("");const[notes,setNotes]=useState("");
  const[fin,setFin]=useState({});const[tabM,setTabM]=useState("products");
  const[modoInput,setModoInput]=useState("sku");   // "sku" | "total"
  const[valorManual,setValorManual]=useState("");
  const isEvt=tipo==="trimestral";
  const totalSKU=prods.reduce((a,p)=>a+safe(p.qtd,1)*safe(p.valor),0);
  const total=modoInput==="total"?safe(parseFloat(valorManual)):totalSKU;
  const dl=dt?dlDate(dt,te,isEvt):null;
  const filt=skus.filter(p=>(p.nome||"").toLowerCase().includes(search.toLowerCase())||(p.codigo||"").includes(search));
  const addP=p=>{if(!prods.find(x=>x.codigo===p.codigo&&x.cor===p.cor))setProds(ps=>[...ps,{...p,qtd:5}]);};
  const getProdutos=()=>modoInput==="total"?[{codigo:"PEDIDO",nome:"Pedido "+nome,cor:"-",cat:"Pedido",qtd:1,valor:safe(parseFloat(valorManual))}]:prods;
  const save=()=>{if(!nome||!dt)return;onSave({id:gid(),nome,tipo,fornecedor:supl,responsavel:resp,tipoEntrega:te,dataDesejada:dt,deadline:dl,colecao:col,notes,produtos:getProdutos(),status:"planned",fin,arquivos:{},criadoEm:new Date().toISOString()});onClose();};

  return <div style={{position:"fixed",inset:0,background:"#000d",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center"}}>
    <div style={{background:C.surf,border:`1px solid ${C.bord}`,borderRadius:16,width:"min(780px,96vw)",maxHeight:"94vh",overflowY:"auto",padding:28}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:20}}><h2 style={{color:C.gold,margin:0,fontFamily:"Georgia,serif",fontSize:20}}>✦ Novo Pedido</h2><button onClick={onClose} style={{background:"none",border:"none",color:C.muted,fontSize:20,cursor:"pointer"}}>✕</button></div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
        <div><label style={LS}>Nome *</label><input {...ip()} value={nome} onChange={e=>setNome(e.target.value)} placeholder="ex: Linda ICE CUT – Semana 23"/></div>
        <div><label style={LS}>Tipo</label><select {...ip()} value={tipo} onChange={e=>setTipo(e.target.value)}><option value="semanal">Weekly (⚡ alto giro)</option><option value="mensal">Monthly (📦 mix mensal)</option><option value="trimestral">Seasonal (🗓 coleção)</option></select></div>
        <div><label style={LS}>Fornecedor China</label><input {...ip()} value={supl} onChange={e=>setSupl(e.target.value)} placeholder="Nome / contato"/></div>
        <div><label style={LS}>Entrega</label><select {...ip()} value={te} onChange={e=>{setTe(e.target.value);setFin({});}}>
          <option value="pronto">Pronta Entrega (pagamento total · 20 dias)</option>
          <option value="fabrica">Fábrica (30% entrada · {LEAD_F} dias{isEvt?` + ${EVT_BUF}d buffer`:""})</option>
        </select></div>
        <div><label style={LS}>Chegada desejada *</label><input {...ip()} type="date" value={dt} onChange={e=>setDt(e.target.value)}/></div>
        {isEvt&&<div><label style={LS}>Coleção / Evento</label><select {...ip()} value={col} onChange={e=>setCol(e.target.value)}><option value="">Selecionar...</option>{EVENTOS.map(e=><option key={e.id} value={e.nome}>{e.icone} {e.nome}</option>)}</select></div>}
        <div><label style={LS}>Responsável financeiro</label><input {...ip()} value={resp} onChange={e=>setResp(e.target.value)} placeholder="Ana, Talita, Ana / Talita..."/></div>
      </div>
      {dl&&<div style={{background:C.goldS,border:`1px solid ${C.gold}33`,borderRadius:8,padding:"9px 14px",marginBottom:14,fontSize:12,display:"flex",gap:16,flexWrap:"wrap",alignItems:"center"}}>
        <span style={{color:C.gold Emmanuel}}>📅 <strong>Iniciar pedido até:</strong> {fmt(dl)} ({dUntil(dl)}d)</span>
        <span style={{color:C.muted}}>Lead time: {te==="fabrica"?(isEvt?LEAD_F+EVT_BUF:LEAD_F):LEAD_P}d</span>
        {te==="fabrica"&&total>0&&<span style={{color:C.warn}}>💳 Entrada: {fmtR(total*0.3)}</span>}
      </div>}

      {/* Tab bar com toggle de modo de input */}
      <div style={{display:"flex",borderBottom:`1px solid ${C.bord}`,marginBottom:14,alignItems:"center"}}>
        {[{k:"products",l:"📦 Produtos"},{k:"financial",l:"💰 Pagamentos"}].map(t=><button key={t.k} onClick={()=>setTabM(t.k)} style={{background:"none",border:"none",borderBottom:tabM===t.k?`2px solid ${C.gold}`:"2px solid transparent",color:tabM===t.k?C.gold:C.muted,padding:"9px 14px 7px",fontSize:13,fontWeight:600,cursor:"pointer"}}>{t.l}</button>)}
        {total>0&&<span style={{marginLeft:"auto",color:C.gold,fontWeight:800,fontSize:15,alignSelf:"center",paddingRight:4}}>{fmtR(total)}</span>}
      </div>

      {tabM==="products"&&<>
        {/* Toggle modo de entrada */}
        <div style={{display:"flex",gap:6,marginBottom:14,background:C.bg,borderRadius:8,padding:4,border:`1px solid ${C.bord}`}}>
          <button onClick={()=>setModoInput("sku")} style={{flex:1,padding:"8px",borderRadius:6,border:"none",background:modoInput==="sku"?C.gold:"transparent",color:modoInput==="sku"?"#000":C.muted,fontWeight:700,fontSize:12,cursor:"pointer",transition:"all 0.15s"}}>
            🔍 Buscar por SKU
          </button>
          <button onClick={()=>setModoInput("total")} style={{flex:1,padding:"8px",borderRadius:6,border:"none",background:modoInput==="total"?C.gold:"transparent",color:modoInput==="total"?"#000":C.muted,fontWeight:700,fontSize:12,cursor:"pointer",transition:"all 0.15s"}}>
            💰 Digitar Valor Total
          </button>
        </div>

        {modoInput==="total"&&<div style={{marginBottom:14}}>
          <label style={LS}>Valor Total do Pedido (R$) *</label>
          <div style={{display:"flex",gap:10,alignItems:"center"}}>
            <input {...ip({flex:1,fontSize:22,fontWeight:700,textAlign:"right",color:C.goldB})} type="number" step="0.01" min="0" value={valorManual} onChange={e=>setValorManual(e.target.value)} placeholder="0,00"/>
          </div>
          {total>0&&te==="fabrica"&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:10}}>
            {[["Entrada (30%)",total*0.3,C.warn],["Saldo (70%)",total*0.7,C.teal]].map(([l,v,c])=><div key={l} style={{background:c+"0d",border:`1px solid ${c}33`,borderRadius:8,padding:"10px 14px",textAlign:"center"}}><div style={{color:C.muted,fontSize:11}}>{l}</div><div style={{color:c,fontWeight:800,fontSize:16,fontFamily:"Georgia,serif"}}>{fmtR(v)}</div></div>)}
          </div>}
          {total>0&&te==="pronto"&&<div style={{background:C.teal+"0d",border:`1px solid ${C.teal}33`,borderRadius:8,padding:"10px 14px",marginTop:10,textAlign:"center"}}><div style={{color:C.muted,fontSize:11}}>Pagamento total</div><div style={{color:C.teal,fontWeight:800,fontSize:18,fontFamily:"Georgia,serif"}}>{fmtR(total)}</div></div>}
        </div>}

        {modoInput==="sku"&&<>
          <div style={{marginBottom:12}}><label style={LS}>Buscar SKU ({skus.length} cadastrados)</label><input {...ip()} value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar por nome, código, cor..."/>{search&&<div style={{background:C.card,border:`1px solid ${C.bord}`,borderRadius:8,marginTop:4,maxHeight:180,overflowY:"auto"}}>
            {filt.length===0?<div style={{padding:12,color:C.dim,fontSize:12}}>Nenhum SKU encontrado</div>:filt.map(p=><button key={p.codigo+(p.cor||"")} onClick={()=>{addP(p);setSearch("");}} style={{display:"flex",justifyContent:"space-between",width:"100%",padding:"8px 12px",background:"transparent",border:"none",color:C.txt,fontSize:12,cursor:"pointer",textAlign:"left"}} onMouseEnter={e=>e.currentTarget.style.background=C.bord} onMouseLeave={e=>e.currentTarget.style.background="transparent"}><span><span style={{color:C.dim,marginRight:6,fontFamily:"monospace",fontSize:10}}>{p.codigo}</span>{p.nome} <span style={{color:C.muted}}>· {p.cor}</span></span><span style={{color:C.gold}}>R$ {safe(p.valor).toFixed(2)}</span></button>)}
          </div>}</div>
          {prods.length>0&&<div style={{background:C.card,borderRadius:8,overflow:"hidden",border:`1px solid ${C.bord}`,marginBottom:8}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}><thead><tr style={{background:C.bg}}>{["Código","Produto","Cor","Qtd","Unit","Total",""].map(h=><th key={h} style={{padding:"7px 10px",color:C.muted,textAlign:"left",fontSize:11}}>{h}</th>)}</tr></thead>
            <tbody>{prods.map((p,i)=><tr key={i} style={{borderTop:`1px solid ${C.bord}`}}>
              <td style={{padding:"6px 10px",color:C.dim,fontSize:10,fontFamily:"monospace"}}>{p.codigo}</td>
              <td style={{padding:"6px 10px",color:C.txt,maxWidth:160}}>{p.nome}</td>
              <td style={{padding:"6px 10px",color:C.muted}}>{p.cor}</td>
              <td style={{padding:"6px 10px"}}><input type="number" min={1} value={p.qtd} onChange={e=>{const v=parseInt(e.target.value)||1;setProds(ps=>ps.map((x,j)=>j===i?{...x,qtd:v}:x));}} style={{width:48,background:C.bg,border:`1px solid ${C.bord}`,borderRadius:4,color:C.txt,padding:"2px 5px",fontSize:12}}/></td>
              <td style={{padding:"6px 10px",color:C.muted}}>R$ {safe(p.valor).toFixed(2)}</td>
              <td style={{padding:"6px 10px",color:C.gold,fontWeight:700}}>R$ {(safe(p.qtd,1)*safe(p.valor)).toFixed(2)}</td>
              <td><button onClick={()=>setProds(ps=>ps.filter((_,j)=>j!==i))} style={{background:"none",border:"none",color:C.red,cursor:"pointer"}}>✕</button></td>
            </tr>)}
            <tr style={{borderTop:`2px solid ${C.bord}`,background:C.bg}}><td colSpan={5} style={{padding:"8px 10px",color:C.muted,fontWeight:700,fontSize:12}}>TOTAL</td><td colSpan={2} style={{padding:"8px 10px",color:C.goldB,fontWeight:700,fontSize:14}}>{fmtR(totalSKU)}</td></tr>
            </tbody></table>
          </div>}
        </>}
      </>}
      {tabM==="financial"&&<div>
        {total===0?<div style={{textAlign:"center",padding:20,color:C.dim,fontSize:12}}>Adicione produtos primeiro para ver o resumo financeiro</div>:<div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:12}}>
            {[["Total",total,C.goldB],["Pago",te==="fabrica"?(fin.downPaymentDate?total*0.3+(fin.finalPaymentDate?total*0.7:0):0):(fin.paymentDate?total:0),C.green],["Saldo",te==="fabrica"?(fin.downPaymentDate?total*0.7-(fin.finalPaymentDate?total*0.7:0):total):(fin.paymentDate?0:total),C.red]].map(([l,v,c])=><div key={l} style={{background:C.bg,borderRadius:8,padding:"10px 12px",border:`1px solid ${c}22`}}><div style={{color:C.muted,fontSize:9,textTransform:"uppercase",fontWeight:700}}>{l}</div><div style={{color:c,fontSize:14,fontWeight:800,marginTop:2}}>{fmtR(v)}</div></div>)}
          </div>
          {te==="fabrica"?<>
            {[{l:"💳 Entrada 30%",f:"downPaymentDate",v:total*0.3,c:C.warn},{l:"✅ Saldo 70%",f:"finalPaymentDate",v:total*0.7,c:C.teal}].map(({l,f,v,c})=><div key={f} style={{padding:"10px 14px",background:fin[f]?c+"0d":C.bg,border:`1px solid ${fin[f]?c+"33":C.bord}`,borderRadius:8,marginBottom:6,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{color:fin[f]?c:C.txt,fontWeight:700,fontSize:13}}>{l}</span>
              <div style={{display:"flex",alignItems:"center",gap:10}}><span style={{color:c,fontWeight:800,fontSize:14}}>{fmtR(v)}</span><button onClick={()=>setFin(f2=>({...f2,[f]:f2[f]?null:today()}))} style={{background:fin[f]?C.green+"22":c+"22",border:`1px solid ${fin[f]?C.green+"44":c+"44"}`,borderRadius:6,color:fin[f]?C.green:c,padding:"5px 12px",fontSize:11,fontWeight:700,cursor:"pointer"}}>{fin[f]?"✓ Pago":"Marcar pago"}</button></div>
            </div>)}
          </>:<div style={{padding:"10px 14px",background:fin.paymentDate?C.teal+"0d":C.bg,border:`1px solid ${fin.paymentDate?C.teal+"33":C.bord}`,borderRadius:8,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{color:fin.paymentDate?C.teal:C.txt,fontWeight:700,fontSize:13}}>💳 Pagamento 100%</span>
            <div style={{display:"flex",alignItems:"center",gap:10}}><span style={{color:C.teal,fontWeight:800,fontSize:14}}>{fmtR(total)}</span><button onClick={()=>setFin(f=>({...f,paymentDate:f.paymentDate?null:today()}))} style={{background:fin.paymentDate?C.green+"22":C.teal+"22",border:`1px solid ${fin.paymentDate?C.green+"44":C.teal+"44"}`,borderRadius:6,color:fin.paymentDate?C.green:C.teal,padding:"5px 12px",fontSize:11,fontWeight:700,cursor:"pointer"}}>{fin.paymentDate?"✓ Pago":"Marcar pago"}</button></div>
          </div>}
        </div>}
      </div>}
      <div style={{marginTop:14,marginBottom:18}}><label style={LS}>Notas</label><textarea {...ip({height:52,resize:"vertical"})} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Especificações, referências..."/></div>
      <div style={{display:"flex",justifyContent:"flex-end",gap:10}}>
        <button onClick={onClose} style={{background:C.card,border:`1px solid ${C.bord}`,borderRadius:8,color:C.muted,padding:"9px 18px",cursor:"pointer"}}>Cancelar</button>
        <button onClick={save} disabled={!nome||!dt} style={{background:nome&&dt?C.gold:"#333",border:"none",borderRadius:8,color:nome&&dt?"#000":C.dim,fontWeight:700,padding:"9px 22px",cursor:nome&&dt?"pointer":"not-allowed"}}>Salvar Pedido</button>
      </div>
    </div>
  </div>;
}

/* ─── SKU TAB ────────────────────────────────────────────────────────────── */
function SkuTab({skus,onAdd,onDelete}){
  const[modal,setModal]=useState(false);const[search,setSearch]=useState("");const[cat,setCat]=useState("All");
  const f=skus.filter(s=>(cat==="All"||s.cat===cat)&&((s.nome||"").toLowerCase().includes(search.toLowerCase())||(s.codigo||"").includes(search)));
  const[form,setForm]=useState({codigo:"",nome:"",cor:"",cat:"Colar",vendas:"",valor:""});
  return <div>
    <div style={{display:"flex",justifyContent:"space-between",marginBottom:14,flexWrap:"wrap",gap:10}}>
      <div><h2 style={{color:C.txt,margin:0,fontFamily:"Georgia,serif",fontSize:20}}>💎 Catálogo SKUs</h2><p style={{color:C.muted,fontSize:12,margin:"4px 0 0"}}>{skus.length} produtos cadastrados · dados: Curva ABC 19/05/2026</p></div>
      <button onClick={()=>setModal(true)} style={{background:C.gold,border:"none",borderRadius:8,color:"#000",fontWeight:700,padding:"9px 18px",cursor:"pointer"}}>+ Novo SKU</button>
    </div>
    <div style={{display:"flex",gap:10,marginBottom:12,flexWrap:"wrap"}}>
      <input {...ip({flex:1,minWidth:180})} value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar por nome ou código..."/>
      <select {...ip({width:"auto"})} value={cat} onChange={e=>setCat(e.target.value)}><option value="All">Todas as categorias</option>{CATS.map(c=><option key={c}>{c}</option>)}</select>
    </div>
    <div style={{background:C.card,border:`1px solid ${C.bord}`,borderRadius:12,overflow:"hidden"}}>
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
        <thead><tr style={{background:C.bg}}>{["Código","Produto","Cor","Cat","Vendas/30d","Preço","Sugestão/sem",""].map(h=><th key={h} style={{padding:"9px 12px",color:C.muted,textAlign:"left",fontSize:11,fontWeight:700}}>{h}</th>)}</tr></thead>
        <tbody>{f.length===0?<tr><td colSpan={8} style={{padding:24,textAlign:"center",color:C.dim}}>Nenhum SKU encontrado</td></tr>:f.map(p=><tr key={p.codigo+(p.cor||"")} style={{borderTop:`1px solid ${C.bord}`}}>
          <td style={{padding:"8px 12px",color:C.dim,fontFamily:"monospace",fontSize:11}}>{p.codigo}</td>
          <td style={{padding:"8px 12px",color:C.txt}}>{p.nome}</td>
          <td style={{padding:"8px 12px",color:C.muted}}>{p.cor}</td>
          <td style={{padding:"8px 12px"}}><span style={{background:C.bord,borderRadius:4,padding:"2px 6px",fontSize:10,color:C.muted}}>{p.cat}</span></td>
          <td style={{padding:"8px 12px"}}><div style={{display:"flex",alignItems:"center",gap:6}}><div style={{height:5,width:Math.max(4,Math.round(safe(p.vendas)/61*70)),background:C.green+"88",borderRadius:3}}/><span style={{color:C.green,fontWeight:700}}>{p.vendas||0}</span></div></td>
          <td style={{padding:"8px 12px",color:C.gold}}>R$ {safe(p.valor).toFixed(2)}</td>
          <td style={{padding:"8px 12px",color:C.txt,fontWeight:700}}>{p.vendas?`${Math.ceil(p.vendas/4)} un`:"—"}</td>
          <td><button onClick={()=>onDelete(p.codigo,p.cor)} style={{background:"none",border:"none",color:C.dim,cursor:"pointer"}}>🗑</button></td>
        </tr>)}</tbody>
      </table>
    </div>
    {modal&&<div style={{position:"fixed",inset:0,background:"#000c",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{background:C.surf,border:`1px solid ${C.bord}`,borderRadius:16,width:"min(500px,94vw)",padding:28}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:20}}><h3 style={{color:C.gold,margin:0}}>+ Novo SKU</h3><button onClick={()=>setModal(false)} style={{background:"none",border:"none",color:C.muted,fontSize:18,cursor:"pointer"}}>✕</button></div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          {[["Código *","codigo","text",""],["Cor","cor","text",""],["Vendas","vendas","number",""],["Preço (R$)","valor","number",""]].map(([l,k,t,p])=><div key={k}><label style={LS}>{l}</label><input {...ip()} type={t} value={form[k]} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} placeholder={p}/></div>)}
          <div style={{gridColumn:"span 2"}}><label style={LS}>Nome *</label><input {...ip()} value={form.nome} onChange={e=>setForm(f=>({...f,nome:e.target.value}))} placeholder="ex: Colar Ródio Riviera 3 Pontas"/></div>
          <div><label style={LS}>Categoria</label><select {...ip()} value={form.cat} onChange={e=>setForm(f=>({...f,cat:e.target.value}))}>{CATS.map(c=><option key={c}>{c}</option>)}</select></div>
        </div>
        <div style={{display:"flex",justifyContent:"flex-end",gap:10,marginTop:20}}>
          <button onClick={()=>setModal(false)} style={{background:C.card,border:`1px solid ${C.bord}`,borderRadius:8,color:C.muted,padding:"9px 18px",cursor:"pointer"}}>Cancelar</button>
          <button onClick={()=>{if(!form.codigo||!form.nome)return;onAdd({...form,vendas:parseInt(form.vendas)||0,valor:parseFloat(form.valor)||0});setModal(false);setForm({codigo:"",nome:"",cor:"",cat:"Colar",vendas:"",valor:""}); }} style={{background:C.gold,border:"none",borderRadius:8,color:"#000",fontWeight:700,padding:"9px 22px",cursor:"pointer"}}>Salvar SKU</button>
        </div>
      </div>
    </div>}
  </div>;
}

/* ─── FINANCIAL OVERVIEW ─────────────────────────────────────────────────── */
function FinancialOverview({pedidos,onUpdatePed}){
  const total=pedidos.reduce((a,p)=>a+prodTotal(p),0);
  const due=pedidos.reduce((a,p)=>a+calcDue(p),0);
  const paid=total-due;
  // by responsible
  const byR={};
  pedidos.forEach(p=>{
    const k=p.responsavel||"Unassigned";
    if(!byR[k])byR[k]={name:k,n:0,total:0,paid:0,due:0};
    const t=prodTotal(p),d=calcDue(p);
    byR[k].n++;byR[k].total+=t;byR[k].paid+=t-d;byR[k].due+=d;
  });
  // upcoming payments
  const prox=pedidos.filter(p=>p.status!=="received"&&calcDue(p)>0).map(p=>{
    const t=prodTotal(p);const f=p.fin||{};const tipoEntrega = p.tipoEntrega || p.tipo_entrega; const fab=tipoEntrega==="fabrica";
    const dl=p.deadline||today();
    if(!fab&&!f.paymentDate)return{n:p.nome,r:p.responsavel,l:"Pagamento 100%",v:t,dt:dl,c:C.teal};
    if(fab&&!f.downPaymentDate)return{n:p.nome,r:p.responsavel,l:"Entrada 30%",v:t*0.3,dt:dl,c:C.warn};
    if(fab&&f.downPaymentDate&&!f.finalPaymentDate){const d=addD(f.downPaymentDate,SM+SS+SA)||dl;return{n:p.nome,r:p.responsavel,l:"Saldo 70%",v:t*0.7,dt:d,c:C.teal};}
    return null;
  }).filter(Boolean).sort((a,b)=>new Date(a.dt||"2099-01-01")-new Date(b.dt||"2099-01-01"));

  // Marcar pedido como totalmente pago
  const marcarPago=p=>{
    const tipoEntrega = p.tipoEntrega || p.tipo_entrega;
    const fab=tipoEntrega==="fabrica";
    const novaFin=fab
      ?{...p.fin,downPaymentDate:p.fin?.downPaymentDate||today(),finalPaymentDate:today()}
      :{...p.fin,paymentDate:today()};
    onUpdatePed({...p,status:"received",fin:novaFin});
  };

  return <div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(155px,1fr))",gap:12,marginBottom:24}}>
      {[{l:"Total Investido",v:fmtR(total),c:C.gold,i:"💰"},{l:"Valor Pago",v:fmtR(paid),c:C.green,i:"✅"},{l:"Saldo Devedor",v:fmtR(due),c:due>0?C.red:C.green,i:"⏳"},{l:"Pedidos Ativos",v:pedidos.filter(p=>p.status!=="received").length,c:C.blue,i:"📋"}].map(x=><div key={x.l} style={{background:C.card,border:`1px solid ${x.c}33`,borderRadius:12,padding:18}}><div style={{fontSize:20,marginBottom:5}}>{x.i}</div><div style={{fontSize:22,fontWeight:800,color:x.c,fontFamily:"Georgia,serif"}}>{x.v}</div><div style={{fontSize:11,color:C.muted,marginTop:2}}>{x.l}</div></div>)}
    </div>
    {Object.keys(byR).length>0&&<>
      <h3 style={{color:C.muted,fontSize:11,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:12}}>👤 Por Responsável</h3>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(210px,1fr))",gap:10,marginBottom:24}}>
        {Object.values(byR).map(r=><div key={r.name} style={{background:C.card,border:`1px solid ${C.purple}33`,borderRadius:12,padding:"14px 16px"}}>
          <div style={{marginBottom:9}}><AvatarChip name={r.name==="Unassigned"?"Não atribuído":r.name} color={r.name==="Unassigned"?C.muted:C.purple}/></div>
          {[["Pedidos",r.n,C.txt],["Total",fmtR(r.total),C.gold],["Pago",fmtR(r.paid),C.green],["Saldo",fmtR(r.due),r.due>0?C.red:C.green]].map(([k,v,c])=><div key={k} style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:2}}><span style={{color:C.muted}}>{k}</span><span style={{color:c,fontWeight:700}}>{v}</span></div>)}
          <div style={{marginTop:8,height:4,background:C.bord,borderRadius:2}}><div style={{height:"100%",width:`${r.total>0?Math.min(100,Math.round(r.paid/r.total*100)):0}%`,background:C.green,borderRadius:2}}/></div>
          <div style={{fontSize:10,color:C.muted,marginTop:3}}>{r.total>0?Math.round(r.paid/r.total*100):0}% pago</div>
        </div>)}
      </div>
    </>}
    <h3 style={{color:C.muted,fontSize:11,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:12}}>📅 Próximos Pagamentos</h3>
    {prox.length===0?<div style={{textAlign:"center",padding:28,color:C.dim,fontSize:13}}>Nenhum pagamento pendente 🎉</div>:<div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:24}}>
      {prox.map((pg,i)=>{const d=dUntil(pg.dt);const col=d<0?C.red:d<7?C.red:d<14?C.warn:C.muted;return <div key={i} style={{background:C.card,border:`1px solid ${col}33`,borderRadius:10,padding:"12px 16px",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
        <div><div style={{color:C.txt,fontWeight:700,fontSize:13}}>{pg.n}</div><div style={{display:"flex",gap:8,marginTop:3,alignItems:"center",flexWrap:"wrap"}}><span style={{color:C.muted,fontSize:11}}>{pg.l}</span>{pg.r&&<AvatarChip name={pg.r} color={C.purple}/>}</div></div>
        <div style={{display:"flex",gap:12,alignItems:"center",flexWrap:"wrap WWII"}}><Chip label={d<0?`Atrasado ${Math.abs(d)}d`:d===0?"Hoje!":d===1?"Amanhã":`em ${d}d`} color={col}/><span style={{color:pg.c,fontWeight:800,fontSize:16,fontFamily:"Georgia,serif"}}>{fmtR(pg.v)}</span></div>
      </div>;})}
    </div>}
    <h3 style={{color:C.muted,fontSize:11,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:12}}>📊 Todos os Pedidos — Marcar como Pago</h3>
    <div style={{background:C.card,border:`1px solid ${C.bord}`,borderRadius:12,overflow:"hidden"}}>
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
        <thead><tr style={{background:C.bg}}>{["Pedido","Tipo","Responsável","Total","Pago","Saldo","Status Pgto","Ação"].map(h=><th key={h} style={{padding:"9px 12px",color:C.muted,textAlign:"left",fontSize:11,fontWeight:700}}>{h}</th>)}</tr></thead>
        <tbody>{pedidos.length===0?<tr><td colSpan={8} style={{padding:20,textAlign:"center",color:C.dim}}>Sem pedidos</td></tr>:pedidos.map(p=>{
          const t=prodTotal(p),d=calcDue(p),pg=t-d;
          const tipoEntrega = p.tipoEntrega || p.tipo_entrega; const fab=tipoEntrega==="fabrica";const f=p.fin||{};
          const isPago=d===0;
          const statusLabel=isPago?"✅ Quitado":fab&&!f.downPaymentDate?"Aguard. entrada":fab&&!f.finalPaymentDate?"Aguard. saldo":"Aguard. pgto";
          const statusColor=isPago?C.green:fab&&!f.downPaymentDate?C.warn:fab&&!f.finalPaymentDate?C.teal:C.red;
          return <tr key={p.id} style={{borderTop:`1px solid ${C.bord}`,background:isPago?C.green+"05":"transparent"}}>
            <td style={{padding:"8px 12px",color:C.txt,fontWeight:600,maxWidth:150,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.nome}</td>
            <td style={{padding:"8px 12px"))}><TypeBadge type={p.tipo}/></td>
            <td style={{padding:"8px 12px"}}>{p.responsavel?<AvatarChip name={p.responsavel} color={C.purple}/>:<span style={{color:C.dim}}>—</span>}</td>
            <td style={{padding:"8px 12px",color:C.gold,fontWeight:700}}>{fmtR(t)}</td>
            <td style={{padding:"8px 12px",color:C.green,fontWeight:700}}>{fmtR(pg)}</td>
            <td style={{padding:"8px 12px",color:d>0?C.red:C.dim,fontWeight:700}}>{fmtR(d)}</td>
            <td style={{padding:"8px 12px"}}><Chip label={statusLabel} color={statusColor}/></td>
            <td style={{padding:"8px 12px"}}>
              {!isPago&&<button onClick={()=>marcarPago(p)} style={{background:C.green+"22",border:`1px solid ${C.green}44`,borderRadius:6,color:C.green,padding:"5px 10px",fontSize:11,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap"}}>✅ Marcar Pago</button>}
              {isPago&&<span style={{color:C.green,fontSize:11}}>✓ Quitado</span>}
            </td>
          </tr>;
        })}</tbody>
      </table>
    </div>
  </div>;
}

/* ─── EVENTS TAB ─────────────────────────────────────────────────────────── */
function EventsTab({custom,setCustom,notes,setNotes}){
  const[modal,setModal]=useState(false);const[edit,setEdit]=useState(null);const[fil,setFil]=useState("all");const[exp,setExp]=useState(null);
  const[newIt,setNewIt]=useState({});
  const all=[...EVENTOS.map(e=>({...e,tipo:"builtin"})),...custom].sort((a,b)=>new Date(a.data)-new Date(b.data));
  const shown=all.filter(e=>{if(fil==="upcoming")return dUntil(e.data)>=0;if(fil==="alta")return e.prior==="alta";return true;});
  const gNote=id=>notes[id]||{items:[],note:""};
  const sNote=(id,d)=>setNotes(n=>({...n,[id]:d}));
  const addIt=id=>{if(!(newIt[id]||"").trim())return;const n=gNote(id);sNote(id,{...n,items:[...(n.items||[]),newIt[id].trim()]});setNewIt(x=>({...x,[id]:""}));};
  const pc=p=>p==="alta"?C.red:p==="média"?C.warn:C.muted;

  return <div>
    <div style={{display:"flex",justifyContent:"space-between",marginBottom:18,flexWrap:"wrap",gap:10}}>
      <div><h2 style={{color:C.txt,margin:0,fontFamily:"Georgia,serif",fontSize:20}}>🗓 Calendário de Eventos</h2><p style={{color:C.muted,fontSize:12,margin:"4px 0 0"}}>{all.length} eventos · fábrica = {LEAD_F}d + {EVT_BUF}d buffer para comemorativas</p></div>
      <button onClick={()=>{setEdit(null);setModal(true);}} style={{background:C.gold,border:"none",borderRadius:8,color:"#000",fontWeight:700,padding:"9px 18px",cursor:"pointer"}}>+ Novo Evento</button>
    </div>
    <div style={{background:C.card,border:`1px solid ${C.purple}22`,borderRadius:10,padding:"11px 15px",marginBottom:14}}>
      <div style={{color:C.purple,fontSize:11,fontWeight:700,marginBottom:8}}>⏱ Como são calculados os prazos</div>
      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
        {[[`📝 Confecção`,`${SP}d`,C.blue],[`💳 Pagamento`,`${SPA}d`,C.warn],[`🏭 Fabricação`,`${SM}d`,C.purple],[`✈️ Envio`,`${SS}d`,C.gold],[`🏠 Ammi`,`${SA}d`,C.teal],[`🎯 Buffer evento`,`${EVT_BUF}d`,C.orange],[`Total fáb+evento`,`${LEAD_F+EVT_BUF}d`,C.red]].map(([l,v,c])=><div key={l} style={{display:"flex",alignItems:"center",gap:4,background:c+"15",border:`1px solid ${c}33`,borderRadius:6,padding:"4px 10px"}}><span style={{color:c,fontSize:11,fontWeight:700}}>{v}</span><span style={{color:C.muted,fontSize:10}}>{l}</span></div>)}
      </div>
    </div>
    <div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap"}}>{[["all","Todos"],["upcoming","Próximos"],["alta","🔥 Alta"]].map(([k,l])=><button key={k} onClick={()=>setFil(k)} style={{background:fil===k?C.gold+"22":C.card,border:`1px solid ${fil===k?C.gold:C.bord}`,borderRadius:20,color:fil===k?C.gold:C.muted,padding:"5px 14px",fontSize:12,fontWeight:600,cursor:"pointer"}}>{l}</button>)}</div>
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      {shown.length===0&&<div style={{textAlign:"center",padding:32,color:C.dim}}>Nenhum evento encontrado</div>}
      {shown.map(evt=>{
        const arrived=addD(evt.data,-EVT_BUF);
        const dfab=dlDate(evt.data,"fabrica",true);
        const dprt=dlDate(evt.data,"pronto");
        const dFab=dUntil(dfab),passou=dUntil(evt.data)<0;
        const isC=evt.tipo==="custom";const note=gNote(evt.id);const expanded=exp===evt.id;
        return <div key={evt.id} style={{background:C.card,border:`1px solid ${passou?C.dim+"33":dFab>=0&&dFab<30?C.warn+"44":evt.prior==="alta"?C.purple+"33":C.bord}`,borderRadius:12,overflow:"hidden",opacity:passou?0.55:1}}>
          <div style={{padding:"13px 17px",display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
            <button onClick={()=>setExp(expanded?null:evt.id)} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:14,padding:"0 4px"}}>{expanded?"▾":"▸"}</button>
            <span style={{fontSize:22}}>{evt.icone}</span>
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:3}}>
                <span style={{color:C.txt,fontWeight:700,fontSize:14}}>{evt.nome}</span>
                <Chip label={evt.prior==="alta"?"🔥 Alta":evt.prior==="média"?"⭐ Média":"💤 Baixa"} color={pc(evt.prior)}/>
                {evt.destaque&&<Chip label={evt.destaque} color={C.orange}/>}
                {isC&&<Chip label="custom" color={C.teal}/>}
              </div>
              <div style={{display:"flex",gap:10,flexWrap:"wrap",fontSize:11}}>
                <span style={{color:C.txt}}>🎯 {fmt(evt.data)}{passou?" (encerrado)":""}</span>
                {!passou&&<><span style={{color:C.teal}}>📦 Chegar até: <strong>{fmt(arrived)}</strong></span><span style={{color:dFab>=0&&dFab<30?C.warn:C.muted}}>🏭 Pedir fáb: <strong>{fmt(dfab)}</strong>{dFab>=0?` (${dFab}d)`:""}</span><span style={{color:C.muted}}>📦 Pedir pronto: <strong>{fmt(dprt)}</strong></span></>}
              </div>
            </div>
            {isC&&<div style={{display:"flex",gap:6}}><button onClick={()=>{setEdit(evt);setModal(true);}} style={{background:C.blue+"22",border:`1px solid ${C.blue}44`,borderRadius:6,color:C.blue,padding:"5px 9px",fontSize:11,cursor:"pointer"}}>✏️</button><button onClick={()=>setCustom(es=>es.filter(e=>e.id!==evt.id))} style={{background:"none",border:"none",color:C.dim,cursor:"pointer"}}>🗑</button></div>}
          </div>
          {expanded&&<div style={{borderTop:`1px solid ${C.bord}`,display:"grid",gridTemplateColumns:"1fr 1fr",gap:0}}>
            <div style={{padding:"14px 16px",borderRight:`1px solid ${C.bord}`}}>
              <div style={{color:C.muted,fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:10}}>📅 Planejamento</div>
              {[["🎯 Evento",fmt(evt.data),C.txt],["📦 Chegar na Ammi até",fmt(arrived),C.teal],[`🏭 Iniciar pedido fábrica`,fmt(dfab),dFab<0?C.dim:dFab<30?C.red:C.warn],[`📦 Iniciar pedido pronto`,fmt(dprt),C.blue]].map(([l,v,c])=><div key={l} style={{display:"flex",justifyContent:"space-between",padding:"6px 9px",background:C.bg,borderRadius:6,marginBottom:4,fontSize:11}}><span style={{color:C.muted}}>{l}</span><strong style={{color:c}}>{v}</strong></div>)}
              {evt.desc&&<div style={{background:C.surf,borderRadius:7,padding:"9px 11px",marginTop:8,color:C.txt,fontSize:12,lineHeight:1.6}}>{evt.desc}</div>}
            </div>
            <div style={{padding:"14px 16px"}}>
              <div style={{color:C.muted,fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:8}}>📋 Itens</div>
              {(evt.items||[]).map((it,i)=><div key={"b"+i} style={{display:"flex",alignItems:"center",gap:7,padding:"5px 9px",background:C.purple+"0d",borderRadius:5,marginBottom:3,fontSize:11}}><span style={{color:C.purple}}>▸</span><span style={{color:C.txt}}>{it}</span></div>)}
              {(note.items||[]).map((it,i)=><div key={"n"+i} style={{display:"flex",alignItems:"center",gap:7,padding:"5px 9px",background:C.teal+"0d",borderRadius:5,marginBottom:3,fontSize:11}}><span style={{color:C.teal}}>▸</span><span style={{flex:1,color:C.txt}}>{it}</span><button onClick={()=>sNote(evt.id,{...note,items:(note.items||[]).filter((_,j)=>j!==i)})} style={{background:"none",border:"none",color:C.dim,cursor:"pointer",fontSize:10}}>✕</button></div>)}
              <div style={{display:"flex",gap:6,marginTop:6,marginBottom:10}}>
                <input value={newIt[evt.id]||""} onChange={e=>setNewIt(x=>({...x,[evt.id]:e.target.value}))} onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();addIt(evt.id);}}} placeholder="Adicionar item..." style={{flex:1,background:C.bg,border:`1px solid ${C.bord}`,borderRadius:6,color:C.txt,padding:"6px 10px",fontSize:12,outline:"none"}}/>
                <button onClick={()=>addIt(evt.id)} style={{background:C.teal+"22",border:`1px solid ${C.teal}44`,borderRadius:6,color:C.teal,padding:"6px 12px",fontSize:12,fontWeight:700,cursor:"pointer"}}>+</button>
              </div>
              <div style={{color:C.muted,fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:5}}>💬 Notas</div>
              <textarea value={note.note||""} onChange={e=>sNote(evt.id,{...note,note:e.target.value})} placeholder="Observações, ideias, fornecedores..." style={{width:"100%",background:C.bg,border:`1px solid ${C.bord}`,borderRadius:6,color:C.txt,padding:"7px 10px",fontSize:12,outline:"none",resize:"vertical",height:68,boxSizing:"border-box"}}/>
            </div>
          </div>}
        </div>;
      })}
    </div>
    {modal&&<div style={{position:"fixed",inset:0,background:"#000d",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{background:C.surf,border:`1px solid ${C.bord}`,borderRadius:16,width:"min(560px,96vw)",maxHeight:"92vh",overflowY:"auto",padding:28}}>
        <EventoForm initial={edit} onClose={()=>{setModal(false);setEdit(null);}} onSave={evt=>{if(edit)setCustom(es=>es.map(e=>e.id===evt.id?evt:e));else setCustom(es=>[...es,evt]);}}/>
      </div>
    </div>}
  </div>;
}

function EventoForm({initial,onClose,onSave}){
  const[f,setF]=useState(initial||{nome:"",data:"",icone:"🎪",desc:"",prior:"média",destaque:""});
  const[items,setItems]=useState(initial?.items||[]);const[ni,setNi]=useState("");
  const s=(k,v)=>setF(p=>({...p,[k]:v}));
  const EMOJIS=["🎪","💍","✨","🛍","🎀","🎯","🌟","🎭","🏆","📣","💫","🎊","🎉","🔮","💼","🌸","🌺","🌿","🍂","❄️","☀️","🌙","🎵","🎨"];
  return <div>
    <div style={{display:"flex",justifyContent:"space-between",marginBottom:20}}><h2 style={{color:C.gold,margin:0,fontFamily:"Georgia,serif",fontSize:18}}>{initial?"✏️ Editar Evento":"✦ Novo Evento"}</h2><button onClick={onClose} style={{background:"none",border:"none",color:C.muted,fontSize:20,cursor:"pointer"}}>✕</button></div>
    <div style={{marginBottom:12}}><label style={LS}>Ícone</label><div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:8}}>{EMOJIS.map(e=><button key={e} onClick={()=>s("icone",e)} style={{width:34,height:34,background:f.icone===e?C.gold+"33":C.bg,border:`2px solid ${f.icone===e?C.gold:C.bord}`,borderRadius:6,fontSize:17,cursor:"pointer"}}>{e}</button>)}</div></div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
      <div style={{gridColumn:"span 2"}}><label style={LS}>Nome *</label><input {...ip()} value={f.nome} onChange={e=>s("nome",e.target.value)} placeholder="ex: Lançamento Coleção Outono"/></div>
      <div><label style={LS}>Data *</label><input {...ip()} type="date" value={f.data} onChange={e=>s("data",e.target.value)}/></div>
      <div><label style={LS}>Prioridade</label><div style={{display:"flex",gap:5}}>{[["alta","🔥 Alta",C.red],["média","⭐ Média",C.warn],["baixa","💤 Baixa",C.muted]].map(([v,l,c])=><button key={v} onClick={()=>s("prior",v)} style={{flex:1,padding:"8px 4px",background:f.prior===v?c+"33":C.bg,border:`1px solid ${f.prior===v?c:C.bord}`,borderRadius:6,color:f.prior===v?c:C.muted,fontSize:11,fontWeight:700,cursor:"pointer"}}>{l}</button>)}</div></div>
      <div style={{gridColumn:"span 2"}}><label style={LS}>Rótulo</label><input {...ip()} value={f.destaque||""} onChange={e=>s("destaque",e.target.value)} placeholder="Feira de Negócios, Evento de Moda..."/></div>
      <div style={{gridColumn:"span 2"}}><label style={LS}>Descrição</label><textarea {...ip({height:60,resize:"vertical"})} value={f.desc} onChange={e=>s("desc",e.target.value)} placeholder="Estratégia, peças focadas..."/></div>
    </div>
    {f.nome&&f.data&&<div style={{background:C.card,border:`1px solid ${C.gold}33`,borderRadius:9,padding:"11px 14px",marginBottom:14,fontSize:11}}>
      <div style={{color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:7}}>Preview de prazos</div>
      {[["🎯 Evento",fmt(f.data),C.txt],["📦 Chegar até",fmt(addD(f.data,-EVT_BUF)),C.teal],["🏭 Iniciar fábrica",fmt(dlDate(f.data,"fabrica",true)),C.warn],["📦 Iniciar pronto",fmt(dlDate(f.data,"pronto")),C.blue]].map(([l,v,c])=><div key={l} style={{display:"flex",justifyContent:"space-between",marginBottom:3}}><span style={{color:C.muted}}>{l}</span><strong style={{color:c}}>{v}</strong></div>)}
    </div>}
    <div style={{marginBottom:14}}><label style={LS}>📋 Itens</label><div style={{display:"flex",gap:7,marginBottom:7}}><input {...ip({flex:1})} value={ni} onChange={e=>setNi(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();if(ni.trim()){setItems(i=>[...i,ni.trim()]);setNi("");}}}} placeholder="Adicionar item..."/><button onClick={()=>{if(ni.trim()){setItems(i=>[...i,ni.trim()]);setNi("");}}} style={{background:C.teal+"22",border:`1px solid ${C.teal}44`,borderRadius:6,color:C.teal,padding:"8px 14px",fontSize:12,fontWeight:700,cursor:"pointer"}}>+</button></div>{items.map((it,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:7,background:C.bg,borderRadius:6,padding:"6px 11px",border:`1px solid ${C.bord}`,marginBottom:4}}><span style={{color:C.teal,fontSize:11}}>▸</span><span style={{flex:1,fontSize:12,color:C.txt}}>{it}</span><button onClick={()=>setItems(is=>is.filter((_,j)=>j!==i))} style={{background:"none",border:"none",color:C.dim,cursor:"pointer",fontSize:11}}>✕</button></div>)}</div>
    <div style={{display:"flex",justifyContent:"flex-end",gap:10}}><button onClick={onClose} style={{background:C.card,border:`1px solid ${C.bord}`,borderRadius:8,color:C.muted,padding:"9px 18px",cursor:"pointer"}}>Cancelar</button><button onClick={()=>{if(!f.nome||!f.data)return;onSave({...f,items,id:initial?.id||gid(),tipo:"custom"});onClose();}} disabled={!f.nome||!f.data} style={{background:f.nome&&f.data?C.gold:"#333",border:"none",borderRadius:8,color:f.nome&&f.data?"#000":C.dim,fontWeight:700,padding:"9px 22px",cursor:f.nome&&f.data?"pointer":"not-allowed"}}>{initial?"Salvar":"Criar Evento"}</button></div>
  </div>;
}

/* ─── DASHBOARD ──────────────────────────────────────────────────────────── */
function Dashboard({pedidos,skus}){
  const total=pedidos.reduce((a,p)=>a+prodTotal(p),0);
  const saldo=pedidos.reduce((a,p)=>a+calcDue(p),0);
  const urg=pedidos.filter(p=>p.deadline&&dUntil(p.deadline)<7&&p.status!=="received").length;
  const ativos=pedidos.filter(p=>["prep","payment","production","transit","ammi"].includes(p.status)).length;
  return <div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(145px,1fr))",gap:11,marginBottom:22}}>
      {[{l:"Pedidos",v:pedidos.length,c:C.gold,i:"📋"},{l:"Urgentes",v:urg,c:C.red,i:"🚨"},{l:"Em Andamento",v:ativos,c:C.blue,i:"✈️"},{l:"SKUs",v:skus.length,c:C.green,i:"💎"},{l:"Investimento",v:fmtR(total),c:C.goldB,i:"💰"},{l:"A Pagar",v:fmtR(saldo),c:saldo>0?C.red:C.green,i:"⏳"}].map(x=><div key={x.l} style={{background:C.card,border:`1px solid ${x.c}33`,borderRadius:12,padding:16}}><div style={{fontSize:18,marginBottom:4}}>{x.i}</div><div style={{fontSize:20,fontWeight:800,color:x.c,fontFamily:"Georgia,serif"}}>{x.v}</div><div style={{fontSize:11,color:C.muted,marginTop:2}}>{x.l}</div></div>)}
    </div>
    <h3 style={{color:C.muted,fontSize:11,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:10}}>⚡ Top Sellers (últimos 30d)</h3>
    <div style={{background:C.card,border:`1px solid ${C.bord}`,borderRadius:12,overflow:"hidden",marginBottom:22}}>
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
        <thead><tr style={{background:C.bg}}>{["Código","Produto","Cor","Cat","Vendas","Preço","Sugestão/sem"].map(h=><th key={h} style={{padding:"8px 12px",color:C.muted,textAlign:"left",fontSize:11}}>{h}</th>)}</tr></thead>
        <tbody>{[...skus].sort((a,b)=>safe(b.vendas)-safe(a.vendas)).slice(0,10).map(p=><tr key={p.codigo+(p.cor||"")} style={{borderTop:`1px solid ${C.bord}`}}>
          <td style={{padding:"7px 12px",color:C.dim,fontSize:11,fontFamily:"monospace"}}>{p.codigo}</td>
          <td style={{padding:"7px 12px",color:C.txt}}>{p.nome}</td>
          <td style={{padding:"7px 12px",color:C.muted}}>{p.cor}</td>
          <td style={{padding:"7px 12px"}}><span style={{background:C.bord,borderRadius:3,padding:"1px 6px",fontSize:10,color:C.muted}}>{p.cat}</span></td>
          <td style={{padding:"7px 12px"}}><div style={{display:"flex",alignItems:"center",gap:6}}><div style={{height:5,width:Math.max(4,Math.round(safe(p.vendas)/61*70)),background:C.green+"88",borderRadius:3}}/><span style={{color:C.green,fontWeight:700}}>{p.vendas||0}</span></div></td>
          <td style={{padding:"7px 12px",color:C.gold}}>R$ {safe(p.valor).toFixed(2)}</td>
          <td style={{padding:"7px 12px",color:C.txt,fontWeight:700}}>{p.vendas?`${Math.ceil(p.vendas/4)} un`:"—"}</td>
        </tr>)}</tbody>
      </table>
    </div>
    <h3 style={{color:C.muted,fontSize:11,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:10}}>🗓 Próximos Eventos — Prazos de Compra</h3>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(210px,1fr))",gap:9}}>
      {EVENTOS.map(c=>{const dfab=dlDate(c.data,"fabrica",true);const dprt=dlDate(c.data,"pronto");const dFab=dUntil(dfab),passou=dUntil(c.data)<0;const pc=c.prior==="alta"?C.red:C.warn;
        return <div key={c.id} style={{background:C.card,border:`1px solid ${passou?C.dim+"33":c.prior==="alta"?C.purple+"44":C.bord}`,borderRadius:10,padding:"12px 13px",opacity:passou?0.4:1}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}><span style={{fontSize:20}}>{c.icone}</span><div style={{display:"flex",gap:4}}>{c.destaque&&<Chip label={c.destaque} color={C.orange}/>}<Chip label={c.prior==="alta"?"🔥":"⭐"} color={pc}/></div></div>
          <div style={{color:C.txt,fontWeight:700,fontSize:13,marginBottom:3}}>{c.nome}</div>
          <div style={{color:C.txt,fontSize:10}}>🎯 {fmt(c.data)}</div>
          <div style={{color:C.teal,fontSize:10,marginTop:1}}>📦 Chegar até: {fmt(addD(c.data,-EVT_BUF))}</div>
          <div style={{color:dFab<0?C.dim:dFab<30?C.red:dFab<60?C.warn:C.muted,fontSize:10,marginTop:1}}>🏭 Pedir fábrica: {fmt(dfab)}{dFab>=0?` (${dFab}d)`:""}</div>
          <div style={{color:C.dim,fontSize:10,marginTop:1}}>📦 Pedir pronto: {fmt(dprt)}</div>
        </div>;
      })}
    </div>
  </div>;
}

/* ─── APP ROOT (Sincronizado com Supabase) ─────────────────────────────────── */
const TABS=["dashboard","semanal","mensal","trimestral","financeiro","eventos","skus","todos"];
const TLBL={dashboard:"Dashboard",semanal:"⚡ Weekly",mensal:"📦 Monthly",trimestral:"🗓 Seasonal",financeiro:"💰 Financial",eventos:"📅 Events",skus:"💎 SKUs",todos:"All Orders"};
const HINT={semanal:`⚡ Pedidos semanais: alto giro, pronta entrega (${LEAD_P}d).`,mensal:`📦 Pedidos mensais: mix e novidades. Fábrica = 30% entrada → ${SM}d fabricação → 70% entrega. Total ${LEAD_F}d.`,trimestral:`🗓 Coleções sazonais: buffer de ${EVT_BUF}d aplicado em pedidos de fábrica → ${LEAD_F+EVT_BUF}d total.`};

export default function App(){
  const[tab,setTab]=useState("dashboard");
  const[pedidos,setPeds]=useState([]);
  const[skus,setSkus]=useState([]);
  const[custom,setCustom]=useState([]);
  const[notes,setNotes]=useState({});
  const[modal,setModal]=useState(false);
  const[mTipo,setMTipo]=useState("mensal");
  const[ready,setReady]=useState(false);

  // Carrega tudo do Supabase ao iniciar
  useEffect(()=>{
    async function load(){
      try {
        const { data: pData } = await supabase.from("pedidos").select("*").order("criado_em", { ascending: false });
        const { data: sData } = await supabase.from("skus").select("*");
        
        setPeds(pData && pData.length > 0 ? pData : []);
        setSkus(sData && sData.length > 0 ? sData : SKUS_DEF);
      } catch (e) {
        setSkus(SKUS_DEF);
      }
      
      // Armazenamento local leve para notas customizadas secundárias
      try{const r=await window.localStorage.getItem("cevts_v3");if(r)setCustom(JSON.parse(r));}catch{}
      try{const r=await window.localStorage.getItem("enotes_v3");if(r)setNotes(JSON.parse(r));}catch{}
      setReady(true);
    }
    load();
  },[]);

  useEffect(()=>{if(!ready)return;window.localStorage.setItem("cevts_v3",JSON.stringify(custom));},[custom,ready]);
  useEffect(()=>{if(!ready)return;window.localStorage.setItem("enotes_v3",JSON.stringify(notes));},[notes,ready]);

  // Funções de Persistência no Banco
  const savePedido = async (novoPedido) => {
    const payload = {
      id: novoPedido.id,
      nome: novoPedido.nome,
      tipo: novoPedido.tipo,
      fornecedor: novoPedido.fornecedor,
      responsavel: novoPedido.responsavel,
      tipo_entrega: novoPedido.tipoEntrega,
      data_desejada: novoPedido.dataDesejada,
      deadline: novoPedido.deadline,
      colecao: novoPedido.colecao,
      notes: novoPedido.notes,
      status: novoPedido.status,
      fin: novoPedido.fin,
      arquivos: novoPedido.arquivos,
      produtos: novoPedido.produtos
    };
    await supabase.from("pedidos").insert([payload]);
    setPeds(ps => [novoPedido, ...ps]);
  };

  const upd = async (p) => {
    const payload = {
      nome: p.nome,
      tipo: p.tipo,
      fornecedor: p.fornecedor,
      responsavel: p.responsavel,
      tipo_entrega: p.tipoEntrega || p.tipo_entrega,
      data_desejada: p.dataDesejada || p.data_desejada,
      deadline: p.deadline,
      colecao: p.colecao,
      notes: p.notes,
      status: p.status,
      fin: p.fin,
      arquivos: p.arquivos,
      produtos: p.produtos
    };
    await supabase.from("pedidos").update(payload).eq("id", p.id);
    setPeds(ps=>ps.map(x=>x.id===p.id?p:x));
  };

  const deletePed = async (id) => {
    await supabase.from("pedidos").delete().eq("id", id);
    setPeds(ps=>ps.filter(p=>p.id!==id));
  };

  const filtrados=tab==="todos"?pedidos:pedidos.filter(p=>p.tipo===tab);

  return <div style={{fontFamily:"'DM Sans','Segoe UI',sans-serif",background:C.bg,minHeight:"100vh",color:C.txt}}>
    {/* Navbar */}
    <div style={{borderBottom:`1px solid ${C.bord}`,padding:"0 16px",display:"flex",alignItems:"center",background:C.surf,position:"sticky",top:0,zIndex:50,flexWrap:"wrap",gap:0}}>
      <div style={{padding:"12px 16px 12px 0",flexShrink:0}}>
        <span style={{fontFamily:"Georgia,serif",fontSize:16,color:C.gold,fontWeight:700,letterSpacing:"0.05em"}}>✦ SEMIJOIA</span>
        <span style={{color:C.dim,fontSize:9,marginLeft:6,letterSpacing:"0.1em",textTransform:"uppercase"}}>Order Planner</span>
      </div>
      <div style={{display:"flex",flex:1,overflowX:"auto"}}>{TABS.map(t=><button key={t} onClick={()=>setTab(t)} style={{background:tab===t?C.goldS:"transparent",border:"none",borderBottom:tab===t?`2px solid ${C.gold}`:"2px solid transparent",color:tab===t?C.gold:C.muted,padding:"14px 10px 12px",fontSize:12,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap"}}>{TLBL[t]}</button>)}</div>
      <div style={{display:"flex",gap:5,padding:"8px 0",flexShrink:0}}>
        {[["semanal",C.green,"Weekly"],["mensal",C.blue,"Monthly"],["trimestral",C.purple,"Seasonal"]].map(([t,c,l])=><button key={t} onClick={()=>{setMTipo(t);setModal(true);}} style={{background:c+"1a",border:`1px solid ${c}44`,borderRadius:7,color:c,padding:"5px 10px",fontSize:11,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap"}}>+{l}</button>)}
      </div>
    </div>
    {/* Content */}
    <div style={{maxWidth:1120,margin:"0 auto",padding:"20px 16px"}}>
      {tab==="dashboard"&&<Dashboard pedidos={pedidos} skus={skus}/>}
      {tab==="financeiro"&&<FinancialOverview pedidos={pedidos} onUpdatePed={upd}/>}
      {tab==="eventos"&&<EventsTab custom={custom} setCustom={setCustom} notes={notes} setNotes={setNotes}/>}
      {tab==="skus"&&<SkuTab skus={skus} onAdd={async (s)=>{ await supabase.from("skus").insert([s]); setSkus(p=>[s,...p]); }} onDelete={async (cod,cor)=>{ await supabase.from("skus").delete().eq("codigo",cod).eq("cor",cor); setSkus(p=>p.filter(x=>!(x.codigo===cod&&(x.cor||"")===(cor||"")))); }}/>}
      {["semanal","mensal","trimestral","todos"].includes(tab)&&<>
        {tab!=="todos"&&<div style={{background:tab==="semanal"?C.green+"0d":tab==="mensal"?C.blue+"0d":C.purple+"0d",border:`1px solid ${tab==="semanal"?C.green:tab==="mensal"?C.blue:C.purple}33`,borderRadius:9,padding:"8px 14px",marginBottom:12,fontSize:12,color:C.muted}}>{HINT[tab]}</div>}
        {filtrados.length===0?<div style={{textAlign:"center",padding:"50px 20px",color:C.dim}}><div style={{fontSize:32,marginBottom:10}}>📭</div><div style={{fontSize:14,marginBottom:14}}>Nenhum pedido aqui ainda.</div><button onClick={()=>{setMTipo(tab==="todos"?"mensal":tab);setModal(true);}} style={{background:C.goldS,border:`1px solid ${C.gold}44`,borderRadius:8,color:C.gold,padding:"10px 20px",fontSize:13,fontWeight:700,cursor:"pointer"}}>+ Criar primeiro pedido</button></div>:filtrados.map(p=><OrderCard key={p.id} pedido={p} onUpdate={upd} onDelete={deletePed}/>)}
      </>}
    </div>
    {modal&&<NewOrderModal tipoProp={mTipo} onClose={()=>setModal(false)} onSave={savePedido} skus={skus}/>}
    <style>{`*{box-sizing:border-box}::-webkit-scrollbar{width:5px;height:5px}::-webkit-scrollbar-thumb{background:${C.bord};border-radius:3px}select option{background:${C.card}}input[type=date]::-webkit-calendar-picker-indicator{filter:invert(0.5)}`}</style>
  </div>;
}