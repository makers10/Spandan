import { GpsCoordinate } from '@/utils/geo';

export type OverleapMapLayer = 'tactical' | 'satellite' | 'terrain';

const STYLES: Record<OverleapMapLayer, string> = {
  tactical: 'https://tiles.openfreemap.org/styles/dark',
  satellite: 'https://tiles.openfreemap.org/styles/bright',
  terrain: 'https://tiles.openfreemap.org/styles/liberty',
};

export function generateMapLibreHtml(
  points: GpsCoordinate[],
  layer: OverleapMapLayer,
  lat: number,
  lng: number
): string {
  const styleUrl = STYLES[layer] || STYLES.tactical;
  const coords = JSON.stringify(points.map((p) => [p.longitude, p.latitude]));

  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<link href="https://cdnjs.cloudflare.com/ajax/libs/maplibre-gl/4.7.1/maplibre-gl.min.css" rel="stylesheet"/>
<style>
*{margin:0;padding:0;box-sizing:border-box;}
html,body,#map{width:100%;height:100%;background:#090d16;overflow:hidden;}
.pulse{width:16px;height:16px;border-radius:50%;background:#00b8a2;border:2.5px solid #fff;box-shadow:0 0 14px #00f5d4;}
#loader{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:#090d16;z-index:99;color:#00b8a2;font-family:sans-serif;font-size:11px;font-weight:700;letter-spacing:1px;}
.spinner{width:22px;height:22px;border:3px solid rgba(0,184,162,0.2);border-top-color:#00b8a2;border-radius:50%;animation:s 0.8s linear infinite;margin-right:8px;}
@keyframes s{to{transform:rotate(360deg);}}
</style></head><body>
<div id="loader"><div class="spinner"></div>INITIALIZING VECTOR MAP...</div>
<div id="map"></div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/maplibre-gl/4.7.1/maplibre-gl.min.js"></script>
<script>
function init(){
  var l=document.getElementById('loader');
  if(typeof maplibregl==='undefined'){if(l)l.style.display='none';return;}
  try{
    var m=new maplibregl.Map({container:'map',style:'${styleUrl}',center:[${lng},${lat}],zoom:15,attributionControl:false});
    m.on('load',function(){
      if(l)l.style.display='none';
      var el=document.createElement('div');
      el.className='pulse';
      new maplibregl.Marker({element:el}).setLngLat([${lng},${lat}]).addTo(m);
      var pts=${coords};
      if(pts.length>1){
        m.addSource('rt',{type:'geojson',data:{type:'Feature',geometry:{type:'LineString',coordinates:pts}}});
        m.addLayer({id:'rt',type:'line',source:'rt',layout:{'line-join':'round','line-cap':'round'},paint:{'line-color':'#00b8a2','line-width':5}});
        var b=pts.reduce(function(a,c){return a.extend(c);},new maplibregl.LngLatBounds(pts[0],pts[0]));
        m.fitBounds(b,{padding:30});
      }
    });
    m.on('error',function(){if(l)l.style.display='none';});
  }catch(e){if(l)l.style.display='none';}
}
window.addEventListener('load',init);
setTimeout(init,1000);
</script></body></html>`;
}
