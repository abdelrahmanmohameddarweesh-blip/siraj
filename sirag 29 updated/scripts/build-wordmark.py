"""Optional asset generator. Requires fonttools + uharfbuzz, not needed to run the app.
The bundled Aref Ruqaa font is licensed under assets/fonts/AREFRUQAA-OFL.txt.
Shapes Arabic before converting glyph outlines, preserving joining and descenders.
"""
from pathlib import Path
import json
import uharfbuzz as hb
from fontTools.ttLib import TTFont
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
root=Path(__file__).resolve().parents[1]
raw=(root/'assets/fonts/ArefRuqaa-Bold.ttf').read_bytes()
face=hb.Face(raw); font=hb.Font(face); font.scale=(face.upem,face.upem); hb.ot_font_set_funcs(font)
buffer=hb.Buffer(); buffer.add_str('سراج'); buffer.guess_segment_properties(); hb.shape(font,buffer)
ttf=TTFont(root/'assets/fonts/ArefRuqaa-Bold.ttf'); glyphs=ttf.getGlyphSet(); order=ttf.getGlyphOrder()
placements=[]; cursor=0
bounds=BoundsPen(glyphs)
for info,pos in zip(buffer.glyph_infos,buffer.glyph_positions):
 name=order[info.codepoint]; x=cursor+pos.x_offset; y=pos.y_offset
 placements.append((name,x,y)); glyphs[name].draw(TransformPen(bounds,(1,0,0,1,x,y))); cursor+=pos.x_advance
x0,y0,x1,y1=bounds.bounds
pad=round((y1-y0)*0.05)
pen=SVGPathPen(glyphs)
for name,x,y in placements:glyphs[name].draw(TransformPen(pen,(1,0,0,-1,x-x0+pad,y1-y+pad)))
asset={'width':x1-x0+2*pad,'height':y1-y0+2*pad,'path':pen.getCommands()}
(root/'src/brand/wordmark.json').write_text(json.dumps(asset,separators=(',',':'))+'\n')
print('Exported complete shaped wordmark:',asset['width'],asset['height'])
