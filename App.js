import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert, SafeAreaView, Modal, Image, KeyboardAvoidingView, Platform } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import * as Notifications from 'expo-notifications';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
WebBrowser.maybeCompleteAuthSession();

// ─── Google Drive OAuth ───────────────────────────────────────────
// Replace with your Android OAuth 2.0 Client ID from Google Cloud Console
const GOOGLE_CLIENT_ID='YOUR_CLIENT_ID.apps.googleusercontent.com';
const DRIVE_SCOPE='https://www.googleapis.com/auth/drive.file';
const BACKUP_FILENAME='pruvyou_backup.json';
// ─────────────────────────────────────────────────────────────────
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
  const [adHocTasks,setAdHocTasks]=useState({}); // {dateStr:[{id,text,done}]}

  useEffect(()=>{(async()=>{
    setHabits(await ld('pv-habits',[]));setLog(await ld('pv-log',{}));
    setProjects(await ld('pv-projects',[]));setProjLog(await ld('pv-projlog',{}));
    setAdHocTasks(await ld('pv-adhoc',{}));
    setLoaded(true);})();},[]);
  useEffect(()=>{if(loaded)sv('pv-habits',habits);},[habits,loaded]);
  useEffect(()=>{if(loaded)sv('pv-log',log);},[log,loaded]);
  useEffect(()=>{if(loaded)sv('pv-projects',projects);},[projects,loaded]);
  useEffect(()=>{if(loaded)sv('pv-projlog',projLog);},[projLog,loaded]);
  useEffect(()=>{if(loaded)sv('pv-adhoc',adHocTasks);},[adHocTasks,loaded]);

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
  const setAdHocTasksForDay=useCallback((ds,tasks)=>{setAdHocTasks(p=>({...p,[ds]:tasks}));},[]);
  const setProjTasks=useCallback((pid,ds,tasks)=>{setProjLog(p=>{const c={...p};if(!c[ds])c[ds]={};
    c[ds]={...c[ds],[pid]:{...c[ds][pid],tasks}};return c;});},[]);
  const scheduleDailyReminder=useCallback(async(time)=>{
    if(!time)return;
    try{
      await Notifications.requestPermissionsAsync();
      const scheduled=await Notifications.getAllScheduledNotificationsAsync();
      for(const n of scheduled){if(n.content.data?.type==='daily')await Notifications.cancelScheduledNotificationAsync(n.identifier);}
      const [hr,min]=time.split(':').map(Number);
      await Notifications.scheduleNotificationAsync({
        content:{title:'PruvYou ⏰',body:"Don't forget to log your habits and tasks today!",data:{type:'daily'}},
        trigger:{hour:hr,minute:min,repeats:true},
      });
    }catch(e){console.log('Notification error',e);}
  },[]);
  const cancelDailyReminder=useCallback(async()=>{
    try{const scheduled=await Notifications.getAllScheduledNotificationsAsync();
      for(const n of scheduled){if(n.content.data?.type==='daily')await Notifications.cancelScheduledNotificationAsync(n.identifier);}
    }catch(e){}
  },[]);
  const addHabit=(h)=>{const nh={...h,id:Date.now().toString()};setHabits(p=>[...p,nh]);setShowAdd(false);};
  const updateHabit=(h)=>{setHabits(p=>p.map(x=>x.id===h.id?h:x));setEditHabit(null);};
  const deleteHabit=(id)=>{setHabits(p=>p.filter(x=>x.id!==id));};
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
          setNote={setNote} log={log} adHocTasks={adHocTasks} setAdHocTasksForDay={setAdHocTasksForDay}/>}
        {tab==='habits'&&<HabitsTab habits={habits} log={log} showAdd={showAdd} setShowAdd={setShowAdd}
          addHabit={addHabit} editHabit={editHabit} setEditHabit={setEditHabit}
          updateHabit={updateHabit} deleteHabit={deleteHabit}
          toggleDay={toggleDay} addMinutes={addMinutes} setHabitMinutes={setHabitMinutes} setNote={setNote} todayStr={todayStr} weekDates={weekDates}/>}
        {tab==='projects'&&<ProjectsTab projects={projects} setProjects={setProjects}
          projLog={projLog} addProjMinutes={addProjMinutes} setProjNote={setProjNote} setProjMinutes={setProjMinutes} setProjTasks={setProjTasks}
          todayStr={todayStr}/>}
        {tab==='stats'&&<StatsTab habits={habits} log={log} projects={projects} projLog={projLog} adHocTasks={adHocTasks}/>}
        {tab==='settings'&&<SettingsTab habits={habits} log={log} projects={projects} projLog={projLog}
          setHabits={setHabits} setLog={setLog} setProjects={setProjects} setProjLog={setProjLog} adHocTasks={adHocTasks} setAdHocTasks={setAdHocTasks} scheduleDailyReminder={scheduleDailyReminder} cancelDailyReminder={cancelDailyReminder}/>}
        <View style={{height:80}}/>
      </ScrollView>

      {/* Tab Bar with PNG icons */}
      <View style={s.tabBar}>
        {TABS.map(t=>(
          <TouchableOpacity key={t.id} onPress={()=>setTab(t.id)} style={s.tabItem}>
            <Image source={TAB_ICONS[t.id]} style={[s.tabIcon,tab===t.id&&{transform:[{scale:1.1}]}]} resizeMode="contain"/>
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
// HOME TAB
// ═══════════════════════════════════════════════════════════════════
function HomeTab({habits,log,weekDates,weekOff,setWeekOff,toggleDay,addMinutes,setHabitMinutes,todayStr,setNote,adHocTasks,setAdHocTasksForDay}){
  const [selDay,setSelDay]=useState(todayStr); // which day strip is selected
  const [expandedHabit,setExpandedHabit]=useState(null);

  const selDate=new Date(selDay.split('-')[0],parseInt(selDay.split('-')[1])-1,selDay.split('-')[2]);
  const selDayIdx=selDate.getDay()===0?6:selDate.getDay()-1;
  const isToday=selDay===todayStr;

  // Habits for selected day
  const selHabits=habits.filter(h=>
    h.frequency==='daily'||(h.frequency==='weekly'&&(h.selectedDays||[]).includes(selDayIdx))||
    (log[selDay]?.[h.id]?.done)||(log[selDay]?.[h.id]?.minutes>0)
  );
  const doneCount=selHabits.filter(h=>log[selDay]?.[h.id]?.done).length;

  if(!habits.length)return<View style={s.empty}><Text style={{fontSize:48,marginBottom:16}}>🌱</Text>
    <Text style={s.emptyTitle}>No habits yet</Text><Text style={s.emptySub}>Go to Habits tab to add your first</Text></View>;

  return(<View>
    <Text style={s.tagline}>Track. <Text style={{color:brand.green}}>Achieve.</Text> <Text style={{color:brand.gold}}>Triumph.</Text></Text>

    {/* Week nav */}
    <View style={s.weekNav}>
      <TouchableOpacity onPress={()=>{setWeekOff(w=>w-1);}} style={s.navBtn}><Text style={s.navBtnT}>◂</Text></TouchableOpacity>
      <Text style={s.weekLabel}>{weekOff===0?'This week':
        `${weekDates[0].toLocaleDateString('en-US',{day:'numeric',month:'short'})} – ${weekDates[6].toLocaleDateString('en-US',{day:'numeric',month:'short'})}`}</Text>
      <TouchableOpacity onPress={()=>setWeekOff(w=>Math.min(0,w+1))} style={[s.navBtn,weekOff>=0&&{opacity:.3}]} disabled={weekOff>=0}>
        <Text style={s.navBtnT}>▸</Text></TouchableOpacity></View>

    {/* 7 Day Cards — tap to select day */}
    <View style={s.cardsRow}>{weekDates.map((d,i)=>{const ds=fmt(d);const isT=ds===todayStr;const isFut=d>today();
      const isSel=ds===selDay;
      const act=habits.filter(h=>h.frequency==='daily'||(h.frequency==='weekly'&&(h.selectedDays||[]).includes(i)));
      const total=act.length;const done=act.filter(h=>log[ds]?.[h.id]?.done).length;
      const pct=total>0?Math.round((done/total)*100):0;const fill=compColor(done/Math.max(1,total));
      return(<TouchableOpacity key={i} activeOpacity={0.7}
        onPress={()=>{if(!isFut){setSelDay(ds);setExpandedHabit(null);}}}
        style={[s.dayCard,isT&&{borderColor:brand.gold,borderWidth:2},isSel&&!isT&&{borderColor:brand.blue,borderWidth:2},isFut&&{opacity:.35}]}>
        <View style={s.dcProgress}><View style={s.dcTrack}><View style={[s.dcFill,{height:`${pct}%`,backgroundColor:fill}]}/></View>
          <View style={s.dcOverlay}>{total>0&&<Text style={[s.dcCount,{color:fill}]}>{done}/{total}</Text>}
            <Text style={[s.dcPct,{color:pct>45?'#fff':C.textMuted}]}>{total>0?`${pct}%`:'—'}</Text></View></View>
        <View style={[s.dcLabel,isT&&{backgroundColor:brand.gold+'18'},isSel&&!isT&&{backgroundColor:brand.blue+'12'}]}>
          <Text style={[s.dcDay,isT&&{color:brand.gold},isSel&&!isT&&{color:brand.blue}]}>{DAYS[i]}</Text>
          <Text style={[s.dcNum,isT&&{color:brand.gold},isSel&&!isT&&{color:brand.blue}]}>{d.getDate()}</Text></View>
      </TouchableOpacity>);})}</View>

    {/* Selected day header */}
    <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
      <View>
        <Text style={s.sectionTitle}>{isToday?'Today':selDate.toLocaleDateString('en-US',{weekday:'long',day:'numeric',month:'short'})}</Text>
        {!isToday&&<Text style={{fontSize:10,color:C.textDim}}>Tap today to return</Text>}
      </View>
      <Text style={{fontSize:15,fontWeight:'800',color:doneCount===selHabits.length&&selHabits.length>0?brand.green:C.textMuted}}>
        {doneCount}/{selHabits.length}</Text>
    </View>

    {/* Habit cards for selected day — tap to expand */}
    {!selHabits.length&&<Text style={{color:C.textDim,textAlign:'center',paddingVertical:20,fontSize:12}}>No habits scheduled for this day</Text>}
    {selHabits.map(h=>{const entry=log[selDay]?.[h.id];const done=!!entry?.done;
      const cat=CATS.find(c=>c.id===h.categoryId);const color=cat?.color||brand.green;
      const isExp=expandedHabit===h.id;
      return(<View key={h.id}>
        <TouchableOpacity onPress={()=>setExpandedHabit(isExp?null:h.id)} activeOpacity={0.7}
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
        {isExp&&<HabitDayPanel h={h} ds={selDay} log={log} toggleDay={toggleDay}
          addMinutes={addMinutes} setHabitMinutes={setHabitMinutes} setNote={setNote}
          color={color} bg={cat?.bg} border={cat?.border}/>}
      </View>);
    })}

    {/* ── AD HOC TASKS ── */}
    <AdHocPanel ds={selDay} adHocTasks={adHocTasks} setAdHocTasksForDay={setAdHocTasksForDay}/>
  </View>);
}

// ═══════════════════════════════════════════════════════════════════
// AD HOC TASKS PANEL — quick tasks not tied to any habit/project
// ═══════════════════════════════════════════════════════════════════
function AdHocPanel({ds,adHocTasks,setAdHocTasksForDay}){
  const tasks=adHocTasks[ds]||[];
  const [input,setInput]=useState('');
  const [show,setShow]=useState(false);
  const isToday=ds===fmt(today());

  const addTask=()=>{if(!input.trim())return;
    setAdHocTasksForDay(ds,[...tasks,{id:Date.now().toString(),text:input.trim(),done:false}]);
    setInput('');};
  const toggle=(idx)=>{const t=[...tasks];t[idx]={...t[idx],done:!t[idx].done};setAdHocTasksForDay(ds,t);};
  const del=(idx)=>setAdHocTasksForDay(ds,tasks.filter((_,i)=>i!==idx));

  const doneCnt=tasks.filter(t=>t.done).length;
  const undone=tasks.filter(t=>!t.done);

  return(
    <View style={{marginTop:12}}>
      {/* Header row */}
      <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
        <View style={{flexDirection:'row',alignItems:'center',gap:8}}>
          <Text style={[s.sectionTitle,{fontSize:14}]}>Quick Tasks</Text>
          {tasks.length>0&&<View style={{paddingHorizontal:7,paddingVertical:2,borderRadius:8,
            backgroundColor:doneCnt===tasks.length?brand.green+'20':C.borderLight}}>
            <Text style={{fontSize:10,fontWeight:'700',color:doneCnt===tasks.length?brand.green:C.textDim}}>
              {doneCnt}/{tasks.length}</Text>
          </View>}
        </View>
        <TouchableOpacity onPress={()=>setShow(s=>!s)}
          style={{flexDirection:'row',alignItems:'center',gap:5,paddingHorizontal:10,paddingVertical:6,
            borderRadius:8,backgroundColor:show?brand.gold+'20':brand.gold,borderWidth:1,borderColor:brand.gold}}>
          <Text style={{fontSize:14,fontWeight:'800',color:show?brand.gold:'#fff'}}>{show?'✕':'+' }</Text>
          <Text style={{fontSize:11,fontWeight:'700',color:show?brand.gold:'#fff'}}>Add task</Text>
        </TouchableOpacity>
      </View>

      {/* Add input */}
      {show&&(
        <View style={{flexDirection:'row',gap:8,marginBottom:10}}>
          <TextInput value={input} onChangeText={setInput}
            placeholder="What do you need to do?" placeholderTextColor={C.textDark}
            style={[s.input,{flex:1,marginBottom:0,fontSize:13,paddingVertical:10}]}
            onSubmitEditing={()=>{addTask();}} returnKeyType="done" blurOnSubmit={false} autoFocus/>
          <TouchableOpacity onPress={addTask}
            style={{width:44,height:44,borderRadius:10,backgroundColor:brand.gold,alignItems:'center',justifyContent:'center'}}>
            <Text style={{color:'#fff',fontSize:22,fontWeight:'600',lineHeight:26}}>+</Text>
          </TouchableOpacity>
        </View>)}

      {/* Task list */}
      {tasks.map((t,i)=>(
        <View key={t.id} style={{flexDirection:'row',alignItems:'center',gap:10,marginBottom:6,
          backgroundColor:C.white,borderRadius:9,padding:10,borderWidth:1,
          borderColor:t.done?brand.green+'30':C.border,
          borderLeftWidth:3,borderLeftColor:t.done?brand.green:brand.gold}}>
          <TouchableOpacity onPress={()=>toggle(i)}
            style={{width:22,height:22,borderRadius:6,borderWidth:2,
              borderColor:t.done?brand.green:C.textDark,
              backgroundColor:t.done?brand.green:'#fff',
              alignItems:'center',justifyContent:'center',flexShrink:0}}>
            {t.done&&<Text style={{color:'#fff',fontSize:12,fontWeight:'800'}}>✓</Text>}
          </TouchableOpacity>
          <Text style={{flex:1,fontSize:13,color:t.done?C.textDim:C.text,
            textDecorationLine:t.done?'line-through':'none'}}>{t.text}</Text>
          <TouchableOpacity onPress={()=>del(i)}
            style={{width:24,height:24,borderRadius:12,backgroundColor:'#FEE',alignItems:'center',justifyContent:'center'}}>
            <Text style={{fontSize:12,color:'#C44',fontWeight:'700'}}>✕</Text>
          </TouchableOpacity>
        </View>))}

      {/* If today: show undone tasks from yesterday as reminder */}
      {isToday&&(()=>{
        const yest=new Date(today());yest.setDate(yest.getDate()-1);
        const yds=fmt(yest);
        const yundone=(adHocTasks[yds]||[]).filter(t=>!t.done);
        if(!yundone.length)return null;
        return(<View style={{marginTop:4,padding:10,borderRadius:9,backgroundColor:'#FEF8E6',borderWidth:1,borderColor:brand.gold+'40'}}>
          <Text style={{fontSize:10,fontWeight:'700',color:brand.gold,marginBottom:6}}>⚠️ UNFINISHED FROM YESTERDAY</Text>
          {yundone.map((t,i)=>(
            <View key={t.id||i} style={{flexDirection:'row',alignItems:'center',gap:8,marginBottom:4}}>
              <View style={{width:14,height:14,borderRadius:3,borderWidth:1.5,borderColor:brand.gold,backgroundColor:'#fff'}}/>
              <Text style={{fontSize:12,color:C.textMuted}}>{t.text}</Text>
            </View>))}
        </View>);})()}
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
function ProjDayPanel({pid,ds,projLog,color,setProjMinutes,setProjNote,setProjTasks,onDelete}){
  // Read live from projLog so updates reflect immediately
  const dayData=projLog[ds]?.[pid]||{};
  const dm=dayData.minutes||0;
  const tasks=dayData.tasks||[];
  const [note,setNoteLocal]=React.useState(dayData.notes||'');
  const [savedNote,setSavedNote]=React.useState(dayData.notes||'');
  const [taskInput,setTaskInput]=React.useState('');
  const dateObj=new Date(ds.split('-')[0],parseInt(ds.split('-')[1])-1,ds.split('-')[2]);

  // Sync note if day or project changes
  React.useEffect(()=>{
    const n=projLog[ds]?.[pid]?.notes||'';
    setNoteLocal(n);setSavedNote(n);
  },[ds,pid]);

  const toggleTask=(idx)=>{const t=[...tasks];t[idx]={...t[idx],done:!t[idx].done};setProjTasks(pid,ds,t);};
  const addTask=()=>{if(!taskInput.trim())return;
    setProjTasks(pid,ds,[...tasks,{text:taskInput.trim(),done:false,id:Date.now().toString()}]);
    setTaskInput('');};
  const deleteTask=(idx)=>setProjTasks(pid,ds,tasks.filter((_,i)=>i!==idx));

  return(
    <View style={{backgroundColor:color+'08',borderRadius:10,padding:12,marginTop:4,marginBottom:6,borderWidth:1,borderColor:color+'30'}}>
      <Text style={{fontSize:11,fontWeight:'700',color,marginBottom:10}}>
        {dateObj.toLocaleDateString('en-US',{weekday:'long',day:'numeric',month:'long'})}</Text>

      {/* ── TIME ── */}
      <Text style={{fontSize:10,fontWeight:'700',color:C.textDim,marginBottom:6,letterSpacing:1}}>TIME LOGGED</Text>
      <View style={{flexDirection:'row',alignItems:'center',gap:8,marginBottom:8}}>
        <TouchableOpacity onPress={()=>setProjMinutes(pid,ds,Math.max(0,dm-15))}
          style={{width:44,height:44,borderRadius:22,backgroundColor:'#FEE',borderWidth:1,borderColor:'#FCC',alignItems:'center',justifyContent:'center'}}>
          <Text style={{fontSize:22,fontWeight:'800',color:'#C44'}}>−</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={()=>setProjMinutes(pid,ds,0)}
          style={{flex:1,height:44,borderRadius:10,backgroundColor:C.bg,borderWidth:1,borderColor:C.border,alignItems:'center',justifyContent:'center'}}>
          <Text style={{fontSize:20,fontWeight:'800',color:dm>0?color:C.textDim}}>{dm}m</Text>
          {dm>0&&<Text style={{fontSize:8,color:C.textDim}}>tap to reset</Text>}
        </TouchableOpacity>
        <TouchableOpacity onPress={()=>setProjMinutes(pid,ds,dm+15)}
          style={{width:44,height:44,borderRadius:22,backgroundColor:color+'20',borderWidth:1,borderColor:color+'40',alignItems:'center',justifyContent:'center'}}>
          <Text style={{fontSize:22,fontWeight:'800',color}}>+</Text>
        </TouchableOpacity>
      </View>
      <View style={{flexDirection:'row',gap:5,marginBottom:14}}>
        {[0,15,30,60,90,120].map(v=>(
          <TouchableOpacity key={v} onPress={()=>setProjMinutes(pid,ds,v)}
            style={{flex:1,paddingVertical:6,borderRadius:7,
              backgroundColor:dm===v?color+'25':C.bg,
              borderWidth:1,borderColor:dm===v?color+'60':C.border,alignItems:'center'}}>
            <Text style={{fontSize:9,fontWeight:'700',color:dm===v?color:C.textDim}}>{v===0?'0':v+'m'}</Text>
          </TouchableOpacity>))}
      </View>

      {/* ── TASKS ── */}
      <Text style={{fontSize:10,fontWeight:'700',color:C.textDim,marginBottom:8,letterSpacing:1}}>TASKS</Text>
      {tasks.map((t,i)=>(
        <View key={t.id||i} style={{flexDirection:'row',alignItems:'center',gap:10,marginBottom:8,
          backgroundColor:'#fff',borderRadius:8,padding:8,borderWidth:1,borderColor:C.border}}>
          <TouchableOpacity onPress={()=>toggleTask(i)}
            style={{width:22,height:22,borderRadius:6,borderWidth:2,
              borderColor:t.done?color:C.textDark,
              backgroundColor:t.done?color:'#fff',
              alignItems:'center',justifyContent:'center',flexShrink:0}}>
            {t.done&&<Text style={{color:'#fff',fontSize:12,fontWeight:'800'}}>✓</Text>}
          </TouchableOpacity>
          <Text style={{flex:1,fontSize:13,color:t.done?C.textDim:C.text,
            textDecorationLine:t.done?'line-through':'none'}}>{t.text}</Text>
          <TouchableOpacity onPress={()=>deleteTask(i)}
            style={{width:26,height:26,borderRadius:13,backgroundColor:'#FEE',alignItems:'center',justifyContent:'center'}}>
            <Text style={{fontSize:13,color:'#C44',fontWeight:'700'}}>✕</Text>
          </TouchableOpacity>
        </View>))}
      {tasks.length===0&&(
        <Text style={{fontSize:11,color:C.textDim,textAlign:'center',paddingVertical:6,marginBottom:8}}>No tasks yet</Text>)}
      <View style={{flexDirection:'row',gap:8,marginBottom:14}}>
        <TextInput value={taskInput} onChangeText={setTaskInput}
          placeholder="Add a task..." placeholderTextColor={C.textDark}
          style={[s.input,{flex:1,marginBottom:0,fontSize:13,paddingVertical:9}]}
          onSubmitEditing={addTask} returnKeyType="done" blurOnSubmit={false}/>
        <TouchableOpacity onPress={addTask}
          style={{width:44,height:44,borderRadius:10,backgroundColor:color,alignItems:'center',justifyContent:'center'}}>
          <Text style={{color:'#fff',fontSize:24,fontWeight:'600',lineHeight:28}}>+</Text>
        </TouchableOpacity>
      </View>

      {/* ── NOTES ── */}
      <Text style={{fontSize:10,fontWeight:'700',color:C.textDim,marginBottom:6,letterSpacing:1}}>NOTES</Text>
      <TextInput value={note} onChangeText={setNoteLocal}
        placeholder="Notes for this day..." placeholderTextColor={C.textDark}
        style={[s.input,{minHeight:70,textAlignVertical:'top',marginBottom:8}]} multiline/>
      {note!==savedNote&&(
        <TouchableOpacity onPress={()=>{setProjNote(pid,ds,note);setSavedNote(note);}}
          style={{padding:11,borderRadius:9,backgroundColor:color,alignItems:'center',marginBottom:8}}>
          <Text style={{fontSize:13,fontWeight:'700',color:'#fff'}}>Save Note</Text>
        </TouchableOpacity>)}

      {/* ── DELETE ── */}
      {onDelete&&(
        <TouchableOpacity onPress={onDelete}
          style={{padding:9,borderRadius:8,backgroundColor:'#FEE',alignItems:'center',borderWidth:1,borderColor:'#FCC',marginTop:2}}>
          <Text style={{fontSize:12,fontWeight:'600',color:'#C44'}}>🗑 Delete project</Text>
        </TouchableOpacity>)}
    </View>);
}


// ═══════════════════════════════════════════════════════════════════
// PROJECTS TAB — same layout as Home: week strip + day detail
// ═══════════════════════════════════════════════════════════════════
function ProjectsTab({projects,setProjects,projLog,addProjMinutes,setProjNote,setProjMinutes,setProjTasks,todayStr}){
  const [showAdd,setShowAdd]=useState(false);
  const [name,setName]=useState('');const [color,setColor]=useState(brand.blue);
  const [weekOff,setWeekOff]=useState(0);
  const [selDay,setSelDay]=useState(todayStr);
  const [expandedProj,setExpandedProj]=useState(null);
  const PCOLORS=[brand.blue,brand.green,brand.gold,'#E8956B','#9B7ED4','#5CB8D6'];
  const weekDates=useMemo(()=>getWeekDates(weekOff),[weekOff]);
  const isToday=selDay===todayStr;
  const selDate=new Date(selDay.split('-')[0],parseInt(selDay.split('-')[1])-1,selDay.split('-')[2]);

  const addProject=()=>{if(!name.trim())return;
    setProjects(p=>[...p,{id:Date.now().toString(),name:name.trim(),color,startDate:todayStr,status:'active'}]);
    setName('');setShowAdd(false);};

  // Summary for each project on selected day
  const dayMins=(pid)=>projLog[selDay]?.[pid]?.minutes||0;
  const dayTasks=(pid)=>projLog[selDay]?.[pid]?.tasks||[];
  const doneTasks=(pid)=>dayTasks(pid).filter(t=>t.done).length;

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

    {projects.length>0&&(<>
      {/* Week nav */}
      <View style={s.weekNav}>
        <TouchableOpacity onPress={()=>{setWeekOff(w=>w-1);setExpandedProj(null);}} style={s.navBtn}><Text style={s.navBtnT}>◂</Text></TouchableOpacity>
        <Text style={s.weekLabel}>{weekOff===0?'This week':
          `${weekDates[0].toLocaleDateString('en-US',{day:'numeric',month:'short'})} – ${weekDates[6].toLocaleDateString('en-US',{day:'numeric',month:'short'})}`}</Text>
        <TouchableOpacity onPress={()=>setWeekOff(w=>Math.min(0,w+1))} style={[s.navBtn,weekOff>=0&&{opacity:.3}]} disabled={weekOff>=0}>
          <Text style={s.navBtnT}>▸</Text></TouchableOpacity></View>

      {/* 7 Day Cards — show total minutes per day across all projects */}
      <View style={s.cardsRow}>{weekDates.map((d,i)=>{
        const ds=fmt(d);const isT=ds===todayStr;const isFut=d>today();const isSel=ds===selDay;
        const totalMins=projects.reduce((sum,p)=>sum+(projLog[ds]?.[p.id]?.minutes||0),0);
        const totalTasks=projects.reduce((sum,p)=>sum+(projLog[ds]?.[p.id]?.tasks||[]).length,0);
        const doneTks=projects.reduce((sum,p)=>sum+(projLog[ds]?.[p.id]?.tasks||[]).filter(t=>t.done).length,0);
        const pct=totalMins>0?Math.min(100,Math.round(totalMins/120*100)):0;
        const fill=totalMins>0?brand.blue:C.textDark;
        return(<TouchableOpacity key={i} activeOpacity={0.7}
          onPress={()=>{if(!isFut){setSelDay(ds);setExpandedProj(null);}}}
          style={[s.dayCard,isT&&{borderColor:brand.gold,borderWidth:2},isSel&&!isT&&{borderColor:brand.blue,borderWidth:2},isFut&&{opacity:.35}]}>
          <View style={s.dcProgress}><View style={s.dcTrack}>
            <View style={[s.dcFill,{height:`${pct}%`,backgroundColor:totalMins>0?brand.blue:C.borderLight}]}/></View>
            <View style={s.dcOverlay}>
              {totalMins>0&&<Text style={[s.dcCount,{color:brand.blue}]}>{totalMins}m</Text>}
              {totalTasks>0&&<Text style={[s.dcPct,{color:pct>45?'#fff':C.textMuted,fontSize:9}]}>{doneTks}/{totalTasks}</Text>}
              {totalMins===0&&totalTasks===0&&<Text style={[s.dcPct,{color:C.textMuted}]}>—</Text>}
            </View></View>
          <View style={[s.dcLabel,isT&&{backgroundColor:brand.gold+'18'},isSel&&!isT&&{backgroundColor:brand.blue+'12'}]}>
            <Text style={[s.dcDay,isT&&{color:brand.gold},isSel&&!isT&&{color:brand.blue}]}>{DAYS[i]}</Text>
            <Text style={[s.dcNum,isT&&{color:brand.gold},isSel&&!isT&&{color:brand.blue}]}>{d.getDate()}</Text></View>
        </TouchableOpacity>);})}</View>

      {/* Selected day header */}
      <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
        <View>
          <Text style={s.sectionTitle}>{isToday?'Today':selDate.toLocaleDateString('en-US',{weekday:'long',day:'numeric',month:'short'})}</Text>
          {!isToday&&<Text style={{fontSize:10,color:C.textDim}}>Tap today to return</Text>}
        </View>
        <Text style={{fontSize:12,fontWeight:'700',color:C.textDim}}>
          {projects.reduce((sum,p)=>sum+dayMins(p.id),0)}m logged</Text>
      </View>

      {/* Project cards for selected day */}
      {projects.map(p=>{
        const isExp=expandedProj===p.id;
        const dm=dayMins(p.id);const tasks=dayTasks(p.id);const done=doneTasks(p.id);
        const totalMins=Object.values(projLog).reduce((sum,day)=>sum+(day[p.id]?.minutes||0),0);
        return(<View key={p.id}>
          <TouchableOpacity onPress={()=>setExpandedProj(isExp?null:p.id)} activeOpacity={0.7}
            style={[s.thinCard,{borderLeftWidth:3,borderLeftColor:p.color},dm>0&&{backgroundColor:p.color+'10'}]}>
            <View style={{width:22,height:22,borderRadius:11,borderWidth:2,
              borderColor:dm>0?p.color:C.textDark,backgroundColor:dm>0?p.color:'#fff',
              justifyContent:'center',alignItems:'center',marginRight:8}}>
              {dm>0&&<Text style={{color:'#fff',fontSize:9,fontWeight:'800'}}>{dm}m</Text>}
            </View>
            <View style={{flex:1}}>
              <Text style={[s.thinName]}>{p.name}</Text>
              <Text style={{fontSize:9,color:C.textDim,marginTop:1}}>
                {dm>0?`${dm}m today · `:'No time today · '}{Math.round(totalMins/60*10)/10}h total
                {tasks.length>0?` · ${done}/${tasks.length} tasks`:''}
              </Text>
            </View>
            <Text style={{fontSize:14,color:C.textDark,paddingHorizontal:6}}>{isExp?'▾':'▸'}</Text>
          </TouchableOpacity>
          {isExp&&<ProjDayPanel pid={p.id} ds={selDay} projLog={projLog}
            color={p.color}
            setProjMinutes={setProjMinutes}
            setProjNote={setProjNote} setProjTasks={setProjTasks}
            onDelete={()=>Alert.alert('Delete',`Delete "${p.name}"?`,[{text:'Cancel',style:'cancel'},
              {text:'Delete',style:'destructive',onPress:()=>{setExpandedProj(null);setProjects(pr=>pr.filter(x=>x.id!==p.id));}}])}
          />}
        </View>);})}
    </>)}
  </View>);
}

// ═══════════════════════════════════════════════════════════════════
// STATS TAB — week view default, expandable to month
// ═══════════════════════════════════════════════════════════════════
function StatsTab({habits,log,projects,projLog,adHocTasks}){
  const [weekOff,setWeekOff]=useState(0);
  const [expandHabits,setExpandHabits]=useState(false);
  const [expandProjects,setExpandProjects]=useState(false);
  const [selMonth,setSelMonth]=useState(today().getMonth());
  const [selYear,setSelYear]=useState(today().getFullYear());
  const [detailDay,setDetailDay]=useState(null);
  const [projDetailDay,setProjDetailDay]=useState(null);
  const [projWeekOff,setProjWeekOff]=useState(0);
  const weekDates=useMemo(()=>getWeekDates(weekOff),[weekOff]);
  const projWeekDates=useMemo(()=>getWeekDates(projWeekOff),[projWeekOff]);
  const monthDates=useMemo(()=>getMonthDates(selYear,selMonth),[selYear,selMonth]);
  const MN=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const todayStr=fmt(today());

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

  const HabitDayCell=({d,ds,size=32})=>{
    const dayLog=log[ds]||{};const isToday=ds===todayStr;
    const dayIdx=d.getDay()===0?6:d.getDay()-1;
    const active=habits.filter(h=>h.frequency==='daily'||(h.frequency==='weekly'&&(h.selectedDays||[]).includes(dayIdx)));
    const done=active.filter(h=>dayLog[h.id]?.done).length;
    const ratio=active.length>0?done/active.length:0;
    const isSel=detailDay===ds;
    return(<TouchableOpacity onPress={()=>setDetailDay(isSel?null:ds)}
      style={{flex:1,height:size,borderRadius:6,justifyContent:'center',alignItems:'center',
        backgroundColor:ratio>=1?brand.green+'30':ratio>=0.5?brand.gold+'25':ratio>0?'#E8956B20':C.bg,
        borderWidth:isToday?2:(isSel?2:1),borderColor:isToday?brand.gold:(isSel?brand.blue:C.borderLight)}}>
      <Text style={{fontSize:9,fontWeight:'700',color:ratio>=0.5?compColor(ratio):C.textDim}}>{d.getDate()}</Text>
      {ratio>=1&&<Text style={{fontSize:6}}>✓</Text>}
    </TouchableOpacity>);
  };

  return(<View>
    {/* ── HABITS ── */}
    {habits.length>0&&(<View style={s.statsCard}>
      <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
        <Text style={s.statsTitle}>📅 Habit Completion</Text>
        <TouchableOpacity onPress={()=>{setExpandHabits(e=>!e);setDetailDay(null);}}
          style={{paddingHorizontal:10,paddingVertical:4,borderRadius:8,backgroundColor:expandHabits?brand.blue+'15':C.bg,borderWidth:1,borderColor:expandHabits?brand.blue:C.border}}>
          <Text style={{fontSize:10,fontWeight:'700',color:expandHabits?brand.blue:C.textDim}}>{expandHabits?'Week view':'Month view'}</Text>
        </TouchableOpacity>
      </View>

      {!expandHabits&&(<>
        {/* Week nav */}
        <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
          <TouchableOpacity onPress={()=>setWeekOff(w=>w-1)} style={s.navBtn}><Text style={s.navBtnT}>◂</Text></TouchableOpacity>
          <Text style={{fontSize:11,fontWeight:'600',color:C.textDim}}>
            {weekOff===0?'This week':`${weekDates[0].toLocaleDateString('en-US',{day:'numeric',month:'short'})} – ${weekDates[6].toLocaleDateString('en-US',{day:'numeric',month:'short'})}`}
          </Text>
          <TouchableOpacity onPress={()=>setWeekOff(w=>Math.min(0,w+1))} style={[s.navBtn,weekOff>=0&&{opacity:.3}]} disabled={weekOff>=0}><Text style={s.navBtnT}>▸</Text></TouchableOpacity>
        </View>
        <View style={{flexDirection:'row',marginBottom:4}}>
          {DAYS.map(d=>(<View key={d} style={{flex:1,alignItems:'center'}}><Text style={{fontSize:9,fontWeight:'700',color:C.textDim}}>{d}</Text></View>))}</View>
        <View style={{flexDirection:'row',gap:3,marginBottom:3}}>
          {weekDates.map((d,i)=><HabitDayCell key={i} d={d} ds={fmt(d)} size={36}/>)}
        </View>
      </>)}

      {expandHabits&&(<>
        <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
          <TouchableOpacity onPress={()=>{if(selMonth===0){setSelMonth(11);setSelYear(y=>y-1);}else setSelMonth(m=>m-1);}} style={s.navBtn}><Text style={s.navBtnT}>◂</Text></TouchableOpacity>
          <Text style={{fontSize:14,fontWeight:'700',color:C.text}}>{MN[selMonth]} {selYear}</Text>
          <TouchableOpacity onPress={()=>{if(selMonth===11){setSelMonth(0);setSelYear(y=>y+1);}else setSelMonth(m=>m+1);}} style={s.navBtn}><Text style={s.navBtnT}>▸</Text></TouchableOpacity>
        </View>
        <View style={{flexDirection:'row',marginBottom:4}}>
          {DAYS.map(d=>(<View key={d} style={{flex:1,alignItems:'center'}}><Text style={{fontSize:9,fontWeight:'700',color:C.textDim}}>{d}</Text></View>))}</View>
        {calGrid.map((row,ri)=>(
          <View key={ri} style={{flexDirection:'row',gap:3,marginBottom:3}}>
            {row.map((d,ci)=>!d?<View key={ci} style={{flex:1,height:32}}/>:<HabitDayCell key={ci} d={d} ds={fmt(d)}/>)}
          </View>))}
        <View style={{flexDirection:'row',justifyContent:'center',gap:12,marginTop:8}}>
          {[{c:brand.green+'30',l:'100%'},{c:brand.gold+'25',l:'50%+'},{c:'#E8956B20',l:'<50%'},{c:C.bg,l:'0%'}].map(({c,l})=>(
            <View key={l} style={{flexDirection:'row',alignItems:'center',gap:4}}>
              <View style={{width:12,height:12,borderRadius:3,backgroundColor:c,borderWidth:1,borderColor:C.border}}/>
              <Text style={{fontSize:8,color:C.textDim}}>{l}</Text></View>))}
        </View>
      </>)}

      {/* Detail for selected day */}
      {detailDay&&(()=>{const dayLog=log[detailDay]||{};const dp=detailDay.split('-');const d=new Date(dp[0],parseInt(dp[1])-1,dp[2]);
        return(<View style={{marginTop:10,padding:12,backgroundColor:C.bg,borderRadius:10}}>
          <Text style={{fontSize:13,fontWeight:'700',color:C.text,marginBottom:6}}>
            {d.toLocaleDateString('en-US',{weekday:'long',day:'numeric',month:'long'})}</Text>
          {!habits.some(h=>dayLog[h.id]?.done||dayLog[h.id]?.minutes||dayLog[h.id]?.notes)&&
            <Text style={{fontSize:11,color:C.textDim}}>No data for this day</Text>}
          {habits.map(h=>{const e=dayLog[h.id];if(!e?.done&&!e?.minutes&&!e?.notes)return null;
            return(<View key={h.id} style={{marginBottom:6}}>
              <View style={{flexDirection:'row',alignItems:'center',gap:6}}>
                <Text style={{fontSize:11,color:e?.done?brand.green:C.textDim}}>{e?.done?'✓':'○'}</Text>
                <Text style={{fontSize:12,fontWeight:'600',color:C.text}}>{h.icon} {h.name}</Text>
                {h.type==='timer'&&<Text style={{fontSize:10,color:C.textDim}}>{e?.minutes||0}m</Text>}
              </View>
              {e?.notes&&<Text style={{fontSize:10,color:brand.blue,marginLeft:20,marginTop:2}}>📝 {e.notes}</Text>}
            </View>);})}
          {(()=>{const qt=adHocTasks?.[detailDay]||[];if(!qt.length)return null;
            const done=qt.filter(t=>t.done).length;
            return(<View style={{marginTop:8,paddingTop:8,borderTopWidth:1,borderTopColor:C.border}}>
              <View style={{flexDirection:'row',alignItems:'center',gap:6,marginBottom:6}}>
                <Text style={{fontSize:11,fontWeight:'700',color:brand.gold}}>⚡ Quick Tasks</Text>
                <Text style={{fontSize:10,color:done===qt.length?brand.green:C.textDim,fontWeight:'700'}}>{done}/{qt.length}</Text>
              </View>
              {qt.map((t,i)=>(
                <View key={t.id||i} style={{flexDirection:'row',alignItems:'center',gap:6,marginBottom:4}}>
                  <View style={{width:14,height:14,borderRadius:3,borderWidth:1.5,
                    borderColor:t.done?brand.green:C.border,backgroundColor:t.done?brand.green:'#fff',
                    alignItems:'center',justifyContent:'center'}}>
                    {t.done&&<Text style={{color:'#fff',fontSize:8,fontWeight:'800'}}>✓</Text>}
                  </View>
                  <Text style={{flex:1,fontSize:12,color:t.done?C.textDim:C.text,
                    textDecorationLine:t.done?'line-through':'none'}}>{t.text}</Text>
                </View>))}
            </View>);})()}
        </View>)})()}
    </View>)}

    {/* ── PROJECTS ── */}
    {projects.length>0&&(<View style={s.statsCard}>
      <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
        <Text style={s.statsTitle}>📁 Project Status</Text>
        <TouchableOpacity onPress={()=>{setExpandProjects(e=>!e);setProjDetailDay(null);}}
          style={{paddingHorizontal:10,paddingVertical:4,borderRadius:8,backgroundColor:expandProjects?brand.blue+'15':C.bg,borderWidth:1,borderColor:expandProjects?brand.blue:C.border}}>
          <Text style={{fontSize:10,fontWeight:'700',color:expandProjects?brand.blue:C.textDim}}>{expandProjects?'Week view':'Month view'}</Text>
        </TouchableOpacity>
      </View>

      {/* Week nav (week view only) */}
      {!expandProjects&&(
        <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
          <TouchableOpacity onPress={()=>{setProjWeekOff(w=>w-1);setProjDetailDay(null);}} style={s.navBtn}><Text style={s.navBtnT}>◂</Text></TouchableOpacity>
          <Text style={{fontSize:11,fontWeight:'600',color:C.textDim}}>
            {projWeekOff===0?'This week':`${projWeekDates[0].toLocaleDateString('en-US',{day:'numeric',month:'short'})} – ${projWeekDates[6].toLocaleDateString('en-US',{day:'numeric',month:'short'})}`}
          </Text>
          <TouchableOpacity onPress={()=>setProjWeekOff(w=>Math.min(0,w+1))} style={[s.navBtn,projWeekOff>=0&&{opacity:.3}]} disabled={projWeekOff>=0}><Text style={s.navBtnT}>▸</Text></TouchableOpacity>
        </View>)}

      {/* Month nav (month view only) */}
      {expandProjects&&(
        <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
          <TouchableOpacity onPress={()=>{if(selMonth===0){setSelMonth(11);setSelYear(y=>y-1);}else setSelMonth(m=>m-1);setProjDetailDay(null);}} style={s.navBtn}><Text style={s.navBtnT}>◂</Text></TouchableOpacity>
          <Text style={{fontSize:14,fontWeight:'700',color:C.text}}>{MN[selMonth]} {selYear}</Text>
          <TouchableOpacity onPress={()=>{if(selMonth===11){setSelMonth(0);setSelYear(y=>y+1);}else setSelMonth(m=>m+1);setProjDetailDay(null);}} style={s.navBtn}><Text style={s.navBtnT}>▸</Text></TouchableOpacity>
        </View>)}

      {/* Day headers */}
      <View style={{flexDirection:'row',marginBottom:4}}>
        {DAYS.map(d=>(<View key={d} style={{flex:1,alignItems:'center'}}><Text style={{fontSize:9,fontWeight:'700',color:C.textDim}}>{d}</Text></View>))}</View>

      {/* Week view: single row of 7 cells */}
      {!expandProjects&&(
        <View style={{flexDirection:'row',gap:3,marginBottom:4}}>
          {projWeekDates.map((d,i)=>{
            const ds=fmt(d);const isToday=ds===todayStr;const isSel=projDetailDay===ds;
            const totalMins=projects.reduce((sum,p)=>sum+(projLog[ds]?.[p.id]?.minutes||0),0);
            const hasAny=totalMins>0||projects.some(p=>(projLog[ds]?.[p.id]?.tasks||[]).length>0);
            const pct=Math.min(100,totalMins/120*100);
            return(<TouchableOpacity key={i} onPress={()=>setProjDetailDay(isSel?null:ds)}
              style={{flex:1,height:36,borderRadius:6,justifyContent:'center',alignItems:'center',overflow:'hidden',
                backgroundColor:hasAny?brand.blue+'20':C.bg,
                borderWidth:isToday?2:(isSel?2:1),borderColor:isToday?brand.gold:(isSel?brand.blue:C.borderLight)}}>
              {totalMins>0&&<View style={{position:'absolute',bottom:0,left:0,right:0,
                height:`${pct}%`,backgroundColor:brand.blue+'40',borderRadius:5}}/>}
              <Text style={{fontSize:9,fontWeight:'700',color:totalMins>0?brand.blue:C.textDim,zIndex:1}}>{d.getDate()}</Text>
              {totalMins>0&&<Text style={{fontSize:6,fontWeight:'700',color:brand.blue,zIndex:1}}>{totalMins}m</Text>}
            </TouchableOpacity>);})}
        </View>)}

      {/* Month view: full calendar grid */}
      {expandProjects&&(
        <>
          {calGrid.map((row,ri)=>(
            <View key={ri} style={{flexDirection:'row',gap:3,marginBottom:3}}>
              {row.map((d,ci)=>{
                if(!d)return<View key={ci} style={{flex:1,height:32}}/>;
                const ds=fmt(d);const isToday=ds===todayStr;const isSel=projDetailDay===ds;
                const totalMins=projects.reduce((sum,p)=>sum+(projLog[ds]?.[p.id]?.minutes||0),0);
                const hasAny=totalMins>0||projects.some(p=>(projLog[ds]?.[p.id]?.tasks||[]).length>0);
                const pct=Math.min(100,totalMins/120*100);
                return(<TouchableOpacity key={ci} onPress={()=>setProjDetailDay(isSel?null:ds)}
                  style={{flex:1,height:32,borderRadius:6,justifyContent:'center',alignItems:'center',overflow:'hidden',
                    backgroundColor:hasAny?brand.blue+'20':C.bg,
                    borderWidth:isToday?2:(isSel?2:1),borderColor:isToday?brand.gold:(isSel?brand.blue:C.borderLight)}}>
                  {totalMins>0&&<View style={{position:'absolute',bottom:0,left:0,right:0,
                    height:`${pct}%`,backgroundColor:brand.blue+'40',borderRadius:5}}/>}
                  <Text style={{fontSize:9,fontWeight:'700',color:totalMins>0?brand.blue:C.textDim,zIndex:1}}>{d.getDate()}</Text>
                  {totalMins>0&&<Text style={{fontSize:6,fontWeight:'700',color:brand.blue,zIndex:1}}>{totalMins}m</Text>}
                </TouchableOpacity>);
              })}
            </View>))}
          <View style={{flexDirection:'row',justifyContent:'center',gap:12,marginTop:8}}>
            {[{c:brand.blue+'40',l:'120m+'},{c:brand.blue+'20',l:'any time'},{c:C.bg,l:'nothing'}].map(({c,l})=>(
              <View key={l} style={{flexDirection:'row',alignItems:'center',gap:4}}>
                <View style={{width:12,height:12,borderRadius:3,backgroundColor:c,borderWidth:1,borderColor:C.border}}/>
                <Text style={{fontSize:8,color:C.textDim}}>{l}</Text></View>))}
          </View>
        </>)}

      {/* Detail panel for selected day */}
      {projDetailDay&&(()=>{
        const dp=projDetailDay.split('-');
        const d=new Date(dp[0],parseInt(dp[1])-1,dp[2]);
        const isToday=projDetailDay===todayStr;
        return(<View style={{marginTop:10,padding:12,backgroundColor:C.bg,borderRadius:10}}>
          <Text style={{fontSize:13,fontWeight:'700',color:C.text,marginBottom:8}}>
            {d.toLocaleDateString('en-US',{weekday:'long',day:'numeric',month:'long'})}</Text>
          {projects.map(p=>{
            const dm=projLog[projDetailDay]?.[p.id]?.minutes||0;
            const tasks=projLog[projDetailDay]?.[p.id]?.tasks||[];
            // For today: also pull in any tasks from today that are undone
            const todayTasks=isToday?(projLog[todayStr]?.[p.id]?.tasks||[]):[];
            const displayTasks=isToday?todayTasks:tasks;
            if(dm===0&&displayTasks.length===0)return null;
            const doneCnt=displayTasks.filter(t=>t.done).length;
            return(<View key={p.id} style={{marginBottom:10}}>
              {/* Project header */}
              <View style={{flexDirection:'row',alignItems:'center',gap:8,marginBottom:6}}>
                <View style={{width:10,height:10,borderRadius:5,backgroundColor:p.color}}/>
                <Text style={{fontSize:13,fontWeight:'700',color:C.text,flex:1}}>{p.name}</Text>
                {dm>0&&<View style={{paddingHorizontal:8,paddingVertical:3,borderRadius:6,backgroundColor:p.color+'20',borderWidth:1,borderColor:p.color+'40'}}>
                  <Text style={{fontSize:11,fontWeight:'800',color:p.color}}>{dm}m</Text></View>}
                {displayTasks.length>0&&<Text style={{fontSize:11,color:doneCnt===displayTasks.length?brand.green:C.textDim,fontWeight:'700'}}>
                  {doneCnt}/{displayTasks.length} tasks</Text>}
              </View>
              {/* Tasks */}
              {displayTasks.map((t,i)=>(
                <View key={t.id||i} style={{flexDirection:'row',alignItems:'center',gap:8,marginBottom:4,marginLeft:18}}>
                  <View style={{width:16,height:16,borderRadius:4,borderWidth:1.5,
                    borderColor:t.done?p.color:C.border,backgroundColor:t.done?p.color:'#fff',
                    alignItems:'center',justifyContent:'center'}}>
                    {t.done&&<Text style={{color:'#fff',fontSize:9,fontWeight:'800'}}>✓</Text>}
                  </View>
                  <Text style={{flex:1,fontSize:12,color:t.done?C.textDim:C.text,
                    textDecorationLine:t.done?'line-through':'none'}}>{t.text}</Text>
                </View>))}
              {/* Notes */}
              {(()=>{const noteText=projLog[projDetailDay]?.[p.id]?.notes;
                return noteText?(<View style={{marginLeft:18,marginTop:4,marginBottom:2}}>
                  <Text style={{fontSize:11,color:brand.blue}}>📝 {noteText}</Text>
                </View>):null;})()}
            </View>);})}
          {!projects.some(p=>{
            const dm=projLog[projDetailDay]?.[p.id]?.minutes||0;
            const tasks=isToday?(projLog[todayStr]?.[p.id]?.tasks||[]):(projLog[projDetailDay]?.[p.id]?.tasks||[]);
            return dm>0||tasks.length>0;})&&
            <Text style={{fontSize:11,color:C.textDim}}>No data for this day</Text>}
        </View>)})()}
    </View>)}
  </View>);
}

// ═══════════════════════════════════════════════════════════════════
// TIME PICKER — simple HH:MM picker
// ═══════════════════════════════════════════════════════════════════
function TimePicker({value,onChange,color}){
  const [h,setH]=useState(value?parseInt(value.split(':')[0]):20);
  const [m,setM]=useState(value?parseInt(value.split(':')[1]):0);
  const pad=n=>String(n).padStart(2,'0');
  const update=(nh,nm)=>{setH(nh);setM(nm);onChange(`${pad(nh)}:${pad(nm)}`);};
  return(
    <View style={{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:4}}>
      <TouchableOpacity onPress={()=>update((h+23)%24,m)} style={{padding:6}}><Text style={{color:C.textDim,fontSize:16}}>▲</Text></TouchableOpacity>
      <View style={{width:44,height:36,borderRadius:8,backgroundColor:color+'15',borderWidth:1,borderColor:color+'40',alignItems:'center',justifyContent:'center'}}>
        <Text style={{fontSize:16,fontWeight:'800',color}}>{pad(h)}</Text></View>
      <Text style={{fontSize:18,fontWeight:'700',color:C.textDim}}>:</Text>
      <View style={{width:44,height:36,borderRadius:8,backgroundColor:color+'15',borderWidth:1,borderColor:color+'40',alignItems:'center',justifyContent:'center'}}>
        <Text style={{fontSize:16,fontWeight:'800',color}}>{pad(m)}</Text></View>
      <TouchableOpacity onPress={()=>update(h,(m+55)%60)} style={{padding:6}}><Text style={{color:C.textDim,fontSize:16}}>▲</Text></TouchableOpacity>
      <View style={{width:2,height:36}}/>
      <TouchableOpacity onPress={()=>update((h+1)%24,m)} style={{padding:6}}><Text style={{color:C.textDim,fontSize:16}}>▼</Text></TouchableOpacity>
      <View style={{width:44}}/>
      <TouchableOpacity onPress={()=>update(h,(m+5)%60)} style={{padding:6}}><Text style={{color:C.textDim,fontSize:16}}>▼</Text></TouchableOpacity>
    </View>);
}

// ═══════════════════════════════════════════════════════════════════
// SETTINGS TAB
// ═══════════════════════════════════════════════════════════════════
function SettingsTab({habits,log,projects,projLog,setHabits,setLog,setProjects,setProjLog,adHocTasks,setAdHocTasks,scheduleDailyReminder,cancelDailyReminder}){
  const [reminderEnabled,setReminderEnabled]=useState(false);
  const [reminderTime,setReminderTime]=useState('20:00');
  const [reminderSaved,setReminderSaved]=useState(false);

  React.useEffect(()=>{
    ld('pv-daily-reminder',null).then(r=>{if(r){setReminderEnabled(r.enabled);setReminderTime(r.time);setReminderSaved(r.enabled);}});
  },[]);

  const saveGlobalReminder=async(enabled,time)=>{
    await sv('pv-daily-reminder',{enabled,time});
    setReminderEnabled(enabled);setReminderTime(time);setReminderSaved(enabled);
    if(enabled)scheduleDailyReminder(time);else cancelDailyReminder();
  };

  const handleBackup=async()=>{
    try{
      const data=JSON.stringify({habits,log,projects,projLog,adHocTasks,exportDate:new Date().toISOString(),app:'PruvYou'},null,2);
      const path=FileSystem.cacheDirectory+'pruvyou_backup_'+fmt(today())+'.json';
      await FileSystem.writeAsStringAsync(path,data);
      await Sharing.shareAsync(path,{mimeType:'application/json',dialogTitle:'Save PruvYou Backup',UTI:'public.json'});
    }catch(e){Alert.alert('Backup failed',e?.message||'Could not share file');}
  };
  const handleRestore=async()=>{
    try{const result=await DocumentPicker.getDocumentAsync({type:'application/json'});if(result.canceled)return;
      const fc=await FileSystem.readAsStringAsync(result.assets[0].uri);const data=JSON.parse(fc);
      if(data.app==='PruvYou'){Alert.alert('Restore','Found '+data.habits?.length+' habits, '+(data.projects?.length||0)+' projects. Restore?',[
        {text:'Cancel',style:'cancel'},{text:'Restore',onPress:()=>{
          if(data.habits)setHabits(data.habits);if(data.log)setLog(data.log);
          if(data.projects)setProjects(data.projects);if(data.projLog)setProjLog(data.projLog);
          if(data.adHocTasks)setAdHocTasks(data.adHocTasks);
          Alert.alert('Done','Data restored!');}}]);}
    }catch{Alert.alert('Error','Could not read file');}};

  return(<View>
    {/* Reminder */}
    <View style={s.statsCard}>
      <Text style={s.statsTitle}>🔔 Daily Reminder</Text>
      <Text style={{fontSize:11,color:C.textDim,marginBottom:14}}>Get one daily notification to remember to log your habits and tasks.</Text>
      <View style={{flexDirection:'row',alignItems:'center',gap:12,marginBottom:14,padding:12,
        borderRadius:10,backgroundColor:reminderSaved?brand.blue+'10':C.bg,borderWidth:1,borderColor:reminderSaved?brand.blue+'40':C.border}}>
        <Text style={{fontSize:28}}>⏰</Text>
        <View style={{flex:1}}>
          <Text style={{fontSize:13,fontWeight:'700',color:C.text}}>Daily reminder</Text>
          <Text style={{fontSize:11,color:reminderSaved?brand.blue:C.textDim}}>
            {reminderSaved?`🔔 Every day at ${reminderTime}`:'Not set'}</Text>
        </View>
        {reminderSaved&&<View style={{width:8,height:8,borderRadius:4,backgroundColor:brand.blue}}/>}
      </View>
      <Text style={{fontSize:10,fontWeight:'700',color:C.textDim,marginBottom:8,letterSpacing:1}}>REMINDER TIME</Text>
      <TimePicker value={reminderTime} onChange={setReminderTime} color={brand.blue}/>
      <Text style={{fontSize:11,color:C.textDim,textAlign:'center',marginTop:6,marginBottom:14}}>Every day at {reminderTime}</Text>
      <View style={{flexDirection:'row',gap:8}}>
        {reminderSaved&&(
          <TouchableOpacity onPress={()=>saveGlobalReminder(false,reminderTime)}
            style={{flex:1,padding:11,borderRadius:9,backgroundColor:'#FEE',alignItems:'center',borderWidth:1,borderColor:'#FCC'}}>
            <Text style={{fontSize:13,fontWeight:'600',color:'#C44'}}>🔕 Remove</Text>
          </TouchableOpacity>)}
        <TouchableOpacity onPress={()=>saveGlobalReminder(true,reminderTime)}
          style={{flex:1,padding:11,borderRadius:9,backgroundColor:brand.blue,alignItems:'center'}}>
          <Text style={{fontSize:13,fontWeight:'700',color:'#fff'}}>🔔 {reminderSaved?'Update':'Set reminder'}</Text>
        </TouchableOpacity>
      </View>
    </View>

    {/* Backup */}
    <View style={s.statsCard}>
      <Text style={s.statsTitle}>☁️ Backup & Sync</Text>

      {/* Google Drive section */}
      {!driveToken?(
        <TouchableOpacity onPress={()=>promptAsync()}
          style={{flexDirection:'row',alignItems:'center',gap:12,padding:14,borderRadius:12,
            backgroundColor:'#fff',borderWidth:2,borderColor:'#4285F4',marginBottom:10}}>
          <Text style={{fontSize:22}}>🔵</Text>
          <View style={{flex:1}}>
            <Text style={{fontSize:14,fontWeight:'700',color:'#4285F4'}}>Connect Google Drive</Text>
            <Text style={{fontSize:11,color:C.textDim}}>Auto-backup to your Drive account</Text>
          </View>
          <Text style={{fontSize:16,color:'#4285F4'}}>▸</Text>
        </TouchableOpacity>
      ):(
        <View style={{padding:12,borderRadius:12,backgroundColor:'#E8F5E9',borderWidth:1,borderColor:'#81C784',marginBottom:10}}>
          <View style={{flexDirection:'row',alignItems:'center',gap:10,marginBottom:10}}>
            <Text style={{fontSize:22}}>✅</Text>
            <View style={{flex:1}}>
              <Text style={{fontSize:13,fontWeight:'700',color:'#2E7D32'}}>Google Drive connected</Text>
              {driveUser?<Text style={{fontSize:11,color:'#388E3C'}}>{driveUser}</Text>:null}
            </View>
            <TouchableOpacity onPress={signOutDrive} style={{padding:6,borderRadius:6,backgroundColor:'#FEE',borderWidth:1,borderColor:'#FCC'}}>
              <Text style={{fontSize:11,color:'#C44',fontWeight:'600'}}>Sign out</Text>
            </TouchableOpacity>
          </View>
          <View style={{flexDirection:'row',gap:8}}>
            <TouchableOpacity onPress={driveBackup}
              style={{flex:1,padding:11,borderRadius:9,backgroundColor:'#4285F4',alignItems:'center',
                opacity:driveStatus==='syncing'?0.6:1}}>
              <Text style={{fontSize:13,fontWeight:'700',color:'#fff'}}>
                {driveStatus==='syncing'?'Saving...':driveStatus==='ok'?'✅ Saved':'☁️ Backup now'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={driveRestore}
              style={{flex:1,padding:11,borderRadius:9,backgroundColor:'#fff',alignItems:'center',
                borderWidth:1,borderColor:'#4285F4',opacity:driveStatus==='syncing'?0.6:1}}>
              <Text style={{fontSize:13,fontWeight:'600',color:'#4285F4'}}>📥 Restore</Text>
            </TouchableOpacity>
          </View>
        </View>)}

      {/* Local backup fallback */}
      <View style={{flexDirection:'row',gap:8}}>
        <TouchableOpacity onPress={handleBackup}
          style={{flex:1,padding:11,borderRadius:9,backgroundColor:C.bg,alignItems:'center',borderWidth:1,borderColor:C.border}}>
          <Text style={{fontSize:12,fontWeight:'600',color:C.textMuted}}>📤 Export file</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleRestore}
          style={{flex:1,padding:11,borderRadius:9,backgroundColor:C.bg,alignItems:'center',borderWidth:1,borderColor:C.border}}>
          <Text style={{fontSize:12,fontWeight:'600',color:C.textMuted}}>📥 Import file</Text>
        </TouchableOpacity>
      </View>
    </View>

    <View style={s.statsCard}><Text style={s.statsTitle}>📊 Your Data</Text>
      <View style={{flexDirection:'row',justifyContent:'space-around'}}>
        <View style={{alignItems:'center'}}><Text style={{fontSize:24,fontWeight:'800',color:brand.blue}}>{habits.length}</Text><Text style={{fontSize:10,color:C.textDim}}>habits</Text></View>
        <View style={{alignItems:'center'}}><Text style={{fontSize:24,fontWeight:'800',color:brand.green}}>{projects.length}</Text><Text style={{fontSize:10,color:C.textDim}}>projects</Text></View>
        <View style={{alignItems:'center'}}><Text style={{fontSize:24,fontWeight:'800',color:brand.gold}}>{Object.keys(log).length}</Text><Text style={{fontSize:10,color:C.textDim}}>days</Text></View>
      </View></View>
    <View style={[s.statsCard,{alignItems:'center'}]}>
      <Image source={require('./assets/PruvYou_logo.png')} style={{width:140,height:35}} resizeMode="contain"/>
      <Text style={{fontSize:9,color:C.textLight,marginTop:4}}>v1.2.0</Text></View>
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
  tabBar:{position:'absolute',bottom:0,left:0,right:0,height:80,backgroundColor:C.white,borderTopWidth:1,borderTopColor:C.border,flexDirection:'row',alignItems:'center',justifyContent:'space-around'},
  tabItem:{alignItems:'center',gap:2},tabIcon:{width:50,height:50},tabLabel:{fontSize:9,fontWeight:'500',color:C.textLight},
  modalBg:{flex:1,backgroundColor:'rgba(0,0,0,0.4)',justifyContent:'flex-end'},modalBox:{backgroundColor:C.white,borderTopLeftRadius:24,borderTopRightRadius:24,padding:20,maxHeight:'80%'},
});
