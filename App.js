import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert, SafeAreaView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const brand = { blue: '#1A4F8A', green: '#34C79F', gold: '#F7C602' };
const C = {
  bg: '#F5F7FA', white: '#FFFFFF', card: '#FFFFFF',
  border: '#E0E4EA', borderLight: '#EDF0F5',
  accent: brand.gold, primary: brand.blue, success: brand.green,
  text: '#1A2E44', textMuted: '#4D5E74', textDim: '#7889A0',
  textDark: '#A0AEBC', textLight: '#B0BACA',
  greenBg: '#E8F8F0', greenBorder: '#B8E6D0',
  blueBg: '#E6EFF8', blueBorder: '#B0CDE8',
  goldBg: '#FEF8E6', goldBorder: '#F5DFA0',
  purpleBg: '#F0EDFE', purpleBorder: '#C8C4E8',
  tealBg: '#E1F5EE', tealBorder: '#9FE1CB',
  pinkBg: '#FBEAF0', pinkBorder: '#F4C0D1',
};
const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const ICONS = ['🏃','🧘','💪','📖','🧠','💧','🍎','😴','✍️','🎯','⏰','🔥'];
const CATS = [
  { id:'sport', name:'Sport & Fitness', icon:'🏃', color:brand.blue, bg:C.blueBg, border:C.blueBorder },
  { id:'mind', name:'Mindfulness', icon:'🧘', color:'#9B7ED4', bg:C.purpleBg, border:C.purpleBorder },
  { id:'health', name:'Health', icon:'💪', color:brand.green, bg:C.greenBg, border:C.greenBorder },
  { id:'learn', name:'Learning', icon:'📖', color:'#5CB8D6', bg:C.tealBg, border:C.tealBorder },
  { id:'nutrition', name:'Nutrition', icon:'🍎', color:brand.gold, bg:C.goldBg, border:C.goldBorder },
  { id:'sleep', name:'Sleep', icon:'😴', color:'#6B8EBF', bg:C.blueBg, border:C.blueBorder },
  { id:'create', name:'Creativity', icon:'✍️', color:'#D4689B', bg:C.pinkBg, border:C.pinkBorder },
  { id:'prod', name:'Productivity', icon:'🎯', color:'#E8956B', bg:C.goldBg, border:C.goldBorder },
];
const compColor = (r) => r>=1?brand.green:r>=0.7?brand.gold:r>=0.4?'#E8956B':C.textDark;
const fmt = (d) => d.toISOString().split('T')[0];
const today = () => new Date();
const clamp = (v,lo,hi) => Math.max(lo,Math.min(hi,v));
function getWeekDates(offset=0) {
  const d=today(); const day=d.getDay()===0?6:d.getDay()-1;
  const mon=new Date(d); mon.setDate(d.getDate()-day+offset*7);
  return Array.from({length:7},(_,i)=>{const x=new Date(mon);x.setDate(mon.getDate()+i);return x;});
}
const load=async(k,fb)=>{try{const r=await AsyncStorage.getItem(k);return r?JSON.parse(r):fb;}catch{return fb;}};
const save=async(k,v)=>{try{await AsyncStorage.setItem(k,JSON.stringify(v));}catch{}};

function StatRing({pct,color,label,size=80}) {
  const r=size/2-6; const circ=2*Math.PI*r; const off=circ-(pct/100)*circ;
  return (
    <View style={{alignItems:'center',width:size}}>
      <View style={{width:size,height:size,position:'relative'}}>
        <View style={{position:'absolute',width:size,height:size,borderRadius:size/2,borderWidth:5,borderColor:C.borderLight}} />
        <View style={{position:'absolute',width:size,height:size,borderRadius:size/2,borderWidth:5,
          borderColor:color,borderTopColor:pct>=75?color:'transparent',
          borderRightColor:pct>=50?color:'transparent',
          borderBottomColor:pct>=25?color:'transparent',
          borderLeftColor:pct>0?color:'transparent',
          transform:[{rotate:`${(pct/100)*360}deg`}]}} />
        <View style={{position:'absolute',inset:0,justifyContent:'center',alignItems:'center'}}>
          <Text style={{fontSize:18,fontWeight:'800',color:C.text}}>{pct}%</Text>
        </View>
      </View>
      <Text style={{fontSize:10,fontWeight:'600',color:C.textDim,marginTop:6}}>{label}</Text>
    </View>
  );
}

