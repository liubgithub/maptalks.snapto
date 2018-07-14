/*!
 * maptalks.snapto v0.1.11
 * LICENSE : MIT
 * (c) 2016-2018 maptalks.org
 */
/*!
 * requires maptalks@^0.33.1 
 */
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('maptalks')) :
	typeof define === 'function' && define.amd ? define(['exports', 'maptalks'], factory) :
	(factory((global.maptalks = global.maptalks || {}),global.maptalks));
}(this, (function (exports,maptalks) { 'use strict';

var commonjsGlobal = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};





function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var quickselect$1 = createCommonjsModule(function (module, exports) {
    (function (global, factory) {
        module.exports = factory();
    })(commonjsGlobal, function () {
        'use strict';

        function quickselect(arr, k, left, right, compare) {
            quickselectStep(arr, k, left || 0, right || arr.length - 1, compare || defaultCompare);
        }

        function quickselectStep(arr, k, left, right, compare) {

            while (right > left) {
                if (right - left > 600) {
                    var n = right - left + 1;
                    var m = k - left + 1;
                    var z = Math.log(n);
                    var s = 0.5 * Math.exp(2 * z / 3);
                    var sd = 0.5 * Math.sqrt(z * s * (n - s) / n) * (m - n / 2 < 0 ? -1 : 1);
                    var newLeft = Math.max(left, Math.floor(k - m * s / n + sd));
                    var newRight = Math.min(right, Math.floor(k + (n - m) * s / n + sd));
                    quickselectStep(arr, k, newLeft, newRight, compare);
                }

                var t = arr[k];
                var i = left;
                var j = right;

                swap(arr, left, k);
                if (compare(arr[right], t) > 0) swap(arr, left, right);

                while (i < j) {
                    swap(arr, i, j);
                    i++;
                    j--;
                    while (compare(arr[i], t) < 0) {
                        i++;
                    }while (compare(arr[j], t) > 0) {
                        j--;
                    }
                }

                if (compare(arr[left], t) === 0) swap(arr, left, j);else {
                    j++;
                    swap(arr, j, right);
                }

                if (j <= k) left = j + 1;
                if (k <= j) right = j - 1;
            }
        }

        function swap(arr, i, j) {
            var tmp = arr[i];
            arr[i] = arr[j];
            arr[j] = tmp;
        }

        function defaultCompare(a, b) {
            return a < b ? -1 : a > b ? 1 : 0;
        }

        return quickselect;
    });
});

var index$1 = rbush$2;
var default_1 = rbush$2;

var quickselect = quickselect$1;

function rbush$2(maxEntries, format) {
    if (!(this instanceof rbush$2)) return new rbush$2(maxEntries, format);

    // max entries in a node is 9 by default; min node fill is 40% for best performance
    this._maxEntries = Math.max(4, maxEntries || 9);
    this._minEntries = Math.max(2, Math.ceil(this._maxEntries * 0.4));

    if (format) {
        this._initFormat(format);
    }

    this.clear();
}

rbush$2.prototype = {

    all: function all() {
        return this._all(this.data, []);
    },

    search: function search(bbox) {

        var node = this.data,
            result = [],
            toBBox = this.toBBox;

        if (!intersects(bbox, node)) return result;

        var nodesToSearch = [],
            i,
            len,
            child,
            childBBox;

        while (node) {
            for (i = 0, len = node.children.length; i < len; i++) {

                child = node.children[i];
                childBBox = node.leaf ? toBBox(child) : child;

                if (intersects(bbox, childBBox)) {
                    if (node.leaf) result.push(child);else if (contains(bbox, childBBox)) this._all(child, result);else nodesToSearch.push(child);
                }
            }
            node = nodesToSearch.pop();
        }

        return result;
    },

    collides: function collides(bbox) {

        var node = this.data,
            toBBox = this.toBBox;

        if (!intersects(bbox, node)) return false;

        var nodesToSearch = [],
            i,
            len,
            child,
            childBBox;

        while (node) {
            for (i = 0, len = node.children.length; i < len; i++) {

                child = node.children[i];
                childBBox = node.leaf ? toBBox(child) : child;

                if (intersects(bbox, childBBox)) {
                    if (node.leaf || contains(bbox, childBBox)) return true;
                    nodesToSearch.push(child);
                }
            }
            node = nodesToSearch.pop();
        }

        return false;
    },

    load: function load(data) {
        if (!(data && data.length)) return this;

        if (data.length < this._minEntries) {
            for (var i = 0, len = data.length; i < len; i++) {
                this.insert(data[i]);
            }
            return this;
        }

        // recursively build the tree with the given data from scratch using OMT algorithm
        var node = this._build(data.slice(), 0, data.length - 1, 0);

        if (!this.data.children.length) {
            // save as is if tree is empty
            this.data = node;
        } else if (this.data.height === node.height) {
            // split root if trees have the same height
            this._splitRoot(this.data, node);
        } else {
            if (this.data.height < node.height) {
                // swap trees if inserted one is bigger
                var tmpNode = this.data;
                this.data = node;
                node = tmpNode;
            }

            // insert the small tree into the large tree at appropriate level
            this._insert(node, this.data.height - node.height - 1, true);
        }

        return this;
    },

    insert: function insert(item) {
        if (item) this._insert(item, this.data.height - 1);
        return this;
    },

    clear: function clear() {
        this.data = createNode([]);
        return this;
    },

    remove: function remove(item, equalsFn) {
        if (!item) return this;

        var node = this.data,
            bbox = this.toBBox(item),
            path = [],
            indexes = [],
            i,
            parent,
            index,
            goingUp;

        // depth-first iterative tree traversal
        while (node || path.length) {

            if (!node) {
                // go up
                node = path.pop();
                parent = path[path.length - 1];
                i = indexes.pop();
                goingUp = true;
            }

            if (node.leaf) {
                // check current node
                index = findItem(item, node.children, equalsFn);

                if (index !== -1) {
                    // item found, remove the item and condense tree upwards
                    node.children.splice(index, 1);
                    path.push(node);
                    this._condense(path);
                    return this;
                }
            }

            if (!goingUp && !node.leaf && contains(node, bbox)) {
                // go down
                path.push(node);
                indexes.push(i);
                i = 0;
                parent = node;
                node = node.children[0];
            } else if (parent) {
                // go right
                i++;
                node = parent.children[i];
                goingUp = false;
            } else node = null; // nothing found
        }

        return this;
    },

    toBBox: function toBBox(item) {
        return item;
    },

    compareMinX: compareNodeMinX,
    compareMinY: compareNodeMinY,

    toJSON: function toJSON() {
        return this.data;
    },

    fromJSON: function fromJSON(data) {
        this.data = data;
        return this;
    },

    _all: function _all(node, result) {
        var nodesToSearch = [];
        while (node) {
            if (node.leaf) result.push.apply(result, node.children);else nodesToSearch.push.apply(nodesToSearch, node.children);

            node = nodesToSearch.pop();
        }
        return result;
    },

    _build: function _build(items, left, right, height) {

        var N = right - left + 1,
            M = this._maxEntries,
            node;

        if (N <= M) {
            // reached leaf level; return leaf
            node = createNode(items.slice(left, right + 1));
            calcBBox(node, this.toBBox);
            return node;
        }

        if (!height) {
            // target height of the bulk-loaded tree
            height = Math.ceil(Math.log(N) / Math.log(M));

            // target number of root entries to maximize storage utilization
            M = Math.ceil(N / Math.pow(M, height - 1));
        }

        node = createNode([]);
        node.leaf = false;
        node.height = height;

        // split the items into M mostly square tiles

        var N2 = Math.ceil(N / M),
            N1 = N2 * Math.ceil(Math.sqrt(M)),
            i,
            j,
            right2,
            right3;

        multiSelect(items, left, right, N1, this.compareMinX);

        for (i = left; i <= right; i += N1) {

            right2 = Math.min(i + N1 - 1, right);

            multiSelect(items, i, right2, N2, this.compareMinY);

            for (j = i; j <= right2; j += N2) {

                right3 = Math.min(j + N2 - 1, right2);

                // pack each entry recursively
                node.children.push(this._build(items, j, right3, height - 1));
            }
        }

        calcBBox(node, this.toBBox);

        return node;
    },

    _chooseSubtree: function _chooseSubtree(bbox, node, level, path) {

        var i, len, child, targetNode, area, enlargement, minArea, minEnlargement;

        while (true) {
            path.push(node);

            if (node.leaf || path.length - 1 === level) break;

            minArea = minEnlargement = Infinity;

            for (i = 0, len = node.children.length; i < len; i++) {
                child = node.children[i];
                area = bboxArea(child);
                enlargement = enlargedArea(bbox, child) - area;

                // choose entry with the least area enlargement
                if (enlargement < minEnlargement) {
                    minEnlargement = enlargement;
                    minArea = area < minArea ? area : minArea;
                    targetNode = child;
                } else if (enlargement === minEnlargement) {
                    // otherwise choose one with the smallest area
                    if (area < minArea) {
                        minArea = area;
                        targetNode = child;
                    }
                }
            }

            node = targetNode || node.children[0];
        }

        return node;
    },

    _insert: function _insert(item, level, isNode) {

        var toBBox = this.toBBox,
            bbox = isNode ? item : toBBox(item),
            insertPath = [];

        // find the best node for accommodating the item, saving all nodes along the path too
        var node = this._chooseSubtree(bbox, this.data, level, insertPath);

        // put the item into the node
        node.children.push(item);
        extend(node, bbox);

        // split on node overflow; propagate upwards if necessary
        while (level >= 0) {
            if (insertPath[level].children.length > this._maxEntries) {
                this._split(insertPath, level);
                level--;
            } else break;
        }

        // adjust bboxes along the insertion path
        this._adjustParentBBoxes(bbox, insertPath, level);
    },

    // split overflowed node into two
    _split: function _split(insertPath, level) {

        var node = insertPath[level],
            M = node.children.length,
            m = this._minEntries;

        this._chooseSplitAxis(node, m, M);

        var splitIndex = this._chooseSplitIndex(node, m, M);

        var newNode = createNode(node.children.splice(splitIndex, node.children.length - splitIndex));
        newNode.height = node.height;
        newNode.leaf = node.leaf;

        calcBBox(node, this.toBBox);
        calcBBox(newNode, this.toBBox);

        if (level) insertPath[level - 1].children.push(newNode);else this._splitRoot(node, newNode);
    },

    _splitRoot: function _splitRoot(node, newNode) {
        // split root node
        this.data = createNode([node, newNode]);
        this.data.height = node.height + 1;
        this.data.leaf = false;
        calcBBox(this.data, this.toBBox);
    },

    _chooseSplitIndex: function _chooseSplitIndex(node, m, M) {

        var i, bbox1, bbox2, overlap, area, minOverlap, minArea, index;

        minOverlap = minArea = Infinity;

        for (i = m; i <= M - m; i++) {
            bbox1 = distBBox(node, 0, i, this.toBBox);
            bbox2 = distBBox(node, i, M, this.toBBox);

            overlap = intersectionArea(bbox1, bbox2);
            area = bboxArea(bbox1) + bboxArea(bbox2);

            // choose distribution with minimum overlap
            if (overlap < minOverlap) {
                minOverlap = overlap;
                index = i;

                minArea = area < minArea ? area : minArea;
            } else if (overlap === minOverlap) {
                // otherwise choose distribution with minimum area
                if (area < minArea) {
                    minArea = area;
                    index = i;
                }
            }
        }

        return index;
    },

    // sorts node children by the best axis for split
    _chooseSplitAxis: function _chooseSplitAxis(node, m, M) {

        var compareMinX = node.leaf ? this.compareMinX : compareNodeMinX,
            compareMinY = node.leaf ? this.compareMinY : compareNodeMinY,
            xMargin = this._allDistMargin(node, m, M, compareMinX),
            yMargin = this._allDistMargin(node, m, M, compareMinY);

        // if total distributions margin value is minimal for x, sort by minX,
        // otherwise it's already sorted by minY
        if (xMargin < yMargin) node.children.sort(compareMinX);
    },

    // total margin of all possible split distributions where each node is at least m full
    _allDistMargin: function _allDistMargin(node, m, M, compare) {

        node.children.sort(compare);

        var toBBox = this.toBBox,
            leftBBox = distBBox(node, 0, m, toBBox),
            rightBBox = distBBox(node, M - m, M, toBBox),
            margin = bboxMargin(leftBBox) + bboxMargin(rightBBox),
            i,
            child;

        for (i = m; i < M - m; i++) {
            child = node.children[i];
            extend(leftBBox, node.leaf ? toBBox(child) : child);
            margin += bboxMargin(leftBBox);
        }

        for (i = M - m - 1; i >= m; i--) {
            child = node.children[i];
            extend(rightBBox, node.leaf ? toBBox(child) : child);
            margin += bboxMargin(rightBBox);
        }

        return margin;
    },

    _adjustParentBBoxes: function _adjustParentBBoxes(bbox, path, level) {
        // adjust bboxes along the given tree path
        for (var i = level; i >= 0; i--) {
            extend(path[i], bbox);
        }
    },

    _condense: function _condense(path) {
        // go through the path, removing empty nodes and updating bboxes
        for (var i = path.length - 1, siblings; i >= 0; i--) {
            if (path[i].children.length === 0) {
                if (i > 0) {
                    siblings = path[i - 1].children;
                    siblings.splice(siblings.indexOf(path[i]), 1);
                } else this.clear();
            } else calcBBox(path[i], this.toBBox);
        }
    },

    _initFormat: function _initFormat(format) {
        // data format (minX, minY, maxX, maxY accessors)

        // uses eval-type function compilation instead of just accepting a toBBox function
        // because the algorithms are very sensitive to sorting functions performance,
        // so they should be dead simple and without inner calls

        var compareArr = ['return a', ' - b', ';'];

        this.compareMinX = new Function('a', 'b', compareArr.join(format[0]));
        this.compareMinY = new Function('a', 'b', compareArr.join(format[1]));

        this.toBBox = new Function('a', 'return {minX: a' + format[0] + ', minY: a' + format[1] + ', maxX: a' + format[2] + ', maxY: a' + format[3] + '};');
    }
};

function findItem(item, items, equalsFn) {
    if (!equalsFn) return items.indexOf(item);

    for (var i = 0; i < items.length; i++) {
        if (equalsFn(item, items[i])) return i;
    }
    return -1;
}

// calculate node's bbox from bboxes of its children
function calcBBox(node, toBBox) {
    distBBox(node, 0, node.children.length, toBBox, node);
}

// min bounding rectangle of node children from k to p-1
function distBBox(node, k, p, toBBox, destNode) {
    if (!destNode) destNode = createNode(null);
    destNode.minX = Infinity;
    destNode.minY = Infinity;
    destNode.maxX = -Infinity;
    destNode.maxY = -Infinity;

    for (var i = k, child; i < p; i++) {
        child = node.children[i];
        extend(destNode, node.leaf ? toBBox(child) : child);
    }

    return destNode;
}

function extend(a, b) {
    a.minX = Math.min(a.minX, b.minX);
    a.minY = Math.min(a.minY, b.minY);
    a.maxX = Math.max(a.maxX, b.maxX);
    a.maxY = Math.max(a.maxY, b.maxY);
    return a;
}

function compareNodeMinX(a, b) {
    return a.minX - b.minX;
}
function compareNodeMinY(a, b) {
    return a.minY - b.minY;
}

function bboxArea(a) {
    return (a.maxX - a.minX) * (a.maxY - a.minY);
}
function bboxMargin(a) {
    return a.maxX - a.minX + (a.maxY - a.minY);
}

function enlargedArea(a, b) {
    return (Math.max(b.maxX, a.maxX) - Math.min(b.minX, a.minX)) * (Math.max(b.maxY, a.maxY) - Math.min(b.minY, a.minY));
}

function intersectionArea(a, b) {
    var minX = Math.max(a.minX, b.minX),
        minY = Math.max(a.minY, b.minY),
        maxX = Math.min(a.maxX, b.maxX),
        maxY = Math.min(a.maxY, b.maxY);

    return Math.max(0, maxX - minX) * Math.max(0, maxY - minY);
}

function contains(a, b) {
    return a.minX <= b.minX && a.minY <= b.minY && b.maxX <= a.maxX && b.maxY <= a.maxY;
}

function intersects(a, b) {
    return b.minX <= a.maxX && b.minY <= a.maxY && b.maxX >= a.minX && b.maxY >= a.minY;
}

function createNode(children) {
    return {
        children: children,
        height: 1,
        leaf: true,
        minX: Infinity,
        minY: Infinity,
        maxX: -Infinity,
        maxY: -Infinity
    };
}

// sort an array so that items come in groups of n unsorted items, with groups sorted between each other;
// combines selection algorithm with binary divide & conquer approach

function multiSelect(arr, left, right, n, compare) {
    var stack = [left, right],
        mid;

    while (stack.length) {
        right = stack.pop();
        left = stack.pop();

        if (right - left <= n) continue;

        mid = left + Math.ceil((right - left) / n / 2) * n;
        quickselect(arr, mid, left, right, compare);

        stack.push(left, mid, mid, right);
    }
}

index$1.default = default_1;

/**
 * GeoJSON BBox
 *
 * @private
 * @typedef {[number, number, number, number]} BBox
 */

/**
 * GeoJSON Id
 *
 * @private
 * @typedef {(number|string)} Id
 */

/**
 * GeoJSON FeatureCollection
 *
 * @private
 * @typedef {Object} FeatureCollection
 * @property {string} type
 * @property {?Id} id
 * @property {?BBox} bbox
 * @property {Feature[]} features
 */

/**
 * GeoJSON Feature
 *
 * @private
 * @typedef {Object} Feature
 * @property {string} type
 * @property {?Id} id
 * @property {?BBox} bbox
 * @property {*} properties
 * @property {Geometry} geometry
 */

/**
 * GeoJSON Geometry
 *
 * @private
 * @typedef {Object} Geometry
 * @property {string} type
 * @property {any[]} coordinates
 */

/**
 * Callback for coordEach
 *
 * @callback coordEachCallback
 * @param {Array<number>} currentCoord The current coordinate being processed.
 * @param {number} coordIndex The current index of the coordinate being processed.
 * Starts at index 0.
 * @param {number} featureIndex The current index of the feature being processed.
 * @param {number} featureSubIndex The current subIndex of the feature being processed.
 */

/**
 * Iterate over coordinates in any GeoJSON object, similar to Array.forEach()
 *
 * @name coordEach
 * @param {(FeatureCollection|Feature|Geometry)} geojson any GeoJSON object
 * @param {Function} callback a method that takes (currentCoord, coordIndex, featureIndex, featureSubIndex)
 * @param {boolean} [excludeWrapCoord=false] whether or not to include the final coordinate of LinearRings that wraps the ring in its iteration.
 * @example
 * var features = turf.featureCollection([
 *   turf.point([26, 37], {"foo": "bar"}),
 *   turf.point([36, 53], {"hello": "world"})
 * ]);
 *
 * turf.coordEach(features, function (currentCoord, coordIndex, featureIndex, featureSubIndex) {
 *   //=currentCoord
 *   //=coordIndex
 *   //=featureIndex
 *   //=featureSubIndex
 * });
 */
function coordEach$1(geojson, callback, excludeWrapCoord) {
    // Handles null Geometry -- Skips this GeoJSON
    if (geojson === null) return;
    var featureIndex,
        geometryIndex,
        j,
        k,
        l,
        geometry,
        stopG,
        coords,
        geometryMaybeCollection,
        wrapShrink = 0,
        coordIndex = 0,
        isGeometryCollection,
        type = geojson.type,
        isFeatureCollection = type === 'FeatureCollection',
        isFeature = type === 'Feature',
        stop = isFeatureCollection ? geojson.features.length : 1;

    // This logic may look a little weird. The reason why it is that way
    // is because it's trying to be fast. GeoJSON supports multiple kinds
    // of objects at its root: FeatureCollection, Features, Geometries.
    // This function has the responsibility of handling all of them, and that
    // means that some of the `for` loops you see below actually just don't apply
    // to certain inputs. For instance, if you give this just a
    // Point geometry, then both loops are short-circuited and all we do
    // is gradually rename the input until it's called 'geometry'.
    //
    // This also aims to allocate as few resources as possible: just a
    // few numbers and booleans, rather than any temporary arrays as would
    // be required with the normalization approach.
    for (featureIndex = 0; featureIndex < stop; featureIndex++) {
        geometryMaybeCollection = isFeatureCollection ? geojson.features[featureIndex].geometry : isFeature ? geojson.geometry : geojson;
        isGeometryCollection = geometryMaybeCollection ? geometryMaybeCollection.type === 'GeometryCollection' : false;
        stopG = isGeometryCollection ? geometryMaybeCollection.geometries.length : 1;

        for (geometryIndex = 0; geometryIndex < stopG; geometryIndex++) {
            var featureSubIndex = 0;
            geometry = isGeometryCollection ? geometryMaybeCollection.geometries[geometryIndex] : geometryMaybeCollection;

            // Handles null Geometry -- Skips this geometry
            if (geometry === null) continue;
            coords = geometry.coordinates;
            var geomType = geometry.type;

            wrapShrink = excludeWrapCoord && (geomType === 'Polygon' || geomType === 'MultiPolygon') ? 1 : 0;

            switch (geomType) {
                case null:
                    break;
                case 'Point':
                    callback(coords, coordIndex, featureIndex, featureSubIndex);
                    coordIndex++;
                    featureSubIndex++;
                    break;
                case 'LineString':
                case 'MultiPoint':
                    for (j = 0; j < coords.length; j++) {
                        callback(coords[j], coordIndex, featureIndex, featureSubIndex);
                        coordIndex++;
                        if (geomType === 'MultiPoint') featureSubIndex++;
                    }
                    if (geomType === 'LineString') featureSubIndex++;
                    break;
                case 'Polygon':
                case 'MultiLineString':
                    for (j = 0; j < coords.length; j++) {
                        for (k = 0; k < coords[j].length - wrapShrink; k++) {
                            callback(coords[j][k], coordIndex, featureIndex, featureSubIndex);
                            coordIndex++;
                        }
                        if (geomType === 'MultiLineString') featureSubIndex++;
                    }
                    if (geomType === 'Polygon') featureSubIndex++;
                    break;
                case 'MultiPolygon':
                    for (j = 0; j < coords.length; j++) {
                        for (k = 0; k < coords[j].length; k++) {
                            for (l = 0; l < coords[j][k].length - wrapShrink; l++) {
                                callback(coords[j][k][l], coordIndex, featureIndex, featureSubIndex);
                                coordIndex++;
                            }
                        }featureSubIndex++;
                    }
                    break;
                case 'GeometryCollection':
                    for (j = 0; j < geometry.geometries.length; j++) {
                        coordEach$1(geometry.geometries[j], callback, excludeWrapCoord);
                    }break;
                default:
                    throw new Error('Unknown Geometry Type');
            }
        }
    }
}

/**
 * Callback for coordReduce
 *
 * The first time the callback function is called, the values provided as arguments depend
 * on whether the reduce method has an initialValue argument.
 *
 * If an initialValue is provided to the reduce method:
 *  - The previousValue argument is initialValue.
 *  - The currentValue argument is the value of the first element present in the array.
 *
 * If an initialValue is not provided:
 *  - The previousValue argument is the value of the first element present in the array.
 *  - The currentValue argument is the value of the second element present in the array.
 *
 * @callback coordReduceCallback
 * @param {*} previousValue The accumulated value previously returned in the last invocation
 * of the callback, or initialValue, if supplied.
 * @param {Array<number>} currentCoord The current coordinate being processed.
 * @param {number} coordIndex The current index of the coordinate being processed.
 * Starts at index 0, if an initialValue is provided, and at index 1 otherwise.
 * @param {number} featureIndex The current index of the feature being processed.
 * @param {number} featureSubIndex The current subIndex of the feature being processed.
 */

/**
 * Reduce coordinates in any GeoJSON object, similar to Array.reduce()
 *
 * @name coordReduce
 * @param {FeatureCollection|Geometry|Feature} geojson any GeoJSON object
 * @param {Function} callback a method that takes (previousValue, currentCoord, coordIndex)
 * @param {*} [initialValue] Value to use as the first argument to the first call of the callback.
 * @param {boolean} [excludeWrapCoord=false] whether or not to include the final coordinate of LinearRings that wraps the ring in its iteration.
 * @returns {*} The value that results from the reduction.
 * @example
 * var features = turf.featureCollection([
 *   turf.point([26, 37], {"foo": "bar"}),
 *   turf.point([36, 53], {"hello": "world"})
 * ]);
 *
 * turf.coordReduce(features, function (previousValue, currentCoord, coordIndex, featureIndex, featureSubIndex) {
 *   //=previousValue
 *   //=currentCoord
 *   //=coordIndex
 *   //=featureIndex
 *   //=featureSubIndex
 *   return currentCoord;
 * });
 */
function coordReduce(geojson, callback, initialValue, excludeWrapCoord) {
    var previousValue = initialValue;
    coordEach$1(geojson, function (currentCoord, coordIndex, featureIndex, featureSubIndex) {
        if (coordIndex === 0 && initialValue === undefined) previousValue = currentCoord;else previousValue = callback(previousValue, currentCoord, coordIndex, featureIndex, featureSubIndex);
    }, excludeWrapCoord);
    return previousValue;
}

/**
 * Callback for propEach
 *
 * @callback propEachCallback
 * @param {Object} currentProperties The current properties being processed.
 * @param {number} featureIndex The index of the current element being processed in the
 * array.Starts at index 0, if an initialValue is provided, and at index 1 otherwise.
 */

/**
 * Iterate over properties in any GeoJSON object, similar to Array.forEach()
 *
 * @name propEach
 * @param {(FeatureCollection|Feature)} geojson any GeoJSON object
 * @param {Function} callback a method that takes (currentProperties, featureIndex)
 * @example
 * var features = turf.featureCollection([
 *     turf.point([26, 37], {foo: 'bar'}),
 *     turf.point([36, 53], {hello: 'world'})
 * ]);
 *
 * turf.propEach(features, function (currentProperties, featureIndex) {
 *   //=currentProperties
 *   //=featureIndex
 * });
 */
function propEach(geojson, callback) {
    var i;
    switch (geojson.type) {
        case 'FeatureCollection':
            for (i = 0; i < geojson.features.length; i++) {
                callback(geojson.features[i].properties, i);
            }
            break;
        case 'Feature':
            callback(geojson.properties, 0);
            break;
    }
}

/**
 * Callback for propReduce
 *
 * The first time the callback function is called, the values provided as arguments depend
 * on whether the reduce method has an initialValue argument.
 *
 * If an initialValue is provided to the reduce method:
 *  - The previousValue argument is initialValue.
 *  - The currentValue argument is the value of the first element present in the array.
 *
 * If an initialValue is not provided:
 *  - The previousValue argument is the value of the first element present in the array.
 *  - The currentValue argument is the value of the second element present in the array.
 *
 * @callback propReduceCallback
 * @param {*} previousValue The accumulated value previously returned in the last invocation
 * of the callback, or initialValue, if supplied.
 * @param {*} currentProperties The current properties being processed.
 * @param {number} featureIndex The index of the current element being processed in the
 * array.Starts at index 0, if an initialValue is provided, and at index 1 otherwise.
 */

/**
 * Reduce properties in any GeoJSON object into a single value,
 * similar to how Array.reduce works. However, in this case we lazily run
 * the reduction, so an array of all properties is unnecessary.
 *
 * @name propReduce
 * @param {(FeatureCollection|Feature)} geojson any GeoJSON object
 * @param {Function} callback a method that takes (previousValue, currentProperties, featureIndex)
 * @param {*} [initialValue] Value to use as the first argument to the first call of the callback.
 * @returns {*} The value that results from the reduction.
 * @example
 * var features = turf.featureCollection([
 *     turf.point([26, 37], {foo: 'bar'}),
 *     turf.point([36, 53], {hello: 'world'})
 * ]);
 *
 * turf.propReduce(features, function (previousValue, currentProperties, featureIndex) {
 *   //=previousValue
 *   //=currentProperties
 *   //=featureIndex
 *   return currentProperties
 * });
 */
function propReduce(geojson, callback, initialValue) {
    var previousValue = initialValue;
    propEach(geojson, function (currentProperties, featureIndex) {
        if (featureIndex === 0 && initialValue === undefined) previousValue = currentProperties;else previousValue = callback(previousValue, currentProperties, featureIndex);
    });
    return previousValue;
}

/**
 * Callback for featureEach
 *
 * @callback featureEachCallback
 * @param {Feature<any>} currentFeature The current feature being processed.
 * @param {number} featureIndex The index of the current element being processed in the
 * array.Starts at index 0, if an initialValue is provided, and at index 1 otherwise.
 */

/**
 * Iterate over features in any GeoJSON object, similar to
 * Array.forEach.
 *
 * @name featureEach
 * @param {(FeatureCollection|Feature|Geometry)} geojson any GeoJSON object
 * @param {Function} callback a method that takes (currentFeature, featureIndex)
 * @example
 * var features = turf.featureCollection([
 *   turf.point([26, 37], {foo: 'bar'}),
 *   turf.point([36, 53], {hello: 'world'})
 * ]);
 *
 * turf.featureEach(features, function (currentFeature, featureIndex) {
 *   //=currentFeature
 *   //=featureIndex
 * });
 */
function featureEach$1(geojson, callback) {
    if (geojson.type === 'Feature') {
        callback(geojson, 0);
    } else if (geojson.type === 'FeatureCollection') {
        for (var i = 0; i < geojson.features.length; i++) {
            callback(geojson.features[i], i);
        }
    }
}

/**
 * Callback for featureReduce
 *
 * The first time the callback function is called, the values provided as arguments depend
 * on whether the reduce method has an initialValue argument.
 *
 * If an initialValue is provided to the reduce method:
 *  - The previousValue argument is initialValue.
 *  - The currentValue argument is the value of the first element present in the array.
 *
 * If an initialValue is not provided:
 *  - The previousValue argument is the value of the first element present in the array.
 *  - The currentValue argument is the value of the second element present in the array.
 *
 * @callback featureReduceCallback
 * @param {*} previousValue The accumulated value previously returned in the last invocation
 * of the callback, or initialValue, if supplied.
 * @param {Feature} currentFeature The current Feature being processed.
 * @param {number} featureIndex The index of the current element being processed in the
 * array.Starts at index 0, if an initialValue is provided, and at index 1 otherwise.
 */

/**
 * Reduce features in any GeoJSON object, similar to Array.reduce().
 *
 * @name featureReduce
 * @param {(FeatureCollection|Feature|Geometry)} geojson any GeoJSON object
 * @param {Function} callback a method that takes (previousValue, currentFeature, featureIndex)
 * @param {*} [initialValue] Value to use as the first argument to the first call of the callback.
 * @returns {*} The value that results from the reduction.
 * @example
 * var features = turf.featureCollection([
 *   turf.point([26, 37], {"foo": "bar"}),
 *   turf.point([36, 53], {"hello": "world"})
 * ]);
 *
 * turf.featureReduce(features, function (previousValue, currentFeature, featureIndex) {
 *   //=previousValue
 *   //=currentFeature
 *   //=featureIndex
 *   return currentFeature
 * });
 */
function featureReduce(geojson, callback, initialValue) {
    var previousValue = initialValue;
    featureEach$1(geojson, function (currentFeature, featureIndex) {
        if (featureIndex === 0 && initialValue === undefined) previousValue = currentFeature;else previousValue = callback(previousValue, currentFeature, featureIndex);
    });
    return previousValue;
}

/**
 * Get all coordinates from any GeoJSON object.
 *
 * @name coordAll
 * @param {(FeatureCollection|Feature|Geometry)} geojson any GeoJSON object
 * @returns {Array<Array<number>>} coordinate position array
 * @example
 * var features = turf.featureCollection([
 *   turf.point([26, 37], {foo: 'bar'}),
 *   turf.point([36, 53], {hello: 'world'})
 * ]);
 *
 * var coords = turf.coordAll(features);
 * //= [[26, 37], [36, 53]]
 */
function coordAll(geojson) {
    var coords = [];
    coordEach$1(geojson, function (coord) {
        coords.push(coord);
    });
    return coords;
}

/**
 * Callback for geomEach
 *
 * @callback geomEachCallback
 * @param {Geometry} currentGeometry The current geometry being processed.
 * @param {number} currentIndex The index of the current element being processed in the
 * array. Starts at index 0, if an initialValue is provided, and at index 1 otherwise.
 * @param {number} currentProperties The current feature properties being processed.
 */

/**
 * Iterate over each geometry in any GeoJSON object, similar to Array.forEach()
 *
 * @name geomEach
 * @param {(FeatureCollection|Feature|Geometry)} geojson any GeoJSON object
 * @param {Function} callback a method that takes (currentGeometry, featureIndex, currentProperties)
 * @example
 * var features = turf.featureCollection([
 *     turf.point([26, 37], {foo: 'bar'}),
 *     turf.point([36, 53], {hello: 'world'})
 * ]);
 *
 * turf.geomEach(features, function (currentGeometry, featureIndex, currentProperties) {
 *   //=currentGeometry
 *   //=featureIndex
 *   //=currentProperties
 * });
 */
function geomEach(geojson, callback) {
    var i,
        j,
        g,
        geometry,
        stopG,
        geometryMaybeCollection,
        isGeometryCollection,
        geometryProperties,
        featureIndex = 0,
        isFeatureCollection = geojson.type === 'FeatureCollection',
        isFeature = geojson.type === 'Feature',
        stop = isFeatureCollection ? geojson.features.length : 1;

    // This logic may look a little weird. The reason why it is that way
    // is because it's trying to be fast. GeoJSON supports multiple kinds
    // of objects at its root: FeatureCollection, Features, Geometries.
    // This function has the responsibility of handling all of them, and that
    // means that some of the `for` loops you see below actually just don't apply
    // to certain inputs. For instance, if you give this just a
    // Point geometry, then both loops are short-circuited and all we do
    // is gradually rename the input until it's called 'geometry'.
    //
    // This also aims to allocate as few resources as possible: just a
    // few numbers and booleans, rather than any temporary arrays as would
    // be required with the normalization approach.
    for (i = 0; i < stop; i++) {

        geometryMaybeCollection = isFeatureCollection ? geojson.features[i].geometry : isFeature ? geojson.geometry : geojson;
        geometryProperties = isFeatureCollection ? geojson.features[i].properties : isFeature ? geojson.properties : {};
        isGeometryCollection = geometryMaybeCollection ? geometryMaybeCollection.type === 'GeometryCollection' : false;
        stopG = isGeometryCollection ? geometryMaybeCollection.geometries.length : 1;

        for (g = 0; g < stopG; g++) {
            geometry = isGeometryCollection ? geometryMaybeCollection.geometries[g] : geometryMaybeCollection;

            // Handle null Geometry
            if (geometry === null) {
                callback(null, featureIndex, geometryProperties);
                continue;
            }
            switch (geometry.type) {
                case 'Point':
                case 'LineString':
                case 'MultiPoint':
                case 'Polygon':
                case 'MultiLineString':
                case 'MultiPolygon':
                    {
                        callback(geometry, featureIndex, geometryProperties);
                        break;
                    }
                case 'GeometryCollection':
                    {
                        for (j = 0; j < geometry.geometries.length; j++) {
                            callback(geometry.geometries[j], featureIndex, geometryProperties);
                        }
                        break;
                    }
                default:
                    throw new Error('Unknown Geometry Type');
            }
        }
        // Only increase `featureIndex` per each feature
        featureIndex++;
    }
}

/**
 * Callback for geomReduce
 *
 * The first time the callback function is called, the values provided as arguments depend
 * on whether the reduce method has an initialValue argument.
 *
 * If an initialValue is provided to the reduce method:
 *  - The previousValue argument is initialValue.
 *  - The currentValue argument is the value of the first element present in the array.
 *
 * If an initialValue is not provided:
 *  - The previousValue argument is the value of the first element present in the array.
 *  - The currentValue argument is the value of the second element present in the array.
 *
 * @callback geomReduceCallback
 * @param {*} previousValue The accumulated value previously returned in the last invocation
 * of the callback, or initialValue, if supplied.
 * @param {Geometry} currentGeometry The current Feature being processed.
 * @param {number} currentIndex The index of the current element being processed in the
 * array.Starts at index 0, if an initialValue is provided, and at index 1 otherwise.
 * @param {Object} currentProperties The current feature properties being processed.
 */

/**
 * Reduce geometry in any GeoJSON object, similar to Array.reduce().
 *
 * @name geomReduce
 * @param {(FeatureCollection|Feature|Geometry)} geojson any GeoJSON object
 * @param {Function} callback a method that takes (previousValue, currentGeometry, featureIndex, currentProperties)
 * @param {*} [initialValue] Value to use as the first argument to the first call of the callback.
 * @returns {*} The value that results from the reduction.
 * @example
 * var features = turf.featureCollection([
 *     turf.point([26, 37], {foo: 'bar'}),
 *     turf.point([36, 53], {hello: 'world'})
 * ]);
 *
 * turf.geomReduce(features, function (previousValue, currentGeometry, featureIndex, currentProperties) {
 *   //=previousValue
 *   //=currentGeometry
 *   //=featureIndex
 *   //=currentProperties
 *   return currentGeometry
 * });
 */
function geomReduce(geojson, callback, initialValue) {
    var previousValue = initialValue;
    geomEach(geojson, function (currentGeometry, currentIndex, currentProperties) {
        if (currentIndex === 0 && initialValue === undefined) previousValue = currentGeometry;else previousValue = callback(previousValue, currentGeometry, currentIndex, currentProperties);
    });
    return previousValue;
}

/**
 * Callback for flattenEach
 *
 * @callback flattenEachCallback
 * @param {Feature} currentFeature The current flattened feature being processed.
 * @param {number} featureIndex The index of the current element being processed in the
 * array. Starts at index 0, if an initialValue is provided, and at index 1 otherwise.
 * @param {number} featureSubIndex The subindex of the current element being processed in the
 * array. Starts at index 0 and increases if the flattened feature was a multi-geometry.
 */

/**
 * Iterate over flattened features in any GeoJSON object, similar to
 * Array.forEach.
 *
 * @name flattenEach
 * @param {(FeatureCollection|Feature|Geometry)} geojson any GeoJSON object
 * @param {Function} callback a method that takes (currentFeature, featureIndex, featureSubIndex)
 * @example
 * var features = turf.featureCollection([
 *     turf.point([26, 37], {foo: 'bar'}),
 *     turf.multiPoint([[40, 30], [36, 53]], {hello: 'world'})
 * ]);
 *
 * turf.flattenEach(features, function (currentFeature, featureIndex, featureSubIndex) {
 *   //=currentFeature
 *   //=featureIndex
 *   //=featureSubIndex
 * });
 */
function flattenEach(geojson, callback) {
    geomEach(geojson, function (geometry, featureIndex, properties) {
        // Callback for single geometry
        var type = geometry === null ? null : geometry.type;
        switch (type) {
            case null:
            case 'Point':
            case 'LineString':
            case 'Polygon':
                callback(feature(geometry, properties), featureIndex, 0);
                return;
        }

        var geomType;

        // Callback for multi-geometry
        switch (type) {
            case 'MultiPoint':
                geomType = 'Point';
                break;
            case 'MultiLineString':
                geomType = 'LineString';
                break;
            case 'MultiPolygon':
                geomType = 'Polygon';
                break;
        }

        geometry.coordinates.forEach(function (coordinate, featureSubIndex) {
            var geom = {
                type: geomType,
                coordinates: coordinate
            };
            callback(feature(geom, properties), featureIndex, featureSubIndex);
        });
    });
}

/**
 * Callback for flattenReduce
 *
 * The first time the callback function is called, the values provided as arguments depend
 * on whether the reduce method has an initialValue argument.
 *
 * If an initialValue is provided to the reduce method:
 *  - The previousValue argument is initialValue.
 *  - The currentValue argument is the value of the first element present in the array.
 *
 * If an initialValue is not provided:
 *  - The previousValue argument is the value of the first element present in the array.
 *  - The currentValue argument is the value of the second element present in the array.
 *
 * @callback flattenReduceCallback
 * @param {*} previousValue The accumulated value previously returned in the last invocation
 * of the callback, or initialValue, if supplied.
 * @param {Feature} currentFeature The current Feature being processed.
 * @param {number} featureIndex The index of the current element being processed in the
 * array.Starts at index 0, if an initialValue is provided, and at index 1 otherwise.
 * @param {number} featureSubIndex The subindex of the current element being processed in the
 * array. Starts at index 0 and increases if the flattened feature was a multi-geometry.
 */

/**
 * Reduce flattened features in any GeoJSON object, similar to Array.reduce().
 *
 * @name flattenReduce
 * @param {(FeatureCollection|Feature|Geometry)} geojson any GeoJSON object
 * @param {Function} callback a method that takes (previousValue, currentFeature, featureIndex, featureSubIndex)
 * @param {*} [initialValue] Value to use as the first argument to the first call of the callback.
 * @returns {*} The value that results from the reduction.
 * @example
 * var features = turf.featureCollection([
 *     turf.point([26, 37], {foo: 'bar'}),
 *     turf.multiPoint([[40, 30], [36, 53]], {hello: 'world'})
 * ]);
 *
 * turf.flattenReduce(features, function (previousValue, currentFeature, featureIndex, featureSubIndex) {
 *   //=previousValue
 *   //=currentFeature
 *   //=featureIndex
 *   //=featureSubIndex
 *   return currentFeature
 * });
 */
function flattenReduce(geojson, callback, initialValue) {
    var previousValue = initialValue;
    flattenEach(geojson, function (currentFeature, featureIndex, featureSubIndex) {
        if (featureIndex === 0 && featureSubIndex === 0 && initialValue === undefined) previousValue = currentFeature;else previousValue = callback(previousValue, currentFeature, featureIndex, featureSubIndex);
    });
    return previousValue;
}

/**
 * Callback for segmentEach
 *
 * @callback segmentEachCallback
 * @param {Feature<LineString>} currentSegment The current segment being processed.
 * @param {number} featureIndex The featureIndex currently being processed, starts at index 0.
 * @param {number} featureSubIndex The featureSubIndex currently being processed, starts at index 0.
 * @param {number} segmentIndex The segmentIndex currently being processed, starts at index 0.
 * @returns {void}
 */

/**
 * Iterate over 2-vertex line segment in any GeoJSON object, similar to Array.forEach()
 * (Multi)Point geometries do not contain segments therefore they are ignored during this operation.
 *
 * @param {(FeatureCollection|Feature|Geometry)} geojson any GeoJSON
 * @param {Function} callback a method that takes (currentSegment, featureIndex, featureSubIndex)
 * @returns {void}
 * @example
 * var polygon = turf.polygon([[[-50, 5], [-40, -10], [-50, -10], [-40, 5], [-50, 5]]]);
 *
 * // Iterate over GeoJSON by 2-vertex segments
 * turf.segmentEach(polygon, function (currentSegment, featureIndex, featureSubIndex, segmentIndex) {
 *   //= currentSegment
 *   //= featureIndex
 *   //= featureSubIndex
 *   //= segmentIndex
 * });
 *
 * // Calculate the total number of segments
 * var total = 0;
 * turf.segmentEach(polygon, function () {
 *     total++;
 * });
 */
function segmentEach(geojson, callback) {
    flattenEach(geojson, function (feature, featureIndex, featureSubIndex) {
        var segmentIndex = 0;

        // Exclude null Geometries
        if (!feature.geometry) return;
        // (Multi)Point geometries do not contain segments therefore they are ignored during this operation.
        var type = feature.geometry.type;
        if (type === 'Point' || type === 'MultiPoint') return;

        // Generate 2-vertex line segments
        coordReduce(feature, function (previousCoords, currentCoord) {
            var currentSegment = lineString([previousCoords, currentCoord], feature.properties);
            callback(currentSegment, featureIndex, featureSubIndex, segmentIndex);
            segmentIndex++;
            return currentCoord;
        });
    });
}

/**
 * Callback for segmentReduce
 *
 * The first time the callback function is called, the values provided as arguments depend
 * on whether the reduce method has an initialValue argument.
 *
 * If an initialValue is provided to the reduce method:
 *  - The previousValue argument is initialValue.
 *  - The currentValue argument is the value of the first element present in the array.
 *
 * If an initialValue is not provided:
 *  - The previousValue argument is the value of the first element present in the array.
 *  - The currentValue argument is the value of the second element present in the array.
 *
 * @callback segmentReduceCallback
 * @param {*} [previousValue] The accumulated value previously returned in the last invocation
 * of the callback, or initialValue, if supplied.
 * @param {Feature<LineString>} [currentSegment] The current segment being processed.
 * @param {number} featureIndex The featureIndex currently being processed, starts at index 0.
 * @param {number} featureSubIndex The featureSubIndex currently being processed, starts at index 0.
 * @param {number} segmentIndex The segmentIndex currently being processed, starts at index 0.
 */

/**
 * Reduce 2-vertex line segment in any GeoJSON object, similar to Array.reduce()
 * (Multi)Point geometries do not contain segments therefore they are ignored during this operation.
 *
 * @param {(FeatureCollection|Feature|Geometry)} geojson any GeoJSON
 * @param {Function} callback a method that takes (previousValue, currentSegment, currentIndex)
 * @param {*} [initialValue] Value to use as the first argument to the first call of the callback.
 * @returns {void}
 * @example
 * var polygon = turf.polygon([[[-50, 5], [-40, -10], [-50, -10], [-40, 5], [-50, 5]]]);
 *
 * // Iterate over GeoJSON by 2-vertex segments
 * turf.segmentReduce(polygon, function (previousSegment, currentSegment, featureIndex, featureSubIndex, segmentIndex) {
 *   //= previousSegment
 *   //= currentSegment
 *   //= featureIndex
 *   //= featureSubIndex
 *   //= segmentInex
 *   return currentSegment
 * });
 *
 * // Calculate the total number of segments
 * var initialValue = 0
 * var total = turf.segmentReduce(polygon, function (previousValue) {
 *     previousValue++;
 *     return previousValue;
 * }, initialValue);
 */
function segmentReduce(geojson, callback, initialValue) {
    var previousValue = initialValue;
    var started = false;
    segmentEach(geojson, function (currentSegment, featureIndex, featureSubIndex, segmentIndex) {
        if (started === false && initialValue === undefined) previousValue = currentSegment;else previousValue = callback(previousValue, currentSegment, featureIndex, featureSubIndex, segmentIndex);
        started = true;
    });
    return previousValue;
}

/**
 * Create Feature
 *
 * @private
 * @param {Geometry} geometry GeoJSON Geometry
 * @param {Object} properties Properties
 * @returns {Feature} GeoJSON Feature
 */
function feature(geometry, properties) {
    if (geometry === undefined) throw new Error('No geometry passed');

    return {
        type: 'Feature',
        properties: properties || {},
        geometry: geometry
    };
}

/**
 * Create LineString
 *
 * @private
 * @param {Array<Array<number>>} coordinates Line Coordinates
 * @param {Object} properties Properties
 * @returns {Feature<LineString>} GeoJSON LineString Feature
 */
function lineString(coordinates, properties) {
    if (!coordinates) throw new Error('No coordinates passed');
    if (coordinates.length < 2) throw new Error('Coordinates must be an array of two or more positions');

    return {
        type: 'Feature',
        properties: properties || {},
        geometry: {
            type: 'LineString',
            coordinates: coordinates
        }
    };
}

/**
 * Callback for lineEach
 *
 * @callback lineEachCallback
 * @param {Feature<LineString>} currentLine The current LineString|LinearRing being processed.
 * @param {number} lineIndex The index of the current element being processed in the array, starts at index 0.
 * @param {number} lineSubIndex The sub-index of the current line being processed at index 0
 */

/**
 * Iterate over line or ring coordinates in LineString, Polygon, MultiLineString, MultiPolygon Features or Geometries,
 * similar to Array.forEach.
 *
 * @name lineEach
 * @param {Geometry|Feature<LineString|Polygon|MultiLineString|MultiPolygon>} geojson object
 * @param {Function} callback a method that takes (currentLine, lineIndex, lineSubIndex)
 * @example
 * var mtLn = turf.multiLineString([
 *   turf.lineString([[26, 37], [35, 45]]),
 *   turf.lineString([[36, 53], [38, 50], [41, 55]])
 * ]);
 *
 * turf.lineEach(mtLn, function (currentLine, lineIndex) {
 *   //=currentLine
 *   //=lineIndex
 * });
 */
function lineEach(geojson, callback) {
    // validation
    if (!geojson) throw new Error('geojson is required');
    var type = geojson.geometry ? geojson.geometry.type : geojson.type;
    if (!type) throw new Error('invalid geojson');
    if (type === 'FeatureCollection') throw new Error('FeatureCollection is not supported');
    if (type === 'GeometryCollection') throw new Error('GeometryCollection is not supported');
    var coordinates = geojson.geometry ? geojson.geometry.coordinates : geojson.coordinates;
    if (!coordinates) throw new Error('geojson must contain coordinates');

    switch (type) {
        case 'LineString':
            callback(coordinates, 0, 0);
            return;
        case 'Polygon':
        case 'MultiLineString':
            var subIndex = 0;
            for (var line = 0; line < coordinates.length; line++) {
                if (type === 'MultiLineString') subIndex = line;
                callback(coordinates[line], line, subIndex);
            }
            return;
        case 'MultiPolygon':
            for (var multi = 0; multi < coordinates.length; multi++) {
                for (var ring = 0; ring < coordinates[multi].length; ring++) {
                    callback(coordinates[multi][ring], ring, multi);
                }
            }
            return;
        default:
            throw new Error(type + ' geometry not supported');
    }
}

/**
 * Callback for lineReduce
 *
 * The first time the callback function is called, the values provided as arguments depend
 * on whether the reduce method has an initialValue argument.
 *
 * If an initialValue is provided to the reduce method:
 *  - The previousValue argument is initialValue.
 *  - The currentValue argument is the value of the first element present in the array.
 *
 * If an initialValue is not provided:
 *  - The previousValue argument is the value of the first element present in the array.
 *  - The currentValue argument is the value of the second element present in the array.
 *
 * @callback lineReduceCallback
 * @param {*} previousValue The accumulated value previously returned in the last invocation
 * of the callback, or initialValue, if supplied.
 * @param {Feature<LineString>} currentLine The current LineString|LinearRing being processed.
 * @param {number} lineIndex The index of the current element being processed in the
 * array. Starts at index 0, if an initialValue is provided, and at index 1 otherwise.
 * @param {number} lineSubIndex The sub-index of the current line being processed at index 0
 */

/**
 * Reduce features in any GeoJSON object, similar to Array.reduce().
 *
 * @name lineReduce
 * @param {Geometry|Feature<LineString|Polygon|MultiLineString|MultiPolygon>} geojson object
 * @param {Function} callback a method that takes (previousValue, currentFeature, featureIndex)
 * @param {*} [initialValue] Value to use as the first argument to the first call of the callback.
 * @returns {*} The value that results from the reduction.
 * @example
 * var mtp = turf.multiPolygon([
 *   turf.polygon([[[12,48],[2,41],[24,38],[12,48]], [[9,44],[13,41],[13,45],[9,44]]]),
 *   turf.polygon([[[5, 5], [0, 0], [2, 2], [4, 4], [5, 5]]])
 * ]);
 *
 * turf.lineReduce(mtp, function (previousValue, currentLine, lineIndex, lineSubIndex) {
 *   //=previousValue
 *   //=currentLine
 *   //=lineIndex
 *   //=lineSubIndex
 *   return currentLine
 * }, 2);
 */
function lineReduce(geojson, callback, initialValue) {
    var previousValue = initialValue;
    lineEach(geojson, function (currentLine, lineIndex, lineSubIndex) {
        if (lineIndex === 0 && initialValue === undefined) previousValue = currentLine;else previousValue = callback(previousValue, currentLine, lineIndex, lineSubIndex);
    });
    return previousValue;
}

var index$3 = Object.freeze({
	coordEach: coordEach$1,
	coordReduce: coordReduce,
	propEach: propEach,
	propReduce: propReduce,
	featureEach: featureEach$1,
	featureReduce: featureReduce,
	coordAll: coordAll,
	geomEach: geomEach,
	geomReduce: geomReduce,
	flattenEach: flattenEach,
	flattenReduce: flattenReduce,
	segmentEach: segmentEach,
	segmentReduce: segmentReduce,
	feature: feature,
	lineString: lineString,
	lineEach: lineEach,
	lineReduce: lineReduce
});

var require$$1 = ( index$3 && undefined ) || index$3;

var rbush = index$1;
var meta = require$$1;
var featureEach = meta.featureEach;
var coordEach = meta.coordEach;

/**
 * GeoJSON implementation of [RBush](https://github.com/mourner/rbush#rbush) spatial index.
 *
 * @name rbush
 * @param {number} [maxEntries=9] defines the maximum number of entries in a tree node. 9 (used by default) is a
 * reasonable choice for most applications. Higher value means faster insertion and slower search, and vice versa.
 * @returns {RBush} GeoJSON RBush
 * @example
 * var rbush = require('geojson-rbush')
 * var tree = rbush()
 */
var index = function index(maxEntries) {
    var tree = rbush(maxEntries);
    /**
     * [insert](https://github.com/mourner/rbush#data-format)
     *
     * @param {Feature<any>} feature insert single GeoJSON Feature
     * @returns {RBush} GeoJSON RBush
     * @example
     * var polygon = {
     *   "type": "Feature",
     *   "properties": {},
     *   "geometry": {
     *     "type": "Polygon",
     *     "coordinates": [[[-78, 41], [-67, 41], [-67, 48], [-78, 48], [-78, 41]]]
     *   }
     * }
     * tree.insert(polygon)
     */
    tree.insert = function (feature) {
        if (Array.isArray(feature)) {
            var bbox = feature;
            feature = bboxPolygon(bbox);
            feature.bbox = bbox;
        } else {
            feature.bbox = feature.bbox ? feature.bbox : turfBBox(feature);
        }
        return rbush.prototype.insert.call(this, feature);
    };

    /**
     * [load](https://github.com/mourner/rbush#bulk-inserting-data)
     *
     * @param {BBox[]|FeatureCollection<any>} features load entire GeoJSON FeatureCollection
     * @returns {RBush} GeoJSON RBush
     * @example
     * var polygons = {
     *   "type": "FeatureCollection",
     *   "features": [
     *     {
     *       "type": "Feature",
     *       "properties": {},
     *       "geometry": {
     *         "type": "Polygon",
     *         "coordinates": [[[-78, 41], [-67, 41], [-67, 48], [-78, 48], [-78, 41]]]
     *       }
     *     },
     *     {
     *       "type": "Feature",
     *       "properties": {},
     *       "geometry": {
     *         "type": "Polygon",
     *         "coordinates": [[[-93, 32], [-83, 32], [-83, 39], [-93, 39], [-93, 32]]]
     *       }
     *     }
     *   ]
     * }
     * tree.load(polygons)
     */
    tree.load = function (features) {
        var load = [];
        // Load an Array of BBox
        if (Array.isArray(features)) {
            features.forEach(function (bbox) {
                var feature = bboxPolygon(bbox);
                feature.bbox = bbox;
                load.push(feature);
            });
        } else {
            // Load FeatureCollection
            featureEach(features, function (feature) {
                feature.bbox = feature.bbox ? feature.bbox : turfBBox(feature);
                load.push(feature);
            });
        }
        return rbush.prototype.load.call(this, load);
    };

    /**
     * [remove](https://github.com/mourner/rbush#removing-data)
     *
     * @param {BBox|Feature<any>} feature remove single GeoJSON Feature
     * @returns {RBush} GeoJSON RBush
     * @example
     * var polygon = {
     *   "type": "Feature",
     *   "properties": {},
     *   "geometry": {
     *     "type": "Polygon",
     *     "coordinates": [[[-78, 41], [-67, 41], [-67, 48], [-78, 48], [-78, 41]]]
     *   }
     * }
     * tree.remove(polygon)
     */
    tree.remove = function (feature) {
        if (Array.isArray(feature)) {
            var bbox = feature;
            feature = bboxPolygon(bbox);
            feature.bbox = bbox;
        }
        return rbush.prototype.remove.call(this, feature);
    };

    /**
     * [clear](https://github.com/mourner/rbush#removing-data)
     *
     * @returns {RBush} GeoJSON Rbush
     * @example
     * tree.clear()
     */
    tree.clear = function () {
        return rbush.prototype.clear.call(this);
    };

    /**
     * [search](https://github.com/mourner/rbush#search)
     *
     * @param {BBox|FeatureCollection|Feature<any>} geojson search with GeoJSON
     * @returns {FeatureCollection<any>} all features that intersects with the given GeoJSON.
     * @example
     * var polygon = {
     *   "type": "Feature",
     *   "properties": {},
     *   "geometry": {
     *     "type": "Polygon",
     *     "coordinates": [[[-78, 41], [-67, 41], [-67, 48], [-78, 48], [-78, 41]]]
     *   }
     * }
     * tree.search(polygon)
     */
    tree.search = function (geojson) {
        var features = rbush.prototype.search.call(this, this.toBBox(geojson));
        return {
            type: 'FeatureCollection',
            features: features
        };
    };

    /**
     * [collides](https://github.com/mourner/rbush#collisions)
     *
     * @param {BBox|FeatureCollection|Feature<any>} geojson collides with GeoJSON
     * @returns {boolean} true if there are any items intersecting the given GeoJSON, otherwise false.
     * @example
     * var polygon = {
     *   "type": "Feature",
     *   "properties": {},
     *   "geometry": {
     *     "type": "Polygon",
     *     "coordinates": [[[-78, 41], [-67, 41], [-67, 48], [-78, 48], [-78, 41]]]
     *   }
     * }
     * tree.collides(polygon)
     */
    tree.collides = function (geojson) {
        return rbush.prototype.collides.call(this, this.toBBox(geojson));
    };

    /**
     * [all](https://github.com/mourner/rbush#search)
     *
     * @returns {FeatureCollection<any>} all the features in RBush
     * @example
     * tree.all()
     * //=FeatureCollection
     */
    tree.all = function () {
        var features = rbush.prototype.all.call(this);
        return {
            type: 'FeatureCollection',
            features: features
        };
    };

    /**
     * [toJSON](https://github.com/mourner/rbush#export-and-import)
     *
     * @returns {any} export data as JSON object
     * @example
     * var exported = tree.toJSON()
     * //=JSON object
     */
    tree.toJSON = function () {
        return rbush.prototype.toJSON.call(this);
    };

    /**
     * [fromJSON](https://github.com/mourner/rbush#export-and-import)
     *
     * @param {any} json import previously exported data
     * @returns {RBush} GeoJSON RBush
     * @example
     * var exported = {
     *   "children": [
     *     {
     *       "type": "Feature",
     *       "geometry": {
     *         "type": "Point",
     *         "coordinates": [110, 50]
     *       },
     *       "properties": {},
     *       "bbox": [110, 50, 110, 50]
     *     }
     *   ],
     *   "height": 1,
     *   "leaf": true,
     *   "minX": 110,
     *   "minY": 50,
     *   "maxX": 110,
     *   "maxY": 50
     * }
     * tree.fromJSON(exported)
     */
    tree.fromJSON = function (json) {
        return rbush.prototype.fromJSON.call(this, json);
    };

    /**
     * Converts GeoJSON to {minX, minY, maxX, maxY} schema
     *
     * @private
     * @param {BBox|FeatureCollectio|Feature<any>} geojson feature(s) to retrieve BBox from
     * @returns {Object} converted to {minX, minY, maxX, maxY}
     */
    tree.toBBox = function (geojson) {
        var bbox;
        if (geojson.bbox) bbox = geojson.bbox;else if (Array.isArray(geojson) && geojson.length === 4) bbox = geojson;else bbox = turfBBox(geojson);

        return {
            minX: bbox[0],
            minY: bbox[1],
            maxX: bbox[2],
            maxY: bbox[3]
        };
    };
    return tree;
};

/**
 * Takes a bbox and returns an equivalent {@link Polygon|polygon}.
 *
 * @private
 * @name bboxPolygon
 * @param {Array<number>} bbox extent in [minX, minY, maxX, maxY] order
 * @returns {Feature<Polygon>} a Polygon representation of the bounding box
 * @example
 * var bbox = [0, 0, 10, 10];
 *
 * var poly = turf.bboxPolygon(bbox);
 *
 * //addToMap
 * var addToMap = [poly]
 */
function bboxPolygon(bbox) {
    var lowLeft = [bbox[0], bbox[1]];
    var topLeft = [bbox[0], bbox[3]];
    var topRight = [bbox[2], bbox[3]];
    var lowRight = [bbox[2], bbox[1]];
    var coordinates = [[lowLeft, lowRight, topRight, topLeft, lowLeft]];

    return {
        type: 'Feature',
        bbox: bbox,
        properties: {},
        geometry: {
            type: 'Polygon',
            coordinates: coordinates
        }
    };
}

/**
 * Takes a set of features, calculates the bbox of all input features, and returns a bounding box.
 *
 * @private
 * @name bbox
 * @param {FeatureCollection|Feature<any>} geojson input features
 * @returns {Array<number>} bbox extent in [minX, minY, maxX, maxY] order
 * @example
 * var line = turf.lineString([[-74, 40], [-78, 42], [-82, 35]]);
 * var bbox = turf.bbox(line);
 * var bboxPolygon = turf.bboxPolygon(bbox);
 *
 * //addToMap
 * var addToMap = [line, bboxPolygon]
 */
function turfBBox(geojson) {
    var bbox = [Infinity, Infinity, -Infinity, -Infinity];
    coordEach(geojson, function (coord) {
        if (bbox[0] > coord[0]) bbox[0] = coord[0];
        if (bbox[1] > coord[1]) bbox[1] = coord[1];
        if (bbox[2] < coord[0]) bbox[2] = coord[0];
        if (bbox[3] < coord[1]) bbox[3] = coord[1];
    });
    return bbox;
}

function _defaults(obj, defaults) { var keys = Object.getOwnPropertyNames(defaults); for (var i = 0; i < keys.length; i++) { var key = keys[i]; var value = Object.getOwnPropertyDescriptor(defaults, key); if (value && value.configurable && obj[key] === undefined) { Object.defineProperty(obj, key, value); } } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : _defaults(subClass, superClass); }

var options = {
    'mode': 'line',
    'tolerance': 10,
    'symbol': {
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
var SnapTool = function (_maptalks$Class) {
    _inherits(SnapTool, _maptalks$Class);

    function SnapTool(options) {
        _classCallCheck(this, SnapTool);

        var _this = _possibleConstructorReturn(this, _maptalks$Class.call(this, options));

        _this.tree = index();
        return _this;
    }

    SnapTool.prototype.getMode = function getMode() {
        this._mode = !this._mode ? this.options['mode'] : this._mode;
        if (this._checkMode(this._mode)) {
            return this._mode;
        } else {
            throw new Error('snap mode is invalid');
        }
    };

    SnapTool.prototype.setMode = function setMode(mode) {
        if (this._checkMode(this._mode)) {
            this._mode = mode;
            if (this.snaplayer) {
                if (this.snaplayer instanceof Array) {
                    var _ref;

                    this.allLayersGeometries = [];
                    this.snaplayer.forEach(function (tempLayer, index$$1) {
                        var tempGeometries = tempLayer.getGeometries();
                        this.allLayersGeometries[index$$1] = this._compositGeometries(tempGeometries);
                    }.bind(this));
                    this.allGeometries = (_ref = []).concat.apply(_ref, this.allLayersGeometries);
                } else {
                    var geometries = this.snaplayer.getGeometries();
                    this.allGeometries = this._compositGeometries(geometries);
                }
            }
        } else {
            throw new Error('snap mode is invalid');
        }
    };

    /**
     * @param {Map} map object
     * When using the snap tool, you should add it to a map firstly.the enable method excute default
     */


    SnapTool.prototype.addTo = function addTo(map) {
        var id = maptalks.INTERNAL_LAYER_PREFIX + '_snapto';
        this._mousemoveLayer = new maptalks.VectorLayer(id).addTo(map);
        this._map = map;
        this.allGeometries = [];
        this.enable();
    };

    SnapTool.prototype.remove = function remove() {
        this.disable();
        if (this._mousemoveLayer) {
            this._mousemoveLayer.remove();
            delete this._mousemoveLayer;
        }
    };

    SnapTool.prototype.getMap = function getMap() {
        return this._map;
    };

    /**
     * @param {String} snap mode
     * mode should be either 'point' or 'line'
     */


    SnapTool.prototype._checkMode = function _checkMode(mode) {
        if (mode === 'point' || mode === 'line') {
            return true;
        } else {
            return false;
        }
    };

    /**
     * Start snap interaction
     */


    SnapTool.prototype.enable = function enable() {
        var map = this.getMap();
        if (this.snaplayer) {
            if (this.snaplayer instanceof Array) {
                var _ref2;

                this.allLayersGeometries = [];
                this.snaplayer.forEach(function (tempLayer, index$$1) {
                    var tempGeometries = tempLayer.getGeometries();
                    this.allLayersGeometries[index$$1] = this._compositGeometries(tempGeometries);
                }.bind(this));
                this.allGeometries = (_ref2 = []).concat.apply(_ref2, this.allLayersGeometries);
            } else {
                var geometries = this.snaplayer.getGeometries();
                this.allGeometries = this._compositGeometries(geometries);
            }
        }
        if (this.allGeometries) {
            if (!this._mousemove) {
                this._registerEvents(map);
            }
            if (this._mousemoveLayer) {
                this._mousemoveLayer.show();
            }
        } else {
            throw new Error('you should set geometries which are snapped to firstly!');
        }
    };

    /**
     * End snap interaction
     */


    SnapTool.prototype.disable = function disable() {
        var map = this.getMap();
        map.off('mousemove touchstart', this._mousemove);
        map.off('mousedown', this._mousedown, this);
        map.off('mouseup', this._mouseup, this);
        if (this._mousemoveLayer) {
            this._mousemoveLayer.hide();
        }
        delete this._mousemove;
        this.allGeometries = [];
    };

    /**
     * @param {Geometry||Array<Geometry>} geometries to snap to
     * Set geomeries to an array for snapping to
     */


    SnapTool.prototype.setGeometries = function setGeometries(geometries) {
        geometries = geometries instanceof Array ? geometries : [geometries];
        this.allGeometries = this._compositGeometries(geometries);
    };

    /**
     * @param {Layer||maptalk.VectorLayer||Array.<Layer>||Array.<maptalk.VectorLayer>} layer to snap to
     * Set layer for snapping to
     */


    SnapTool.prototype.setLayer = function setLayer(layer) {
        if (layer instanceof Array) {
            var _ref5;

            this.snaplayer = [];
            this.allLayersGeometries = [];
            layer.forEach(function (tempLayer, index$$1) {
                if (tempLayer instanceof maptalks.VectorLayer) {
                    this.snaplayer.push(tempLayer);
                    var tempGeometries = tempLayer.getGeometries();
                    this.allLayersGeometries[index$$1] = this._compositGeometries(tempGeometries);
                    tempLayer.on('addgeo', function () {
                        var _ref3;

                        var tempGeometries = this.snaplayer[index$$1].getGeometries();
                        this.allLayersGeometries[index$$1] = this._compositGeometries(tempGeometries);
                        this.allGeometries = (_ref3 = []).concat.apply(_ref3, this.allLayersGeometries);
                    }, this);
                    tempLayer.on('clear', function () {
                        var _ref4;

                        this.allLayersGeometries.splice(index$$1, 1);
                        this.allGeometries = (_ref4 = []).concat.apply(_ref4, this.allLayersGeometries);
                    }, this);
                }
            }.bind(this));
            this.allGeometries = (_ref5 = []).concat.apply(_ref5, this.allLayersGeometries);
            this._mousemoveLayer.bringToFront();
        } else if (layer instanceof maptalks.VectorLayer) {
            var geometries = layer.getGeometries();
            this.snaplayer = layer;
            this.allGeometries = this._compositGeometries(geometries);
            layer.on('addgeo', function () {
                var geometries = this.snaplayer.getGeometries();
                this.allGeometries = this._compositGeometries(geometries);
            }, this);
            this.snaplayer.on('clear', function () {
                this._clearGeometries();
            }, this);
            this._mousemoveLayer.bringToFront();
        }
    };

    /**
     * @param {drawTool||maptalks.DrawTool} drawing tool
     * When interacting with a drawtool, you should bind the drawtool object to this snapto tool
     */


    SnapTool.prototype.bindDrawTool = function bindDrawTool(drawTool) {
        var _this2 = this;

        if (drawTool instanceof maptalks.DrawTool) {
            drawTool.on('drawstart', function (e) {
                if (_this2.snapPoint) {
                    _this2._resetCoordinates(e.target._geometry, _this2.snapPoint);
                    _this2._resetClickPoint(e.target._clickCoords, _this2.snapPoint);
                }
            }, this);
            drawTool.on('mousemove', function (e) {
                if (_this2.snapPoint) {
                    var mode = e.target.getMode();
                    var map = e.target.getMap();
                    if (mode === 'circle' || mode === 'freeHandCircle') {
                        var radius = map.computeLength(e.target._geometry.getCenter(), _this2.snapPoint);
                        e.target._geometry.setRadius(radius);
                    } else if (mode === 'ellipse' || mode === 'freeHandEllipse') {
                        var center = e.target._geometry.getCenter();
                        var rx = map.computeLength(center, new maptalks.Coordinate({
                            x: _this2.snapPoint.x,
                            y: center.y
                        }));
                        var ry = map.computeLength(center, new maptalks.Coordinate({
                            x: center.x,
                            y: _this2.snapPoint.y
                        }));
                        e.target._geometry.setWidth(rx * 2);
                        e.target._geometry.setHeight(ry * 2);
                    } else if (mode === 'rectangle' || mode === 'freeHandRectangle') {
                        var containerPoint = map.coordToContainerPoint(new maptalks.Coordinate({
                            x: _this2.snapPoint.x,
                            y: _this2.snapPoint.y
                        }));
                        var firstClick = map.coordToContainerPoint(e.target._geometry.getFirstCoordinate());
                        var ring = [[firstClick.x, firstClick.y], [containerPoint.x, firstClick.y], [containerPoint.x, containerPoint.y], [firstClick.x, containerPoint.y]];
                        e.target._geometry.setCoordinates(ring.map(function (c) {
                            return map.containerPointToCoord(new maptalks.Point(c));
                        }));
                    } else {
                        _this2._resetCoordinates(e.target._geometry, _this2.snapPoint);
                    }
                }
            }, this);
            drawTool.on('drawvertex', function (e) {
                if (_this2.snapPoint) {
                    _this2._resetCoordinates(e.target._geometry, _this2.snapPoint);
                    _this2._resetClickPoint(e.target._clickCoords, _this2.snapPoint);
                }
            }, this);
            drawTool.on('drawend', function (e) {
                if (_this2.snapPoint) {
                    var mode = e.target.getMode();
                    var map = e.target.getMap();
                    var geometry = e.geometry;
                    if (mode === 'circle' || mode === 'freeHandCircle') {
                        var radius = map.computeLength(e.target._geometry.getCenter(), _this2.snapPoint);
                        geometry.setRadius(radius);
                    } else if (mode === 'ellipse' || mode === 'freeHandEllipse') {
                        var center = geometry.getCenter();
                        var rx = map.computeLength(center, new maptalks.Coordinate({
                            x: _this2.snapPoint.x,
                            y: center.y
                        }));
                        var ry = map.computeLength(center, new maptalks.Coordinate({
                            x: center.x,
                            y: _this2.snapPoint.y
                        }));
                        geometry.setWidth(rx * 2);
                        geometry.setHeight(ry * 2);
                    } else if (mode === 'rectangle' || mode === 'freeHandRectangle') {
                        var containerPoint = map.coordToContainerPoint(new maptalks.Coordinate({
                            x: _this2.snapPoint.x,
                            y: _this2.snapPoint.y
                        }));
                        var firstClick = map.coordToContainerPoint(geometry.getFirstCoordinate());
                        var ring = [[firstClick.x, firstClick.y], [containerPoint.x, firstClick.y], [containerPoint.x, containerPoint.y], [firstClick.x, containerPoint.y]];
                        geometry.setCoordinates(ring.map(function (c) {
                            return map.containerPointToCoord(new maptalks.Point(c));
                        }));
                    } else {
                        _this2._resetCoordinates(geometry, _this2.snapPoint);
                    }
                }
            }, this);
        }
    };

    SnapTool.prototype._resetCoordinates = function _resetCoordinates(geometry, snapPoint) {
        if (!geometry) return geometry;
        var coords = geometry.getCoordinates();
        if (geometry instanceof maptalks.Polygon) {
            if (geometry instanceof maptalks.Circle) {
                return geometry;
            }
            var coordinates = coords[0];
            if (coordinates instanceof Array && coordinates.length > 2) {
                coordinates[coordinates.length - 2].x = snapPoint.x;
                coordinates[coordinates.length - 2].y = snapPoint.y;
            }
        } else if (coords instanceof Array) {
            coords[coords.length - 1].x = snapPoint.x;
            coords[coords.length - 1].y = snapPoint.y;
        } else if (coords instanceof maptalks.Coordinate) {
            coords.x = snapPoint.x;
            coords.y = snapPoint.y;
        }
        geometry.setCoordinates(coords);
        return geometry;
    };

    SnapTool.prototype._resetClickPoint = function _resetClickPoint(clickCoords, snapPoint) {
        if (!clickCoords) return;
        clickCoords[clickCoords.length - 1].x = snapPoint.x;
        clickCoords[clickCoords.length - 1].y = snapPoint.y;
    };

    SnapTool.prototype._addGeometries = function _addGeometries(geometries) {
        geometries = geometries instanceof Array ? geometries : [geometries];
        var addGeometries = this._compositGeometries(geometries);
        this.allGeometries = this.allGeometries.concat(addGeometries);
    };

    SnapTool.prototype._clearGeometries = function _clearGeometries() {
        this.addGeometries = [];
    };

    /**
     * @param {Coordinate} mouse's coordinate on map
     * Using a point to inspect the surrounding geometries
     */


    SnapTool.prototype._prepareGeometries = function _prepareGeometries(coordinate) {
        if (this.allGeometries) {
            var allGeoInGeojson = this.allGeometries;
            this.tree.clear();
            this.tree.load({
                'type': 'FeatureCollection',
                'features': allGeoInGeojson
            });
            this.inspectExtent = this._createInspectExtent(coordinate);
            var availGeometries = this.tree.search(this.inspectExtent);
            return availGeometries;
        }
        return null;
    };

    SnapTool.prototype._compositGeometries = function _compositGeometries(geometries) {
        var geos = [];
        var mode = this.getMode();
        if (mode === 'point') {
            geos = this._compositToPoints(geometries);
        } else if (mode === 'line') {
            geos = this._compositToLines(geometries);
        }
        return geos;
    };

    SnapTool.prototype._compositToPoints = function _compositToPoints(geometries) {
        var geos = [];
        geometries.forEach(function (geo) {
            geos = geos.concat(this._parserToPoints(geo));
        }.bind(this));
        return geos;
    };

    SnapTool.prototype._createMarkers = function _createMarkers(coords) {
        var markers = [];
        coords.forEach(function (coord) {
            if (coord instanceof Array) {
                coord.forEach(function (_coord) {
                    var _geo = new maptalks.Marker(_coord, {
                        properties: {}
                    });
                    _geo = _geo.toGeoJSON();
                    markers.push(_geo);
                });
            } else {
                var _geo = new maptalks.Marker(coord, {
                    properties: {}
                });
                _geo = _geo.toGeoJSON();
                markers.push(_geo);
            }
        });
        return markers;
    };

    SnapTool.prototype._parserToPoints = function _parserToPoints(geo) {
        var type = geo.getType();
        var coordinates = null;
        if (type === 'Circle' || type === 'Ellipse') {
            coordinates = geo.getShell();
        } else coordinates = geo.getCoordinates();
        var geos = [];
        //two cases,one is single geometry,and another is multi geometries
        if (coordinates[0] instanceof Array) {
            coordinates.forEach(function (coords) {
                var _markers = this._createMarkers(coords);
                geos = geos.concat(_markers);
            }.bind(this));
        } else {
            if (!(coordinates instanceof Array)) {
                coordinates = [coordinates];
            }
            var _markers = this._createMarkers(coordinates);
            geos = geos.concat(_markers);
        }
        return geos;
    };

    SnapTool.prototype._compositToLines = function _compositToLines(geometries) {
        var geos = [];
        geometries.forEach(function (geo) {
            switch (geo.getType()) {
                case 'Point':
                    {
                        var _geo = geo.toGeoJSON();
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
    };

    SnapTool.prototype._parserGeometries = function _parserGeometries(geo, _len) {
        var coordinates = geo.getCoordinates();
        var geos = [];
        //two cases,one is single geometry,and another is multi geometries
        if (coordinates[0] instanceof Array) {
            coordinates.forEach(function (coords) {
                var _lines = this._createLine(coords, _len, geo);
                geos = geos.concat(_lines);
            }.bind(this));
        } else {
            var _lines = this._createLine(coordinates, _len, geo);
            geos = geos.concat(_lines);
        }
        return geos;
    };

    SnapTool.prototype._createLine = function _createLine(coordinates, _length, geo) {
        var lines = [];
        var len = coordinates.length - _length;
        for (var i = 0; i < len; i++) {
            var line = new maptalks.LineString([coordinates[i], coordinates[i + 1]], {
                properties: {
                    obj: geo
                }
            });
            lines.push(line.toGeoJSON());
        }
        return lines;
    };

    SnapTool.prototype._createInspectExtent = function _createInspectExtent(coordinate) {
        var tolerance = !this.options['tolerance'] ? 10 : this.options['tolerance'];
        var map = this.getMap();
        var zoom = map.getZoom();
        var screenPoint = map.coordinateToPoint(coordinate, zoom);
        var lefttop = map.pointToCoordinate(new maptalks.Point([screenPoint.x - tolerance, screenPoint.y - tolerance]), zoom);
        var righttop = map.pointToCoordinate(new maptalks.Point([screenPoint.x + tolerance, screenPoint.y - tolerance]), zoom);
        var leftbottom = map.pointToCoordinate(new maptalks.Point([screenPoint.x - tolerance, screenPoint.y + tolerance]), zoom);
        var rightbottom = map.pointToCoordinate(new maptalks.Point([screenPoint.x + tolerance, screenPoint.y + tolerance]), zoom);
        return {
            'type': 'Feature',
            'properties': {},
            'geometry': {
                'type': 'Polygon',
                'coordinates': [[[lefttop.x, lefttop.y], [righttop.x, righttop.y], [rightbottom.x, rightbottom.y], [leftbottom.x, leftbottom.y]]]
            }
        };
    };

    /**
     * @param {Map}
     * Register mousemove event
     */


    SnapTool.prototype._registerEvents = function _registerEvents(map) {
        this._needFindGeometry = true;
        this._mousemove = function (e) {
            this.mousePoint = e.coordinate;
            if (!this._marker) {
                this._marker = new maptalks.Marker(e.coordinate, {
                    'symbol': this.options['symbol']
                }).addTo(this._mousemoveLayer);
            } else {
                this._marker.setCoordinates(e.coordinate);
            }
            //indicate find geometry
            if (!this._needFindGeometry) return;
            var availGeometries = this._findGeometry(e.coordinate);
            if (availGeometries.features.length > 0) {
                this.snapPoint = this._getSnapPoint(availGeometries);
                if (this.snapPoint) {
                    this._marker.setCoordinates([this.snapPoint.x, this.snapPoint.y]);
                }
            } else {
                this.snapPoint = null;
            }
        };
        this._mousedown = function () {
            this._needFindGeometry = false;
        };
        this._mouseup = function () {
            this._needFindGeometry = true;
        };
        map.on('mousemove touchstart', this._mousemove, this);
        map.on('mousedown', this._mousedown, this);
        map.on('mouseup', this._mouseup, this);
    };

    /**
     * @param {Array<geometry>} available geometries which are surrounded
     * Calculate the distance from mouse point to every geometry
     */


    SnapTool.prototype._setDistance = function _setDistance(geos) {
        var geoObjects = [];
        for (var i = 0; i < geos.length; i++) {
            var geo = geos[i];
            if (geo.geometry.type === 'LineString') {
                var distance = this._distToPolyline(this.mousePoint, geo);
                //geo.properties.distance = distance;
                geoObjects.push({
                    geoObject: geo,
                    distance: distance
                });
            } else if (geo.geometry.type === 'Point') {
                var _distance = this._distToPoint(this.mousePoint, geo);
                //Composite an object including geometry and distance
                geoObjects.push({
                    geoObject: geo,
                    distance: _distance
                });
            }
        }
        return geoObjects;
    };

    SnapTool.prototype._findNearestGeometries = function _findNearestGeometries(geos) {
        var geoObjects = this._setDistance(geos);
        geoObjects = geoObjects.sort(this._compare(geoObjects, 'distance'));
        return geoObjects[0];
    };

    SnapTool.prototype._findGeometry = function _findGeometry(coordinate) {
        var availGeimetries = this._prepareGeometries(coordinate);
        return availGeimetries;
    };

    SnapTool.prototype._getSnapPoint = function _getSnapPoint(availGeometries) {
        var _nearestGeometry = this._findNearestGeometries(availGeometries.features);
        var snapPoint = null;
        if (!this._validDistance(_nearestGeometry.distance)) {
            return null;
        }
        //when it's point, return itself
        if (_nearestGeometry.geoObject.geometry.type === 'Point') {
            snapPoint = {
                x: _nearestGeometry.geoObject.geometry.coordinates[0],
                y: _nearestGeometry.geoObject.geometry.coordinates[1]
            };
        } else if (_nearestGeometry.geoObject.geometry.type === 'LineString') {
            //when it's line,return the vertical insect point
            var nearestLine = this._setEquation(_nearestGeometry.geoObject);
            //whether k exists
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
                var k = nearestLine.B / nearestLine.A;
                var verticalLine = this._setVertiEquation(k, this.mousePoint);
                snapPoint = this._solveEquation(nearestLine, verticalLine);
            }
        }
        return snapPoint;
    };

    //Calculate the distance from a point to a line


    SnapTool.prototype._distToPolyline = function _distToPolyline(point, line) {
        var equation = this._setEquation(line);
        var A = equation.A;
        var B = equation.B;
        var C = equation.C;
        var distance = Math.abs((A * point.x + B * point.y + C) / Math.sqrt(Math.pow(A, 2) + Math.pow(B, 2)));
        return distance;
    };

    SnapTool.prototype._validDistance = function _validDistance(distance) {
        var map = this.getMap();
        var resolution = map.getResolution();
        var tolerance = this.options['tolerance'];
        if (distance / resolution > tolerance) {
            return false;
        } else {
            return true;
        }
    };

    SnapTool.prototype._distToPoint = function _distToPoint(mousePoint, toPoint) {
        var from = [mousePoint.x, mousePoint.y];
        var to = toPoint.geometry.coordinates;
        return Math.sqrt(Math.pow(from[0] - to[0], 2) + Math.pow(from[1] - to[1], 2));
    };
    //create a line's equation


    SnapTool.prototype._setEquation = function _setEquation(line) {
        var coords = line.geometry.coordinates;
        var from = coords[0];
        var to = coords[1];
        var k = Number((from[1] - to[1]) / (from[0] - to[0]).toString());
        var A = k;
        var B = -1;
        var C = from[1] - k * from[0];
        return {
            A: A,
            B: B,
            C: C
        };
    };

    SnapTool.prototype._setVertiEquation = function _setVertiEquation(k, point) {
        var b = point.y - k * point.x;
        var A = k;
        var B = -1;
        var C = b;
        return {
            A: A,
            B: B,
            C: C
        };
    };

    SnapTool.prototype._solveEquation = function _solveEquation(equationW, equationU) {
        var A1 = equationW.A,
            B1 = equationW.B,
            C1 = equationW.C;
        var A2 = equationU.A,
            B2 = equationU.B,
            C2 = equationU.C;
        var x = (B1 * C2 - C1 * B2) / (A1 * B2 - A2 * B1);
        var y = (A1 * C2 - A2 * C1) / (B1 * A2 - B2 * A1);
        return {
            x: x,
            y: y
        };
    };

    SnapTool.prototype._compare = function _compare(data, propertyName) {
        return function (object1, object2) {
            var value1 = object1[propertyName];
            var value2 = object2[propertyName];
            if (value2 < value1) {
                return 1;
            } else if (value2 > value1) {
                return -1;
            } else {
                return 0;
            }
        };
    };

    return SnapTool;
}(maptalks.Class);

SnapTool.mergeOptions(options);

exports.SnapTool = SnapTool;

Object.defineProperty(exports, '__esModule', { value: true });

typeof console !== 'undefined' && console.log('maptalks.snapto v0.1.11, requires maptalks@^0.33.1.');

})));
