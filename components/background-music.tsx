"use client";

import {useEffect,useRef,useState} from "react";
import {Music2,Pause} from "lucide-react";

export default function BackgroundMusic(){
 const audio=useRef<HTMLAudioElement>(null);const clearUnlock=useRef<()=>void>(()=>{});const [playing,setPlaying]=useState(false);
 useEffect(()=>{const el=audio.current;if(!el)return;el.volume=.2;let armed=false;const started=()=>setPlaying(true);const stopped=()=>setPlaying(false);const cleanupUnlock=()=>{if(!armed)return;document.removeEventListener("pointerdown",unlock,true);document.removeEventListener("keydown",unlock,true);armed=false};const unlock=(event:Event)=>{const target=event.target;if(target instanceof Element&&target.closest(".music-toggle"))return;void el.play().then(cleanupUnlock).catch(()=>{})};const armUnlock=()=>{if(armed)return;armed=true;document.addEventListener("pointerdown",unlock,true);document.addEventListener("keydown",unlock,true)};clearUnlock.current=cleanupUnlock;el.addEventListener("play",started);el.addEventListener("pause",stopped);void el.play().catch(armUnlock);return()=>{cleanupUnlock();el.removeEventListener("play",started);el.removeEventListener("pause",stopped);clearUnlock.current=()=>{}}},[]);
 const toggle=async()=>{const el=audio.current;if(!el)return;if(!el.paused){el.pause();return}try{await el.play();clearUnlock.current();setPlaying(true)}catch{setPlaying(false)}};
 return <><audio ref={audio} src="/quiet-reading.m4a" loop autoPlay preload="auto"/><button className="music-toggle" aria-pressed={playing} aria-label={playing?"暂停轻音乐":"播放轻音乐"} onClick={toggle}>{playing?<Pause size={15}/>:<Music2 size={15}/>}<span>{playing?"暂停音乐":"轻音乐"}</span></button></>;
}
