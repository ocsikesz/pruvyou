import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert, SafeAreaView, Modal, Image, KeyboardAvoidingView, Platform } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';

const brand={blue:'#1A4F8A',green:'#34C79F',gold:'#F7C602'};
const C={bg:'#F5F7FA',white:'#FFFFFF',border:'#E0E4EA',borderLight:'#EDF0F5',
  text:'#1A2E44',textMuted:'#4D5E74',textDim:'#7889A0',textDark:'#A0AEBC',textLight:'#B0BACA',
  greenBg:'#E8F8F0',greenBorder:'#B8E6D0',blueBg:'#E6EFF8',blueBorder:'#B0CDE8',
  goldBg:'#FEF8E6',goldBorder:'#F5DFA0',purpleBg:'#F0EDFE',purpleBorder:'#C8C4E8'};
const DAYS=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const ICONS=['🏃','🧘','💪','📖','🧠','💧','🍎','😴','✍️','🎯','⏰','🔥','💰','📝','🌿'];
const CATS=[
  {id:'fitness',name:'Health & Fitness',icon:'💪',color:brand.green,bg:C.greenBg,border:C.greenBorder},
  {id:'develop',name:'Development',icon:'📖',color:brand.blue,bg:C.blueBg,border:C.blueBorder},
  {id:'finance',name:'Finance',icon:'💰',color:brand.gold,bg:C.goldBg,border:C.goldBorder},
  {id:'lifestyle',name:'Lifestyle',icon:'🌿',color:'#9B7ED4',bg:C.purpleBg,border:C.purpleBorder},
  {id:'work',name:'Work & Productivity',icon:'🎯',color:'#E8956B',bg:C.goldBg,border:C.goldBorder},
];
const compColor=(r)=>r>=1?brand.green:r>=0.7?brand.gold:r>=0.4?'#E8956B':C.textDark;
const fmt=(d)=>{const y=d.getFullYear();const m=String(d.getMonth()+1).padStart(2,'0');const day=String(d.getDate()).padStart(2,'0');return`${y}-${m}-${day}`;};
const today=()=>new Date();
const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
function getWeekDates(off=0){const d=today();const day=d.getDay()===0?6:d.getDay()-1;
  const mon=new Date(d);mon.setDate(d.getDate()-day+off*7);
  return Array.from({length:7},(_,i)=>{const x=new Date(mon);x.setDate(mon.getDate()+i);return x;});}
function getMonthDates(y,m){const days=new Date(y,m+1,0).getDate();
  return Array.from({length:days},(_,i)=>new Date(y,m,i+1));}

const ld=async(k,fb)=>{try{const r=await AsyncStorage.getItem(k);return r?JSON.parse(r):fb;}catch{return fb;}};
const sv=async(k,v)=>{try{await AsyncStorage.setItem(k,JSON.stringify(v));}catch{}};

function Ring({size,sw,pct,color,children}){
  const r=(size-sw)/2,circ=2*Math.PI*r,off=circ-(Math.min(100,pct)/100)*circ;
  return(<View style={{width:size,height:size,alignItems:'center',justifyContent:'center'}}>
    <Svg width={size} height={size} style={{position:'absolute',transform:[{rotate:'-90deg'}]}}>
      <Circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#E0E4EA" strokeWidth={sw}/>
      <Circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={sw}
        strokeDasharray={`${circ}`} strokeDashoffset={off} strokeLinecap="round"/></Svg>
    {children}</View>);}

// Tab icons
const TAB_ICONS={home:require('./assets/Home.png'),habits:require('./assets/Habits.png'),
  projects:require('./assets/Projects.png'),stats:require('./assets/Stats.png'),settings:require('./assets/Setting.png')};

