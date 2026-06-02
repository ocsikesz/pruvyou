import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert, SafeAreaView, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Brand & Theme ─────────────────────────────────────────────────
const brand = { blue: '#1A4F8A', green: '#34C79F', gold: '#F7C602' };
const C = {
  bg: '#F5F7FA', white: '#FFFFFF',
  border: '#E0E4EA', borderLight: '#EDF0F5',
  text: '#1A2E44', textMuted: '#4D5E74', textDim: '#7889A0',
  textDark: '#A0AEBC', textLight: '#B0BACA',
};
const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const ICONS = ['🏃','🧘','💪','📖','🧠','💧','🍎','😴','✍️','🎯','⏰','🔥','💰','📝','🌿'];

// ─── Category Groups ───────────────────────────────────────────────
const CATS = [
  { id:'fitness', name:'Health & Fitness', icon:'💪', color:brand.green, bg:'#E8F8F0', border:'#B8E6D0',
    examples:'Yoga, Running, Workout, Meditation, Sleep' },
  { id:'develop', name:'Development', icon:'📖', color:brand.blue, bg:'#E6EFF8', border:'#B0CDE8',
    examples:'Reading, Learning, Courses, Coding' },
  { id:'finance', name:'Finance', icon:'💰', color:brand.gold, bg:'#FEF8E6', border:'#F5DFA0',
    examples:'Budget review, Savings, Invoices, Investing' },
  { id:'lifestyle', name:'Lifestyle', icon:'🌿', color:'#9B7ED4', bg:'#F0EDFE', border:'#C8C4E8',
    examples:'Journaling, Cooking, Cleaning, No phone' },
  { id:'work', name:'Work & Productivity', icon:'🎯', color:'#E8956B', bg:'#FEF0E6', border:'#F5D0A0',
    examples:'Deep work, Emails, Planning, Proposals' },
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

// ═══════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════
export default function App() {
  const [tab,setTab]=useState('home');
  const [habits,setHabits]=useState([]);
  const [log,setLog]=useState({});
  const [loaded,setLoaded]=useState(false);
  const [weekOff,setWeekOff]=useState(0);
  const [showAdd,setShowAdd]=useState(false);
  const [editHabit,setEditHabit]=useState(null);
  // For editing a past day
  const [editDay,setEditDay]=useState(null); // { dateStr, dayIndex }

  useEffect(()=>{(async()=>{
    setHabits(await load('pv-habits',[]));
    setLog(await load('pv-log',{}));
    setLoaded(true);
  })();},[]);
  useEffect(()=>{if(loaded)save('pv-habits',habits);},[habits,loaded]);
  useEffect(()=>{if(loaded)save('pv-log',log);},[log,loaded]);

  const toggleDay=useCallback((hid,ds)=>{
    setLog(p=>{const c={...p};if(!c[ds])c[ds]={};
      const cur=c[ds][hid];
      c[ds]={...c[ds],[hid]:{done:!cur?.done,minutes:cur?.minutes||0}};
      return c;});
  },[]);

  const addMinutes=useCallback((hid,ds,delta,target)=>{
    setLog(p=>{const c={...p};if(!c[ds])c[ds]={};
      const cur=c[ds][hid]?.minutes||0;
      const next=clamp(cur+delta,0,999);
      c[ds]={...c[ds],[hid]:{done:next>=target,minutes:next}};
      return c;});
  },[]);

  const addHabit=(h)=>{setHabits(p=>[...p,{...h,id:Date.now().toString()}]);setShowAdd(false);};
  const updateHabit=(h)=>{setHabits(p=>p.map(x=>x.id===h.id?h:x));setEditHabit(null);};
  const deleteHabit=(id)=>setHabits(p=>p.filter(x=>x.id!==id));
  const weekDates=useMemo(()=>getWeekDates(weekOff),[weekOff]);
  const todayStr=fmt(today());

  if(!loaded) return <SafeAreaView style={s.root}><View style={{flex:1,justifyContent:'center',alignItems:'center'}}>
    <Text style={{fontSize:40}}>⏳</Text></View></SafeAreaView>;

  return (
    <SafeAreaView style={s.root}>
      <ScrollView style={s.content} showsVerticalScrollIndicator={false}>
        {/* Logo */}
        <View style={s.logoArea}>
          <Text style={s.logoMark}>P<Text style={{color:brand.green}}>Y</Text><Text style={{fontSize:14,color:brand.green}}>↗</Text></Text>
          <Text style={s.logoName}>PRUVYOU</Text>
          <Text style={s.logoSub}>PROVE YOURSELF DAILY</Text>
        </View>

        {tab==='home'&&<HomeTab habits={habits} log={log} weekDates={weekDates} weekOff={weekOff}
          setWeekOff={setWeekOff} toggleDay={toggleDay} addMinutes={addMinutes}
          todayStr={todayStr} setEditDay={setEditDay}/>}
        {tab==='habits'&&<HabitsTab habits={habits} showAdd={showAdd} setShowAdd={setShowAdd}
          addHabit={addHabit} editHabit={editHabit} setEditHabit={setEditHabit}
          updateHabit={updateHabit} deleteHabit={deleteHabit}/>}
        {tab==='stats'&&<StatsTab habits={habits} log={log}/>}
        <View style={{height:80}}/>
      </ScrollView>

      {/* Tab Bar */}
      <View style={s.tabBar}>
        {[{id:'home',icon:'🏠',label:'Home'},{id:'habits',icon:'📋',label:'Habits'},
          {id:'stats',icon:'📊',label:'Stats'},{id:'settings',icon:'⚙️',label:'Settings'}].map(t=>(
          <TouchableOpacity key={t.id} onPress={()=>setTab(t.id)} style={s.tabItem}>
            <Text style={{fontSize:20}}>{t.icon}</Text>
            <Text style={[s.tabLabel,tab===t.id&&{color:brand.blue,fontWeight:'700'}]}>{t.label}</Text>
          </TouchableOpacity>))}
      </View>

      {/* ── Edit Past Day Modal ── */}
      {editDay&&(
        <Modal transparent animationType="slide" visible={!!editDay} onRequestClose={()=>setEditDay(null)}>
          <View style={s.modalBg}>
            <View style={s.modalBox}>
              <DayEditor
                dateStr={editDay.dateStr}
                dayIndex={editDay.dayIndex}
                habits={habits}
                log={log}
                toggleDay={toggleDay}
                addMinutes={addMinutes}
                onClose={()=>setEditDay(null)}
              />
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

// ═══════════════════════════════════════════════════════════════════
// DAY EDITOR MODAL — edit any day's habits (past or today)
// ═══════════════════════════════════════════════════════════════════
function DayEditor({dateStr,dayIndex,habits,log,toggleDay,addMinutes,onClose}) {
  const d=new Date(dateStr+'T12:00:00');
  const dayLabel=d.toLocaleDateString('en-US',{weekday:'long',day:'numeric',month:'long'});
  const activeHabits=habits.filter(h=>
    h.frequency==='daily'||(h.frequency==='weekly'&&(h.selectedDays||[]).includes(dayIndex)));

  return (
    <View>
      <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <View>
          <Text style={{fontSize:16,fontWeight:'700',color:C.text}}>{DAYS[dayIndex]}</Text>
          <Text style={{fontSize:12,color:C.textDim}}>{dayLabel}</Text>
        </View>
        <TouchableOpacity onPress={onClose} style={{padding:8}}>
          <Text style={{fontSize:20,color:C.textDim}}>✕</Text>
        </TouchableOpacity>
      </View>

      {activeHabits.length===0&&<Text style={{color:C.textDim,textAlign:'center',padding:20}}>No habits scheduled for this day</Text>}

      {activeHabits.map(h=>{
        const entry=log[dateStr]?.[h.id];
        const done=!!entry?.done;
        const cat=CATS.find(c=>c.id===h.categoryId);
        return(
          <View key={h.id} style={{marginBottom:12}}>
            <TouchableOpacity onPress={()=>{if(h.type==='check')toggleDay(h.id,dateStr);}}
              style={{flexDirection:'row',alignItems:'center',padding:12,backgroundColor:done?(cat?.bg||'#E8F8F0'):C.bg,
                borderRadius:10,borderWidth:1,borderColor:done?(cat?.color||brand.green):C.border}}>
              <View style={[s.check,done&&{backgroundColor:cat?.color||brand.green,borderColor:cat?.color||brand.green}]}>
                {done&&<Text style={{color:'#fff',fontSize:14,fontWeight:'700'}}>✓</Text>}
              </View>
              <View style={{flex:1}}>
                <Text style={{fontSize:14,fontWeight:'600',color:C.text}}>{h.icon} {h.name}</Text>
                {h.type==='timer'&&<Text style={{fontSize:11,color:C.textDim,marginTop:2}}>
                  {entry?.minutes||0} / {h.targetMinutes} min</Text>}
              </View>
            </TouchableOpacity>
            {h.type==='timer'&&(
              <View style={{flexDirection:'row',gap:8,marginTop:6,paddingLeft:4}}>
                {[-15,-5,-1,1,5,15].map(delta=>(
                  <TouchableOpacity key={delta} onPress={()=>addMinutes(h.id,dateStr,delta,h.targetMinutes)}
                    style={{flex:1,padding:8,borderRadius:8,backgroundColor:delta>0?(cat?.bg||C.bg):C.bg,
                      borderWidth:1,borderColor:cat?.border||C.border,alignItems:'center'}}>
                    <Text style={{fontSize:12,fontWeight:'700',color:delta>0?(cat?.color||brand.blue):C.textDim}}>
                      {delta>0?'+':''}{delta}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════
// HOME TAB — 7 day cards + today's habits by category
// ═══════════════════════════════════════════════════════════════════
function HomeTab({habits,log,weekDates,weekOff,setWeekOff,toggleDay,addMinutes,todayStr,setEditDay}) {
  const todayDayIdx=today().getDay()===0?6:today().getDay()-1;

  // Habits active today — separated
  const dailyHabits=habits.filter(h=>h.frequency==='daily');
  const weeklyToday=habits.filter(h=>h.frequency==='weekly'&&(h.selectedDays||[]).includes(todayDayIdx));
  const todayHabits=[...dailyHabits,...weeklyToday];

  const doneDaily=dailyHabits.filter(h=>log[todayStr]?.[h.id]?.done).length;
  const doneWeekly=weeklyToday.filter(h=>log[todayStr]?.[h.id]?.done).length;
  const dailyPct=dailyHabits.length>0?Math.round((doneDaily/dailyHabits.length)*100):0;

  // Group today's habits by category
  const todayGrouped=CATS.map(cat=>({
    cat, habits:todayHabits.filter(h=>h.categoryId===cat.id)
  })).filter(g=>g.habits.length>0);

  if(!habits.length) return <View style={s.empty}><Text style={{fontSize:48,marginBottom:16}}>🌱</Text>
    <Text style={s.emptyTitle}>No habits yet</Text>
    <Text style={s.emptySub}>Go to Habits tab to add your first</Text></View>;

  return (
    <View>
      <Text style={s.tagline}>Track. <Text style={{color:brand.green}}>Achieve.</Text> <Text style={{color:brand.gold}}>Triumph.</Text></Text>

      {/* ── Week Navigator ── */}
      <View style={s.weekNav}>
        <TouchableOpacity onPress={()=>setWeekOff(w=>w-1)} style={s.navBtn}><Text style={s.navBtnT}>◂</Text></TouchableOpacity>
        <Text style={s.weekLabel}>{weekOff===0?'This week':
          `${weekDates[0].toLocaleDateString('en-US',{day:'numeric',month:'short'})} – ${weekDates[6].toLocaleDateString('en-US',{day:'numeric',month:'short'})}`}</Text>
        <TouchableOpacity onPress={()=>setWeekOff(w=>Math.min(0,w+1))} style={[s.navBtn,weekOff>=0&&{opacity:.3}]} disabled={weekOff>=0}>
          <Text style={s.navBtnT}>▸</Text></TouchableOpacity>
      </View>

      {/* ── 7 Day Cards (tap to edit any day) ── */}
      <View style={s.cardsRow}>
        {weekDates.map((d,i)=>{
          const ds=fmt(d);
          const isToday=ds===todayStr;
          const isFuture=d>today();
          // Only count daily habits for the day card percentage
          const dayDailyHabits=habits.filter(h=>h.frequency==='daily');
          const dayWeeklyHabits=habits.filter(h=>h.frequency==='weekly'&&(h.selectedDays||[]).includes(i));
          const dailyTotal=dayDailyHabits.length;
          const dailyDone=dayDailyHabits.filter(h=>log[ds]?.[h.id]?.done).length;
          const weeklyDone=dayWeeklyHabits.filter(h=>log[ds]?.[h.id]?.done).length;
          const ratio=dailyTotal>0?dailyDone/dailyTotal:0;
          const pct=Math.round(ratio*100);
          const fill=compColor(ratio);
          const hasWeekly=dayWeeklyHabits.length>0;
          return(
            <TouchableOpacity key={i} activeOpacity={0.7}
              onPress={()=>{if(!isFuture) setEditDay({dateStr:ds,dayIndex:i});}}
              style={[s.dayCard,isToday&&{borderColor:brand.gold,borderWidth:2},isFuture&&{opacity:.35}]}>
              <View style={s.dcProgress}>
                <View style={s.dcTrack}>
                  <View style={[s.dcFill,{height:`${pct}%`,backgroundColor:fill}]}/>
                </View>
                <View style={s.dcOverlay}>
                  {dailyTotal>0&&<Text style={[s.dcCount,{color:fill}]}>{dailyDone}/{dailyTotal}</Text>}
                  <Text style={[s.dcPct,{color:pct>45?'#fff':C.textMuted}]}>{dailyTotal>0?`${pct}%`:'—'}</Text>
                  {hasWeekly&&<Text style={{position:'absolute',bottom:4,fontSize:7,fontWeight:'700',
                    color:weeklyDone===dayWeeklyHabits.length?brand.green:brand.blue}}>
                    +{weeklyDone}/{dayWeeklyHabits.length}</Text>}
                </View>
              </View>
              <View style={[s.dcLabel,isToday&&{backgroundColor:brand.gold+'18'}]}>
                <Text style={[s.dcDay,isToday&&{color:brand.gold}]}>{DAYS[i]}</Text>
                <Text style={[s.dcNum,isToday&&{color:brand.gold}]}>{d.getDate()}</Text>
              </View>
              {pct>=100&&weeklyDone>=dayWeeklyHabits.length&&<View style={s.dcCheck}><Text style={{fontSize:8}}>✓</Text></View>}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Today Header ── */}
      <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
        <Text style={s.sectionTitle}>Today</Text>
        <View style={{flexDirection:'row',alignItems:'center',gap:8}}>
          <View style={{alignItems:'center'}}>
            <Text style={{fontSize:20,fontWeight:'800',color:compColor(dailyPct/100)}}>{doneDaily}/{dailyHabits.length}</Text>
            <Text style={{fontSize:8,color:C.textDim}}>daily</Text>
          </View>
          {weeklyToday.length>0&&(
            <View style={{alignItems:'center'}}>
              <Text style={{fontSize:14,fontWeight:'700',color:brand.blue}}>{doneWeekly}/{weeklyToday.length}</Text>
              <Text style={{fontSize:8,color:C.textDim}}>weekly</Text>
            </View>
          )}
        </View>
      </View>

      {/* ── Category Cards with today's habits + weekly cumulative ── */}
      {todayGrouped.map(({cat,habits:ch})=>{
        // Weekly cumulative for this category
        const weeklyStats=ch.map(h=>{
          const scheduledDays=h.frequency==='daily'?7:(h.selectedDays||[]).length;
          if(h.type==='timer'){
            const weekMins=weekDates.reduce((sum,d)=>sum+(log[fmt(d)]?.[h.id]?.minutes||0),0);
            const weekTarget=h.targetMinutes*scheduledDays;
            return {h,weekMins,weekTarget,weekPct:weekTarget>0?Math.round((weekMins/weekTarget)*100):0};
          } else {
            const weekDone=weekDates.reduce((sum,d)=>sum+(log[fmt(d)]?.[h.id]?.done?1:0),0);
            return {h,weekDone,weekTarget:scheduledDays,weekPct:scheduledDays>0?Math.round((weekDone/scheduledDays)*100):0};
          }
        });
        const catWeekPct=weeklyStats.length>0?Math.round(weeklyStats.reduce((s,ws)=>s+ws.weekPct,0)/weeklyStats.length):0;

        return(
        <View key={cat.id} style={[s.catCard,{backgroundColor:cat.bg,borderColor:cat.border}]}>
          <View style={s.catHeader}>
            <View style={[s.catIcon,{backgroundColor:cat.color+'20'}]}><Text style={{fontSize:16}}>{cat.icon}</Text></View>
            <View style={{flex:1,marginLeft:10}}>
              <Text style={[s.catTitle,{color:cat.color}]}>{cat.name}</Text>
              <Text style={{fontSize:10,color:cat.color+'90'}}>{ch.filter(h=>log[todayStr]?.[h.id]?.done).length}/{ch.length} done today</Text>
            </View>
            {/* Weekly cumulative badge */}
            <View style={{alignItems:'center'}}>
              <Text style={{fontSize:16,fontWeight:'800',color:compColor(catWeekPct/100)}}>{catWeekPct}%</Text>
              <Text style={{fontSize:8,color:C.textDim}}>week</Text>
            </View>
          </View>

          {/* Weekly cumulative bar for category */}
          <View style={{height:4,backgroundColor:cat.border,borderRadius:2,overflow:'hidden',marginTop:8,marginBottom:4}}>
            <View style={{height:'100%',width:`${Math.min(100,catWeekPct)}%`,backgroundColor:cat.color,borderRadius:2}}/></View>

          {ch.map(h=>{
            const entry=log[todayStr]?.[h.id];
            const done=!!entry?.done;
            const ws=weeklyStats.find(w=>w.h.id===h.id);
            return(
              <View key={h.id} style={{marginTop:8}}>
                <TouchableOpacity onPress={()=>{if(h.type==='check')toggleDay(h.id,todayStr);}}
                  style={{flexDirection:'row',alignItems:'center',gap:10,padding:10,
                    backgroundColor:done?'#fff':'transparent',borderRadius:10,
                    borderWidth:done?1:0,borderColor:cat.border}}>
                  <View style={[s.check,done&&{backgroundColor:cat.color,borderColor:cat.color}]}>
                    {done&&<Text style={{color:'#fff',fontSize:14,fontWeight:'700'}}>✓</Text>}
                  </View>
                  <View style={{flex:1}}>
                    <Text style={[{fontSize:13,fontWeight:'600',color:C.text},
                      done&&{textDecorationLine:'line-through',color:C.textDim}]}>{h.icon} {h.name}</Text>

                    {/* Timer: daily progress */}
                    {h.type==='timer'&&(
                      <View style={{flexDirection:'row',alignItems:'center',gap:6,marginTop:4}}>
                        <View style={{flex:1,height:4,backgroundColor:cat.border,borderRadius:2,overflow:'hidden'}}>
                          <View style={{height:'100%',width:`${Math.min(100,(entry?.minutes||0)/h.targetMinutes*100)}%`,
                            backgroundColor:cat.color,borderRadius:2}}/></View>
                        <Text style={{fontSize:11,fontWeight:'700',color:cat.color}}>
                          {entry?.minutes||0}/{h.targetMinutes}m</Text>
                      </View>
                    )}

                    {/* Weekly cumulative line */}
                    {ws&&(
                      <View style={{flexDirection:'row',alignItems:'center',gap:4,marginTop:3}}>
                        <Text style={{fontSize:9,color:C.textDim}}>Week:</Text>
                        <View style={{flex:1,height:3,backgroundColor:cat.border+'80',borderRadius:2,overflow:'hidden'}}>
                          <View style={{height:'100%',width:`${Math.min(100,ws.weekPct)}%`,
                            backgroundColor:ws.weekPct>=100?brand.green:cat.color+'80',borderRadius:2}}/></View>
                        <Text style={{fontSize:9,fontWeight:'700',color:ws.weekPct>=100?brand.green:C.textDim}}>
                          {h.type==='timer'?`${ws.weekMins}/${ws.weekTarget}m`:`${ws.weekDone}/${ws.weekTarget}x`}
                          {ws.weekPct>=100?' ✓':''}
                        </Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>

                {/* Timer: +/- buttons */}
                {h.type==='timer'&&(
                  <View style={{flexDirection:'row',gap:4,marginTop:4,paddingLeft:36}}>
                    {[-5,5,15,30].map(delta=>(
                      <TouchableOpacity key={delta} onPress={()=>addMinutes(h.id,todayStr,delta,h.targetMinutes)}
                        style={{paddingHorizontal:10,paddingVertical:5,borderRadius:6,
                          backgroundColor:delta>0?'#fff':C.bg,borderWidth:1,borderColor:cat.border}}>
                        <Text style={{fontSize:11,fontWeight:'700',color:delta>0?cat.color:C.textDim}}>
                          {delta>0?'+':''}{delta}</Text>
                      </TouchableOpacity>))}
                  </View>
                )}
              </View>
            );
          })}
        </View>
        );
      })}
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════
// HABITS TAB
// ═══════════════════════════════════════════════════════════════════
function HabitsTab({habits,showAdd,setShowAdd,addHabit,editHabit,setEditHabit,updateHabit,deleteHabit}) {
  return(<View>
    <TouchableOpacity onPress={()=>{setShowAdd(true);setEditHabit(null);}} style={s.addBtn}>
      <Text style={s.addBtnT}>＋ Add new habit</Text></TouchableOpacity>
    {(showAdd||editHabit)&&<HabitForm habit={editHabit} onSave={editHabit?updateHabit:addHabit}
      onCancel={()=>{setShowAdd(false);setEditHabit(null);}}/>}
    {!habits.length&&!showAdd&&<View style={s.empty}><Text style={{fontSize:36,marginBottom:12}}>📋</Text>
      <Text style={s.emptySub}>Tap the button above to create your first habit</Text></View>}
    {CATS.map(cat=>{const ch=habits.filter(h=>h.categoryId===cat.id);if(!ch.length)return null;
      return(<View key={cat.id} style={[s.catCard,{backgroundColor:cat.bg,borderColor:cat.border,marginBottom:12}]}>
        <View style={s.catHeader}>
          <View style={[s.catIcon,{backgroundColor:cat.color+'20'}]}><Text style={{fontSize:16}}>{cat.icon}</Text></View>
          <View style={{flex:1,marginLeft:10}}>
            <Text style={[s.catTitle,{color:cat.color}]}>{cat.name}</Text>
            <Text style={{fontSize:10,color:C.textDim}}>{ch.length} habit{ch.length>1?'s':''}</Text>
          </View>
        </View>
        {ch.map(h=>(<View key={h.id} style={{flexDirection:'row',alignItems:'center',marginTop:8,
          backgroundColor:'#fff',borderRadius:10,padding:12,borderWidth:1,borderColor:cat.border}}>
          <View style={{flex:1}}>
            <Text style={{fontSize:13,fontWeight:'600',color:C.text}}>{h.icon} {h.name}</Text>
            <Text style={{fontSize:10,color:C.textDim,marginTop:2}}>
              {h.type==='timer'?`${h.targetMinutes} min`:'Checkbox'} · {h.frequency==='daily'?'Daily':
                `${(h.selectedDays||[]).map(d=>DAYS[d]).join(', ')}`}</Text></View>
          <TouchableOpacity onPress={()=>setEditHabit(h)} style={s.actionBtn}><Text>✏️</Text></TouchableOpacity>
          <TouchableOpacity onPress={()=>Alert.alert('Delete',`Delete "${h.name}"?`,[{text:'Cancel',style:'cancel'},
            {text:'Delete',style:'destructive',onPress:()=>deleteHabit(h.id)}])} style={s.actionBtn}><Text>🗑</Text></TouchableOpacity>
        </View>))}
      </View>);})}
  </View>);
}

// ═══════════════════════════════════════════════════════════════════
// HABIT FORM
// ═══════════════════════════════════════════════════════════════════
function HabitForm({habit,onSave,onCancel}) {
  const [name,setName]=useState(habit?.name||'');
  const [type,setType]=useState(habit?.type||'check');
  const [freq,setFreq]=useState(habit?.frequency||'daily');
  const [mins,setMins]=useState(String(habit?.targetMinutes||15));
  const [selectedDays,setSelectedDays]=useState(habit?.selectedDays||[]);
  const [icon,setIcon]=useState(habit?.icon||'🎯');
  const [catId,setCatId]=useState(habit?.categoryId||'fitness');
  const cat=CATS.find(c=>c.id===catId)||CATS[0];
  const toggleDaySel=(i)=>setSelectedDays(p=>p.includes(i)?p.filter(d=>d!==i):[...p,i].sort());

  return(
    <View style={s.form}>
      <Text style={s.formTitle}>{habit?'Edit habit':'New habit'}</Text>

      <Text style={s.label}>CATEGORY</Text>
      <View style={{gap:6,marginBottom:12}}>
        {CATS.map(c=>(
          <TouchableOpacity key={c.id} onPress={()=>setCatId(c.id)}
            style={{flexDirection:'row',alignItems:'center',padding:10,borderRadius:10,
              backgroundColor:catId===c.id?c.bg:C.bg,borderWidth:catId===c.id?2:1,
              borderColor:catId===c.id?c.color:C.border}}>
            <Text style={{fontSize:18,marginRight:10}}>{c.icon}</Text>
            <View style={{flex:1}}>
              <Text style={{fontSize:13,fontWeight:'600',color:catId===c.id?c.color:C.textMuted}}>{c.name}</Text>
              <Text style={{fontSize:9,color:C.textDim}}>{c.examples}</Text>
            </View>
          </TouchableOpacity>))}
      </View>

      <Text style={s.label}>HABIT NAME</Text>
      <TextInput value={name} onChangeText={setName} placeholder="e.g. Morning yoga, Read 30min"
        placeholderTextColor={C.textDark} style={s.input}/>

      <Text style={s.label}>ICON</Text>
      <View style={{flexDirection:'row',flexWrap:'wrap',gap:6,marginBottom:12}}>
        {ICONS.map(ic=>(<TouchableOpacity key={ic} onPress={()=>setIcon(ic)}
          style={[s.iconBtn,icon===ic&&{borderColor:cat.color,borderWidth:2,backgroundColor:cat.bg}]}>
          <Text style={{fontSize:18}}>{ic}</Text></TouchableOpacity>))}</View>

      <Text style={s.label}>TYPE</Text>
      <View style={{flexDirection:'row',gap:8,marginBottom:12}}>
        {[['check','✓ Checkbox'],['timer','⏱ Timer (minutes)']].map(([v,l])=>(
          <TouchableOpacity key={v} onPress={()=>setType(v)} style={[s.toggle,type===v&&{borderColor:cat.color,backgroundColor:cat.bg}]}>
            <Text style={[s.toggleT,type===v&&{color:cat.color}]}>{l}</Text></TouchableOpacity>))}</View>

      {type==='timer'&&(<><Text style={s.label}>DAILY TARGET (MINUTES)</Text>
        <TextInput value={mins} onChangeText={setMins} keyboardType="number-pad" style={s.input}/></>)}

      <Text style={s.label}>FREQUENCY</Text>
      <View style={{flexDirection:'row',gap:8,marginBottom:12}}>
        {[['daily','Every day'],['weekly','Specific days']].map(([v,l])=>(
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

// ═══════════════════════════════════════════════════════════════════
// STATS TAB
// ═══════════════════════════════════════════════════════════════════
function StatsTab({habits,log}) {
  const last30=useMemo(()=>Array.from({length:30},(_,i)=>{const d=new Date();d.setDate(d.getDate()-(29-i));return d;}),[]);
  const habitStats=useMemo(()=>habits.map(h=>{
    const done=last30.filter(d=>log[fmt(d)]?.[h.id]?.done).length;
    const cat=CATS.find(c=>c.id===h.categoryId);
    return{name:h.icon+' '+h.name,rate:Math.round((done/30)*100),color:h.color,cat};}),[habits,log,last30]);
  const streaks=useMemo(()=>habits.map(h=>{let streak=0;
    for(let i=0;i<365;i++){const d=new Date();d.setDate(d.getDate()-i);if(log[fmt(d)]?.[h.id]?.done)streak++;else break;}
    return{name:h.icon+' '+h.name,streak,color:h.color};}).sort((a,b)=>b.streak-a.streak),[habits,log]);

  if(!habits.length) return <View style={s.empty}><Text style={{fontSize:48,marginBottom:16}}>📊</Text>
    <Text style={s.emptySub}>Add habits to see stats</Text></View>;

  // Group stats by category
  const grouped=CATS.map(cat=>({cat,stats:habitStats.filter(h=>h.cat?.id===cat.id)})).filter(g=>g.stats.length>0);

  return(<View>
    {grouped.map(({cat,stats})=>(
      <View key={cat.id} style={[s.statsCard,{borderLeftWidth:3,borderLeftColor:cat.color}]}>
        <Text style={[s.statsTitle,{color:cat.color}]}>{cat.icon} {cat.name}</Text>
        {stats.map((h,i)=>(<View key={i} style={{flexDirection:'row',alignItems:'center',marginBottom:10}}>
          <Text style={{width:90,fontSize:11,color:C.textMuted}} numberOfLines={1}>{h.name}</Text>
          <View style={{flex:1,height:10,backgroundColor:C.borderLight,borderRadius:5,overflow:'hidden',marginHorizontal:8}}>
            <View style={{height:'100%',width:`${h.rate}%`,backgroundColor:h.color,borderRadius:5}}/></View>
          <Text style={{width:36,textAlign:'right',fontSize:12,fontWeight:'700',color:h.color}}>{h.rate}%</Text>
        </View>))}
      </View>
    ))}
    {streaks.length>0&&<View style={s.statsCard}>
      <Text style={s.statsTitle}>🔥 Current streaks</Text>
      {streaks.map((st,i)=>(<View key={i} style={{flexDirection:'row',justifyContent:'space-between',paddingVertical:8,
        borderBottomWidth:i<streaks.length-1?1:0,borderBottomColor:C.borderLight}}>
        <Text style={{fontSize:13,color:C.textMuted}}>{st.name}</Text>
        <Text style={{fontSize:16,fontWeight:'800',color:st.streak>7?brand.green:st.streak>0?brand.gold:C.textDark}}>
          {st.streak} {st.streak===1?'day':'days'}</Text></View>))}
    </View>}
  </View>);
}

// ═══════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════
const s = StyleSheet.create({
  root:{flex:1,backgroundColor:C.bg},
  content:{flex:1,paddingHorizontal:16},
  logoArea:{alignItems:'center',paddingTop:12,marginBottom:4},
  logoMark:{fontSize:28,fontWeight:'800',color:brand.blue,letterSpacing:-1},
  logoName:{fontSize:11,fontWeight:'700',color:brand.blue,letterSpacing:3,marginTop:2},
  logoSub:{fontSize:8,fontWeight:'600',color:C.textDim,letterSpacing:2},
  tagline:{textAlign:'center',fontSize:14,fontWeight:'600',color:C.textMuted,marginBottom:16},

  weekNav:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:10},
  navBtn:{width:32,height:32,borderRadius:16,backgroundColor:C.white,borderWidth:1,borderColor:C.border,justifyContent:'center',alignItems:'center'},
  navBtnT:{color:C.textDim,fontSize:14},
  weekLabel:{fontSize:12,fontWeight:'600',color:C.textDim},

  cardsRow:{flexDirection:'row',marginBottom:16,gap:4},
  dayCard:{flex:1,borderRadius:12,backgroundColor:C.white,borderWidth:1,borderColor:C.border,overflow:'hidden',minHeight:110,position:'relative'},
  dcProgress:{flex:1,padding:3,position:'relative'},
  dcTrack:{position:'absolute',left:3,right:3,top:3,bottom:3,borderRadius:9,backgroundColor:'#E8ECF0',overflow:'hidden',justifyContent:'flex-end'},
  dcFill:{width:'100%',borderRadius:9,minHeight:1},
  dcOverlay:{position:'absolute',left:0,right:0,top:0,bottom:0,justifyContent:'center',alignItems:'center'},
  dcPct:{fontSize:11,fontWeight:'800'},
  dcCount:{fontSize:7,fontWeight:'700',position:'absolute',top:6},
  dcLabel:{paddingVertical:4,alignItems:'center',borderTopWidth:1,borderTopColor:C.border},
  dcDay:{fontSize:9,fontWeight:'700',color:C.textDim,letterSpacing:.3},
  dcNum:{fontSize:12,fontWeight:'800',color:C.textMuted},
  dcCheck:{position:'absolute',top:2,right:2,width:14,height:14,borderRadius:7,backgroundColor:brand.green,justifyContent:'center',alignItems:'center'},

  sectionTitle:{fontSize:16,fontWeight:'700',color:C.text},
  catCard:{borderRadius:14,padding:14,marginBottom:10,borderWidth:1},
  catHeader:{flexDirection:'row',alignItems:'center'},
  catIcon:{width:32,height:32,borderRadius:8,justifyContent:'center',alignItems:'center'},
  catTitle:{fontSize:14,fontWeight:'700'},
  check:{width:24,height:24,borderRadius:12,borderWidth:2,borderColor:C.textDark,justifyContent:'center',alignItems:'center'},

  empty:{alignItems:'center',paddingVertical:50},
  emptyTitle:{fontSize:18,fontWeight:'700',color:C.textDim,marginBottom:8},
  emptySub:{fontSize:13,color:C.textDark,textAlign:'center'},

  actionBtn:{width:32,height:32,borderRadius:6,borderWidth:1,borderColor:C.border,justifyContent:'center',alignItems:'center',marginLeft:4},
  addBtn:{padding:14,borderRadius:12,backgroundColor:brand.blue,alignItems:'center',marginBottom:14},
  addBtnT:{fontSize:14,fontWeight:'700',color:'#fff'},

  form:{backgroundColor:C.white,borderRadius:16,padding:18,marginBottom:14,borderWidth:1,borderColor:C.border},
  formTitle:{fontSize:17,fontWeight:'700',color:brand.blue,marginBottom:14},
  label:{fontSize:10,fontWeight:'600',color:C.textDim,letterSpacing:1,marginBottom:5,marginTop:2},
  input:{backgroundColor:C.bg,borderWidth:1,borderColor:C.border,borderRadius:10,padding:11,color:C.text,fontSize:14,marginBottom:10},
  iconBtn:{width:36,height:36,borderRadius:8,borderWidth:1,borderColor:C.border,backgroundColor:C.bg,justifyContent:'center',alignItems:'center'},
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

  modalBg:{flex:1,backgroundColor:'rgba(0,0,0,0.4)',justifyContent:'flex-end'},
  modalBox:{backgroundColor:C.white,borderTopLeftRadius:24,borderTopRightRadius:24,padding:20,maxHeight:'80%'},
});
