"use client";

import {useEffect,useRef,useState} from "react";
import {Music2,Pause} from "lucide-react";

export default function BackgroundMusic(){
 const audio=useRef<HTMLAudioElement>(null);const [playing,setPlaying]=useState(false);
 useEffect(()=>{const el=audio.current;if(!el)return;el.volume=.2;const stopped=()=>setPlaying(false);el.addEventListener("pause",stopped);return()=>el.removeEventListener("pause",stopped)},[]);
 const toggle=async()=>{const el=audio.current;if(!el)return;if(!el.paused){el.pause();return}try{await el.play();setPlaying(true)}catch{setPlaying(false)}};
 return <><audio ref={audio} src="/quiet-reading.m4a" loop preload="metadata"/><button className="music-toggle" aria-pressed={playing} aria-label={playing?"暂停轻音乐":"播放轻音乐"} onClick={toggle}>{playing?<Pause size={15}/>:<Music2 size={15}/>}<span>{playing?"暂停音乐":"轻音乐"}</span></button></>;
}
