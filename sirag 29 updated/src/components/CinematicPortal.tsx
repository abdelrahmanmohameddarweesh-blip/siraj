import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

type Scene = 'mosque'|'quran'|'sirah'|'garden'|'arena'|'night';
type Props = {scene:Scene;title:string;subtitle:string;eyebrow?:string;action?:string;onPress?:()=>void;compact?:boolean;progress?:number};
const themes:Record<Scene,[string,string,string]>={
 mosque:['#113D33','#0A2827','#071B20'],quran:['#155849','#083D36','#071F24'],
 sirah:['#79502C','#3E3429','#111E22'],garden:['#416B43','#17483C','#0B2B29'],
 arena:['#4E3A30','#202C2C','#081E23'],night:['#183F49','#102E37','#091D27']};
function SceneArt({scene}:{scene:Scene}) {
 const garden=scene==='garden',sirah=scene==='sirah',gold=sirah?'#F5BE72':'#F2D18A';
 return <Svg width="100%" height="100%" viewBox="0 0 340 190" preserveAspectRatio="xMidYMid slice">
  <Circle cx="255" cy="47" r="31" fill={gold} opacity={0.24}/><Circle cx="255" cy="47" r="24" fill={gold} opacity={0.18}/>
  <Path d="M0 153Q45 118 90 144T180 142T340 137V190H0Z" fill={garden?'#2B6246':'#174A42'} opacity={0.75}/>
  {garden ? <><Path d="M220 180V105M218 142Q170 124 179 98Q216 96 221 130M222 125Q272 103 275 81Q235 82 221 112" stroke="#B6D895" strokeWidth="9" fill="none" strokeLinecap="round"/><Circle cx="201" cy="90" r="34" fill="#477E51"/><Circle cx="244" cy="82" r="37" fill="#64985D"/><Circle cx="225" cy="58" r="28" fill="#83A56A"/></> : scene==='quran' ? <><Path d="M148 142Q186 118 222 138L222 166Q187 146 148 169Z" fill="#F5DCA0" opacity={0.88}/><Path d="M222 138Q257 118 293 142L293 169Q257 146 222 166Z" fill="#FFF1C5" opacity={0.9}/><Path d="M222 138V166M161 147L203 139M239 140L277 147" stroke="#9A7C45" strokeWidth="1.4" fill="none"/><Path d="M162 170L222 178L282 170" stroke="#D3A95E" strokeWidth="4" fill="none"/></> : <><Rect x="160" y="104" width="128" height="72" fill={sirah?'#8B6240':'#286457'}/><Path d="M175 104Q224 28 274 104Z" fill={sirah?'#B48A57':'#4C8572'}/><Path d="M201 174V129Q225 99 249 129V174Z" fill="#0A302C"/><Rect x="151" y="83" width="15" height="93" fill={sirah?'#987045':'#397363'}/><Path d="M149 83L159 59L168 83Z" fill={gold}/><Rect x="284" y="99" width="12" height="76" fill={sirah?'#987045':'#397363'}/><Path d="M282 99L290 76L299 99Z" fill={gold}/></>}
  <Path d="M0 184Q80 165 160 183T340 177V190H0Z" fill="#082620" opacity={0.8}/>
 </Svg>;
}
export default function CinematicPortal({scene,title,subtitle,eyebrow,action,onPress,compact=false,progress}:Props) {
 const content=<LinearGradient colors={themes[scene]} start={{x:0,y:0}} end={{x:1,y:1}} style={[styles.card,compact?styles.compact:styles.large]}>
  <View style={styles.art} pointerEvents="none"><SceneArt scene={scene}/></View><View style={styles.shade} pointerEvents="none"/>
  <View style={styles.textArea}>{!!eyebrow&&<Text style={styles.eyebrow}>{eyebrow}</Text>}
   <Text style={[styles.title,compact&&styles.compactTitle]}>{title}</Text><Text style={styles.subtitle}>{subtitle}</Text>
   {typeof progress==='number'&&<View style={styles.track}><View style={[styles.fill,{width:`${Math.max(0,Math.min(100,progress))}%` as `${number}%`}]}/></View>}
   {!!action&&<View style={styles.action}><Text style={styles.actionText}>{action}</Text></View>}
  </View>
 </LinearGradient>;
 return onPress?<TouchableOpacity activeOpacity={0.88} accessibilityRole="button" onPress={onPress}>{content}</TouchableOpacity>:content;
}
const styles=StyleSheet.create({
 card:{overflow:'hidden',borderRadius:22,borderWidth:1,borderColor:'#A5834B',justifyContent:'flex-end'},large:{minHeight:238},compact:{minHeight:158},
 art:{position:'absolute',top:0,bottom:0,right:0,left:0,opacity:0.94},shade:{position:'absolute',top:0,bottom:0,right:0,left:0,backgroundColor:'rgba(4,20,20,0.35)'},
 textArea:{padding:20,gap:7,maxWidth:'85%'},eyebrow:{color:'#F6D38B',fontSize:11,fontWeight:'800',letterSpacing:0.6},
 title:{color:'#FFF4DB',fontSize:24,lineHeight:34,fontWeight:'900'},compactTitle:{fontSize:20,lineHeight:29},
 subtitle:{color:'#D7E8DB',fontSize:13,lineHeight:21,fontWeight:'500'},action:{backgroundColor:'#EFC778',paddingHorizontal:16,paddingVertical:10,borderRadius:12,alignSelf:'flex-start',marginTop:5},
 actionText:{color:'#173C31',fontWeight:'900',fontSize:13},track:{height:5,backgroundColor:'#366255',borderRadius:5,overflow:'hidden',marginTop:4},fill:{height:5,backgroundColor:'#EFC778',borderRadius:5},
});
