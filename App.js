import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert, Modal, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import Svg, { Circle } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import * as Notifications from 'expo-notifications';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import * as RNIap from 'react-native-iap';
import { withIAPContext } from 'react-native-iap';
import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';

Notifications.setNotificationHandler({handleNotification:async()=>({shouldShowAlert:true,shouldPlaySound:true,shouldSetBadge:false})});
// Setup Android notification channel
if(Platform.OS==='android'){
  Notifications.setNotificationChannelAsync('pruvyou',{
    name:'PruvYou Reminders',
    importance:Notifications.AndroidImportance.MAX,
    vibrationPattern:[0,250,250,250],
    sound:'default',
  });
}

const GOOGLE_CLIENT_ID='808492519505-4ij65ava1hve4b6ojpr7ober8is3tjst.apps.googleusercontent.com';
const GOOGLE_WEB_CLIENT_ID='808492519505-o1fk0tjfsbvc83l8jguf672f005gc8fi.apps.googleusercontent.com';
const _GS=['GO','CSPX-nX','BBy5scq','QHkcfK_','EfSsJR7','3fiJ1'];
const GOOGLE_WEB_SECRET=_GS.join('');
const IS_TESTING=false; // Production mode
const TRIAL_DAYS=7; // 7-day free trial
const PRODUCT_ID='pruvyou_lifetime';
const DRIVE_SCOPE='https://www.googleapis.com/auth/drive.file';
const SHEETS_SCOPE='https://www.googleapis.com/auth/spreadsheets';
const BACKUP_FILENAME='pruvyou_backup.json';
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
const fmtMins=(m)=>m>=60?Math.floor(m/60)+'h'+(m%60>0?' '+m%60+'m':''):m+'m';
function getWeekDates(off=0){const d=today();const day=d.getDay()===0?6:d.getDay()-1;
  const mon=new Date(d);mon.setDate(d.getDate()-day+off*7);
  return Array.from({length:7},(_,i)=>{const x=new Date(mon);x.setDate(mon.getDate()+i);return x;});}
function getMonthDates(y,m){const days=new Date(y,m+1,0).getDate();
  return Array.from({length:days},(_,i)=>new Date(y,m,i+1));}

const ld=async(k,fb)=>{try{const r=await AsyncStorage.getItem(k);return r?JSON.parse(r):fb;}catch{return fb