export default function App() {
  const [tab,setTab]=useState('home');
  const [habits,setHabits]=useState([]);
  const [log,setLog]=useState({});
  const [loaded,setLoaded]=useState(false);
  const [weekOff,setWeekOff]=useState(0);
  const [showAdd,setShowAdd]=useState(false);
  const [editHabit,setEditHabit]=useState(null);

  useEffect(()=>{(async()=>{setHabits(await load('pv-habits',[]));setLog(await load('pv-log',{}));setLoaded(true);})();},[]);
  useEffect(()=>{if(loaded)save('pv-habits',habits);},[habits,loaded]);
  useEffect(()=>{if(loaded)save('pv-log',log);},[log,loaded]);

  const toggleDay=useCallback((hid,ds)=>{
    setLog(p=>{const c={...p};if(!c[ds])c[ds]={};const cur=c[ds][hid];c[ds]={...c[ds],[hid]:{done:!cur?.done,minutes:cur?.minutes}};return c;});
  },[]);
  const addMinutes=useCallback((hid,ds,delta,target)=>{
    setLog(p=>{const c={...p};if(!c[ds])c[ds]={};const cur=c[ds][hid]?.minutes||0;const next=clamp(cur+delta,0,999);c[ds]={...c[ds],[hid]:{done:next>=target,minutes:next}};return c;});
  },[]);
  const addHabit=(h)=>{setHabits(p=>[...p,{...h,id:Date.now().toString()}]);setShowAdd(false);};
  const updateHabit=(h)=>{setHabits(p=>p.map(x=>x.id===h.id?h:x));setEditHabit(null);};
  const deleteHabit=(id)=>setHabits(p=>p.filter(x=>x.id!==id));
  const weekDates=useMemo(()=>getWeekDates(weekOff),[weekOff]);
  const todayStr=fmt(today());
  if(!loaded)return<SafeAreaView style={s.root}><View style={{flex:1,justifyContent:'center',alignItems:'center'}}><Text style={{fontSize:40}}>⏳</Text></View></SafeAreaView>;

  return (
    <SafeAreaView style={s.root}>
      <ScrollView style={s.content} showsVerticalScrollIndicator={false}>
        <View style={s.logoArea}>
          <Text style={s.logoMark}>P<Text style={{color:brand.green}}>Y</Text><Text style={{fontSize:14,color:brand.green}}>↗</Text></Text>
          <Text style={s.logoName}>PRUVYOU</Text>
          <Text style={s.logoSub}>PROVE YOURSELF DAILY</Text>
        </View>
        {tab==='home'&&<HomeTab habits={habits} log={log} weekDates={weekDates} weekOff={weekOff}
          setWeekOff={setWeekOff} toggleDay={toggleDay} addMinutes={addMinutes} todayStr={todayStr}/>}
        {tab==='habits'&&<HabitsTab habits={habits} showAdd={showAdd} setShowAdd={setShowAdd}
          addHabit={addHabit} editHabit={editHabit} setEditHabit={setEditHabit}
          updateHabit={updateHabit} deleteHabit={deleteHabit}/>}
        {tab==='stats'&&<StatsTab habits={habits} log={log}/>}
        <View style={{height:80}}/>
      </ScrollView>
      <View style={s.tabBar}>
        {[{id:'home',icon:'🏠',label:'Home'},{id:'habits',icon:'📋',label:'Habits'},
          {id:'stats',icon:'📊',label:'Stats'},{id:'settings',icon:'⚙️',label:'Settings'}].map(t=>(
          <TouchableOpacity key={t.id} onPress={()=>setTab(t.id)} style={s.tabItem}>
            <Text style={{fontSize:20}}>{t.icon}</Text>
            <Text style={[s.tabLabel,tab===t.id&&{color:brand.blue,fontWeight:'700'}]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

function HomeTab({habits,log,weekDates,weekOff,setWeekOff,toggleDay,addMinutes,todayStr}) {
  const todayDayIdx=today().getDay()===0?6:today().getDay()-1;
  const todayHabits=habits.filter(h=>h.frequency==='daily'||(h.frequency==='weekly'&&(h.selectedDays||[]).includes(todayDayIdx)));
  const doneToday=todayHabits.filter(h=>log[todayStr]?.[h.id]?.done).length;
  const todayPct=todayHabits.length>0?Math.round((doneToday/todayHabits.length)*100):0;
  const weekDone=weekDates.reduce((sum,d,i)=>{const ds=fmt(d);
    const a=habits.filter(h=>h.frequency==='daily'||(h.frequency==='weekly'&&(h.selectedDays||[]).includes(i)));
    return sum+a.filter(h=>log[ds]?.[h.id]?.done).length;},0);
  const weekTotal=weekDates.reduce((sum,_,i)=>sum+habits.filter(h=>h.frequency==='daily'||(h.frequency==='weekly'&&(h.selectedDays||[]).includes(i))).length,0);
  const weekPct=weekTotal>0?Math.round((weekDone/weekTotal)*100):0;
  const bestStreak=habits.reduce((best,h)=>{let st=0;for(let i=0;i<365;i++){const d=new Date();d.setDate(d.getDate()-i);if(log[fmt(d)]?.[h.id]?.done)st++;else break;}return Math.max(best,st);},0);
  const grouped=CATS.map(cat=>({cat,habits:habits.filter(h=>h.categoryId===cat.id)})).filter(g=>g.habits.length>0);

  if(!habits.length) return <View style={s.empty}><Text style={{fontSize:48,marginBottom:16}}>🌱</Text>
    <Text style={s.emptyTitle}>No habits yet</Text><Text style={s.emptySub}>Go to Habits tab to add your first</Text></View>;

  return (
    <View>
      <Text style={s.tagline}>Track. <Text style={{color:brand.green}}>Achieve.</Text> <Text style={{color:brand.gold}}>Triumph.</Text></Text>

      {/* 3 Stat Rings */}
      <View style={s.ringsRow}>
        <View style={s.ringCard}>
          <View style={[s.ringCircle,{borderColor:brand.green}]}>
            <Text style={[s.ringPct,{color:brand.green}]}>{weekPct}%</Text>
          </View>
          <Text style={s.ringLabel}>Week</Text>
          <View style={[s.ringBar,{backgroundColor:C.greenBorder}]}>
            <View style={{height:'100%',width:`${weekPct}%`,backgroundColor:brand.green,borderRadius:3}}/></View>
        </View>
        <View style={s.ringCard}>
          <View style={[s.ringCircle,{borderColor:brand.blue}]}>
            <Text style={[s.ringPct,{color:brand.blue}]}>{todayPct}%</Text>
          </View>
          <Text style={s.ringLabel}>Today</Text>
          <View style={[s.ringBar,{backgroundColor:C.blueBorder}]}>
            <View style={{height:'100%',width:`${todayPct}%`,backgroundColor:brand.blue,borderRadius:3}}/></View>
        </View>
        <View style={s.ringCard}>
          <View style={[s.ringCircle,{borderColor:brand.gold}]}>
            <Text style={[s.ringPct,{color:'#B8920A'}]}>{bestStreak}</Text>
          </View>
          <Text style={s.ringLabel}>Streak</Text>
          <View style={[s.ringBar,{backgroundColor:C.goldBorder}]}>
            <View style={{height:'100%',width:`${Math.min(100,bestStreak/30*100)}%`,backgroundColor:brand.gold,borderRadius:3}}/></View>
        </View>
      </View>

      {/* Week nav */}
      <View style={s.weekNav}>
        <TouchableOpacity onPress={()=>setWeekOff(w=>w-1)} style={s.navBtn}><Text style={s.navBtnT}>◂</Text></TouchableOpacity>
        <Text style={s.weekLabel}>{weekOff===0?'This week':
          `${weekDates[0].toLocaleDateString('en-US',{day:'numeric',month:'short'})} – ${weekDates[6].toLocaleDateString('en-US',{day:'numeric',month:'short'})}`}</Text>
        <TouchableOpacity onPress={()=>setWeekOff(w=>Math.min(0,w+1))} style={[s.navBtn,weekOff>=0&&{opacity:.3}]} disabled={weekOff>=0}>
          <Text style={s.navBtnT}>▸</Text></TouchableOpacity>
      </View>

      {/* Category Cards */}
      {grouped.map(({cat,habits:ch})=>(
        <View key={cat.id} style={[s.catCard,{backgroundColor:cat.bg,borderColor:cat.border}]}>
          <View style={s.catHeader}>
            <View style={[s.catIcon,{backgroundColor:cat.color+'20'}]}><Text style={{fontSize:16}}>{cat.icon}</Text></View>
            <Text style={[s.catTitle,{color:cat.color}]}>{cat.name}</Text>
            <Text style={{color:C.textLight,fontSize:18}}>›</Text>
          </View>
          {ch.map(h=>{
            const entry=log[todayStr]?.[h.id]; const done=!!entry?.done;
            if(h.type==='timer'){
              const mins=entry?.minutes||0; const ratio=h.targetMinutes>0?mins/h.targetMinutes:0;
              return(<View key={h.id} style={{marginTop:8}}>
                <View style={{flexDirection:'row',justifyContent:'space-between',marginBottom:4}}>
                  <Text style={{fontSize:12,fontWeight:'600',color:cat.color}}>{h.icon} {h.name}</Text>
                  <Text style={{fontSize:14,fontWeight:'800',color:cat.color}}>{mins}/{h.targetMinutes} min</Text></View>
                <View style={[s.progressTrack,{backgroundColor:cat.border}]}>
                  <View style={{height:'100%',width:`${Math.min(100,ratio*100)}%`,backgroundColor:cat.color,borderRadius:3}}/></View>
                <View style={{flexDirection:'row',gap:6,marginTop:6}}>
                  <TouchableOpacity onPress={()=>addMinutes(h.id,todayStr,-5,h.targetMinutes)} style={[s.miniBtn,{borderColor:cat.border}]}>
                    <Text style={{fontSize:11,fontWeight:'700',color:cat.color}}>-5</Text></TouchableOpacity>
                  <TouchableOpacity onPress={()=>addMinutes(h.id,todayStr,5,h.targetMinutes)} style={[s.miniBtn,{borderColor:cat.border}]}>
                    <Text style={{fontSize:11,fontWeight:'700',color:cat.color}}>+5</Text></TouchableOpacity></View>
              </View>);
            }
            return(<View key={h.id} style={{marginTop:8}}>
              <View style={{flexDirection:'row',alignItems:'center',gap:6,marginBottom:6}}>
                <Text style={{fontSize:12,fontWeight:'600',color:cat.color}}>{h.icon} {h.name}</Text>
                {done&&<Text style={{fontSize:10,fontWeight:'700',color:brand.green}}>✓</Text>}</View>
              <View style={{flexDirection:'row',gap:4}}>
                {weekDates.map((d,i)=>{const ds=fmt(d);const dayDone=log[ds]?.[h.id]?.done;const isToday=ds===todayStr;
                  const scheduled=h.frequency==='daily'||(h.selectedDays||[]).includes(i);
                  return(<TouchableOpacity key={i} onPress={()=>{if(scheduled)toggleDay(h.id,ds);}}
                    style={[s.dayPill,dayDone&&{backgroundColor:cat.color,borderColor:cat.color},
                      isToday&&!dayDone&&{borderColor:brand.gold,borderWidth:2},!scheduled&&{opacity:.3}]}>
                    <Text style={[s.dayPillD,dayDone&&{color:'#fff'}]}>{DAYS[i].substring(0,2)}</Text>
                    <Text style={[s.dayPillN,dayDone&&{color:'#fff'}]}>{d.getDate()}</Text>
                  </TouchableOpacity>);})}</View>
            </View>);
          })}
          {(()=>{let streak=0;for(const h of ch){let st=0;for(let i=0;i<365;i++){const d=new Date();d.setDate(d.getDate()-i);
            if(log[fmt(d)]?.[h.id]?.done)st++;else break;}streak=Math.max(streak,st);}
            return streak>0?<Text style={{fontSize:11,fontWeight:'700',color:cat.color,marginTop:10}}>{streak} day streak 🔥</Text>:null;})()}
        </View>
      ))}
    </View>
  );
}

function HabitsTab({habits,showAdd,setShowAdd,addHabit,editHabit,setEditHabit,updateHabit,deleteHabit}) {
  return(<View>
    <TouchableOpacity onPress={()=>{setShowAdd(true);setEditHabit(null);}} style={s.addBtn}>
      <Text style={s.addBtnT}>＋ Add new habit</Text></TouchableOpacity>
    {(showAdd||editHabit)&&<HabitForm habit={editHabit} onSave={editHabit?updateHabit:addHabit}
      onCancel={()=>{setShowAdd(false);setEditHabit(null);}}/>}
    {!habits.length&&!showAdd&&<View style={s.empty}><Text style={{fontSize:36,marginBottom:12}}>📋</Text>
      <Text style={s.emptySub}>Tap the button above to create your first habit</Text></View>}
    {CATS.map(cat=>{const ch=habits.filter(h=>h.categoryId===cat.id);if(!ch.length)return null;
      return(<View key={cat.id} style={{marginBottom:16}}>
        <View style={{flexDirection:'row',alignItems:'center',gap:8,marginBottom:6}}>
          <Text style={{fontSize:16}}>{cat.icon}</Text>
          <Text style={{fontSize:13,fontWeight:'700',color:cat.color,flex:1}}>{cat.name}</Text>
          <View style={{paddingHorizontal:8,paddingVertical:2,borderRadius:10,backgroundColor:cat.bg}}>
            <Text style={{fontSize:10,fontWeight:'700',color:cat.color}}>{ch.length}</Text></View></View>
        {ch.map(h=>(<View key={h.id} style={[s.habitListCard,{borderLeftWidth:3,borderLeftColor:cat.color}]}>
          <View style={{flex:1}}>
            <Text style={{fontSize:13,fontWeight:'600',color:C.text}}>{h.icon} {h.name}</Text>
            <Text style={{fontSize:10,color:C.textDim,marginTop:2}}>
              {h.type==='timer'?`${h.targetMinutes} min`:'Checkbox'} · {h.frequency==='daily'?'Daily':'Weekly'}
              {h.frequency==='weekly'&&h.selectedDays?.length>0?` · ${h.selectedDays.map(d=>DAYS[d]).join(', ')}`:''}</Text></View>
          <TouchableOpacity onPress={()=>setEditHabit(h)} style={s.actionBtn}><Text>✏️</Text></TouchableOpacity>
          <TouchableOpacity onPress={()=>Alert.alert('Delete',`Delete "${h.name}"?`,[{text:'Cancel',style:'cancel'},
            {text:'Delete',style:'destructive',onPress:()=>deleteHabit(h.id)}])} style={s.actionBtn}><Text>🗑</Text></TouchableOpacity>
        </View>))}</View>);})}
  </View>);
}

function HabitForm({habit,onSave,onCancel}) {
  const [name,setName]=useState(habit?.name||'');
  const [type,setType]=useState(habit?.type||'check');
  const [freq,setFreq]=useState(habit?.frequency||'daily');
  const [mins,setMins]=useState(String(habit?.targetMinutes||15));
  const [selectedDays,setSelectedDays]=useState(habit?.selectedDays||[]);
  const [icon,setIcon]=useState(habit?.icon||'🎯');
  const [catId,setCatId]=useState(habit?.categoryId||'sport');
  const cat=CATS.find(c=>c.id===catId)||CATS[0];
  const toggleDaySel=(i)=>setSelectedDays(p=>p.includes(i)?p.filter(d=>d!==i):[...p,i].sort());
  return(
    <View style={s.form}>
      <Text style={s.formTitle}>{habit?'Edit habit':'New habit'}</Text>
      <Text style={s.label}>CATEGORY</Text>
      <View style={{flexDirection:'row',flexWrap:'wrap',gap:6,marginBottom:12}}>
        {CATS.map(c=>(<TouchableOpacity key={c.id} onPress={()=>setCatId(c.id)}
          style={[s.catBtn,catId===c.id&&{borderColor:c.color,borderWidth:2,backgroundColor:c.bg}]}>
          <Text style={{fontSize:18}}>{c.icon}</Text>
          <Text style={[s.catBtnLabel,catId===c.id&&{color:c.color}]}>{c.name}</Text>
        </TouchableOpacity>))}</View>
      <Text style={s.label}>HABIT NAME</Text>
      <TextInput value={name} onChangeText={setName} placeholder="e.g. Morning abs" placeholderTextColor={C.textDark} style={s.input}/>
      <Text style={s.label}>ICON</Text>
      <View style={{flexDirection:'row',flexWrap:'wrap',gap:6,marginBottom:12}}>
        {ICONS.map(ic=>(<TouchableOpacity key={ic} onPress={()=>setIcon(ic)}
          style={[s.iconBtn,icon===ic&&{borderColor:cat.color,borderWidth:2,backgroundColor:cat.bg}]}>
          <Text style={{fontSize:18}}>{ic}</Text></TouchableOpacity>))}</View>
      <Text style={s.label}>TYPE</Text>
      <View style={{flexDirection:'row',gap:8,marginBottom:12}}>
        {[['check','✓ Checkbox'],['timer','⏱ Timer']].map(([v,l])=>(
          <TouchableOpacity key={v} onPress={()=>setType(v)} style={[s.toggle,type===v&&{borderColor:cat.color,backgroundColor:cat.bg}]}>
            <Text style={[s.toggleT,type===v&&{color:cat.color}]}>{l}</Text></TouchableOpacity>))}</View>
      {type==='timer'&&(<><Text style={s.label}>TARGET (MINUTES/DAY)</Text>
        <TextInput value={mins} onChangeText={setMins} keyboardType="number-pad" style={s.input}/></>)}
      <Text style={s.label}>FREQUENCY</Text>
      <View style={{flexDirection:'row',gap:8,marginBottom:12}}>
        {[['daily','Daily'],['weekly','Weekly']].map(([v,l])=>(
          <TouchableOpacity key={v} onPress={()=>setFreq(v)} style={[s.toggle,freq===v&&{borderColor:cat.color,backgroundColor:cat.bg}]}>
            <Text style={[s.toggleT,freq===v&&{color:cat.color}]}>{l}</Text></TouchableOpacity>))}</View>
      {freq==='weekly'&&(<><Text style={s.label}>SELECT DAYS</Text>
        <View style={{flexDirection:'row',gap:4,marginBottom:6}}>
          {DAYS.map((d,i)=>{const sel=selectedDays.includes(i);return(
            <TouchableOpacity key={i} onPress={()=>toggleDaySel(i)}
              style={[s.dayChip,sel&&{backgroundColor:cat.color,borderColor:cat.color}]}>
              <Text style={[s.dayChipT,sel&&{color:'#fff'}]}>{d}</Text></TouchableOpacity>);})}</View>
        <Text style={{fontSize:10,color:C.textDim,marginBottom:12}}>
          {selectedDays.length>0?`${selectedDays.length}x/week: ${selectedDays.map(d=>DAYS[d]).join(', ')}`:'Tap the days'}</Text></>)}
      <View style={{flexDirection:'row',gap:10,marginTop:8}}>
        <TouchableOpacity onPress={onCancel} style={s.cancelBtn}><Text style={s.cancelBtnT}>Cancel</Text></TouchableOpacity>
        <TouchableOpacity onPress={()=>{if(!name.trim())return;onSave({...(habit||{}),name:name.trim(),type,frequency:freq,
          targetMinutes:parseInt(mins)||15,weeklyTarget:freq==='weekly'?selectedDays.length:7,
          selectedDays:freq==='weekly'?selectedDays:[],icon,color:cat.color,categoryId:catId});}}
          style={[s.saveBtn,{backgroundColor:cat.color}]}><Text style={s.saveBtnT}>Save</Text></TouchableOpacity></View>
    </View>);
}

function StatsTab({habits,log}) {
  const last30=useMemo(()=>Array.from({length:30},(_,i)=>{const d=new Date();d.setDate(d.getDate()-(29-i));return d;}),[]);
  const daily=habits.filter(h=>h.frequency==='daily');
  const habitStats=useMemo(()=>daily.map(h=>{const done=last30.filter(d=>log[fmt(d)]?.[h.id]?.done).length;
    const cat=CATS.find(c=>c.id===h.categoryId);return{name:h.icon+' '+h.name,rate:Math.round((done/30)*100),color:h.color};}),[daily,log,last30]);
  const streaks=useMemo(()=>daily.map(h=>{let streak=0;for(let i=0;i<365;i++){const d=new Date();d.setDate(d.getDate()-i);
    if(log[fmt(d)]?.[h.id]?.done)streak++;else break;}return{name:h.icon+' '+h.name,streak,color:h.color};}).sort((a,b)=>b.streak-a.streak),[daily,log]);
  if(!habits.length)return<View style={s.empty}><Text style={{fontSize:48,marginBottom:16}}>📊</Text><Text style={s.emptySub}>Add habits to see stats</Text></View>;
  return(<View>
    {habitStats.length>0&&<View style={s.statsCard}><Text style={s.statsTitle}>Per habit (30 days)</Text>
      {habitStats.map((h,i)=>(<View key={i} style={{flexDirection:'row',alignItems:'center',marginBottom:10}}>
        <Text style={{width:90,fontSize:11,color:C.textMuted}} numberOfLines={1}>{h.name}</Text>
        <View style={{flex:1,height:10,backgroundColor:C.borderLight,borderRadius:5,overflow:'hidden',marginHorizontal:8}}>
          <View style={{height:'100%',width:`${h.rate}%`,backgroundColor:h.color,borderRadius:5}}/></View>
        <Text style={{width:36,textAlign:'right',fontSize:12,fontWeight:'700',color:h.color}}>{h.rate}%</Text></View>))}</View>}
    {streaks.length>0&&<View style={s.statsCard}><Text style={s.statsTitle}>🔥 Current streaks</Text>
      {streaks.map((st,i)=>(<View key={i} style={{flexDirection:'row',justifyContent:'space-between',paddingVertical:8,
        borderBottomWidth:i<streaks.length-1?1:0,borderBottomColor:C.borderLight}}>
        <Text style={{fontSize:13,color:C.textMuted}}>{st.name}</Text>
        <Text style={{fontSize:16,fontWeight:'800',color:st.streak>7?brand.green:st.streak>0?brand.gold:C.textDark}}>{st.streak} {st.streak===1?'day':'days'}</Text>
      </View>))}</View>}
  </View>);
}

const s = StyleSheet.create({
  root:{flex:1,backgroundColor:C.bg},
  content:{flex:1,paddingHorizontal:16},
  logoArea:{alignItems:'center',paddingTop:12,marginBottom:4},
  logoMark:{fontSize:28,fontWeight:'800',color:brand.blue,letterSpacing:-1},
  logoName:{fontSize:11,fontWeight:'700',color:brand.blue,letterSpacing:3,marginTop:2},
  logoSub:{fontSize:8,fontWeight:'600',color:C.textDim,letterSpacing:2},
  tagline:{textAlign:'center',fontSize:14,fontWeight:'600',color:C.textMuted,marginBottom:16},
  ringsRow:{flexDirection:'row',justifyContent:'space-around',marginBottom:16,paddingHorizontal:8},
  ringCard:{alignItems:'center',flex:1},
  ringCircle:{width:72,height:72,borderRadius:36,borderWidth:5,justifyContent:'center',alignItems:'center',backgroundColor:C.white},
  ringPct:{fontSize:18,fontWeight:'800'},
  ringLabel:{fontSize:10,fontWeight:'600',color:C.textDim,marginTop:6},
  ringBar:{height:4,borderRadius:2,overflow:'hidden',width:'80%',marginTop:4},
  weekNav:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:12},
  navBtn:{width:32,height:32,borderRadius:16,backgroundColor:C.white,borderWidth:1,borderColor:C.border,justifyContent:'center',alignItems:'center'},
  navBtnT:{color:C.textDim,fontSize:14},
  weekLabel:{fontSize:12,fontWeight:'600',color:C.textDim},
  catCard:{borderRadius:14,padding:14,marginBottom:10,borderWidth:1},
  catHeader:{flexDirection:'row',alignItems:'center',marginBottom:4},
  catIcon:{width:32,height:32,borderRadius:8,justifyContent:'center',alignItems:'center'},
  catTitle:{fontSize:14,fontWeight:'700',flex:1,marginLeft:10},
  progressTrack:{height:6,borderRadius:3,overflow:'hidden',marginTop:2},
  miniBtn:{paddingHorizontal:12,paddingVertical:4,borderRadius:6,borderWidth:1,backgroundColor:'#fff'},
  dayPill:{flex:1,height:40,borderRadius:8,backgroundColor:'#fff',borderWidth:1,borderColor:C.border,alignItems:'center',justifyContent:'center'},
  dayPillD:{fontSize:8,fontWeight:'700',color:C.textDim,letterSpacing:.3},
  dayPillN:{fontSize:12,fontWeight:'800',color:C.textMuted},
  empty:{alignItems:'center',paddingVertical:50},
  emptyTitle:{fontSize:18,fontWeight:'700',color:C.textDim,marginBottom:8},
  emptySub:{fontSize:13,color:C.textDark,textAlign:'center'},
  habitListCard:{flexDirection:'row',alignItems:'center',backgroundColor:C.white,borderRadius:10,padding:12,marginBottom:5,borderWidth:1,borderColor:C.border},
  actionBtn:{width:32,height:32,borderRadius:6,borderWidth:1,borderColor:C.border,justifyContent:'center',alignItems:'center',marginLeft:4},
  addBtn:{padding:14,borderRadius:12,backgroundColor:brand.blue,alignItems:'center',marginBottom:14},
  addBtnT:{fontSize:14,fontWeight:'700',color:'#fff'},
  form:{backgroundColor:C.white,borderRadius:16,padding:18,marginBottom:14,borderWidth:1,borderColor:C.border},
  formTitle:{fontSize:17,fontWeight:'700',color:brand.blue,marginBottom:14},
  label:{fontSize:10,fontWeight:'600',color:C.textDim,letterSpacing:1,marginBottom:5,marginTop:2},
  input:{backgroundColor:C.bg,borderWidth:1,borderColor:C.border,borderRadius:10,padding:11,color:C.text,fontSize:14,marginBottom:10},
  iconBtn:{width:36,height:36,borderRadius:8,borderWidth:1,borderColor:C.border,backgroundColor:C.bg,justifyContent:'center',alignItems:'center'},
  catBtn:{width:'30%',flexGrow:1,minWidth:80,backgroundColor:C.bg,borderRadius:10,padding:8,alignItems:'center',borderWidth:1,borderColor:C.border},
  catBtnLabel:{fontSize:8,fontWeight:'600',color:C.textDim,textAlign:'center',marginTop:2},
  toggle:{flex:1,padding:10,borderRadius:10,borderWidth:1,borderColor:C.border,backgroundColor:C.bg,alignItems:'center'},
  toggleT:{fontSize:12,fontWeight:'600',color:C.textDark},
  dayChip:{flex:1,height:36,borderRadius:8,borderWidth:1.5,borderColor:C.border,backgroundColor:C.bg,justifyContent:'center',alignItems:'center'},
  dayChipT:{fontSize:10,fontWeight:'700',color:C.textDark},
  cancelBtn:{flex:1,padding:12,borderRadius:10,backgroundColor:C.bg,borderWidth:1,borderColor:C.border,alignItems:'center'},
  cancelBtnT:{fontSize:13,fontWeight:'600',color:C.textDim},
  saveBtn:{flex:1,padding:12,borderRadius:10,alignItems:'center'},
  saveBtnT:{fontSize:13,fontWeight:'700',color:'#fff'},
  statsCard:{backgroundColor:C.white,borderRadius:14,padding:16,marginBottom:12,borderWidth:1,borderColor:C.border},
  statsTitle:{fontSize:13,fontWeight:'700',color:brand.blue,marginBottom:12},
  tabBar:{position:'absolute',bottom:0,left:0,right:0,height:64,backgroundColor:C.white,borderTopWidth:1,borderTopColor:C.border,flexDirection:'row',alignItems:'center',justifyContent:'space-around'},
  tabItem:{alignItems:'center',gap:2},
  tabLabel:{fontSize:9,fontWeight:'500',color:C.textLight},
});
