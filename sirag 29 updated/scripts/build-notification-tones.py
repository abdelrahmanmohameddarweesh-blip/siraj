"""Generate original short non-vocal notification cues. Python stdlib only, 44.1kHz mono PCM."""
import math, wave, struct
from pathlib import Path
RATE=44100
OUT=Path(__file__).resolve().parent.parent/'assets'/'sounds'
TONES={
 'wudu_drop':[(0,980,.28),(.32,1320,.32),(.72,1640,.38)],
 'wudu_soft':[(0,660,.45),(.55,880,.55)],
 'prayer_bell':[(0,523.25,.7),(.38,659.25,.7),(.76,783.99,.85)],
 'prayer_soft':[(0,392,.7),(.8,523.25,.8)],
 'gentle':[(0,440,.65),(.52,554.37,.65),(1.04,659.25,.8)],
}
for name, notes in TONES.items():
 samples=[0.0]*int((max(start+dur for start,_,dur in notes)+.2)*RATE)
 for start,freq,dur in notes:
  for i in range(int(dur*RATE)):
   t=i/RATE
   env=min(1,t/.012)*math.exp(-t*5/dur)*min(1,(dur-t)/.06)
   # Pure pitched water cue versus harmonic bell. No copied recording or spoken words.
   phase=2*math.pi*(freq*t+(35*dur/(2*math.pi))*math.sin(t/dur*math.pi)) if name.startswith('wudu') else 2*math.pi*freq*t
   value=(math.sin(phase)+.2*math.sin(phase*2.01))*.3*env
   samples[int(start*RATE)+i]+=value
 peak=max(abs(v) for v in samples)
 with wave.open(str(OUT/(name+'.wav')),'wb') as w:
  w.setparams((1,2,RATE,0,'NONE','not compressed'))
  w.writeframes(b''.join(struct.pack('<h',int(v/max(peak,1)*32700)) for v in samples))
 print(name,round(len(samples)/RATE,2),'seconds')
