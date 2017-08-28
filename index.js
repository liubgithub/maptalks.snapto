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
 * A snap tool used for mouse point to adsorb geometries, it extends maptalks.Class.
 *
 * Thanks to rbush's author, this pluging has used the rbush to inspect surrounding geometries within tolerance(https://github.com/mourner/rbush)
 *
 * @author liubgithub(https://github.com/liubgithub)
 *
 * MIT License
 */
export class SnapTool extends maptalks.Class {
    constructor(options) {
        super(options);
        this.tree = rbush();
    }

    getMode() {
        this._mode = !this._mode ? this.options['mode'] : this._mode;
        if (this._checkMode(this._mode)) {
            return this._mode;
        } else {
            throw new Error('snap mode is invalid');
        }
    }

    setMode(mode) {
        if (this._checkMode(this._mode)) {
            this._mode = mode;
        } else {
            throw new Error('snap mode is invalid');
        }
    }

    /**
     * @param {Map} map object
     * When using the snap tool, you should add it to a map firstly.the enable method excute default
     */
    addTo(map) {
        const id = `${maptalks.INTERNAL_LAYER_PREFIX}_snapto`;
        this._mousemoveLayer = new maptalks.VectorLayer(id).addTo(map);
        this._map = map;
        this.allGeometries = [];
        this.enable();
    }

    getMap() {
        return this._map;
    }

    /**
     * @param {String} snap mode
     * mode should be either 'point' or 'line'
     */
    _checkMode(mode) {
        if (mode === 'point' || mode === 'line') {
            return true;
        } else {
            return false;
        }
    }

    /**
     * Start snap interaction
     */
    enable() {
        const map = this.getMap();
        if (this.allGeometries) {
            if (!this._mousemove) {
                this._registerEvents(map);
            }
        } else {
            throw new Error('you should set geometries which are snapped to firstly!');
        }
    }

    /**
     * End snap interaction
     */
    disable() {
        const map = this.getMap();
        map.off('mousemove', this._mousemove);
        delete this._mousemove;
    }

    /**
     * @param {Geometry||Array<Geometry>} geometries to snap to
     * Set geomeries to an array for snapping to
     */
    setGeometries(geometries) {
        geometries = (geometries instanceof Array) ? geometries : [geometries];
        this.allGeometries = this._compositGeometries(geometries);
    }

    /**
     * @param {Layer} layer to snap to
     * Set layer for snapping to
     */
    setLayer(layer) {
        if (layer instanceof maptalks.VectorLayer) {
            const geometries = layer.getGeometries();
            this.allGeometries = this._compositGeometries(geometries);
            layer.on('addgeo', function (e) {
                this._addGeometries(e.geometries);
            }, this);
            layer.on('clear', function () {
                this._clearGeometries();
            }, this);
        }
    }

    _addGeometries(geometries) {
        geometries = (geometries instanceof Array) ? geometries : [geometries];
        const addGeometries = this._compositGeometries(geometries);
        this.allGeometries = this.allGeometries.concat(addGeometries);
    }

    _clearGeometries() {
        this.addGeometries = [];
    }

    /**
     * @param {Coordinate} mouse's coordinate on map
     * Using a point to inspect the surrounding geometries
     */
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
        const mode = this.getMode();
        if (mode === 'point') {
            geos = this._compositToPoints(geometries);
        } else if (mode === 'line') {
            geos = this._compositToLines(geometries);
        }
        return geos;
    }

    _compositToPoints(geometries) {
        let geos = [];
        geometries.forEach(function (geo) {
            geos = geos.concat(this._parserToPoints(geo));
        }.bind(this));
        return geos;
    }

    _createMarkers(coords) {
        const markers = [];
        coords.forEach(function (coord) {
            let _geo = new maptalks.Marker(coord, {
                properties:{}
            });
            _geo = _geo.toGeoJSON();
            markers.push(_geo);
        });
        return markers;
    }

    _parserToPoints(geo) {
        let coordinates = geo.getCoordinates();
        let geos = [];
        //two cases,one is single geometry,and another is multi geometries
        if (coordinates[0] instanceof Array) {
            coordinates.forEach(function (coords) {
                const _markers = this._createMarkers(coords);
                geos = geos.concat(_markers);
            }.bind(this));
        } else {
            if (!(coordinates instanceof Array)) {
                coordinates = [coordinates];
            }
            const _markers = this._createMarkers(coordinates);
            geos = geos.concat(_markers);
        }
        return geos;
    }

    _compositToLines(geometries) {
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
        if (coordinates[0] instanceof Array) {
            coordinates.forEach(function (coords) {
                const _lines = this._createLine(coords, _len, geo);
                geos = geos.concat(_lines);
            }.bind(this));
        } else {
            const _lines = this._createLine(coordinates, _len, geo);
            geos = geos.concat(_lines);
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

    /**
     * @param {Map}
     * Register mousemove event
     */
    _registerEvents(map) {
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
                const snapPoint = this._getSnapPoint(availGeometries);
                if (snapPoint) {
                    this._marker.setCoordinates([snapPoint.x, snapPoint.y]);
                }
            }
        };
        map.on('mousemove', this._mousemove, this);
    }

    /**
     * @param {Array<geometry>} available geometries which are surrounded
     * Calaculate the distance from mouse point to every geometry
     */
    _setDistance(geos) {
        const geoObjects = [];
        for (let i = 0; i < geos.length; i++) {
            const geo = geos[i];
            if (geo.geometry.type === 'LineString') {
                const distance = this._distToPolyline(this.mousePoint, geo);
                //geo.properties.distance = distance;
                geoObjects.push({
                    geoObject : geo,
                    distance : distance
                });
            } else if (geo.geometry.type === 'Point') {
                const distance = this._distToPoint(this.mousePoint, geo);
                //Composite an object including geometry and distance
                geoObjects.push({
                    geoObject : geo,
                    distance : distance
                });
            }
        }
        return geoObjects;
    }

    _findNearestGeometries(geos) {
        let geoObjects = this._setDistance(geos);
        geoObjects = geoObjects.sort(this._compare(geoObjects, 'distance'));
        return geoObjects[0];
    }

    _findGeometry(coordinate) {
        const availGeimetries = this._prepareGeometries(coordinate);
        return availGeimetries;
    }

    _getSnapPoint(availGeometries) {
        const _nearestGeometry = this._findNearestGeometries(availGeometries.features);
        let snapPoint = null;
        if (!this._validDistance(_nearestGeometry.distance)) {
            return null;
        }
        //when point, return itself
        if (_nearestGeometry.geoObject.geometry.type === 'Point') {
            snapPoint = {
                x : _nearestGeometry.geoObject.geometry.coordinates[0],
                y : _nearestGeometry.geoObject.geometry.coordinates[1]
            };
        } else if (_nearestGeometry.geoObject.geometry.type === 'LineString') {
            //when line,return the vertical insect point
            const nearestLine = this._setEquation(_nearestGeometry.geoObject);
            //whether k exist
            if (nearestLine.A === 0) {
                snapPoint = {
                    x: this.mousePoint.x,
                    y: _nearestGeometry.geoObject.geometry.coordinates[0][1]
                };
            } else if (nearestLine.A === Infinity) {
                snapPoint = {
                    x: _nearestGeometry.geoObject.geometry.coordinates[0][0],
                    y: this.mousePoint.y
                };
            } else {
                const k = nearestLine.B / nearestLine.A;
                const verticalLine = this._setVertiEquation(k, this.mousePoint);
                snapPoint = this._solveEquation(nearestLine, verticalLine);
            }
        }
        return snapPoint;
    }

    //Calaculate the distance from a point to a line
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
        const k = Number((from[1] - to[1]) / (from[0] - to[0]).toString());
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
            const value1 = object1[propertyName];
            const value2 = object2[propertyName];
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