// ═══════════════════════════════════════════════════════════════════
export default function App(){
  const [tab,setTab]=useState('home');
  const [habits,setHabits]=useState([]);
  const [log,setLog]=useState({}); // {dateStr:{habitId:{done,minutes,notes}}}
  const [projects,setProjects]=useState([]);
  const [projLog,setProjLog]=useState({}); // {dateStr:{projId:{minutes,notes}}}
  const [loaded,setLoaded]=useState(false);
  const [weekOff,setWeekOff]=useState(0);
  const [showAdd,setShowAdd]=useState(false);
  const [editHabit,setEditHabit]=useState(null);

  useEffect(()=>{(async()=>{
    setHabits(await ld('pv-habits',[]));setLog(await ld('pv-log',{}));
    setProjects(await ld('pv-projects',[]));setProjLog(await ld('pv-projlog',{}));
    setLoaded(true);})();},[]);
  useEffect(()=>{if(loaded)sv('pv-habits',habits);},[habits,loaded]);
  useEffect(()=>{if(loaded)sv('pv-log',log);},[log,loaded]);
  useEffect(()=>{if(loaded)sv('pv-projects',projects);},[projects,loaded]);
  useEffect(()=>{if(loaded)sv('pv-projlog',projLog);},[projLog,loaded]);

  const toggleDay=useCallback((hid,ds)=>{setLog(p=>{const c={...p};if(!c[ds])c[ds]={};
    const cur=c[ds][hid];c[ds]={...c[ds],[hid]:{...cur,done:!cur?.done}};return c;});},[]);
  const addMinutes=useCallback((hid,ds,delta,target)=>{setLog(p=>{const c={...p};if(!c[ds])c[ds]={};
    const cur=c[ds][hid]?.minutes||0;const next=clamp(cur+delta,0,999);
    c[ds]={...c[ds],[hid]:{...c[ds][hid],done:next>=target,minutes:next}};return c;});},[]);
  const setNote=useCallback((hid,ds,note)=>{setLog(p=>{const c={...p};if(!c[ds])c[ds]={};
    c[ds]={...c[ds],[hid]:{...c[ds][hid],notes:note}};return c;});},[]);
  const addProjMinutes=useCallback((pid,ds,delta)=>{setProjLog(p=>{const c={...p};if(!c[ds])c[ds]={};
    const cur=c[ds][pid]?.minutes||0;c[ds]={...c[ds],[pid]:{...c[ds][pid],minutes:clamp(cur+delta,0,999)}};return c;});},[]);
  const setProjMinutes=useCallback((pid,ds,val)=>{setProjLog(p=>{const c={...p};if(!c[ds])c[ds]={};c[ds]={...c[ds],[pid]:{...c[ds][pid],minutes:clamp(val,0,999)}};return c;});},[]);
  const setProjNote=useCallback((pid,ds,note)=>{setProjLog(p=>{const c={...p};if(!c[ds])c[ds]={};
    c[ds]={...c[ds],[pid]:{...c[ds][pid],notes:note}};return c;});},[]);

  const setHabitMinutes=useCallback((hid,ds,val,target)=>{setLog(p=>{const c={...p};if(!c[ds])c[ds]={};
    const v=clamp(val,0,999);c[ds]={...c[ds],[hid]:{...c[ds][hid],done:v>=(target||0),minutes:v}};return c;});},[]);
  const setProjTasks=useCallback((pid,ds,tasks)=>{setProjLog(p=>{const c={...p};if(!c[ds])c[ds]={};
    c[ds]={...c[ds],[pid]:{...c[ds][pid],tasks}};return c;});},[]);
  const addHabit=(h)=>{setHabits(p=>[...p,{...h,id:Date.now().toString()}]);setShowAdd(false);};
  const updateHabit=(h)=>{setHabits(p=>p.map(x=>x.id===h.id?h:x));setEditHabit(null);};
  const deleteHabit=(id)=>setHabits(p=>p.filter(x=>x.id!==id));
  const weekDates=useMemo(()=>getWeekDates(weekOff),[weekOff]);
  const todayStr=fmt(today());

  if(!loaded)return<SafeAreaView style={s.root}><View style={{flex:1,justifyContent:'center',alignItems:'center'}}>
    <Text style={{fontSize:40}}>⏳</Text></View></SafeAreaView>;

  const TABS=[{id:'home',label:'Home'},{id:'habits',label:'Habits'},{id:'projects',label:'Projects'},
    {id:'stats',label:'Stats'},{id:'settings',label:'Settings'}];

  return(
    <SafeAreaView style={s.root}>
      <ScrollView style={s.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={s.logoArea}>
          <Image source={require('./assets/PruvYou_logo.png')} style={s.logoImg} resizeMode="contain"/>
          <Text style={s.logoSub}>PROVE YOURSELF DAILY</Text>
        </View>
        {tab==='home'&&<HomeTab habits={habits} log={log} weekDates={weekDates} weekOff={weekOff}
          setWeekOff={setWeekOff} toggleDay={toggleDay} addMinutes={addMinutes} setHabitMinutes={setHabitMinutes} todayStr={todayStr}
          setNote={setNote} log={log}/>}
        {tab==='habits'&&<HabitsTab habits={habits} log={log} showAdd={showAdd} setShowAdd={setShowAdd}
          addHabit={addHabit} editHabit={editHabit} setEditHabit={setEditHabit}
          updateHabit={updateHabit} deleteHabit={deleteHabit}
          toggleDay={toggleDay} addMinutes={addMinutes} setHabitMinutes={setHabitMinutes} setNote={setNote} todayStr={todayStr} weekDates={weekDates}/>}
        {tab==='projects'&&<ProjectsTab projects={projects} setProjects={setProjects}
          projLog={projLog} addProjMinutes={addProjMinutes} setProjNote={setProjNote} setProjMinutes={setProjMinutes} setProjTasks={setProjTasks}
          todayStr={todayStr}/>}
        {tab==='stats'&&<StatsTab habits={habits} log={log} projects={projects} projLog={projLog}/>}
        {tab==='settings'&&<SettingsTab habits={habits} log={log} projects={projects} projLog={projLog}
          setHabits={setHabits} setLog={setLog} setProjects={setProjects} setProjLog={setProjLog}/>}
        <View style={{height:80}}/>
      </ScrollView>

      {/* Tab Bar with PNG icons */}
      <View style={s.tabBar}>
        {TABS.map(t=>(
          <TouchableOpacity key={t.id} onPress={()=>setTab(t.id)} style={s.tabItem}>
            <Image source={TAB_ICONS[t.id]} style={[s.tabIcon,tab===t.id&&{tintColor:brand.blue}]} resizeMode="contain"/>
            <Text style={[s.tabLabel,tab===t.id&&{color:brand.blue,fontWeight:'700'}]}>{t.label}</Text>
          </TouchableOpacity>))}
      </View>




    </SafeAreaView>);
}

// ═══════════════════════════════════════════════════════════════════
// HABIT DAY PANEL — inline expand card for habit log
// ═══════════════════════════════════════════════════════════════════
function HabitDayPanel({h,ds,log,toggleDay,addMinutes,setHabitMinutes,setNote,color,bg,border}){
  const entry=log[ds]?.[h.id];
  const done=!!entry?.done;
  const curMins=entry?.minutes||0;
  const [note,setNoteLocal]=useState(entry?.notes||'');
  const [savedNote,setSavedNote]=useState(entry?.notes||'');
  // sync note if entry changes externally
  React.useEffect(()=>{setNoteLocal(entry?.notes||'');setSavedNote(entry?.notes||'');},[ds,h.id]);
  return(
    <View style={{backgroundColor:bg||'#fff',borderRadius:10,padding:12,marginTop:4,borderWidth:1,borderColor:border||C.border}}>
      {/* Time / Check section */}
      {h.type==='timer'?(
        <View style={{marginBottom:12}}>
          <Text style={{fontSize:10,fontWeight:'700',color:C.textDim,marginBottom:8}}>TIME LOGGED</Text>
          <View style={{flexDirection:'row',alignItems:'center',gap:10}}>
            <TouchableOpacity onPress={()=>setHabitMinutes(h.id,ds,Math.max(0,curMins-15),h.targetMinutes)}
              style={{width:44,height:44,borderRadius:22,backgroundColor:'#FEE',borderWidth:1,borderColor:'#FCC',alignItems:'center',justifyContent:'center'}}>
              <Text style={{fontSize:22,fontWeight:'800',color:'#C44'}}>−</Text></TouchableOpacity>
            <TouchableOpacity onPress={()=>setHabitMinutes(h.id,ds,0,h.targetMinutes)}
              style={{flex:1,height:44,borderRadius:10,backgroundColor:C.bg,borderWidth:1,borderColor:C.border,alignItems:'center',justifyContent:'center'}}>
              <Text style={{fontSize:18,fontWeight:'800',color:curMins>0?color:C.textDim}}>{curMins}m</Text>
              <Text style={{fontSize:8,color:C.textDim}}>{curMins>0?'tap to reset':'tap 0'}</Text></TouchableOpacity>
            <TouchableOpacity onPress={()=>setHabitMinutes(h.id,ds,curMins+15,h.targetMinutes)}
              style={{width:44,height:44,borderRadius:22,backgroundColor:color+'20',borderWidth:1,borderColor:color+'50',alignItems:'center',justifyContent:'center'}}>
              <Text style={{fontSize:22,fontWeight:'800',color}}>+</Text></TouchableOpacity>
          </View>
          <View style={{flexDirection:'row',gap:6,marginTop:8}}>
            {[15,30,60,90].map(v=>(<TouchableOpacity key={v} onPress={()=>setHabitMinutes(h.id,ds,v,h.targetMinutes)}
              style={{flex:1,padding:6,borderRadius:8,backgroundColor:curMins===v?color+'25':C.bg,borderWidth:1,borderColor:curMins===v?color+'60':C.border,alignItems:'center'}}>
              <Text style={{fontSize:10,fontWeight:'700',color:curMins===v?color:C.textDim}}>{v}m</Text>
            </TouchableOpacity>))}
          </View>
          {/* Progress bar */}
          <View style={{marginTop:8,height:4,backgroundColor:C.border,borderRadius:2,overflow:'hidden'}}>
            <View style={{height:'100%',width:`${Math.min(100,curMins/h.targetMinutes*100)}%`,backgroundColor:color,borderRadius:2}}/>
          </View>
          <Text style={{fontSize:9,color:C.textDim,marginTop:3,textAlign:'right'}}>{curMins}/{h.targetMinutes}m goal</Text>
        </View>
      ):(
        <TouchableOpacity onPress={()=>toggleDay(h.id,ds)}
          style={{flexDirection:'row',alignItems:'center',padding:12,borderRadius:10,marginBottom:12,
            backgroundColor:done?color+'20':C.bg,borderWidth:1,borderColor:done?color:C.border}}>
          <View style={[s.check,done&&{backgroundColor:color,borderColor:color}]}>
            {done&&<Text style={{color:'#fff',fontSize:14,fontWeight:'700'}}>✓</Text>}</View>
          <Text style={{marginLeft:10,fontSize:13,fontWeight:'600',color:done?color:C.text}}>
            {done?'Done! Tap to undo':'Mark as done'}</Text>
        </TouchableOpacity>
      )}
      {/* Note */}
      <Text style={{fontSize:10,fontWeight:'700',color:C.textDim,marginBottom:6}}>NOTES</Text>
      <TextInput value={note} onChangeText={setNoteLocal}
        placeholder="Add a note..." placeholderTextColor={C.textDark}
        style={[s.input,{height:60,textAlignVertical:'top',marginBottom:8}]} multiline/>
      {note!==savedNote&&(
        <TouchableOpacity onPress={()=>{setNote(h.id,ds,note);setSavedNote(note);}}
          style={{padding:10,borderRadius:8,backgroundColor:color,alignItems:'center',marginBottom:4}}>
          <Text style={{fontSize:12,fontWeight:'700',color:'#fff'}}>Save Note</Text>
        </TouchableOpacity>)}
    </View>);
}

// ═══════════════════════════════════════════════════════════════════
// HOME TAB — thin habit cards with progress
// ═══════════════════════════════════════════════════════════════════
function HomeTab({habits,log,weekDates,weekOff,setWeekOff,toggleDay,addMinutes,setHabitMinutes,todayStr,setNote}){
  const [expanded,setExpanded]=useState(null);
  const todayDayIdx=today().getDay()===0?6:today().getDay()-1;
  const dailyH=habits.filter(h=>h.frequency==='daily');
  const weeklyToday=habits.filter(h=>h.frequency==='weekly'&&(h.selectedDays||[]).includes(todayDayIdx));
  // Also include habits done/logged today but not scheduled for today
  const extraDoneToday=habits.filter(h=>{
    if(h.frequency==='daily') return false;
    if(h.frequency==='weekly'&&(h.selectedDays||[]).includes(todayDayIdx)) return false;
    const entry=log[todayStr]?.[h.id];
    return entry?.done || (entry?.minutes && entry.minutes>0);
  });
  const todayH=[...dailyH,...weeklyToday,...extraDoneToday];
  const doneD=dailyH.filter(h=>log[todayStr]?.[h.id]?.done).length;
  const doneW=weeklyToday.filter(h=>log[todayStr]?.[h.id]?.done).length;
  const dPct=dailyH.length>0?Math.round((doneD/dailyH.length)*100):0;

  if(!habits.length)return<View style={s.empty}><Text style={{fontSize:48,marginBottom:16}}>🌱</Text>
    <Text style={s.emptyTitle}>No habits yet</Text><Text style={s.emptySub}>Go to Habits tab to add your first</Text></View>;

  return(<View>
    <Text style={s.tagline}>Track. <Text style={{color:brand.green}}>Achieve.</Text> <Text style={{color:brand.gold}}>Triumph.</Text></Text>

    {/* Week nav */}
    <View style={s.weekNav}>
      <TouchableOpacity onPress={()=>setWeekOff(w=>w-1)} style={s.navBtn}><Text style={s.navBtnT}>◂</Text></TouchableOpacity>
      <Text style={s.weekLabel}>{weekOff===0?'This week':
        `${weekDates[0].toLocaleDateString('en-US',{day:'numeric',month:'short'})} – ${weekDates[6].toLocaleDateString('en-US',{day:'numeric',month:'short'})}`}</Text>
      <TouchableOpacity onPress={()=>setWeekOff(w=>Math.min(0,w+1))} style={[s.navBtn,weekOff>=0&&{opacity:.3}]} disabled={weekOff>=0}>
        <Text style={s.navBtnT}>▸</Text></TouchableOpacity></View>

    {/* 7 Day Cards */}
    <View style={s.cardsRow}>{weekDates.map((d,i)=>{const ds=fmt(d);const isT=ds===todayStr;const isFut=d>today();
      const act=habits.filter(h=>h.frequency==='daily'||(h.frequency==='weekly'&&(h.selectedDays||[]).includes(i)));
      const total=act.length;const done=act.filter(h=>log[ds]?.[h.id]?.done).length;
      const pct=total>0?Math.round((done/total)*100):0;const fill=compColor(done/Math.max(1,total));
      return(<TouchableOpacity key={i} activeOpacity={0.7} onPress={()=>{if(!isFut)setExpanded(null);}}
        style={[s.dayCard,isT&&{borderColor:brand.gold,borderWidth:2},isFut&&{opacity:.35}]}>
        <View style={s.dcProgress}><View style={s.dcTrack}><View style={[s.dcFill,{height:`${pct}%`,backgroundColor:fill}]}/></View>
          <View style={s.dcOverlay}>{total>0&&<Text style={[s.dcCount,{color:fill}]}>{done}/{total}</Text>}
            <Text style={[s.dcPct,{color:pct>45?'#fff':C.textMuted}]}>{total>0?`${pct}%`:'—'}</Text></View></View>
        <View style={[s.dcLabel,isT&&{backgroundColor:brand.gold+'18'}]}>
          <Text style={[s.dcDay,isT&&{color:brand.gold}]}>{DAYS[i]}</Text>
          <Text style={[s.dcNum,isT&&{color:brand.gold}]}>{d.getDate()}</Text></View>
      </TouchableOpacity>);})}</View>

    {/* Today header */}
    <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
      <Text style={s.sectionTitle}>Today</Text>
      <View style={{flexDirection:'row',gap:8}}>
        <Text style={{fontSize:18,fontWeight:'800',color:compColor(dPct/100)}}>{doneD}/{dailyH.length}</Text>
        {weeklyToday.length>0&&<Text style={{fontSize:14,fontWeight:'700',color:brand.blue}}>+{doneW}/{weeklyToday.length}</Text>}
      </View></View>

    {/* Habit cards — tap to expand */}
    {todayH.map(h=>{const entry=log[todayStr]?.[h.id];const done=!!entry?.done;
      const cat=CATS.find(c=>c.id===h.categoryId);const color=cat?.color||brand.green;
      const isExp=expanded===h.id;
      return(<View key={h.id}>
        <TouchableOpacity onPress={()=>setExpanded(isExp?null:h.id)} activeOpacity={0.7}
          style={[s.thinCard,{borderLeftWidth:3,borderLeftColor:color},done&&{backgroundColor:cat?.bg||C.greenBg}]}>
          <View style={[s.thinCheck,done&&{backgroundColor:color,borderColor:color}]}>
            {done&&<Text style={{color:'#fff',fontSize:11,fontWeight:'700'}}>✓</Text>}</View>
          <View style={{flex:1}}>
            <Text style={[s.thinName,done&&{textDecorationLine:'line-through',color:C.textDim}]}>{h.icon} {h.name}</Text>
            {h.type==='timer'&&(<View style={{flexDirection:'row',alignItems:'center',gap:4,marginTop:3}}>
              <View style={{flex:1,height:3,backgroundColor:C.border,borderRadius:2,overflow:'hidden'}}>
                <View style={{height:'100%',width:`${Math.min(100,(entry?.minutes||0)/h.targetMinutes*100)}%`,backgroundColor:color,borderRadius:2}}/></View>
              <Text style={{fontSize:9,fontWeight:'700',color}}>{entry?.minutes||0}/{h.targetMinutes}m</Text></View>)}
            {entry?.notes&&<Text style={{fontSize:9,color:brand.blue,marginTop:2}} numberOfLines={1}>📝 {entry.notes}</Text>}
          </View>
          <Text style={{fontSize:14,color:C.textDark,paddingHorizontal:6}}>{isExp?'▾':'▸'}</Text>
        </TouchableOpacity>
        {isExp&&<HabitDayPanel h={h} ds={todayStr} log={log} toggleDay={toggleDay}
          addMinutes={addMinutes} setHabitMinutes={setHabitMinutes} setNote={setNote}
          color={color} bg={cat?.bg} border={cat?.border}/>}
      </View>);
    })}
  </View>);
}

// ═══════════════════════════════════════════════════════════════════
// HABITS TAB (same as before, abbreviated)
// ═══════════════════════════════════════════════════════════════════
function HabitsTab({habits,log,showAdd,setShowAdd,addHabit,editHabit,setEditHabit,updateHabit,deleteHabit,toggleDay,addMinutes,setHabitMinutes,setNote,todayStr,weekDates}){
  const [expanded,setExpanded]=useState(null);
  const [expandedDay,setExpandedDay]=useState(null);
  return(<View>
    <TouchableOpacity onPress={()=>{setShowAdd(true);setEditHabit(null);}} style={s.addBtn}>
      <Text style={s.addBtnT}>＋ Add new habit</Text></TouchableOpacity>
    {(showAdd||editHabit)&&<HabitForm habit={editHabit} onSave={editHabit?updateHabit:addHabit}
      onCancel={()=>{setShowAdd(false);setEditHabit(null);}}/>}
    {!habits.length&&!showAdd&&<View style={s.empty}><Text style={{fontSize:36,marginBottom:12}}>📋</Text>
      <Text style={s.emptySub}>Tap + to create your first habit</Text></View>}
    {CATS.map(cat=>{const ch=habits.filter(h=>h.categoryId===cat.id);if(!ch.length)return null;
      return(<View key={cat.id} style={[s.catCard,{backgroundColor:cat.bg,borderColor:cat.border,marginBottom:12}]}>
        <View style={{flexDirection:'row',alignItems:'center',marginBottom:6}}>
          <Text style={{fontSize:16}}>{cat.icon}</Text>
          <Text style={{fontSize:14,fontWeight:'700',color:cat.color,marginLeft:8,flex:1}}>{cat.name}</Text></View>
        {ch.map(h=>{const entry=log[todayStr]?.[h.id];const done=!!entry?.done;const isExp=expanded===h.id;
          return(<View key={h.id} style={{marginTop:6}}>
            <TouchableOpacity onPress={()=>setExpanded(isExp?null:h.id)}
              style={{backgroundColor:'#fff',borderRadius:10,padding:12,borderWidth:1,borderColor:cat.border,flexDirection:'row',alignItems:'center'}}>
              <TouchableOpacity onPress={()=>{if(h.type==='check')toggleDay(h.id,todayStr);
                else if(!done)addMinutes(h.id,todayStr,h.targetMinutes,h.targetMinutes);}}
                style={[s.check,done&&{backgroundColor:cat.color,borderColor:cat.color}]}>
                {done&&<Text style={{color:'#fff',fontSize:14,fontWeight:'700'}}>✓</Text>}</TouchableOpacity>
              <View style={{flex:1,marginLeft:10}}>
                <Text style={{fontSize:13,fontWeight:'600',color:C.text}}>{h.icon} {h.name}</Text>
                <Text style={{fontSize:10,color:C.textDim}}>{h.type==='timer'?`${h.targetMinutes}m`:'Check'} · {h.frequency==='daily'?'Daily':
                  (h.selectedDays||[]).map(d=>DAYS[d]).join(', ')}</Text></View>
              <Text style={{fontSize:14,color:C.textDark}}>{isExp?'▾':'▸'}</Text>
            </TouchableOpacity>
            {isExp&&(<View style={{marginTop:2}}>
              {/* Week strip */}
              <View style={{flexDirection:'row',gap:3,marginBottom:6,paddingHorizontal:2}}>
                {weekDates.map((d,i)=>{const ds=fmt(d);const dd=log[ds]?.[h.id]?.done;const dm=log[ds]?.[h.id]?.minutes||0;
                  const isFut=d>today();const isTod=ds===fmt(today());
                  return(<TouchableOpacity key={i} onPress={()=>{if(!isFut)setExpandedDay(expandedDay===ds?null:ds);}}
                    style={{flex:1,paddingVertical:5,borderRadius:8,alignItems:'center',
                      backgroundColor:dd?cat.color+'25':'#fff',borderWidth:isTod?2:1,
                      borderColor:isTod?brand.gold:(dd?cat.color:C.border),opacity:isFut?0.3:1}}>
                    <Text style={{fontSize:8,fontWeight:'700',color:isTod?brand.gold:C.textDim}}>{DAYS[i]}</Text>
                    <Text style={{fontSize:10,fontWeight:'800',color:dd?cat.color:C.textDark}}>
                      {h.type==='timer'?(dm>0?dm+'m':'—'):(dd?'✓':'○')}</Text>
                  </TouchableOpacity>);})}
              </View>
              {/* Expanded day panel */}
              {expandedDay&&(<HabitDayPanel h={h} ds={expandedDay} log={log} toggleDay={toggleDay}
                addMinutes={addMinutes} setHabitMinutes={setHabitMinutes} setNote={setNote}
                color={cat.color} bg={cat.bg} border={cat.border}/>)}
              {/* Edit / Delete */}
              <View style={{flexDirection:'row',gap:8,marginTop:8}}>
                <TouchableOpacity onPress={()=>{setExpanded(null);setEditHabit(h);}}
                  style={{flex:1,padding:8,borderRadius:8,backgroundColor:cat.bg,alignItems:'center',borderWidth:1,borderColor:cat.border}}>
                  <Text style={{fontSize:12,fontWeight:'600',color:cat.color}}>✏️ Edit</Text></TouchableOpacity>
                <TouchableOpacity onPress={()=>Alert.alert('Delete',`Delete "${h.name}"?`,[{text:'Cancel',style:'cancel'},
                  {text:'Delete',style:'destructive',onPress:()=>{setExpanded(null);deleteHabit(h.id);}}])}
                  style={{flex:1,padding:8,borderRadius:8,backgroundColor:'#FEE',alignItems:'center',borderWidth:1,borderColor:'#FCC'}}>
                  <Text style={{fontSize:12,fontWeight:'600',color:'#C44'}}>🗑 Delete</Text></TouchableOpacity></View>
            </View>)}
          </View>);})}
      </View>);})}
  </View>);
}

// ═══════════════════════════════════════════════════════════════════
// HABIT FORM
// ═══════════════════════════════════════════════════════════════════
function HabitForm({habit,onSave,onCancel}){
  const [name,setName]=useState(habit?.name||'');const [type,setType]=useState(habit?.type||'check');
  const [freq,setFreq]=useState(habit?.frequency||'daily');const [mins,setMins]=useState(String(habit?.targetMinutes||15));
  const [selectedDays,setSelectedDays]=useState(habit?.selectedDays||[]);const [icon,setIcon]=useState(habit?.icon||'🎯');
  const [catId,setCatId]=useState(habit?.categoryId||'fitness');const cat=CATS.find(c=>c.id===catId)||CATS[0];
  const tds=(i)=>setSelectedDays(p=>p.includes(i)?p.filter(d=>d!==i):[...p,i].sort());
  return(<View style={s.form}><Text style={s.formTitle}>{habit?'Edit':'New habit'}</Text>
    <Text style={s.label}>CATEGORY</Text>
    <View style={{gap:6,marginBottom:12}}>{CATS.map(c=>(<TouchableOpacity key={c.id} onPress={()=>setCatId(c.id)}
      style={{flexDirection:'row',alignItems:'center',padding:10,borderRadius:10,backgroundColor:catId===c.id?c.bg:C.bg,
        borderWidth:catId===c.id?2:1,borderColor:catId===c.id?c.color:C.border}}>
      <Text style={{fontSize:18,marginRight:10}}>{c.icon}</Text>
      <Text style={{fontSize:13,fontWeight:'600',color:catId===c.id?c.color:C.textMuted}}>{c.name}</Text>
    </TouchableOpacity>))}</View>
    <Text style={s.label}>NAME</Text>
    <TextInput value={name} onChangeText={setName} placeholder="e.g. Yoga, Reading" placeholderTextColor={C.textDark} style={s.input}/>
    <Text style={s.label}>ICON</Text>
    <View style={{flexDirection:'row',flexWrap:'wrap',gap:6,marginBottom:12}}>{ICONS.map(ic=>(<TouchableOpacity key={ic} onPress={()=>setIcon(ic)}
      style={[s.iconBtn,icon===ic&&{borderColor:cat.color,borderWidth:2,backgroundColor:cat.bg}]}>
      <Text style={{fontSize:18}}>{ic}</Text></TouchableOpacity>))}</View>
    <Text style={s.label}>TYPE</Text>
    <View style={{flexDirection:'row',gap:8,marginBottom:12}}>{[['check','✓ Checkbox'],['timer','⏱ Timer']].map(([v,l])=>(
      <TouchableOpacity key={v} onPress={()=>setType(v)} style={[s.toggle,type===v&&{borderColor:cat.color,backgroundColor:cat.bg}]}>
        <Text style={[s.toggleT,type===v&&{color:cat.color}]}>{l}</Text></TouchableOpacity>))}</View>
    {type==='timer'&&(<><Text style={s.label}>MINUTES/DAY</Text>
      <TextInput value={mins} onChangeText={setMins} keyboardType="number-pad" style={s.input}/></>)}
    <Text style={s.label}>FREQUENCY</Text>
    <View style={{flexDirection:'row',gap:8,marginBottom:12}}>{[['daily','Every day'],['weekly','Specific days']].map(([v,l])=>(
      <TouchableOpacity key={v} onPress={()=>setFreq(v)} style={[s.toggle,freq===v&&{borderColor:cat.color,backgroundColor:cat.bg}]}>
        <Text style={[s.toggleT,freq===v&&{color:cat.color}]}>{l}</Text></TouchableOpacity>))}</View>
    {freq==='weekly'&&(<><Text style={s.label}>SELECT DAYS</Text>
      <View style={{flexDirection:'row',gap:4,marginBottom:12}}>{DAYS.map((d,i)=>{const sel=selectedDays.includes(i);return(
        <TouchableOpacity key={i} onPress={()=>tds(i)} style={[s.dayChip,sel&&{backgroundColor:cat.color,borderColor:cat.color}]}>
          <Text style={[s.dayChipT,sel&&{color:'#fff'}]}>{d}</Text></TouchableOpacity>);})}</View></>)}
    <View style={{flexDirection:'row',gap:10,marginTop:8}}>
      <TouchableOpacity onPress={onCancel} style={s.cancelBtn}><Text style={s.cancelBtnT}>Cancel</Text></TouchableOpacity>
      <TouchableOpacity onPress={()=>{if(!name.trim())return;onSave({...(habit||{}),name:name.trim(),type,frequency:freq,
        targetMinutes:parseInt(mins)||15,weeklyTarget:freq==='weekly'?selectedDays.length:7,
        selectedDays:freq==='weekly'?selectedDays:[],icon,color:cat.color,categoryId:catId});}}
        style={[s.saveBtn,{backgroundColor:cat.color}]}><Text style={s.saveBtnT}>Save</Text></TouchableOpacity></View>
  </View>);
}

// ═══════════════════════════════════════════════════════════════════
// PROJECT DAY PANEL — inline panel for a selected day in project
// ═══════════════════════════════════════════════════════════════════
function ProjDayPanel({pid,ds,dm,dn,tasks,color,addProjMinutes,setProjMinutes,setProjNote,setProjTasks}){
  const [note,setNoteLocal]=useState(dn);
  const [savedNote,setSavedNote]=useState(dn);
  const [taskInput,setTaskInput]=useState('');
  const dateObj=new Date(ds.split('-')[0],parseInt(ds.split('-')[1])-1,ds.split('-')[2]);
  const toggleTask=(idx)=>{const t=[...tasks];t[idx]={...t[idx],done:!t[idx].done};setProjTasks(pid,ds,t);};
  const addTask=()=>{if(!taskInput.trim())return;setProjTasks(pid,ds,[...tasks,{text:taskInput.trim(),done:false,id:Date.now().toString()}]);setTaskInput('');};
  const deleteTask=(idx)=>{const t=tasks.filter((_,i)=>i!==idx);setProjTasks(pid,ds,t);};
  return(
    <View style={{backgroundColor:color+'08',borderRadius:10,padding:12,marginTop:4,marginBottom:6,borderWidth:1,borderColor:color+'30'}}>
      <Text style={{fontSize:11,fontWeight:'700',color,marginBottom:8}}>
        {dateObj.toLocaleDateString('en-US',{weekday:'short',day:'numeric',month:'short'})}</Text>
      {/* Time */}
      <Text style={{fontSize:10,fontWeight:'700',color:C.textDim,marginBottom:6}}>TIME LOGGED</Text>
      <View style={{flexDirection:'row',alignItems:'center',gap:8,marginBottom:8}}>
        <TouchableOpacity onPress={()=>setProjMinutes(pid,ds,Math.max(0,dm-15))}
          style={{width:40,height:40,borderRadius:20,backgroundColor:'#FEE',borderWidth:1,borderColor:'#FCC',alignItems:'center',justifyContent:'center'}}>
          <Text style={{fontSize:20,fontWeight:'800',color:'#C44'}}>−</Text></TouchableOpacity>
        <TouchableOpacity onPress={()=>setProjMinutes(pid,ds,0)}
          style={{flex:1,height:40,borderRadius:10,backgroundColor:C.bg,borderWidth:1,borderColor:C.border,alignItems:'center',justifyContent:'center'}}>
          <Text style={{fontSize:16,fontWeight:'800',color:dm>0?color:C.textDim}}>{dm}m</Text></TouchableOpacity>
        <TouchableOpacity onPress={()=>setProjMinutes(pid,ds,dm+15)}
          style={{width:40,height:40,borderRadius:20,backgroundColor:color+'20',borderWidth:1,borderColor:color+'40',alignItems:'center',justifyContent:'center'}}>
          <Text style={{fontSize:20,fontWeight:'800',color}}>+</Text></TouchableOpacity>
      </View>
      <View style={{flexDirection:'row',gap:5,marginBottom:12}}>
        {[0,15,30,60,90,120].map(v=>(<TouchableOpacity key={v} onPress={()=>setProjMinutes(pid,ds,v)}
          style={{flex:1,padding:5,borderRadius:7,backgroundColor:dm===v?color+'25':C.bg,borderWidth:1,borderColor:dm===v?color+'60':C.border,alignItems:'center'}}>
          <Text style={{fontSize:9,fontWeight:'700',color:dm===v?color:C.textDim}}>{v===0?'0':v+'m'}</Text>
        </TouchableOpacity>))}
      </View>
      {/* Tasks */}
      <Text style={{fontSize:10,fontWeight:'700',color:C.textDim,marginBottom:6}}>TASKS</Text>
      {tasks.map((t,i)=>(
        <View key={t.id||i} style={{flexDirection:'row',alignItems:'center',gap:8,marginBottom:6}}>
          <TouchableOpacity onPress={()=>toggleTask(i)}
            style={{width:20,height:20,borderRadius:5,borderWidth:1.5,borderColor:t.done?color:C.border,
              backgroundColor:t.done?color:'#fff',alignItems:'center',justifyContent:'center'}}>
            {t.done&&<Text style={{color:'#fff',fontSize:11,fontWeight:'800'}}>✓</Text>}
          </TouchableOpacity>
          <Text style={{flex:1,fontSize:12,color:t.done?C.textDim:C.text,textDecorationLine:t.done?'line-through':'none'}}>{t.text}</Text>
          <TouchableOpacity onPress={()=>deleteTask(i)} style={{padding:4}}>
            <Text style={{fontSize:12,color:'#C44'}}>✕</Text>
          </TouchableOpacity>
        </View>))}
      <View style={{flexDirection:'row',gap:8,marginBottom:12}}>
        <TextInput value={taskInput} onChangeText={setTaskInput} placeholder="Add task..."
          placeholderTextColor={C.textDark} style={[s.input,{flex:1,marginBottom:0,fontSize:12,padding:8}]}
          onSubmitEditing={addTask} returnKeyType="done"/>
        <TouchableOpacity onPress={addTask}
          style={{width:40,height:40,borderRadius:8,backgroundColor:color,alignItems:'center',justifyContent:'center'}}>
          <Text style={{color:'#fff',fontSize:20,fontWeight:'700'}}>+</Text>
        </TouchableOpacity>
      </View>
      {/* Note */}
      <Text style={{fontSize:10,fontWeight:'700',color:C.textDim,marginBottom:6}}>NOTES</Text>
      <TextInput value={note} onChangeText={setNoteLocal} placeholder="Notes for this day..."
        placeholderTextColor={C.textDark} style={[s.input,{height:60,textAlignVertical:'top',marginBottom:8}]} multiline/>
      {note!==savedNote&&(
        <TouchableOpacity onPress={()=>{setProjNote(pid,ds,note);setSavedNote(note);}}
          style={{padding:10,borderRadius:8,backgroundColor:color,alignItems:'center'}}>
          <Text style={{fontSize:12,fontWeight:'700',color:'#fff'}}>Save Note</Text>
        </TouchableOpacity>)}
    </View>);
}

// ═══════════════════════════════════════════════════════════════════
// PROJECTS TAB
// ═══════════════════════════════════════════════════════════════════
function ProjectsTab({projects,setProjects,projLog,addProjMinutes,setProjNote,setProjMinutes,setProjTasks,todayStr}){
  const [showAdd,setShowAdd]=useState(false);
  const [name,setName]=useState('');const [color,setColor]=useState(brand.blue);
  const [expanded,setExpanded]=useState(null);
  const [pMonth,setPMonth]=useState(today().getMonth());
  const [pYear,setPYear]=useState(today().getFullYear());
  const [projExpDay,setProjExpDay]=useState(null);
  const PCOLORS=[brand.blue,brand.green,brand.gold,'#E8956B','#9B7ED4','#5CB8D6'];
  const MN=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const monthDates=useMemo(()=>getMonthDates(pYear,pMonth),[pYear,pMonth]);

  const addProject=()=>{if(!name.trim())return;
    setProjects(p=>[...p,{id:Date.now().toString(),name:name.trim(),color,startDate:todayStr,status:'active'}]);
    setName('');setShowAdd(false);};

  // Calendar grid helper
  const calGrid=(dates)=>{
    const first=dates[0].getDay();const startPad=(first===0?6:first-1);
    const cells=[...Array(startPad).fill(null),...dates];
    const rows=[];for(let i=0;i<cells.length;i+=7)rows.push(cells.slice(i,i+7));
    if(rows[rows.length-1].length<7)rows[rows.length-1].push(...Array(7-rows[rows.length-1].length).fill(null));
    return rows;
  };

  return(<View>
    <TouchableOpacity onPress={()=>setShowAdd(!showAdd)} style={s.addBtn}>
      <Text style={s.addBtnT}>＋ Add new project</Text></TouchableOpacity>
    {showAdd&&(<View style={s.form}>
      <Text style={s.formTitle}>New Project</Text>
      <Text style={s.label}>PROJECT NAME</Text>
      <TextInput value={name} onChangeText={setName} placeholder="e.g. PruvYou App" placeholderTextColor={C.textDark} style={s.input}/>
      <Text style={s.label}>COLOR</Text>
      <View style={{flexDirection:'row',gap:8,marginBottom:12}}>{PCOLORS.map(c=>(
        <TouchableOpacity key={c} onPress={()=>setColor(c)}
          style={{width:32,height:32,borderRadius:16,backgroundColor:c,borderWidth:color===c?3:0,borderColor:'#fff'}}/>))}</View>
      <View style={{flexDirection:'row',gap:10}}>
        <TouchableOpacity onPress={()=>setShowAdd(false)} style={s.cancelBtn}><Text style={s.cancelBtnT}>Cancel</Text></TouchableOpacity>
        <TouchableOpacity onPress={addProject} style={[s.saveBtn,{backgroundColor:color}]}><Text style={s.saveBtnT}>Create</Text></TouchableOpacity></View>
    </View>)}
    {!projects.length&&!showAdd&&<View style={s.empty}><Text style={{fontSize:36,marginBottom:12}}>📁</Text>
      <Text style={s.emptySub}>Add your first project</Text></View>}

    {projects.map(p=>{const isExp=expanded===p.id;
      const totalMins=Object.values(projLog).reduce((sum,day)=>sum+(day[p.id]?.minutes||0),0);
      const monthMins=monthDates.reduce((sum,d)=>sum+(projLog[fmt(d)]?.[p.id]?.minutes||0),0);
      return(<View key={p.id} style={{marginBottom:10}}>
        <TouchableOpacity onPress={()=>setExpanded(isExp?null:p.id)}
          style={[s.catCard,{backgroundColor:p.color+'10',borderColor:p.color+'40',marginBottom:0}]}>
          <View style={{flexDirection:'row',alignItems:'center'}}>
            <View style={{width:8,height:8,borderRadius:4,backgroundColor:p.color,marginRight:10}}/>
            <View style={{flex:1}}>
              <Text style={{fontSize:14,fontWeight:'700',color:C.text}}>{p.name}</Text>
              <Text style={{fontSize:10,color:C.textDim}}>{Math.round(totalMins/60)}h total · {monthMins}m in {MN[pMonth]}</Text></View>
            <Text style={{fontSize:14,color:C.textDark}}>{isExp?'▾':'▸'}</Text></View>
        </TouchableOpacity>

        {isExp&&(<View style={{backgroundColor:'#fff',borderRadius:10,padding:12,marginTop:4,borderWidth:1,borderColor:p.color+'40'}}>
          {/* Today log */}
          <Text style={{fontSize:10,fontWeight:'600',color:C.textDim,marginBottom:4}}>LOG TIME TODAY</Text>
          <View style={{flexDirection:'row',gap:4,marginBottom:10}}>
            {[15,30,60,120].map(d=>(<TouchableOpacity key={d} onPress={()=>addProjMinutes(p.id,todayStr,d)}
              style={{flex:1,padding:8,borderRadius:8,backgroundColor:p.color+'10',borderWidth:1,borderColor:p.color+'30',alignItems:'center'}}>
              <Text style={{fontSize:12,fontWeight:'700',color:p.color}}>+{d}m</Text></TouchableOpacity>))}</View>

          {/* Month navigator */}
          <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:6}}>
            <TouchableOpacity onPress={()=>{if(pMonth===0){setPMonth(11);setPYear(y=>y-1);}else setPMonth(m=>m-1);}} style={s.navBtn}>
              <Text style={s.navBtnT}>◂</Text></TouchableOpacity>
            <Text style={{fontSize:12,fontWeight:'700',color:C.text}}>{MN[pMonth]} {pYear}</Text>
            <TouchableOpacity onPress={()=>{if(pMonth===11){setPMonth(0);setPYear(y=>y+1);}else setPMonth(m=>m+1);}} style={s.navBtn}>
              <Text style={s.navBtnT}>▸</Text></TouchableOpacity></View>

          {/* Calendar header */}
          <View style={{flexDirection:'row',marginBottom:4}}>
            {DAYS.map(d=>(<View key={d} style={{flex:1,alignItems:'center'}}><Text style={{fontSize:8,fontWeight:'700',color:C.textDim}}>{d}</Text></View>))}</View>

          {/* Calendar grid */}
          {calGrid(monthDates).map((row,ri)=>(
            <View key={ri} style={{flexDirection:'row',gap:3,marginBottom:3}}>
              {row.map((d,ci)=>{if(!d)return<View key={ci} style={{flex:1,height:32}}/>;
                const ds=fmt(d);const dm=projLog[ds]?.[p.id]?.minutes||0;const dn=projLog[ds]?.[p.id]?.notes;
                const isToday=ds===todayStr;
                const isSelDay=projExpDay===p.id+'|'+ds;
                return(<TouchableOpacity key={ci} onPress={()=>setProjExpDay(isSelDay?null:p.id+'|'+ds)}
                  style={{flex:1,height:32,borderRadius:6,alignItems:'center',justifyContent:'center',
                    backgroundColor:dm>0?p.color+(dm>60?'40':'20'):C.bg,
                    borderWidth:isToday?2:1,borderColor:isToday?brand.gold:(dm>0?p.color+'40':C.borderLight)}}>
                  <Text style={{fontSize:9,fontWeight:'700',color:dm>0?p.color:C.textDim}}>{d.getDate()}</Text>
                  {dm>0&&<Text style={{fontSize:6,fontWeight:'700',color:p.color}}>{dm}m</Text>}
                  {dn&&<View style={{position:'absolute',top:1,right:1,width:4,height:4,borderRadius:2,backgroundColor:p.color}}/>}
                </TouchableOpacity>);})}</View>))}

          <TouchableOpacity onPress={()=>Alert.alert('Delete',`Delete "${p.name}"?`,[{text:'Cancel',style:'cancel'},
            {text:'Delete',style:'destructive',onPress:()=>{setExpanded(null);setProjects(pr=>pr.filter(x=>x.id!==p.id));}}])}
            style={{padding:8,borderRadius:8,backgroundColor:'#FEE',alignItems:'center',borderWidth:1,borderColor:'#FCC'}}>
            <Text style={{fontSize:12,fontWeight:'600',color:'#C44'}}>🗑 Delete project</Text></TouchableOpacity>
        </View>)}
      </View>);})}
  </View>);
}

