import * as maptalks from 'maptalks';
import rbush from 'geojson-rbush';

const options = {
    'mode': 'point',
    'tolerance':10
};


export class SnapTool extends maptalks.MapTool {
    constructor(options) {
        super(options);
        //this._checkMode();
    }

    getMode() {
        return this.mode;
    }

    setMode(mode) {
        this.mode = mode;
    }

    addTo(map) {
        this._mousemoveLayer = new maptalks.VectorLayer('SnapTool_mousemovelayer').addTo(map);
        return super.addTo(map);
    }

    enable() {
        const map = this.getMap();
        this.allGeometries = this._getAllGeometries();
        if (this.allGeometries) {
            this._registerEvents(map);
        }
    }

    disable() {
        const map = this.getMap();
        map.off('mousemove', this._mousemove);
    }

    setLayer(layer) {
        if (layer instanceof maptalks.VectorLayer) {
            this._snapLayer = layer;
        }
    }

    _prepareGeometries(coordinate) {
        if (this.allGeometries) {
            const allGeoInGeojson = this._toGeoJSON(this.allGeometries);
            let tree = rbush();
            tree.load({
                'type': 'FeatureCollection',
                'features':allGeoInGeojson
            });
            this.inspectExtent = this._createInspectExtent(coordinate);
            const availGeometries = tree.search(this.inspectExtent);
            return availGeometries;
        }
        return null;
    }

    _createInspectExtent(coordinate) {
        const tolerance = (!this.options['tolerance']) ? 10 : this.options['tolerance'];
        const map = this.getMap();
        const zoom = map.getZoom();
        const screenPoint = map.coordinateToPoint(coordinate, zoom);
        const lefttop = map.pointToCoordinate(new maptalks.Point([screenPoint.x - tolerance, screenPoint.y - tolerance]), zoom);
        const righttop = map.pointToCoordinate(new maptalks.Point([screenPoint.x + tolerance, screenPoint.y - tolerance]), zoom);
        const leftbottom = map.pointToCoordinate(new maptalks.Point([screenPoint.x - tolerance, screenPoint.y + tolerance]), zoom);
        const rightbottom = map.pointToCoordinate(new maptalks.Point([screenPoint.x + tolerance, screenPoint.y + tolerance]), zoom);
        return {
            'type': 'Feature',
            'properties': {},
            'geometry': {
                'type': 'Polygon',
                'coordinates': [[[lefttop.x, lefttop.y], [righttop.x, righttop.y], [rightbottom.x, rightbottom.y], [leftbottom.x, leftbottom.y]]]
            }
        };
    }
    _registerEvents(map) {
        this._mousemove = function (e) {
            if (!this._marker) {
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
            } else {
                this._marker.setCoordinates(e.coordinate);
            }
            var geos = this._findGeometry(e.coordinate);
            if (geos.features.length > 0) {
                console.log(geos.features.length);
                const availLines = this._findLines(geos.features);
                const nearestLine = this._findNearestLine(availLines);
            }
            return geos;
        };
        map.on('mousemove', this._mousemove, this);
    }

    _setDistance(lines) {
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const distance = this._distToPolyline(this._marker.getCenter(), line);
            line.properties.distance = distance;
            const lineEquation = this._setEquation(line);
            const VerticalLine = this._setVertiEquation(-lineEquation.A / lineEquation.B, this._marker.getCenter());
            const insectPoint = this._solveEquation(lineEquation, VerticalLine);
            line.properties.insectPoint = insectPoint;
        }
        return lines;
    }

    _findNearestLine(lines) {
        lines = this._compare(lines, 'distance');
        return lines[0];
    }

    _findLines(features) {
        const lines = this._compositLine(features);
        let tree = rbush();
        tree.clear();
        tree.load({
            'type': 'FeatureCollection',
            'features':lines
        });
        const availLines = tree.search(this.inspectExtent);
        return availLines;
    }

    _findGeometry(coordinate) {
        const tolerance = (!this.options['tolerance']) ? 10 : this.options['tolerance'];
        const availGeimetries = this._prepareGeometries(coordinate, tolerance);
        return availGeimetries;
    }

    _compositLine(features) {
        const geos = [];
        features.forEach(feature => {
            const coordinates = feature.geometry.coordinates;
            for (let i = 0; i < coordinates.length; i++) {
                const coords = coordinates[i];
                let len = coords.length - 1;
                if (feature.geometry.type === 'polygon') {
                    len = coords.length - 2;
                } else if (feature.geometry.type === 'linestring') {
                    len = coords.length - 1;
                }
                for (let j = 0; j < len - 1; j++) {
                    const line = new maptalks.LineString([coords[j], coords[j + 1]], {
                        properties : {
                            obj : feature.getProperties().obj
                        }
                    });
                    geos.push(line.toGeoJSON());
                }
            }
        });
        return geos;
    }

    _snap() {
        const mousePoint = this._marker.toGeoJSON();
        return mousePoint;
    }

    _getAllGeometries() {
        let _allGeometries = [];
        if (this._snapLayer) {
            _allGeometries = this._snapLayer.getGeometries();
        } else {
            const map = this.getMap();
            const layers = map.getLayers(function (layer) {
                return (layer instanceof maptalks.VectorLayer);
            });
            layers.forEach(function (layer) {
                _allGeometries = _allGeometries.concat(layer.getGeometries());
            });
        }
        return _allGeometries;
    }
    ///
    _toGeoJSON(geometries) {
        const _snapGeometries = [];
        if (geometries instanceof Array) {
            geometries.forEach(function (geo) {
                const geojson = geo.toGeoJSON();
                geojson.properties.obj = geo;
                _snapGeometries.push(geojson);
            });
        }
        return _snapGeometries;
    }
    //calaculate the distance from a point to a line
    _distToPolyline(point, line) {
        const equation = this._setEquation(line);
        const A = equation.A;
        const B = equation.B;
        const C = equation.C;
        const distance = Math.abs((A * point.x + B * point.y + C) / Math.sqrt(Math.pow(A, 2) + Math.pow(B, 2)));
        return distance;
    }
    //create a line's equation
    _setEquation(line) {
        const coords = line.geometry.coordinates;
        const from = coords[0];
        const to = coords[1];
        const k = (from.y - to.y) / (from.x - to.x);
        const A = k;
        const B = -1;
        const C = from.y - k * from.x;
        return {
            A : A,
            B : B,
            C : C
        };
    }

    _setVertiEquation(k, point) {
        const b = point.y - k * point.x;
        const A = k;
        const B = -1;
        const C = b;
        return {
            A : A,
            B : B,
            C : C
        };
    }
    _solveEquation(equationW, equationU) {
        const A1 = equationW.A, B1 = equationW.B, C1 = equationW.C;
        const A2 = equationU.A, B2 = equationU.B, C2 = equationU.C;
        const x = (B1 * C2 - C1 * B2) / (A1 * B2 - A2 * B1);
        const y = (A1 * C2 - A2 * C1) / (B1 * A2 - B2 * A1);
        return {
            x:x,
            y:y
        };
    }

    _compare(data, propertyName) {
        return function (object1, object2) {
            const value1 = object1.properties[propertyName];
            const value2 = object2.properties[propertyName];
            if (value2 < value1) {
                return 1;
            } else if (value2 > value1) {
                return -1;
            } else {
                return 0;
            }
        };
    }
}

SnapTool.mergeOptions(options);

