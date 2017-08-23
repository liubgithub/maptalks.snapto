import * as maptalks from 'maptalks';
import rbush from 'geojson-rbush';

const options = {
    'mode': 'line',
    'tolerance':10,
    'symbol':{
        'markerType': 'ellipse',
        'markerFill': '#0f89f5',
        'markerLineColor': '#fff',
        'markerLineWidth': 2,
        'markerLineOpacity': 1,
        'markerWidth': 15,
        'markerHeight': 15
    }
};

/**
 * Takes an array of LinearRings and optionally an {@link Object} with properties and returns a {@link Polygon} feature.
 *
 * @name polygon
 * @param {Array<Array<Array<number>>>} coordinates an array of LinearRings
 * @param {Object} [properties={}] an Object of key-value pairs to add as properties
 * @param {Array<number>} [bbox] BBox [west, south, east, north]
 * @param {string|number} [id] Identifier
 * @returns {Feature<Polygon>} a Polygon feature
 * @throws {Error} throw an error if a LinearRing of the polygon has too few positions
 * or if a LinearRing of the Polygon does not have matching Positions at the beginning & end.
 **/
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
        } else {
            throw new Error('you should set geometries which are snapped to firstly!');
        }
    }

    disable() {
        const map = this.getMap();
        map.off('mousemove', this._mousemove);
    }

    setGeometries(geometries) {
        geometries = (geometries instanceof Array) ? geometries : [geometries];
        this.allGeometries = this._compositGeometries(geometries);
    }

    setLayer(layer) {
        if (layer instanceof maptalks.VectorLayer) {
            const geometries = layer.getGeometries();
            this.allGeometries = this._compositGeometries(geometries);
            layer.on('addgeo', function (e) {
                this._addGeometries(e.geometries);
            }, this);
        }
    }

    _addGeometries(geometries) {
        geometries = (geometries instanceof Array) ? geometries : [geometries];
        const addGeometries = this._compositGeometries(geometries);
        this.allGeometries = this.allGeometries.concat(addGeometries);
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
            //the search result's structure should be remembered
            const availGeometries = this.tree.search(this.inspectExtent);
            return availGeometries;
        }
        return null;
    }

    _compositGeometries(geometries) {
        let geos = [];
        geometries.forEach(function (geo) {
            switch (geo.getType()) {
            case 'Point': {
                const _geo = geo.toGeoJSON();
                _geo.properties = {};
                geos.push(_geo);
            }
                break;
            case 'LineString':
            case 'Polygon':
                geos = geos.concat(this._parserGeometries(geo, 1));
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
        //two cases,one is single geometry,and another is multi geometries
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
            this.mousePoint = e.coordinate;
            if (!this._marker) {
                this._marker = new maptalks.Marker(e.coordinate, {
                    'symbol' : this.options['symbol']
                }).addTo(this._mousemoveLayer);
            } else {
                this._marker.setCoordinates(e.coordinate);
            }
            const availGeometries = this._findGeometry(e.coordinate);
            if (availGeometries.features.length > 0) {
                if (callback) callback(availGeometries);
                console.log(availGeometries.features.length);
                const snapPoint = this._getSnapPoint(availGeometries);
                if (snapPoint) {
                    this._marker.setCoordinates([snapPoint.x, snapPoint.y]);
                }
            }
        };
        map.on('mousemove', this._mousemove, this);
    }

    _setDistance(geos) {
        for (let i = 0; i < geos.length; i++) {
            const geo = geos[i];
            if (geo.geometry.type === 'LineString') {
                const distance = this._distToPolyline(this.mousePoint, geo);
                geo.properties.distance = distance;
            } else if (geo.geometry.type === 'Point') {
                const distance = this._distToPoint(this.mousePoint, geo);
                geo.properties.distance = distance;
            }
        }
        return geos;
    }

    _findNearestGeometries(geos) {
        geos = this._setDistance(geos);
        geos = geos.sort(this._compare(geos, 'distance'));
        return geos[0];
    }

    _findGeometry(coordinate) {
        const availGeimetries = this._prepareGeometries(coordinate);
        return availGeimetries;
    }

    _getSnapPoint(availGeometries) {
        const _nearestGeometry = this._findNearestGeometries(availGeometries.features);
        if (!this._validDistance(_nearestGeometry.properties.distance)) {
            return null;
        }
        //when point, return itself
        if (_nearestGeometry.geometry.type === 'Point') {
            return {
                x : _nearestGeometry.geometry.coordinates[0],
                y : _nearestGeometry.geometry.coordinates[1]
            };
        } else if (_nearestGeometry.geometry.type === 'LineString') {
            //when line,return the vertical insect point
            const nearestLine = this._setEquation(_nearestGeometry);
            const k = nearestLine.B / nearestLine.A;
            if (k) {
                const verticalLine = this._setVertiEquation(k, this.mousePoint);
                const snapPoint = this._solveEquation(nearestLine, verticalLine);
                return snapPoint;
            }
        }
        return null;
    }

    /*_getAllGeometries() {
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
    }*/
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

    _validDistance(distance) {
        const map = this.getMap();
        const resolution = map.getResolution();
        const tolerance = this.options['tolerance'];
        if (distance / resolution > tolerance) {
            return false;
        } else {
            return true;
        }
    }

    _distToPoint(mousePoint, toPoint) {
        const from = [mousePoint.x, mousePoint.y];
        const to = toPoint.geometry.coordinates;
        return Math.sqrt(Math.pow(from[0] - to[0], 2) + Math.pow(from[1] - to[1], 2));
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

