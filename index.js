import * as maptalks from 'maptalks';
import rbush from 'geojson-rbush';

const options = {
    'mode': 'point',
    'tolerance':10,
    'symbol':{
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
};


export class SnapTool extends maptalks.Class {
    constructor(options) {
        super(options);
        this.tree = rbush();
        //this._checkMode();
    }

    getMode() {
        return this.mode;
    }

    setMode(mode) {
        this.mode = mode;
    }

    addTo(map) {
        const id = `${maptalks.INTERNAL_LAYER_PREFIX}_snapto`;
        this._mousemoveLayer = new maptalks.VectorLayer(id).addTo(map);
        this._map = map;
    }

    getMap() {
        return this._map;
    }

    enable(callback) {
        const map = this.getMap();
        if (this.allGeometries) {
            this._registerEvents(map, callback);
        }
    }

    disable() {
        const map = this.getMap();
        map.off('mousemove', this._mousemove);
    }

    setGeometries(geometries) {
        geometries = (geometries instanceof Array) ? geometries : [geometries];
        this.allGeometries = this._compositLine(geometries);
    }

    _prepareGeometries(coordinate) {
        if (this.allGeometries) {
            const allGeoInGeojson = this.allGeometries;
            this.tree.clear();
            this.tree.load({
                'type': 'FeatureCollection',
                'features':allGeoInGeojson
            });
            this.inspectExtent = this._createInspectExtent(coordinate);
            const availGeometries = this.tree.search(this.inspectExtent);
            return availGeometries;
        }
        return null;
    }

    _compositLine(geometries) {
        let geos = [];
        geometries.forEach(function (geo) {
            switch (geo.getType()) {
            case 'Point':
                break;
            case 'Polyline':
                geos = geos.concat(this._parserGeometries(geo, 1));
                break;
            case 'Polygon':
                geos = geos.concat(this._parserGeometries(geo, 2));
                break;
            default:
                break;
            }

        }.bind(this));
        return geos;
    }

    _parserGeometries(geo, _len) {
        const coordinates = geo.getCoordinates();
        let geos = [];
        //分两种情况，一种是单条线的， 另一种是多条线
        if (coordinates[0].x && coordinates[0].y) {
            const _lines = this._createLine(coordinates, _len, geo);
            geos = geos.concat(_lines);
        } else {
            coordinates.forEach(function (coords) {
                const _lines = this._createLine(coords, _len, geo);
                geos = geos.concat(_lines);
            }.bind(this));
        }
        return geos;
    }

    _createLine(coordinates, _length, geo) {
        const lines = [];
        const len = coordinates.length - _length;
        for (let i = 0; i < len; i++) {
            const line = new maptalks.LineString([coordinates[i], coordinates[i + 1]], {
                properties : {
                    obj : geo
                }
            });
            lines.push(line.toGeoJSON());
        }
        return lines;
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
    _registerEvents(map, callback) {
        this._mousemove = function (e) {
            if (!this._marker) {
                this._marker = new maptalks.Marker(e.coordinate, {
                    'symbol' : this.options['symbol']
                }).addTo(this._mousemoveLayer);
            } else {
                this._marker.setCoordinates(e.coordinate);
            }
            const availLines = this._findGeometry(e.coordinate);
            if (availLines.features.length > 0) {
                if (callback) callback(availLines);
                console.log(availLines.features.length);
                const snapPoint = this._getSnapPoint(availLines);
                this._marker.setCoordinates([snapPoint.x, snapPoint.y]);
            }
        };
        map.on('mousemove', this._mousemove, this);
    }

    _setDistance(lines) {
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const distance = this._distToPolyline(this._marker.getCenter(), line);
            line.properties.distance = distance;
            const lineEquation = this._setEquation(line);
            const VerticalLine = this._setVertiEquation(lineEquation.B / lineEquation.A, this._marker.getCenter());
            const insectPoint = this._solveEquation(lineEquation, VerticalLine);
            line.properties.insectPoint = insectPoint;
        }
        return lines;
    }

    _findNearestLine(lines) {
        lines = this._setDistance(lines);
        lines = lines.sort(this._compare(lines, 'distance'));
        return lines[0];
    }

    _findLines(features) {
        const lines = this._compositLine(features);
        let tree = rbush();
        tree.load({
            'type': 'FeatureCollection',
            'features':lines
        });
        const availLines = tree.search(this.inspectExtent);
        return availLines;
    }

    _findGeometry(coordinate) {
        const availGeimetries = this._prepareGeometries(coordinate);
        return availGeimetries;
    }

    _getSnapPoint(availLines) {
        const _nearestLine = this._findNearestLine(availLines.features);
        const nearestLine = this._setEquation(_nearestLine);
        const verticalLine = this._setVertiEquation(nearestLine.A / nearestLine.B, this._marker.getCenter());
        const snapPoint = this._solveEquation(nearestLine, verticalLine);
        return snapPoint;
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
        const k = (from[1] - to[1]) / (from[0] - to[0]);
        const A = k;
        const B = -1;
        const C = from[1] - k * from[0];
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