// ═══════════════════════════════════════════════════════════════════
// STATS TAB — Proper monthly calendar + project status
// ═══════════════════════════════════════════════════════════════════
function StatsTab({habits,log,projects,projLog}){
  const [selMonth,setSelMonth]=useState(today().getMonth());
  const [selYear,setSelYear]=useState(today().getFullYear());
  const [detailDay,setDetailDay]=useState(null);
  const monthDates=useMemo(()=>getMonthDates(selYear,selMonth),[selYear,selMonth]);
  const MN=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const todayStr=fmt(today());

  // Calendar grid: proper rows starting on correct weekday
  const calGrid=useMemo(()=>{
    const first=monthDates[0].getDay();const startPad=(first===0?6:first-1);
    const cells=[...Array(startPad).fill(null),...monthDates];
    const rows=[];for(let i=0;i<cells.length;i+=7)rows.push(cells.slice(i,i+7));
    if(rows.length>0&&rows[rows.length-1].length<7)
      rows[rows.length-1].push(...Array(7-rows[rows.length-1].length).fill(null));
    return rows;
  },[monthDates]);

  if(!habits.length&&!projects.length)return<View style={s.empty}><Text style={{fontSize:48,marginBottom:16}}>📊</Text>
    <Text style={s.emptySub}>Add habits or projects to see stats</Text></View>;

  return(<View>
    {/* Month selector */}
    <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
      <TouchableOpacity onPress={()=>{if(selMonth===0){setSelMonth(11);setSelYear(y=>y-1);}else setSelMonth(m=>m-1);}} style={s.navBtn}>
        <Text style={s.navBtnT}>◂</Text></TouchableOpacity>
      <Text style={{fontSize:16,fontWeight:'700',color:C.text}}>{MN[selMonth]} {selYear}</Text>
      <TouchableOpacity onPress={()=>{if(selMonth===11){setSelMonth(0);setSelYear(y=>y+1);}else setSelMonth(m=>m+1);}} style={s.navBtn}>
        <Text style={s.navBtnT}>▸</Text></TouchableOpacity></View>

    {/* Habit Calendar */}
    {habits.length>0&&(<View style={s.statsCard}>
      <Text style={s.statsTitle}>📅 Habit Completion</Text>
      {/* Day headers */}
      <View style={{flexDirection:'row',marginBottom:6}}>
        {DAYS.map(d=>(<View key={d} style={{flex:1,alignItems:'center'}}><Text style={{fontSize:9,fontWeight:'700',color:C.textDim}}>{d}</Text></View>))}</View>
      {/* Calendar rows */}
      {calGrid.map((row,ri)=>(
        <View key={ri} style={{flexDirection:'row',gap:3,marginBottom:3}}>
          {row.map((d,ci)=>{
            if(!d) return <View key={ci} style={{flex:1,height:32}}/>;
            const ds=fmt(d);const dayLog=log[ds]||{};const isToday=ds===todayStr;
            const dayIdx=d.getDay()===0?6:d.getDay()-1;
            const active=habits.filter(h=>h.frequency==='daily'||(h.frequency==='weekly'&&(h.selectedDays||[]).includes(dayIdx)));
            const done=active.filter(h=>dayLog[h.id]?.done).length;
            const ratio=active.length>0?done/active.length:0;
            const isSel=detailDay===ds;
            return(<TouchableOpacity key={ci} onPress={()=>setDetailDay(isSel?null:ds)}
              style={{flex:1,height:32,borderRadius:6,justifyContent:'center',alignItems:'center',
                backgroundColor:ratio>=1?brand.green+(isSel?'60':'30'):ratio>=0.5?brand.gold+(isSel?'60':'25'):ratio>0?'#E8956B20':C.bg,
                borderWidth:isToday?2:(isSel?2:1),borderColor:isToday?brand.gold:(isSel?brand.blue:C.borderLight)}}>
              <Text style={{fontSize:9,fontWeight:'700',color:ratio>=0.5?(isSel?'#fff':compColor(ratio)):C.textDim}}>{d.getDate()}</Text>
              {ratio>=1&&<Text style={{fontSize:6}}>✓</Text>}
            </TouchableOpacity>);
          })}</View>))}

      {/* Legend */}
      <View style={{flexDirection:'row',justifyContent:'center',gap:12,marginTop:8}}>
        {[{c:brand.green+'30',l:'100%'},{c:brand.gold+'25',l:'50%+'},{c:'#E8956B20',l:'<50%'},{c:C.bg,l:'0%'}].map(({c,l})=>(
          <View key={l} style={{flexDirection:'row',alignItems:'center',gap:4}}>
            <View style={{width:12,height:12,borderRadius:3,backgroundColor:c,borderWidth:1,borderColor:C.border}}/>
            <Text style={{fontSize:8,color:C.textDim}}>{l}</Text></View>))}</View>

      {/* Detail for selected day */}
      {detailDay&&(()=>{const dayLog=log[detailDay]||{};const d=new Date(detailDay.split('-')[0],parseInt(detailDay.split('-')[1])-1,detailDay.split('-')[2]);
        const hasData=habits.some(h=>dayLog[h.id]?.done||dayLog[h.id]?.minutes||dayLog[h.id]?.notes);
        return(<View style={{marginTop:10,padding:12,backgroundColor:C.bg,borderRadius:10}}>
          <Text style={{fontSize:13,fontWeight:'700',color:C.text,marginBottom:6}}>
            {d.toLocaleDateString('en-US',{weekday:'long',day:'numeric',month:'long'})}</Text>
          {!hasData&&<Text style={{fontSize:11,color:C.textDim}}>No data for this day</Text>}
          {habits.map(h=>{const entry=dayLog[h.id];if(!entry?.done&&!entry?.minutes&&!entry?.notes)return null;
            return(<View key={h.id} style={{marginBottom:6}}>
              <View style={{flexDirection:'row',alignItems:'center',gap:6}}>
                <Text style={{fontSize:11,color:entry?.done?brand.green:C.textDim}}>{entry?.done?'✓':'○'}</Text>
                <Text style={{fontSize:12,fontWeight:'600',color:C.text}}>{h.icon} {h.name}</Text>
                {h.type==='timer'&&<Text style={{fontSize:10,color:C.textDim}}>{entry?.minutes||0}m</Text>}
              </View>
              {entry?.notes&&<Text style={{fontSize:10,color:brand.blue,marginLeft:20,marginTop:2}}>📝 {entry.notes}</Text>}
            </View>);})}</View>);})()}
    </View>)}

    {/* Project status */}
    {projects.length>0&&(<View style={s.statsCard}>
      <Text style={s.statsTitle}>📁 Project Status</Text>
      {projects.map(p=>{
        const totalMins=Object.values(projLog).reduce((sum,day)=>sum+(day[p.id]?.minutes||0),0);
        const totalHrs=Math.round(totalMins/60*10)/10;
        const monthMins=monthDates.reduce((sum,d)=>sum+(projLog[fmt(d)]?.[p.id]?.minutes||0),0);
        return(<View key={p.id} style={{marginBottom:14}}>
          <View style={{flexDirection:'row',alignItems:'center',gap:8,marginBottom:6}}>
            <View style={{width:10,height:10,borderRadius:5,backgroundColor:p.color}}/>
            <Text style={{fontSize:13,fontWeight:'600',color:C.text,flex:1}}>{p.name}</Text>
            <Text style={{fontSize:14,fontWeight:'800',color:p.color}}>{totalHrs}h</Text></View>
          {/* Mini calendar bars */}
          <View style={{flexDirection:'row',gap:1,height:24,alignItems:'flex-end'}}>
            {monthDates.map((d,i)=>{const dm=projLog[fmt(d)]?.[p.id]?.minutes||0;
              return(<View key={i} style={{flex:1,height:dm>0?clamp(dm/120*24,3,24):2,
                backgroundColor:dm>0?p.color:C.borderLight,borderRadius:1}}>
                {dm>60&&<Text style={{fontSize:4,color:'#fff',textAlign:'center'}}>{dm}</Text>}
              </View>);})}
          </View>
          <Text style={{fontSize:9,color:C.textDim,marginTop:3}}>{monthMins}m in {MN[selMonth]} · {Math.round(monthMins/60*10)/10}h</Text>
        </View>);})}
    </View>)}
  </View>);
}

