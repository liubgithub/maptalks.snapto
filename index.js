import * as maptalks from 'maptalks';
import rbush from 'rbush';

const options = {
    'mode': 'point'
};

/*maptalks.Map.include({
    startSnapTo(options) {
      const geometries = options['geometries'];
      if(Array.isArray(geometries)) {
        const len = geometries.length;
        for(let i = 0;i < len; i++) {
           if (geometries[i] instanceof maptalks.Geometry) {//Geometry Object
               const geo = geometries[i].toGeoJSON();
            }
            if (geometries[i].type && geometries[i].type == 'Feature') {//geoGeoJSON Object
               const geo = geometries[i].geometry;
            }
        }
      }
    },

    endSnapTo() {

    }
});*/
class SnapTool extends maptalks.MapTool {
    constructor(options) {
        super(options);
        //this._checkMode();
    }

    getMode() {

    }

    setMode(mode) {

    }
    
    addTo(map) {
        this._mousemoveLayer = new maptalks.VectorLayer('SnapTool_mousemovelayer').addTo(map);
        this._registerEvents();
        return super.addTo(map);
    }

    enable() {
        const map = this.getMap();
        if (this._snapGeometries) {
            map.on('mousemove',this._mousemove,this);
        }
    }

    disable() {
         const map = this.getMap();
         map.off('mousemove',this._mousemove);
    }

    setLayer(layer) {
        if (layer instanceof maptalks.VectorLayer) {
            this._snapGeometries = layer.getGeometries();
        }
    }

    _registerEvents(map) {
        this._mousemove = function(e){
            if(!this._marker){
              this._marker = new maptalks.Marker(e.coordinate, {
                'symbol' : {
                'markerType': 'ellipse',
                'markerFill': 'rgb(10,20,200)',
                'markerFillOpacity': 1,
                'markerLineColor': '#fff',
                'markerLineWidth': 1,
                'markerLineOpacity': 1,
                'markerWidth': 20,
                'markerHeight': 20,
                'markerDx': 0,
                'markerDy': 0
               }
              }).addTo(this._mousemoveLayer);
            }
            else {
               this._marker.setCoordinates(e.coordinate);
            }

        }
    }

    _snap() {
        const mousePoint = this._marker.toGeoJSON();
    }

    _getAllGeometries() {

    }
}

