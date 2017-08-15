import * as maptalks from 'maptalks';
import snapLine from '@turf/point-on-line';

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

    onEnable() {
        const map = this.getMap();
    }

    setLayer(layer) {
        if (layer instanceof maptalks.VectorLayer) {
            this._snapGeometries = layer.getGeometries();
        }
    }

    _getAllGeometries() {

    }
}

