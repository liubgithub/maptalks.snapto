import * as maptalks from 'maptalks';
import rbush from 'rbush';

maptalks.Map.include({
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
});
