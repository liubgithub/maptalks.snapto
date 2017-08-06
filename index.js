import * as maptalks from 'maptalks';

maptalks.Map.include({
    startSnapTo(options) {
      const geometries = options['geometries'];
      if(Array.isArray(geometries)) {
        const len = geometries.length;
        for(let i = 0;i < len; i++) {
           if (geometries[i] instanceof maptalks.Geometry) {
               const geo = geometries[i].toGeoJSON();
            }
        }
      }
    },

    endSnapTo() {

    }
});
