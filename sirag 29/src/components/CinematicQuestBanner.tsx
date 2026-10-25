import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { useLanguage } from '../contexts/LanguageContext';

type Props = {
  titleAr: string; titleEn: string;
  descriptionAr: string; descriptionEn: string;
  icon?: string; chapter?: number; compact?: boolean;
};

/** A reusable RTL-aware illustrated journey banner; intentionally decorative, not a reward claim. */
export default function CinematicQuestBanner({titleAr,titleEn,descriptionAr,descriptionEn,icon='✦',chapter,compact=false}: Props) {
  const { language } = useLanguage();
  const ar = language === 'ar';
  return <LinearGradient colors={['#185B4B','#0B3B34','#082722']} start={{x:0,y:0}} end={{x:1,y:1}} style={[styles.panel,compact&&styles.compact]}>
    <View pointerEvents="none" style={styles.art}>
      <Svg width="154" height="150" viewBox="0 0 154 150">
        <Circle cx="108" cy="30" r="23" fill="#EAC779" opacity={0.15}/>
        <Path d="M5 150V96Q38 47 72 96V150Z" fill="#D6AF5D" opacity={0.18}/>
        <Path d="M20 96Q38 68 56 96" stroke="#F0D18A" opacity={0.4} fill="none" strokeWidth="2"/>
        <Rect x="93" y="77" width="12" height="73" fill="#D6AF5D" opacity={0.17}/>
        <Path d="M91 77L99 55L107 77Z" fill="#EFC879" opacity={0.32}/>
        <Path d="M0 142H154" stroke="#EFC879" opacity={0.5}/>
      </Svg>
    </View>
    <View style={[styles.row, {flexDirection: ar ? 'row-reverse':'row'}]}>
      <Text style={styles.eyebrow}>{chapter ? (ar ? `الفصل ${chapter} • رحلة البطل` : `CHAPTER ${chapter} • HERO JOURNEY`) : (ar ? 'بَطَل مُسْلِم • رحلة جديدة' : 'BATL MUSLIM • NEW JOURNEY')}</Text>
      <Text style={styles.icon}>{icon}</Text>
    </View>
    <Text style={[styles.title,{textAlign:ar?'right':'left'}]}>{ar?titleAr:titleEn}</Text>
    <Text style={[styles.description,{textAlign:ar?'right':'left'}]}>{ar?descriptionAr:descriptionEn}</Text>
    <View style={[styles.dots,{flexDirection:ar?'row-reverse':'row'}]}><View style={styles.activeDot}/><View style={styles.dot}/><View style={styles.dot}/><View style={styles.line}/></View>
  </LinearGradient>;
}
const styles=StyleSheet.create({
 panel:{marginHorizontal:16,marginTop:8,marginBottom:11,padding:16,borderRadius:18,borderWidth:1,borderColor:'#B49353',overflow:'hidden',minHeight:0},
 compact:{minHeight:0,padding:16}, art:{position:'absolute',right:0,bottom:0,opacity:0.13},row:{alignItems:'center',justifyContent:'space-between'},
 eyebrow:{fontSize:10,color:'#E6C781',fontWeight:'800',letterSpacing:0.2},icon:{color:'#F8D990',fontSize:20},
 title:{fontSize:21,fontWeight:'900',color:'#FFF9E9',marginTop:7,maxWidth:'100%'},description:{fontSize:12.5,color:'#CFE3DA',lineHeight:21,marginTop:6,maxWidth:'100%'},
 dots:{alignItems:'center',gap:6,marginTop:8},activeDot:{width:23,height:5,borderRadius:5,backgroundColor:'#E8C16B'},dot:{width:5,height:5,borderRadius:5,backgroundColor:'#6C9785'},line:{height:1,flex:1,backgroundColor:'#527466',marginHorizontal:9}
});