// ═══════════════════════════════════════════════════════════════════
// SETTINGS TAB
// ═══════════════════════════════════════════════════════════════════
function SettingsTab({habits,log,projects,projLog,setHabits,setLog,setProjects,setProjLog}){
  const handleBackup=async()=>{
    const data=JSON.stringify({habits,log,projects,projLog,exportDate:new Date().toISOString(),app:'PruvYou'},null,2);
    const path=FileSystem.cacheDirectory+'pruvyou_backup_'+fmt(today())+'.json';
    await FileSystem.writeAsStringAsync(path,data);
    if(await Sharing.isAvailableAsync())await Sharing.shareAsync(path,{mimeType:'application/json',dialogTitle:'Backup PruvYou'});
  };
  const handleRestore=async()=>{
    try{const result=await DocumentPicker.getDocumentAsync({type:'application/json'});if(result.canceled)return;
      const content=await FileSystem.readAsStringAsync(result.assets[0].uri);const data=JSON.parse(content);
      if(data.app==='PruvYou'){Alert.alert('Restore','Found '+data.habits?.length+' habits, '+(data.projects?.length||0)+' projects. Restore?',[
        {text:'Cancel',style:'cancel'},{text:'Restore',onPress:()=>{
          if(data.habits)setHabits(data.habits);if(data.log)setLog(data.log);
          if(data.projects)setProjects(data.projects);if(data.projLog)setProjLog(data.projLog);
          Alert.alert('Done','Data restored!');}}]);}
    }catch{Alert.alert('Error','Could not read file');}};
  return(<View>
    <View style={s.statsCard}><Text style={s.statsTitle}>☁️ Backup & Sync</Text>
      <TouchableOpacity onPress={handleBackup} style={{padding:14,borderRadius:12,backgroundColor:brand.blue,alignItems:'center',marginBottom:8}}>
        <Text style={{fontSize:14,fontWeight:'700',color:'#fff'}}>📤 Backup to Google Drive</Text></TouchableOpacity>
      <TouchableOpacity onPress={handleRestore} style={{padding:14,borderRadius:12,backgroundColor:C.bg,alignItems:'center',borderWidth:1,borderColor:C.border}}>
        <Text style={{fontSize:14,fontWeight:'600',color:C.textMuted}}>📥 Restore from file</Text></TouchableOpacity></View>
    <View style={s.statsCard}><Text style={s.statsTitle}>📊 Your Data</Text>
      <View style={{flexDirection:'row',justifyContent:'space-around'}}>
        <View style={{alignItems:'center'}}><Text style={{fontSize:24,fontWeight:'800',color:brand.blue}}>{habits.length}</Text><Text style={{fontSize:10,color:C.textDim}}>habits</Text></View>
        <View style={{alignItems:'center'}}><Text style={{fontSize:24,fontWeight:'800',color:brand.green}}>{projects.length}</Text><Text style={{fontSize:10,color:C.textDim}}>projects</Text></View>
        <View style={{alignItems:'center'}}><Text style={{fontSize:24,fontWeight:'800',color:brand.gold}}>{Object.keys(log).length}</Text><Text style={{fontSize:10,color:C.textDim}}>days</Text></View>
      </View></View>
    <View style={[s.statsCard,{alignItems:'center'}]}>
      <Image source={require('./assets/PruvYou_logo.png')} style={{width:140,height:35}} resizeMode="contain"/>
      <Text style={{fontSize:9,color:C.textLight,marginTop:4}}>v1.1.0</Text></View>
    <TouchableOpacity onPress={()=>Alert.alert('Reset','Delete ALL data?',[{text:'Cancel',style:'cancel'},
      {text:'Delete Everything',style:'destructive',onPress:async()=>{setHabits([]);setLog({});setProjects([]);setProjLog({});await AsyncStorage.clear();}}])}
      style={{padding:14,borderRadius:12,backgroundColor:'#FEE',alignItems:'center',marginTop:8,borderWidth:1,borderColor:'#FCC'}}>
      <Text style={{fontSize:13,fontWeight:'600',color:'#C44'}}>🗑 Reset all data</Text></TouchableOpacity>
  </View>);
}

