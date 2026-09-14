type Palette={sky:[string,string,string];mountains:[string,string,string];ground:string;branch:string;leaves:[string,string];light:string};

const PALETTES:Palette[]=[
 {sky:["#eadcf1","#f7dccd","#f5e8df"],mountains:["#b6a8c8","#9386ad","#706787"],ground:"#bba29f",branch:"#765a60",leaves:["#cf998e","#e8b6a2"],light:"#fff0bd"},
 {sky:["#cfd9ec","#e7d8e9","#f3dfd4"],mountains:["#a9b5ca","#8996b2","#687793"],ground:"#9b9ba8",branch:"#5f5b70",leaves:["#9f9bb9","#c8b1c8"],light:"#fff6d2"},
 {sky:["#d8e4da","#eadfc9","#f5dfcf"],mountains:["#a6b8aa","#7f9a8b","#617d72"],ground:"#9caa8d",branch:"#655e50",leaves:["#87a481","#b7bd86"],light:"#fff1ad"},
 {sky:["#f0d8c0","#eccdcc","#d8cfe6"],mountains:["#c4a6ae","#a4869d","#806e8c"],ground:"#ba9688",branch:"#795a58",leaves:["#d5957f","#e4b282"],light:"#ffe3a1"},
 {sky:["#d7e7eb","#d9ddef","#ead9e7"],mountains:["#a6b9c4","#879bab","#687d92"],ground:"#93a2a5",branch:"#575f68",leaves:["#7fa3a0","#a9bdb2"],light:"#fff7db"},
 {sky:["#f1d8df","#f4dfd1","#e3d8ea"],mountains:["#c5a8bc","#a98fa7","#83718e"],ground:"#b89b9e",branch:"#755b66",leaves:["#c993a9","#e4a9a3"],light:"#ffefc3"},
];

function hash(value:string){let n=2166136261;for(let i=0;i<value.length;i++){n^=value.charCodeAt(i);n=Math.imul(n,16777619)}return n>>>0}
function randomFrom(seed:number){let n=seed;return()=>{n+=0x6d2b79f5;let t=n;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}
function ridge(rand:()=>number,base:number,height:number){const points:[[number,number],...[number,number][]]=[[0,base]];for(let x=0;x<=1000;x+=125)points.push([x,base-rand()*height]);points.push([1000,1400],[0,1400]);return `M ${points.map(([x,y])=>`${x} ${y}`).join(" L ")} Z`}

export default function QuoteIllustration({quoteId}:{quoteId:string}){
 const seed=hash(quoteId);const rand=randomFrom(seed);const number=Number(quoteId.match(/\d+/)?.[0]||seed);const palette=PALETTES[number%PALETTES.length];const safe=quoteId.replace(/[^a-zA-Z0-9_-]/g,"");
 const sunX=170+rand()*660,sunY=120+rand()*230,sunR=52+rand()*28;const flip=number%2===0;
 const stars=Array.from({length:12},(_,i)=>({x:80+rand()*840,y:60+rand()*390,r:1.6+rand()*3,key:i}));
 const leaves=Array.from({length:13},(_,i)=>({x:95+i*43+rand()*24,y:1020-i*43+rand()*45,rx:17+rand()*12,ry:8+rand()*7,rotate:-48+rand()*96,color:palette.leaves[i%2],key:i}));
 const blossoms=Array.from({length:9},(_,i)=>({x:150+i*49+rand()*28,y:970-i*42+rand()*48,r:7+rand()*7,key:i}));
 const birds=Array.from({length:3},(_,i)=>({x:150+rand()*690,y:300+rand()*250,s:10+rand()*9,key:i}));
 return <svg className="quote-illustration" viewBox="0 0 1000 1400" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
  <defs>
   <linearGradient id={`sky-${safe}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={palette.sky[0]}/><stop offset=".52" stopColor={palette.sky[1]}/><stop offset="1" stopColor={palette.sky[2]}/></linearGradient>
   <radialGradient id={`glow-${safe}`}><stop offset="0" stopColor={palette.light} stopOpacity=".95"/><stop offset="1" stopColor={palette.light} stopOpacity="0"/></radialGradient>
   <filter id={`paper-${safe}`} x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency=".018" numOctaves="3" seed={seed%97}/><feColorMatrix values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 .12 0"/><feBlend in="SourceGraphic" mode="soft-light"/></filter>
  </defs>
  <g filter={`url(#paper-${safe})`}>
   <rect width="1000" height="1400" fill={`url(#sky-${safe})`}/>
   <circle cx={sunX} cy={sunY} r={sunR*2.8} fill={`url(#glow-${safe})`}/><circle cx={sunX} cy={sunY} r={sunR} fill={palette.light} opacity=".78"/>
   {stars.map(star=><circle key={star.key} cx={star.x} cy={star.y} r={star.r} fill="#fff8e7" opacity=".75"/>)}
   {birds.map(bird=><path key={bird.key} d={`M ${bird.x-bird.s} ${bird.y} Q ${bird.x-bird.s/2} ${bird.y-bird.s/2} ${bird.x} ${bird.y} Q ${bird.x+bird.s/2} ${bird.y-bird.s/2} ${bird.x+bird.s} ${bird.y}`} fill="none" stroke={palette.mountains[2]} strokeWidth="3" opacity=".34" strokeLinecap="round"/>)}
   <path d={ridge(rand,750,210)} fill={palette.mountains[0]} opacity=".52"/><path d={ridge(rand,880,235)} fill={palette.mountains[1]} opacity=".55"/><path d={ridge(rand,1010,190)} fill={palette.mountains[2]} opacity=".5"/>
   <path d="M0 1080 Q220 1010 430 1080 T1000 1050 V1400 H0Z" fill={palette.ground} opacity=".62"/>
   <g transform={flip?"translate(1000 0) scale(-1 1)":undefined}>
    <path d="M -40 1320 C 95 1180 120 1040 260 920 C 345 847 430 820 575 755" fill="none" stroke={palette.branch} strokeWidth="20" opacity=".66" strokeLinecap="round"/>
    <path d="M 130 1110 C 250 1070 335 1000 405 900 M 275 930 C 365 920 435 870 505 790" fill="none" stroke={palette.branch} strokeWidth="9" opacity=".54" strokeLinecap="round"/>
    {leaves.map(leaf=><ellipse key={leaf.key} cx={leaf.x} cy={leaf.y} rx={leaf.rx} ry={leaf.ry} fill={leaf.color} opacity=".72" transform={`rotate(${leaf.rotate} ${leaf.x} ${leaf.y})`}/>)}
    {blossoms.map(flower=><g key={flower.key} transform={`translate(${flower.x} ${flower.y})`} opacity=".72"><circle cx={-flower.r*.55} cy="0" r={flower.r} fill="#f4c9b6"/><circle cx={flower.r*.55} cy="0" r={flower.r} fill="#e9b6b6"/><circle cx="0" cy={-flower.r*.55} r={flower.r} fill="#f7d5c0"/><circle cx="0" cy={flower.r*.55} r={flower.r} fill="#dca7ae"/><circle r={flower.r*.42} fill={palette.light}/></g>)}
   </g>
  </g>
 </svg>
}