// ═══════════════════════════════════════════════════════════════════
const s=StyleSheet.create({
  root:{flex:1,backgroundColor:C.bg},content:{flex:1,paddingHorizontal:16},
  logoArea:{alignItems:'center',paddingTop:12,marginBottom:4},logoImg:{width:240,height:60},logoSub:{fontSize:8,fontWeight:'600',color:C.textDim,letterSpacing:2,marginTop:2},
  tagline:{textAlign:'center',fontSize:14,fontWeight:'600',color:C.textMuted,marginBottom:16},
  weekNav:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:10},
  navBtn:{width:32,height:32,borderRadius:16,backgroundColor:C.white,borderWidth:1,borderColor:C.border,justifyContent:'center',alignItems:'center'},
  navBtnT:{color:C.textDim,fontSize:14},weekLabel:{fontSize:12,fontWeight:'600',color:C.textDim},
  cardsRow:{flexDirection:'row',marginBottom:16,gap:4},
  dayCard:{flex:1,borderRadius:12,backgroundColor:C.white,borderWidth:1,borderColor:C.border,overflow:'hidden',minHeight:100,position:'relative'},
  dcProgress:{flex:1,padding:3,position:'relative'},dcTrack:{position:'absolute',left:3,right:3,top:3,bottom:3,borderRadius:9,backgroundColor:'#E8ECF0',overflow:'hidden',justifyContent:'flex-end'},
  dcFill:{width:'100%',borderRadius:9,minHeight:1},dcOverlay:{position:'absolute',left:0,right:0,top:0,bottom:0,justifyContent:'center',alignItems:'center'},
  dcPct:{fontSize:11,fontWeight:'800'},dcCount:{fontSize:7,fontWeight:'700',position:'absolute',top:6},
  dcLabel:{paddingVertical:4,alignItems:'center',borderTopWidth:1,borderTopColor:C.border},dcDay:{fontSize:9,fontWeight:'700',color:C.textDim},dcNum:{fontSize:12,fontWeight:'800',color:C.textMuted},
  sectionTitle:{fontSize:16,fontWeight:'700',color:C.text},
  thinCard:{flexDirection:'row',alignItems:'center',backgroundColor:C.white,borderRadius:10,padding:10,marginBottom:5,borderWidth:1,borderColor:C.border},
  thinCheck:{width:22,height:22,borderRadius:11,borderWidth:2,borderColor:C.textDark,justifyContent:'center',alignItems:'center',marginRight:8},
  thinName:{fontSize:12,fontWeight:'600',color:C.text},
  miniBtn:{paddingHorizontal:8,paddingVertical:4,borderRadius:6,backgroundColor:C.bg,borderWidth:1,borderColor:C.border},
  miniBtnT:{fontSize:10,fontWeight:'700'},
  catCard:{borderRadius:14,padding:14,marginBottom:10,borderWidth:1},catHeader:{flexDirection:'row',alignItems:'center'},
  catIcon:{width:32,height:32,borderRadius:8,justifyContent:'center',alignItems:'center'},catTitle:{fontSize:14,fontWeight:'700'},
  check:{width:24,height:24,borderRadius:12,borderWidth:2,borderColor:C.textDark,justifyContent:'center',alignItems:'center'},
  empty:{alignItems:'center',paddingVertical:50},emptyTitle:{fontSize:18,fontWeight:'700',color:C.textDim,marginBottom:8},emptySub:{fontSize:13,color:C.textDark,textAlign:'center'},
  actionBtn:{width:32,height:32,borderRadius:6,borderWidth:1,borderColor:C.border,justifyContent:'center',alignItems:'center',marginLeft:4},
  addBtn:{padding:14,borderRadius:12,backgroundColor:brand.blue,alignItems:'center',marginBottom:14},addBtnT:{fontSize:14,fontWeight:'700',color:'#fff'},
  form:{backgroundColor:C.white,borderRadius:16,padding:18,marginBottom:14,borderWidth:1,borderColor:C.border},
  formTitle:{fontSize:17,fontWeight:'700',color:brand.blue,marginBottom:14},label:{fontSize:10,fontWeight:'600',color:C.textDim,letterSpacing:1,marginBottom:5,marginTop:2},
  input:{backgroundColor:C.bg,borderWidth:1,borderColor:C.border,borderRadius:10,padding:11,color:C.text,fontSize:14,marginBottom:10},
  iconBtn:{width:36,height:36,borderRadius:8,borderWidth:1,borderColor:C.border,backgroundColor:C.bg,justifyContent:'center',alignItems:'center'},
  toggle:{flex:1,padding:10,borderRadius:10,borderWidth:1,borderColor:C.border,backgroundColor:C.bg,alignItems:'center'},toggleT:{fontSize:12,fontWeight:'600',color:C.textDark},
  dayChip:{flex:1,height:36,borderRadius:8,borderWidth:1.5,borderColor:C.border,backgroundColor:C.bg,justifyContent:'center',alignItems:'center'},dayChipT:{fontSize:10,fontWeight:'700',color:C.textDark},
  cancelBtn:{flex:1,padding:12,borderRadius:10,backgroundColor:C.bg,borderWidth:1,borderColor:C.border,alignItems:'center'},cancelBtnT:{fontSize:13,fontWeight:'600',color:C.textDim},
  saveBtn:{flex:1,padding:12,borderRadius:10,alignItems:'center'},saveBtnT:{fontSize:13,fontWeight:'700',color:'#fff'},
  statsCard:{backgroundColor:C.white,borderRadius:14,padding:16,marginBottom:12,borderWidth:1,borderColor:C.border},statsTitle:{fontSize:13,fontWeight:'700',color:brand.blue,marginBottom:12},
  tabBar:{position:'absolute',bottom:0,left:0,right:0,height:64,backgroundColor:C.white,borderTopWidth:1,borderTopColor:C.border,flexDirection:'row',alignItems:'center',justifyContent:'space-around'},
  tabItem:{alignItems:'center',gap:2},tabIcon:{width:24,height:24,tintColor:C.textDark},tabLabel:{fontSize:9,fontWeight:'500',color:C.textLight},
  modalBg:{flex:1,backgroundColor:'rgba(0,0,0,0.4)',justifyContent:'flex-end'},modalBox:{backgroundColor:C.white,borderTopLeftRadius:24,borderTopRightRadius:24,padding:20,maxHeight:'80%'},
});
