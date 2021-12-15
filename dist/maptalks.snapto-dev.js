/*!
 * maptalks.snapto v0.1.11
 * LICENSE : MIT
 * (c) 2016-2021 maptalks.org
 */
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('maptalks')) :
  typeof define === 'function' && define.amd ? define(['exports', 'maptalks'], factory) :
  (factory((global.maptalks = global.maptalks || {}),global.maptalks));
}(this, (function (exports,maptalks) { 'use strict';

  function _inheritsLoose(subClass, superClass) {
    subClass.prototype = Object.create(superClass.prototype);
    subClass.prototype.constructor = subClass;

    _setPrototypeOf(subClass, superClass);
  }

  function _setPrototypeOf(o, p) {
    _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) {
      o.__proto__ = p;
      return o;
    };

    return _setPrototypeOf(o, p);
  }

  var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

  function createCommonjsModule(fn, module) {
  	return module = { exports: {} }, fn(module, module.exports), module.exports;
  }

  var quickselect = createCommonjsModule(function (module, exports) {
    (function (global, factory) {
      module.exports = factory();
    })(commonjsGlobal, function () {

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
            }

            while (compare(arr[j], t) > 0) {
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

  var rbush_1 = rbush;
  var default_1 = rbush;

  function rbush(maxEntries, format) {
    if (!(this instanceof rbush)) return new rbush(maxEntries, format);
    this._maxEntries = Math.max(4, maxEntries || 9);
    this._minEntries = Math.max(2, Math.ceil(this._maxEntries * 0.4));

    if (format) {
      this._initFormat(format);
    }

    this.clear();
  }

  rbush.prototype = {
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

      var node = this._build(data.slice(), 0, data.length - 1, 0);

      if (!this.data.children.length) {
        this.data = node;
      } else if (this.data.height === node.height) {
        this._splitRoot(this.data, node);
      } else {
        if (this.data.height < node.height) {
          var tmpNode = this.data;
          this.data = node;
          node = tmpNode;
        }

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

      while (node || path.length) {
        if (!node) {
          node = path.pop();
          parent = path[path.length - 1];
          i = indexes.pop();
          goingUp = true;
        }

        if (node.leaf) {
          index = findItem(item, node.children, equalsFn);

          if (index !== -1) {
            node.children.splice(index, 1);
            path.push(node);

            this._condense(path);

            return this;
          }
        }

        if (!goingUp && !node.leaf && contains(node, bbox)) {
          path.push(node);
          indexes.push(i);
          i = 0;
          parent = node;
          node = node.children[0];
        } else if (parent) {
          i++;
          node = parent.children[i];
          goingUp = false;
        } else node = null;
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
        node = createNode(items.slice(left, right + 1));
        calcBBox(node, this.toBBox);
        return node;
      }

      if (!height) {
        height = Math.ceil(Math.log(N) / Math.log(M));
        M = Math.ceil(N / Math.pow(M, height - 1));
      }

      node = createNode([]);
      node.leaf = false;
      node.height = height;
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

          if (enlargement < minEnlargement) {
            minEnlargement = enlargement;
            minArea = area < minArea ? area : minArea;
            targetNode = child;
          } else if (enlargement === minEnlargement) {
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

      var node = this._chooseSubtree(bbox, this.data, level, insertPath);

      node.children.push(item);
      extend(node, bbox);

      while (level >= 0) {
        if (insertPath[level].children.length > this._maxEntries) {
          this._split(insertPath, level);

          level--;
        } else break;
      }

      this._adjustParentBBoxes(bbox, insertPath, level);
    },
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

        if (overlap < minOverlap) {
          minOverlap = overlap;
          index = i;
          minArea = area < minArea ? area : minArea;
        } else if (overlap === minOverlap) {
          if (area < minArea) {
            minArea = area;
            index = i;
          }
        }
      }

      return index;
    },
    _chooseSplitAxis: function _chooseSplitAxis(node, m, M) {
      var compareMinX = node.leaf ? this.compareMinX : compareNodeMinX,
          compareMinY = node.leaf ? this.compareMinY : compareNodeMinY,
          xMargin = this._allDistMargin(node, m, M, compareMinX),
          yMargin = this._allDistMargin(node, m, M, compareMinY);

      if (xMargin < yMargin) node.children.sort(compareMinX);
    },
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
      for (var i = level; i >= 0; i--) {
        extend(path[i], bbox);
      }
    },
    _condense: function _condense(path) {
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

  function calcBBox(node, toBBox) {
    distBBox(node, 0, node.children.length, toBBox, node);
  }

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
  rbush_1["default"] = default_1;

  function coordEach(geojson, callback, excludeWrapCoord) {
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

    for (featureIndex = 0; featureIndex < stop; featureIndex++) {
      geometryMaybeCollection = isFeatureCollection ? geojson.features[featureIndex].geometry : isFeature ? geojson.geometry : geojson;
      isGeometryCollection = geometryMaybeCollection ? geometryMaybeCollection.type === 'GeometryCollection' : false;
      stopG = isGeometryCollection ? geometryMaybeCollection.geometries.length : 1;

      for (geometryIndex = 0; geometryIndex < stopG; geometryIndex++) {
        var featureSubIndex = 0;
        geometry = isGeometryCollection ? geometryMaybeCollection.geometries[geometryIndex] : geometryMaybeCollection;
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
              }

              featureSubIndex++;
            }

            break;

          case 'GeometryCollection':
            for (j = 0; j < geometry.geometries.length; j++) {
              coordEach(geometry.geometries[j], callback, excludeWrapCoord);
            }

            break;

          default:
            throw new Error('Unknown Geometry Type');
        }
      }
    }
  }
  function coordReduce(geojson, callback, initialValue, excludeWrapCoord) {
    var previousValue = initialValue;
    coordEach(geojson, function (currentCoord, coordIndex, featureIndex, featureSubIndex) {
      if (coordIndex === 0 && initialValue === undefined) previousValue = currentCoord;else previousValue = callback(previousValue, currentCoord, coordIndex, featureIndex, featureSubIndex);
    }, excludeWrapCoord);
    return previousValue;
  }
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
  function propReduce(geojson, callback, initialValue) {
    var previousValue = initialValue;
    propEach(geojson, function (currentProperties, featureIndex) {
      if (featureIndex === 0 && initialValue === undefined) previousValue = currentProperties;else previousValue = callback(previousValue, currentProperties, featureIndex);
    });
    return previousValue;
  }
  function featureEach(geojson, callback) {
    if (geojson.type === 'Feature') {
      callback(geojson, 0);
    } else if (geojson.type === 'FeatureCollection') {
      for (var i = 0; i < geojson.features.length; i++) {
        callback(geojson.features[i], i);
      }
    }
  }
  function featureReduce(geojson, callback, initialValue) {
    var previousValue = initialValue;
    featureEach(geojson, function (currentFeature, featureIndex) {
      if (featureIndex === 0 && initialValue === undefined) previousValue = currentFeature;else previousValue = callback(previousValue, currentFeature, featureIndex);
    });
    return previousValue;
  }
  function coordAll(geojson) {
    var coords = [];
    coordEach(geojson, function (coord) {
      coords.push(coord);
    });
    return coords;
  }
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

    for (i = 0; i < stop; i++) {
      geometryMaybeCollection = isFeatureCollection ? geojson.features[i].geometry : isFeature ? geojson.geometry : geojson;
      geometryProperties = isFeatureCollection ? geojson.features[i].properties : isFeature ? geojson.properties : {};
      isGeometryCollection = geometryMaybeCollection ? geometryMaybeCollection.type === 'GeometryCollection' : false;
      stopG = isGeometryCollection ? geometryMaybeCollection.geometries.length : 1;

      for (g = 0; g < stopG; g++) {
        geometry = isGeometryCollection ? geometryMaybeCollection.geometries[g] : geometryMaybeCollection;

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

      featureIndex++;
    }
  }
  function geomReduce(geojson, callback, initialValue) {
    var previousValue = initialValue;
    geomEach(geojson, function (currentGeometry, currentIndex, currentProperties) {
      if (currentIndex === 0 && initialValue === undefined) previousValue = currentGeometry;else previousValue = callback(previousValue, currentGeometry, currentIndex, currentProperties);
    });
    return previousValue;
  }
  function flattenEach(geojson, callback) {
    geomEach(geojson, function (geometry, featureIndex, properties) {
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
  function flattenReduce(geojson, callback, initialValue) {
    var previousValue = initialValue;
    flattenEach(geojson, function (currentFeature, featureIndex, featureSubIndex) {
      if (featureIndex === 0 && featureSubIndex === 0 && initialValue === undefined) previousValue = currentFeature;else previousValue = callback(previousValue, currentFeature, featureIndex, featureSubIndex);
    });
    return previousValue;
  }
  function segmentEach(geojson, callback) {
    flattenEach(geojson, function (feature, featureIndex, featureSubIndex) {
      var segmentIndex = 0;
      if (!feature.geometry) return;
      var type = feature.geometry.type;
      if (type === 'Point' || type === 'MultiPoint') return;
      coordReduce(feature, function (previousCoords, currentCoord) {
        var currentSegment = lineString([previousCoords, currentCoord], feature.properties);
        callback(currentSegment, featureIndex, featureSubIndex, segmentIndex);
        segmentIndex++;
        return currentCoord;
      });
    });
  }
  function segmentReduce(geojson, callback, initialValue) {
    var previousValue = initialValue;
    var started = false;
    segmentEach(geojson, function (currentSegment, featureIndex, featureSubIndex, segmentIndex) {
      if (started === false && initialValue === undefined) previousValue = currentSegment;else previousValue = callback(previousValue, currentSegment, featureIndex, featureSubIndex, segmentIndex);
      started = true;
    });
    return previousValue;
  }
  function feature(geometry, properties) {
    if (geometry === undefined) throw new Error('No geometry passed');
    return {
      type: 'Feature',
      properties: properties || {},
      geometry: geometry
    };
  }
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
  function lineEach(geojson, callback) {
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
  function lineReduce(geojson, callback, initialValue) {
    var previousValue = initialValue;
    lineEach(geojson, function (currentLine, lineIndex, lineSubIndex) {
      if (lineIndex === 0 && initialValue === undefined) previousValue = currentLine;else previousValue = callback(previousValue, currentLine, lineIndex, lineSubIndex);
    });
    return previousValue;
  }

  var meta = /*#__PURE__*/Object.freeze({
    coordEach: coordEach,
    coordReduce: coordReduce,
    propEach: propEach,
    propReduce: propReduce,
    featureEach: featureEach,
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

  var featureEach$1 = meta.featureEach;
  var coordEach$1 = meta.coordEach;

  var geojsonRbush = function geojsonRbush(maxEntries) {
    var tree = rbush_1(maxEntries);

    tree.insert = function (feature) {
      if (Array.isArray(feature)) {
        var bbox = feature;
        feature = bboxPolygon(bbox);
        feature.bbox = bbox;
      } else {
        feature.bbox = feature.bbox ? feature.bbox : turfBBox(feature);
      }

      return rbush_1.prototype.insert.call(this, feature);
    };

    tree.load = function (features) {
      var load = [];

      if (Array.isArray(features)) {
        features.forEach(function (bbox) {
          var feature = bboxPolygon(bbox);
          feature.bbox = bbox;
          load.push(feature);
        });
      } else {
        featureEach$1(features, function (feature) {
          feature.bbox = feature.bbox ? feature.bbox : turfBBox(feature);
          load.push(feature);
        });
      }

      return rbush_1.prototype.load.call(this, load);
    };

    tree.remove = function (feature) {
      if (Array.isArray(feature)) {
        var bbox = feature;
        feature = bboxPolygon(bbox);
        feature.bbox = bbox;
      }

      return rbush_1.prototype.remove.call(this, feature);
    };

    tree.clear = function () {
      return rbush_1.prototype.clear.call(this);
    };

    tree.search = function (geojson) {
      var features = rbush_1.prototype.search.call(this, this.toBBox(geojson));
      return {
        type: 'FeatureCollection',
        features: features
      };
    };

    tree.collides = function (geojson) {
      return rbush_1.prototype.collides.call(this, this.toBBox(geojson));
    };

    tree.all = function () {
      var features = rbush_1.prototype.all.call(this);
      return {
        type: 'FeatureCollection',
        features: features
      };
    };

    tree.toJSON = function () {
      return rbush_1.prototype.toJSON.call(this);
    };

    tree.fromJSON = function (json) {
      return rbush_1.prototype.fromJSON.call(this, json);
    };

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

  function turfBBox(geojson) {
    var bbox = [Infinity, Infinity, -Infinity, -Infinity];
    coordEach$1(geojson, function (coord) {
      if (bbox[0] > coord[0]) bbox[0] = coord[0];
      if (bbox[1] > coord[1]) bbox[1] = coord[1];
      if (bbox[2] < coord[0]) bbox[2] = coord[0];
      if (bbox[3] < coord[1]) bbox[3] = coord[1];
    });
    return bbox;
  }

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
  var SnapTool = function (_maptalks$Class) {
    _inheritsLoose(SnapTool, _maptalks$Class);

    function SnapTool(options) {
      var _this;

      _this = _maptalks$Class.call(this, options) || this;
      _this.tree = geojsonRbush();
      return _this;
    }

    var _proto = SnapTool.prototype;

    _proto.getMode = function getMode() {
      this._mode = !this._mode ? this.options['mode'] : this._mode;

      if (this._checkMode(this._mode)) {
        return this._mode;
      } else {
        throw new Error('snap mode is invalid');
      }
    };

    _proto.setMode = function setMode(mode) {
      if (this._checkMode(this._mode)) {
        this._mode = mode;

        if (this.snaplayer) {
          if (this.snaplayer instanceof Array) {
            var _ref;

            this.allLayersGeometries = [];
            this.snaplayer.forEach(function (tempLayer, index) {
              var tempGeometries = tempLayer.getGeometries();
              this.allLayersGeometries[index] = this._compositGeometries(tempGeometries);
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

    _proto.addTo = function addTo(map) {
      var id = maptalks.INTERNAL_LAYER_PREFIX + "_snapto";
      this._mousemoveLayer = new maptalks.VectorLayer(id).addTo(map);
      this._map = map;
      this.allGeometries = [];
      this.enable();
    };

    _proto.remove = function remove() {
      this.disable();

      if (this._mousemoveLayer) {
        this._mousemoveLayer.remove();

        delete this._mousemoveLayer;
      }
    };

    _proto.getMap = function getMap() {
      return this._map;
    };

    _proto._checkMode = function _checkMode(mode) {
      if (mode === 'point' || mode === 'line') {
        return true;
      } else {
        return false;
      }
    };

    _proto.enable = function enable() {
      var map = this.getMap();

      if (this.snaplayer) {
        if (this.snaplayer instanceof Array) {
          var _ref2;

          this.allLayersGeometries = [];
          this.snaplayer.forEach(function (tempLayer, index) {
            var tempGeometries = tempLayer.getGeometries();
            this.allLayersGeometries[index] = this._compositGeometries(tempGeometries);
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

    _proto.disable = function disable() {
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

    _proto.setGeometries = function setGeometries(geometries) {
      geometries = geometries instanceof Array ? geometries : [geometries];
      this.allGeometries = this._compositGeometries(geometries);
    };

    _proto.setLayer = function setLayer(layer) {
      if (layer instanceof Array) {
        var _ref5;

        this.snaplayer = [];
        this.allLayersGeometries = [];
        layer.forEach(function (tempLayer, index) {
          if (tempLayer instanceof maptalks.VectorLayer) {
            this.snaplayer.push(tempLayer);
            var tempGeometries = tempLayer.getGeometries();
            this.allLayersGeometries[index] = this._compositGeometries(tempGeometries);
            tempLayer.on('addgeo', function () {
              var _ref3;

              var tempGeometries = this.snaplayer[index].getGeometries();
              this.allLayersGeometries[index] = this._compositGeometries(tempGeometries);
              this.allGeometries = (_ref3 = []).concat.apply(_ref3, this.allLayersGeometries);
            }, this);
            tempLayer.on('clear', function () {
              var _ref4;

              this.allLayersGeometries.splice(index, 1);
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

    _proto.bindDrawTool = function bindDrawTool(drawTool) {
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

    _proto._resetCoordinates = function _resetCoordinates(geometry, snapPoint) {
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

    _proto._resetClickPoint = function _resetClickPoint(clickCoords, snapPoint) {
      if (!clickCoords) return;
      var map = this.getMap();

      var clickPoint = map._pointToPrj(map.coordinateToPoint(snapPoint));

      clickCoords[clickCoords.length - 1].x = clickPoint.x;
      clickCoords[clickCoords.length - 1].y = clickPoint.y;
    };

    _proto._addGeometries = function _addGeometries(geometries) {
      geometries = geometries instanceof Array ? geometries : [geometries];

      var addGeometries = this._compositGeometries(geometries);

      this.allGeometries = this.allGeometries.concat(addGeometries);
    };

    _proto._clearGeometries = function _clearGeometries() {
      this.addGeometries = [];
    };

    _proto._prepareGeometries = function _prepareGeometries(coordinate) {
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

    _proto._compositGeometries = function _compositGeometries(geometries) {
      var geos = [];
      var mode = this.getMode();

      if (mode === 'point') {
        geos = this._compositToPoints(geometries);
      } else if (mode === 'line') {
        geos = this._compositToLines(geometries);
      }

      return geos;
    };

    _proto._compositToPoints = function _compositToPoints(geometries) {
      var geos = [];
      geometries.forEach(function (geo) {
        geos = geos.concat(this._parserToPoints(geo));
      }.bind(this));
      return geos;
    };

    _proto._createMarkers = function _createMarkers(coords) {
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

    _proto._parserToPoints = function _parserToPoints(geo) {
      var type = geo.getType();
      var coordinates = null;

      if (type === 'Circle' || type === 'Ellipse') {
        coordinates = geo.getShell();
      } else coordinates = geo.getCoordinates();

      var geos = [];

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

    _proto._compositToLines = function _compositToLines(geometries) {
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

    _proto._parserGeometries = function _parserGeometries(geo, _len) {
      var coordinates = geo.getCoordinates();
      var geos = [];

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

    _proto._createLine = function _createLine(coordinates, _length, geo) {
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

    _proto._createInspectExtent = function _createInspectExtent(coordinate) {
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

    _proto._registerEvents = function _registerEvents(map) {
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

    _proto._setDistance = function _setDistance(geos) {
      var geoObjects = [];

      for (var i = 0; i < geos.length; i++) {
        var geo = geos[i];

        if (geo.geometry.type === 'LineString') {
          var distance = this._distToPolyline(this.mousePoint, geo);

          geoObjects.push({
            geoObject: geo,
            distance: distance
          });
        } else if (geo.geometry.type === 'Point') {
          var _distance = this._distToPoint(this.mousePoint, geo);

          geoObjects.push({
            geoObject: geo,
            distance: _distance
          });
        }
      }

      return geoObjects;
    };

    _proto._findNearestGeometries = function _findNearestGeometries(geos) {
      var geoObjects = this._setDistance(geos);

      geoObjects = geoObjects.sort(this._compare(geoObjects, 'distance'));
      return geoObjects[0];
    };

    _proto._findGeometry = function _findGeometry(coordinate) {
      var availGeimetries = this._prepareGeometries(coordinate);

      return availGeimetries;
    };

    _proto._getSnapPoint = function _getSnapPoint(availGeometries) {
      var _nearestGeometry = this._findNearestGeometries(availGeometries.features);

      var snapPoint = null;

      if (!this._validDistance(_nearestGeometry.distance)) {
        return null;
      }

      if (_nearestGeometry.geoObject.geometry.type === 'Point') {
        snapPoint = {
          x: _nearestGeometry.geoObject.geometry.coordinates[0],
          y: _nearestGeometry.geoObject.geometry.coordinates[1]
        };
      } else if (_nearestGeometry.geoObject.geometry.type === 'LineString') {
        var nearestLine = this._setEquation(_nearestGeometry.geoObject);

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

    _proto._distToPolyline = function _distToPolyline(point, line) {
      var equation = this._setEquation(line);

      var A = equation.A;
      var B = equation.B;
      var C = equation.C;
      var distance = Math.abs((A * point.x + B * point.y + C) / Math.sqrt(Math.pow(A, 2) + Math.pow(B, 2)));
      return distance;
    };

    _proto._validDistance = function _validDistance(distance) {
      var map = this.getMap();
      var resolution = map.getResolution();
      var tolerance = this.options['tolerance'];

      if (distance / resolution > tolerance) {
        return false;
      } else {
        return true;
      }
    };

    _proto._distToPoint = function _distToPoint(mousePoint, toPoint) {
      var from = [mousePoint.x, mousePoint.y];
      var to = toPoint.geometry.coordinates;
      return Math.sqrt(Math.pow(from[0] - to[0], 2) + Math.pow(from[1] - to[1], 2));
    };

    _proto._setEquation = function _setEquation(line) {
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

    _proto._setVertiEquation = function _setVertiEquation(k, point) {
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

    _proto._solveEquation = function _solveEquation(equationW, equationU) {
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

    _proto._compare = function _compare(data, propertyName) {
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

})));
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFwdGFsa3Muc25hcHRvLWRldi5qcyIsInNvdXJjZXMiOlsiLi4vbm9kZV9tb2R1bGVzL3F1aWNrc2VsZWN0L3F1aWNrc2VsZWN0LmpzIiwiLi4vbm9kZV9tb2R1bGVzL3JidXNoL2luZGV4LmpzIiwiLi4vbm9kZV9tb2R1bGVzL0B0dXJmL21ldGEvaW5kZXguanMiLCIuLi9ub2RlX21vZHVsZXMvZ2VvanNvbi1yYnVzaC9pbmRleC5qcyIsIi4uL2luZGV4LmpzIl0sInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiAoZ2xvYmFsLCBmYWN0b3J5KSB7XG5cdHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyA/IG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeSgpIDpcblx0dHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kID8gZGVmaW5lKGZhY3RvcnkpIDpcblx0KGdsb2JhbC5xdWlja3NlbGVjdCA9IGZhY3RvcnkoKSk7XG59KHRoaXMsIChmdW5jdGlvbiAoKSB7ICd1c2Ugc3RyaWN0JztcblxuZnVuY3Rpb24gcXVpY2tzZWxlY3QoYXJyLCBrLCBsZWZ0LCByaWdodCwgY29tcGFyZSkge1xuICAgIHF1aWNrc2VsZWN0U3RlcChhcnIsIGssIGxlZnQgfHwgMCwgcmlnaHQgfHwgKGFyci5sZW5ndGggLSAxKSwgY29tcGFyZSB8fCBkZWZhdWx0Q29tcGFyZSk7XG59XG5cbmZ1bmN0aW9uIHF1aWNrc2VsZWN0U3RlcChhcnIsIGssIGxlZnQsIHJpZ2h0LCBjb21wYXJlKSB7XG5cbiAgICB3aGlsZSAocmlnaHQgPiBsZWZ0KSB7XG4gICAgICAgIGlmIChyaWdodCAtIGxlZnQgPiA2MDApIHtcbiAgICAgICAgICAgIHZhciBuID0gcmlnaHQgLSBsZWZ0ICsgMTtcbiAgICAgICAgICAgIHZhciBtID0gayAtIGxlZnQgKyAxO1xuICAgICAgICAgICAgdmFyIHogPSBNYXRoLmxvZyhuKTtcbiAgICAgICAgICAgIHZhciBzID0gMC41ICogTWF0aC5leHAoMiAqIHogLyAzKTtcbiAgICAgICAgICAgIHZhciBzZCA9IDAuNSAqIE1hdGguc3FydCh6ICogcyAqIChuIC0gcykgLyBuKSAqIChtIC0gbiAvIDIgPCAwID8gLTEgOiAxKTtcbiAgICAgICAgICAgIHZhciBuZXdMZWZ0ID0gTWF0aC5tYXgobGVmdCwgTWF0aC5mbG9vcihrIC0gbSAqIHMgLyBuICsgc2QpKTtcbiAgICAgICAgICAgIHZhciBuZXdSaWdodCA9IE1hdGgubWluKHJpZ2h0LCBNYXRoLmZsb29yKGsgKyAobiAtIG0pICogcyAvIG4gKyBzZCkpO1xuICAgICAgICAgICAgcXVpY2tzZWxlY3RTdGVwKGFyciwgaywgbmV3TGVmdCwgbmV3UmlnaHQsIGNvbXBhcmUpO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHQgPSBhcnJba107XG4gICAgICAgIHZhciBpID0gbGVmdDtcbiAgICAgICAgdmFyIGogPSByaWdodDtcblxuICAgICAgICBzd2FwKGFyciwgbGVmdCwgayk7XG4gICAgICAgIGlmIChjb21wYXJlKGFycltyaWdodF0sIHQpID4gMCkgc3dhcChhcnIsIGxlZnQsIHJpZ2h0KTtcblxuICAgICAgICB3aGlsZSAoaSA8IGopIHtcbiAgICAgICAgICAgIHN3YXAoYXJyLCBpLCBqKTtcbiAgICAgICAgICAgIGkrKztcbiAgICAgICAgICAgIGotLTtcbiAgICAgICAgICAgIHdoaWxlIChjb21wYXJlKGFycltpXSwgdCkgPCAwKSBpKys7XG4gICAgICAgICAgICB3aGlsZSAoY29tcGFyZShhcnJbal0sIHQpID4gMCkgai0tO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGNvbXBhcmUoYXJyW2xlZnRdLCB0KSA9PT0gMCkgc3dhcChhcnIsIGxlZnQsIGopO1xuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGorKztcbiAgICAgICAgICAgIHN3YXAoYXJyLCBqLCByaWdodCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoaiA8PSBrKSBsZWZ0ID0gaiArIDE7XG4gICAgICAgIGlmIChrIDw9IGopIHJpZ2h0ID0gaiAtIDE7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBzd2FwKGFyciwgaSwgaikge1xuICAgIHZhciB0bXAgPSBhcnJbaV07XG4gICAgYXJyW2ldID0gYXJyW2pdO1xuICAgIGFycltqXSA9IHRtcDtcbn1cblxuZnVuY3Rpb24gZGVmYXVsdENvbXBhcmUoYSwgYikge1xuICAgIHJldHVybiBhIDwgYiA/IC0xIDogYSA+IGIgPyAxIDogMDtcbn1cblxucmV0dXJuIHF1aWNrc2VsZWN0O1xuXG59KSkpO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHJidXNoO1xubW9kdWxlLmV4cG9ydHMuZGVmYXVsdCA9IHJidXNoO1xuXG52YXIgcXVpY2tzZWxlY3QgPSByZXF1aXJlKCdxdWlja3NlbGVjdCcpO1xuXG5mdW5jdGlvbiByYnVzaChtYXhFbnRyaWVzLCBmb3JtYXQpIHtcbiAgICBpZiAoISh0aGlzIGluc3RhbmNlb2YgcmJ1c2gpKSByZXR1cm4gbmV3IHJidXNoKG1heEVudHJpZXMsIGZvcm1hdCk7XG5cbiAgICAvLyBtYXggZW50cmllcyBpbiBhIG5vZGUgaXMgOSBieSBkZWZhdWx0OyBtaW4gbm9kZSBmaWxsIGlzIDQwJSBmb3IgYmVzdCBwZXJmb3JtYW5jZVxuICAgIHRoaXMuX21heEVudHJpZXMgPSBNYXRoLm1heCg0LCBtYXhFbnRyaWVzIHx8IDkpO1xuICAgIHRoaXMuX21pbkVudHJpZXMgPSBNYXRoLm1heCgyLCBNYXRoLmNlaWwodGhpcy5fbWF4RW50cmllcyAqIDAuNCkpO1xuXG4gICAgaWYgKGZvcm1hdCkge1xuICAgICAgICB0aGlzLl9pbml0Rm9ybWF0KGZvcm1hdCk7XG4gICAgfVxuXG4gICAgdGhpcy5jbGVhcigpO1xufVxuXG5yYnVzaC5wcm90b3R5cGUgPSB7XG5cbiAgICBhbGw6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2FsbCh0aGlzLmRhdGEsIFtdKTtcbiAgICB9LFxuXG4gICAgc2VhcmNoOiBmdW5jdGlvbiAoYmJveCkge1xuXG4gICAgICAgIHZhciBub2RlID0gdGhpcy5kYXRhLFxuICAgICAgICAgICAgcmVzdWx0ID0gW10sXG4gICAgICAgICAgICB0b0JCb3ggPSB0aGlzLnRvQkJveDtcblxuICAgICAgICBpZiAoIWludGVyc2VjdHMoYmJveCwgbm9kZSkpIHJldHVybiByZXN1bHQ7XG5cbiAgICAgICAgdmFyIG5vZGVzVG9TZWFyY2ggPSBbXSxcbiAgICAgICAgICAgIGksIGxlbiwgY2hpbGQsIGNoaWxkQkJveDtcblxuICAgICAgICB3aGlsZSAobm9kZSkge1xuICAgICAgICAgICAgZm9yIChpID0gMCwgbGVuID0gbm9kZS5jaGlsZHJlbi5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuXG4gICAgICAgICAgICAgICAgY2hpbGQgPSBub2RlLmNoaWxkcmVuW2ldO1xuICAgICAgICAgICAgICAgIGNoaWxkQkJveCA9IG5vZGUubGVhZiA/IHRvQkJveChjaGlsZCkgOiBjaGlsZDtcblxuICAgICAgICAgICAgICAgIGlmIChpbnRlcnNlY3RzKGJib3gsIGNoaWxkQkJveCkpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG5vZGUubGVhZikgcmVzdWx0LnB1c2goY2hpbGQpO1xuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIChjb250YWlucyhiYm94LCBjaGlsZEJCb3gpKSB0aGlzLl9hbGwoY2hpbGQsIHJlc3VsdCk7XG4gICAgICAgICAgICAgICAgICAgIGVsc2Ugbm9kZXNUb1NlYXJjaC5wdXNoKGNoaWxkKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBub2RlID0gbm9kZXNUb1NlYXJjaC5wb3AoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfSxcblxuICAgIGNvbGxpZGVzOiBmdW5jdGlvbiAoYmJveCkge1xuXG4gICAgICAgIHZhciBub2RlID0gdGhpcy5kYXRhLFxuICAgICAgICAgICAgdG9CQm94ID0gdGhpcy50b0JCb3g7XG5cbiAgICAgICAgaWYgKCFpbnRlcnNlY3RzKGJib3gsIG5vZGUpKSByZXR1cm4gZmFsc2U7XG5cbiAgICAgICAgdmFyIG5vZGVzVG9TZWFyY2ggPSBbXSxcbiAgICAgICAgICAgIGksIGxlbiwgY2hpbGQsIGNoaWxkQkJveDtcblxuICAgICAgICB3aGlsZSAobm9kZSkge1xuICAgICAgICAgICAgZm9yIChpID0gMCwgbGVuID0gbm9kZS5jaGlsZHJlbi5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuXG4gICAgICAgICAgICAgICAgY2hpbGQgPSBub2RlLmNoaWxkcmVuW2ldO1xuICAgICAgICAgICAgICAgIGNoaWxkQkJveCA9IG5vZGUubGVhZiA/IHRvQkJveChjaGlsZCkgOiBjaGlsZDtcblxuICAgICAgICAgICAgICAgIGlmIChpbnRlcnNlY3RzKGJib3gsIGNoaWxkQkJveCkpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG5vZGUubGVhZiB8fCBjb250YWlucyhiYm94LCBjaGlsZEJCb3gpKSByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgbm9kZXNUb1NlYXJjaC5wdXNoKGNoaWxkKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBub2RlID0gbm9kZXNUb1NlYXJjaC5wb3AoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9LFxuXG4gICAgbG9hZDogZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgICAgaWYgKCEoZGF0YSAmJiBkYXRhLmxlbmd0aCkpIHJldHVybiB0aGlzO1xuXG4gICAgICAgIGlmIChkYXRhLmxlbmd0aCA8IHRoaXMuX21pbkVudHJpZXMpIHtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSBkYXRhLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5pbnNlcnQoZGF0YVtpXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHJlY3Vyc2l2ZWx5IGJ1aWxkIHRoZSB0cmVlIHdpdGggdGhlIGdpdmVuIGRhdGEgZnJvbSBzY3JhdGNoIHVzaW5nIE9NVCBhbGdvcml0aG1cbiAgICAgICAgdmFyIG5vZGUgPSB0aGlzLl9idWlsZChkYXRhLnNsaWNlKCksIDAsIGRhdGEubGVuZ3RoIC0gMSwgMCk7XG5cbiAgICAgICAgaWYgKCF0aGlzLmRhdGEuY2hpbGRyZW4ubGVuZ3RoKSB7XG4gICAgICAgICAgICAvLyBzYXZlIGFzIGlzIGlmIHRyZWUgaXMgZW1wdHlcbiAgICAgICAgICAgIHRoaXMuZGF0YSA9IG5vZGU7XG5cbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLmRhdGEuaGVpZ2h0ID09PSBub2RlLmhlaWdodCkge1xuICAgICAgICAgICAgLy8gc3BsaXQgcm9vdCBpZiB0cmVlcyBoYXZlIHRoZSBzYW1lIGhlaWdodFxuICAgICAgICAgICAgdGhpcy5fc3BsaXRSb290KHRoaXMuZGF0YSwgbm9kZSk7XG5cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmICh0aGlzLmRhdGEuaGVpZ2h0IDwgbm9kZS5oZWlnaHQpIHtcbiAgICAgICAgICAgICAgICAvLyBzd2FwIHRyZWVzIGlmIGluc2VydGVkIG9uZSBpcyBiaWdnZXJcbiAgICAgICAgICAgICAgICB2YXIgdG1wTm9kZSA9IHRoaXMuZGF0YTtcbiAgICAgICAgICAgICAgICB0aGlzLmRhdGEgPSBub2RlO1xuICAgICAgICAgICAgICAgIG5vZGUgPSB0bXBOb2RlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBpbnNlcnQgdGhlIHNtYWxsIHRyZWUgaW50byB0aGUgbGFyZ2UgdHJlZSBhdCBhcHByb3ByaWF0ZSBsZXZlbFxuICAgICAgICAgICAgdGhpcy5faW5zZXJ0KG5vZGUsIHRoaXMuZGF0YS5oZWlnaHQgLSBub2RlLmhlaWdodCAtIDEsIHRydWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIGluc2VydDogZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgICAgaWYgKGl0ZW0pIHRoaXMuX2luc2VydChpdGVtLCB0aGlzLmRhdGEuaGVpZ2h0IC0gMSk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICBjbGVhcjogZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLmRhdGEgPSBjcmVhdGVOb2RlKFtdKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIHJlbW92ZTogZnVuY3Rpb24gKGl0ZW0sIGVxdWFsc0ZuKSB7XG4gICAgICAgIGlmICghaXRlbSkgcmV0dXJuIHRoaXM7XG5cbiAgICAgICAgdmFyIG5vZGUgPSB0aGlzLmRhdGEsXG4gICAgICAgICAgICBiYm94ID0gdGhpcy50b0JCb3goaXRlbSksXG4gICAgICAgICAgICBwYXRoID0gW10sXG4gICAgICAgICAgICBpbmRleGVzID0gW10sXG4gICAgICAgICAgICBpLCBwYXJlbnQsIGluZGV4LCBnb2luZ1VwO1xuXG4gICAgICAgIC8vIGRlcHRoLWZpcnN0IGl0ZXJhdGl2ZSB0cmVlIHRyYXZlcnNhbFxuICAgICAgICB3aGlsZSAobm9kZSB8fCBwYXRoLmxlbmd0aCkge1xuXG4gICAgICAgICAgICBpZiAoIW5vZGUpIHsgLy8gZ28gdXBcbiAgICAgICAgICAgICAgICBub2RlID0gcGF0aC5wb3AoKTtcbiAgICAgICAgICAgICAgICBwYXJlbnQgPSBwYXRoW3BhdGgubGVuZ3RoIC0gMV07XG4gICAgICAgICAgICAgICAgaSA9IGluZGV4ZXMucG9wKCk7XG4gICAgICAgICAgICAgICAgZ29pbmdVcCA9IHRydWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChub2RlLmxlYWYpIHsgLy8gY2hlY2sgY3VycmVudCBub2RlXG4gICAgICAgICAgICAgICAgaW5kZXggPSBmaW5kSXRlbShpdGVtLCBub2RlLmNoaWxkcmVuLCBlcXVhbHNGbik7XG5cbiAgICAgICAgICAgICAgICBpZiAoaW5kZXggIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGl0ZW0gZm91bmQsIHJlbW92ZSB0aGUgaXRlbSBhbmQgY29uZGVuc2UgdHJlZSB1cHdhcmRzXG4gICAgICAgICAgICAgICAgICAgIG5vZGUuY2hpbGRyZW4uc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgICAgICAgICAgICAgcGF0aC5wdXNoKG5vZGUpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9jb25kZW5zZShwYXRoKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoIWdvaW5nVXAgJiYgIW5vZGUubGVhZiAmJiBjb250YWlucyhub2RlLCBiYm94KSkgeyAvLyBnbyBkb3duXG4gICAgICAgICAgICAgICAgcGF0aC5wdXNoKG5vZGUpO1xuICAgICAgICAgICAgICAgIGluZGV4ZXMucHVzaChpKTtcbiAgICAgICAgICAgICAgICBpID0gMDtcbiAgICAgICAgICAgICAgICBwYXJlbnQgPSBub2RlO1xuICAgICAgICAgICAgICAgIG5vZGUgPSBub2RlLmNoaWxkcmVuWzBdO1xuXG4gICAgICAgICAgICB9IGVsc2UgaWYgKHBhcmVudCkgeyAvLyBnbyByaWdodFxuICAgICAgICAgICAgICAgIGkrKztcbiAgICAgICAgICAgICAgICBub2RlID0gcGFyZW50LmNoaWxkcmVuW2ldO1xuICAgICAgICAgICAgICAgIGdvaW5nVXAgPSBmYWxzZTtcblxuICAgICAgICAgICAgfSBlbHNlIG5vZGUgPSBudWxsOyAvLyBub3RoaW5nIGZvdW5kXG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgdG9CQm94OiBmdW5jdGlvbiAoaXRlbSkgeyByZXR1cm4gaXRlbTsgfSxcblxuICAgIGNvbXBhcmVNaW5YOiBjb21wYXJlTm9kZU1pblgsXG4gICAgY29tcGFyZU1pblk6IGNvbXBhcmVOb2RlTWluWSxcblxuICAgIHRvSlNPTjogZnVuY3Rpb24gKCkgeyByZXR1cm4gdGhpcy5kYXRhOyB9LFxuXG4gICAgZnJvbUpTT046IGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICAgIHRoaXMuZGF0YSA9IGRhdGE7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICBfYWxsOiBmdW5jdGlvbiAobm9kZSwgcmVzdWx0KSB7XG4gICAgICAgIHZhciBub2Rlc1RvU2VhcmNoID0gW107XG4gICAgICAgIHdoaWxlIChub2RlKSB7XG4gICAgICAgICAgICBpZiAobm9kZS5sZWFmKSByZXN1bHQucHVzaC5hcHBseShyZXN1bHQsIG5vZGUuY2hpbGRyZW4pO1xuICAgICAgICAgICAgZWxzZSBub2Rlc1RvU2VhcmNoLnB1c2guYXBwbHkobm9kZXNUb1NlYXJjaCwgbm9kZS5jaGlsZHJlbik7XG5cbiAgICAgICAgICAgIG5vZGUgPSBub2Rlc1RvU2VhcmNoLnBvcCgpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfSxcblxuICAgIF9idWlsZDogZnVuY3Rpb24gKGl0ZW1zLCBsZWZ0LCByaWdodCwgaGVpZ2h0KSB7XG5cbiAgICAgICAgdmFyIE4gPSByaWdodCAtIGxlZnQgKyAxLFxuICAgICAgICAgICAgTSA9IHRoaXMuX21heEVudHJpZXMsXG4gICAgICAgICAgICBub2RlO1xuXG4gICAgICAgIGlmIChOIDw9IE0pIHtcbiAgICAgICAgICAgIC8vIHJlYWNoZWQgbGVhZiBsZXZlbDsgcmV0dXJuIGxlYWZcbiAgICAgICAgICAgIG5vZGUgPSBjcmVhdGVOb2RlKGl0ZW1zLnNsaWNlKGxlZnQsIHJpZ2h0ICsgMSkpO1xuICAgICAgICAgICAgY2FsY0JCb3gobm9kZSwgdGhpcy50b0JCb3gpO1xuICAgICAgICAgICAgcmV0dXJuIG5vZGU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIWhlaWdodCkge1xuICAgICAgICAgICAgLy8gdGFyZ2V0IGhlaWdodCBvZiB0aGUgYnVsay1sb2FkZWQgdHJlZVxuICAgICAgICAgICAgaGVpZ2h0ID0gTWF0aC5jZWlsKE1hdGgubG9nKE4pIC8gTWF0aC5sb2coTSkpO1xuXG4gICAgICAgICAgICAvLyB0YXJnZXQgbnVtYmVyIG9mIHJvb3QgZW50cmllcyB0byBtYXhpbWl6ZSBzdG9yYWdlIHV0aWxpemF0aW9uXG4gICAgICAgICAgICBNID0gTWF0aC5jZWlsKE4gLyBNYXRoLnBvdyhNLCBoZWlnaHQgLSAxKSk7XG4gICAgICAgIH1cblxuICAgICAgICBub2RlID0gY3JlYXRlTm9kZShbXSk7XG4gICAgICAgIG5vZGUubGVhZiA9IGZhbHNlO1xuICAgICAgICBub2RlLmhlaWdodCA9IGhlaWdodDtcblxuICAgICAgICAvLyBzcGxpdCB0aGUgaXRlbXMgaW50byBNIG1vc3RseSBzcXVhcmUgdGlsZXNcblxuICAgICAgICB2YXIgTjIgPSBNYXRoLmNlaWwoTiAvIE0pLFxuICAgICAgICAgICAgTjEgPSBOMiAqIE1hdGguY2VpbChNYXRoLnNxcnQoTSkpLFxuICAgICAgICAgICAgaSwgaiwgcmlnaHQyLCByaWdodDM7XG5cbiAgICAgICAgbXVsdGlTZWxlY3QoaXRlbXMsIGxlZnQsIHJpZ2h0LCBOMSwgdGhpcy5jb21wYXJlTWluWCk7XG5cbiAgICAgICAgZm9yIChpID0gbGVmdDsgaSA8PSByaWdodDsgaSArPSBOMSkge1xuXG4gICAgICAgICAgICByaWdodDIgPSBNYXRoLm1pbihpICsgTjEgLSAxLCByaWdodCk7XG5cbiAgICAgICAgICAgIG11bHRpU2VsZWN0KGl0ZW1zLCBpLCByaWdodDIsIE4yLCB0aGlzLmNvbXBhcmVNaW5ZKTtcblxuICAgICAgICAgICAgZm9yIChqID0gaTsgaiA8PSByaWdodDI7IGogKz0gTjIpIHtcblxuICAgICAgICAgICAgICAgIHJpZ2h0MyA9IE1hdGgubWluKGogKyBOMiAtIDEsIHJpZ2h0Mik7XG5cbiAgICAgICAgICAgICAgICAvLyBwYWNrIGVhY2ggZW50cnkgcmVjdXJzaXZlbHlcbiAgICAgICAgICAgICAgICBub2RlLmNoaWxkcmVuLnB1c2godGhpcy5fYnVpbGQoaXRlbXMsIGosIHJpZ2h0MywgaGVpZ2h0IC0gMSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgY2FsY0JCb3gobm9kZSwgdGhpcy50b0JCb3gpO1xuXG4gICAgICAgIHJldHVybiBub2RlO1xuICAgIH0sXG5cbiAgICBfY2hvb3NlU3VidHJlZTogZnVuY3Rpb24gKGJib3gsIG5vZGUsIGxldmVsLCBwYXRoKSB7XG5cbiAgICAgICAgdmFyIGksIGxlbiwgY2hpbGQsIHRhcmdldE5vZGUsIGFyZWEsIGVubGFyZ2VtZW50LCBtaW5BcmVhLCBtaW5FbmxhcmdlbWVudDtcblxuICAgICAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgICAgICAgcGF0aC5wdXNoKG5vZGUpO1xuXG4gICAgICAgICAgICBpZiAobm9kZS5sZWFmIHx8IHBhdGgubGVuZ3RoIC0gMSA9PT0gbGV2ZWwpIGJyZWFrO1xuXG4gICAgICAgICAgICBtaW5BcmVhID0gbWluRW5sYXJnZW1lbnQgPSBJbmZpbml0eTtcblxuICAgICAgICAgICAgZm9yIChpID0gMCwgbGVuID0gbm9kZS5jaGlsZHJlbi5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgICAgICAgIGNoaWxkID0gbm9kZS5jaGlsZHJlbltpXTtcbiAgICAgICAgICAgICAgICBhcmVhID0gYmJveEFyZWEoY2hpbGQpO1xuICAgICAgICAgICAgICAgIGVubGFyZ2VtZW50ID0gZW5sYXJnZWRBcmVhKGJib3gsIGNoaWxkKSAtIGFyZWE7XG5cbiAgICAgICAgICAgICAgICAvLyBjaG9vc2UgZW50cnkgd2l0aCB0aGUgbGVhc3QgYXJlYSBlbmxhcmdlbWVudFxuICAgICAgICAgICAgICAgIGlmIChlbmxhcmdlbWVudCA8IG1pbkVubGFyZ2VtZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIG1pbkVubGFyZ2VtZW50ID0gZW5sYXJnZW1lbnQ7XG4gICAgICAgICAgICAgICAgICAgIG1pbkFyZWEgPSBhcmVhIDwgbWluQXJlYSA/IGFyZWEgOiBtaW5BcmVhO1xuICAgICAgICAgICAgICAgICAgICB0YXJnZXROb2RlID0gY2hpbGQ7XG5cbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGVubGFyZ2VtZW50ID09PSBtaW5FbmxhcmdlbWVudCkge1xuICAgICAgICAgICAgICAgICAgICAvLyBvdGhlcndpc2UgY2hvb3NlIG9uZSB3aXRoIHRoZSBzbWFsbGVzdCBhcmVhXG4gICAgICAgICAgICAgICAgICAgIGlmIChhcmVhIDwgbWluQXJlYSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbWluQXJlYSA9IGFyZWE7XG4gICAgICAgICAgICAgICAgICAgICAgICB0YXJnZXROb2RlID0gY2hpbGQ7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIG5vZGUgPSB0YXJnZXROb2RlIHx8IG5vZGUuY2hpbGRyZW5bMF07XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbm9kZTtcbiAgICB9LFxuXG4gICAgX2luc2VydDogZnVuY3Rpb24gKGl0ZW0sIGxldmVsLCBpc05vZGUpIHtcblxuICAgICAgICB2YXIgdG9CQm94ID0gdGhpcy50b0JCb3gsXG4gICAgICAgICAgICBiYm94ID0gaXNOb2RlID8gaXRlbSA6IHRvQkJveChpdGVtKSxcbiAgICAgICAgICAgIGluc2VydFBhdGggPSBbXTtcblxuICAgICAgICAvLyBmaW5kIHRoZSBiZXN0IG5vZGUgZm9yIGFjY29tbW9kYXRpbmcgdGhlIGl0ZW0sIHNhdmluZyBhbGwgbm9kZXMgYWxvbmcgdGhlIHBhdGggdG9vXG4gICAgICAgIHZhciBub2RlID0gdGhpcy5fY2hvb3NlU3VidHJlZShiYm94LCB0aGlzLmRhdGEsIGxldmVsLCBpbnNlcnRQYXRoKTtcblxuICAgICAgICAvLyBwdXQgdGhlIGl0ZW0gaW50byB0aGUgbm9kZVxuICAgICAgICBub2RlLmNoaWxkcmVuLnB1c2goaXRlbSk7XG4gICAgICAgIGV4dGVuZChub2RlLCBiYm94KTtcblxuICAgICAgICAvLyBzcGxpdCBvbiBub2RlIG92ZXJmbG93OyBwcm9wYWdhdGUgdXB3YXJkcyBpZiBuZWNlc3NhcnlcbiAgICAgICAgd2hpbGUgKGxldmVsID49IDApIHtcbiAgICAgICAgICAgIGlmIChpbnNlcnRQYXRoW2xldmVsXS5jaGlsZHJlbi5sZW5ndGggPiB0aGlzLl9tYXhFbnRyaWVzKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fc3BsaXQoaW5zZXJ0UGF0aCwgbGV2ZWwpO1xuICAgICAgICAgICAgICAgIGxldmVsLS07XG4gICAgICAgICAgICB9IGVsc2UgYnJlYWs7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBhZGp1c3QgYmJveGVzIGFsb25nIHRoZSBpbnNlcnRpb24gcGF0aFxuICAgICAgICB0aGlzLl9hZGp1c3RQYXJlbnRCQm94ZXMoYmJveCwgaW5zZXJ0UGF0aCwgbGV2ZWwpO1xuICAgIH0sXG5cbiAgICAvLyBzcGxpdCBvdmVyZmxvd2VkIG5vZGUgaW50byB0d29cbiAgICBfc3BsaXQ6IGZ1bmN0aW9uIChpbnNlcnRQYXRoLCBsZXZlbCkge1xuXG4gICAgICAgIHZhciBub2RlID0gaW5zZXJ0UGF0aFtsZXZlbF0sXG4gICAgICAgICAgICBNID0gbm9kZS5jaGlsZHJlbi5sZW5ndGgsXG4gICAgICAgICAgICBtID0gdGhpcy5fbWluRW50cmllcztcblxuICAgICAgICB0aGlzLl9jaG9vc2VTcGxpdEF4aXMobm9kZSwgbSwgTSk7XG5cbiAgICAgICAgdmFyIHNwbGl0SW5kZXggPSB0aGlzLl9jaG9vc2VTcGxpdEluZGV4KG5vZGUsIG0sIE0pO1xuXG4gICAgICAgIHZhciBuZXdOb2RlID0gY3JlYXRlTm9kZShub2RlLmNoaWxkcmVuLnNwbGljZShzcGxpdEluZGV4LCBub2RlLmNoaWxkcmVuLmxlbmd0aCAtIHNwbGl0SW5kZXgpKTtcbiAgICAgICAgbmV3Tm9kZS5oZWlnaHQgPSBub2RlLmhlaWdodDtcbiAgICAgICAgbmV3Tm9kZS5sZWFmID0gbm9kZS5sZWFmO1xuXG4gICAgICAgIGNhbGNCQm94KG5vZGUsIHRoaXMudG9CQm94KTtcbiAgICAgICAgY2FsY0JCb3gobmV3Tm9kZSwgdGhpcy50b0JCb3gpO1xuXG4gICAgICAgIGlmIChsZXZlbCkgaW5zZXJ0UGF0aFtsZXZlbCAtIDFdLmNoaWxkcmVuLnB1c2gobmV3Tm9kZSk7XG4gICAgICAgIGVsc2UgdGhpcy5fc3BsaXRSb290KG5vZGUsIG5ld05vZGUpO1xuICAgIH0sXG5cbiAgICBfc3BsaXRSb290OiBmdW5jdGlvbiAobm9kZSwgbmV3Tm9kZSkge1xuICAgICAgICAvLyBzcGxpdCByb290IG5vZGVcbiAgICAgICAgdGhpcy5kYXRhID0gY3JlYXRlTm9kZShbbm9kZSwgbmV3Tm9kZV0pO1xuICAgICAgICB0aGlzLmRhdGEuaGVpZ2h0ID0gbm9kZS5oZWlnaHQgKyAxO1xuICAgICAgICB0aGlzLmRhdGEubGVhZiA9IGZhbHNlO1xuICAgICAgICBjYWxjQkJveCh0aGlzLmRhdGEsIHRoaXMudG9CQm94KTtcbiAgICB9LFxuXG4gICAgX2Nob29zZVNwbGl0SW5kZXg6IGZ1bmN0aW9uIChub2RlLCBtLCBNKSB7XG5cbiAgICAgICAgdmFyIGksIGJib3gxLCBiYm94Miwgb3ZlcmxhcCwgYXJlYSwgbWluT3ZlcmxhcCwgbWluQXJlYSwgaW5kZXg7XG5cbiAgICAgICAgbWluT3ZlcmxhcCA9IG1pbkFyZWEgPSBJbmZpbml0eTtcblxuICAgICAgICBmb3IgKGkgPSBtOyBpIDw9IE0gLSBtOyBpKyspIHtcbiAgICAgICAgICAgIGJib3gxID0gZGlzdEJCb3gobm9kZSwgMCwgaSwgdGhpcy50b0JCb3gpO1xuICAgICAgICAgICAgYmJveDIgPSBkaXN0QkJveChub2RlLCBpLCBNLCB0aGlzLnRvQkJveCk7XG5cbiAgICAgICAgICAgIG92ZXJsYXAgPSBpbnRlcnNlY3Rpb25BcmVhKGJib3gxLCBiYm94Mik7XG4gICAgICAgICAgICBhcmVhID0gYmJveEFyZWEoYmJveDEpICsgYmJveEFyZWEoYmJveDIpO1xuXG4gICAgICAgICAgICAvLyBjaG9vc2UgZGlzdHJpYnV0aW9uIHdpdGggbWluaW11bSBvdmVybGFwXG4gICAgICAgICAgICBpZiAob3ZlcmxhcCA8IG1pbk92ZXJsYXApIHtcbiAgICAgICAgICAgICAgICBtaW5PdmVybGFwID0gb3ZlcmxhcDtcbiAgICAgICAgICAgICAgICBpbmRleCA9IGk7XG5cbiAgICAgICAgICAgICAgICBtaW5BcmVhID0gYXJlYSA8IG1pbkFyZWEgPyBhcmVhIDogbWluQXJlYTtcblxuICAgICAgICAgICAgfSBlbHNlIGlmIChvdmVybGFwID09PSBtaW5PdmVybGFwKSB7XG4gICAgICAgICAgICAgICAgLy8gb3RoZXJ3aXNlIGNob29zZSBkaXN0cmlidXRpb24gd2l0aCBtaW5pbXVtIGFyZWFcbiAgICAgICAgICAgICAgICBpZiAoYXJlYSA8IG1pbkFyZWEpIHtcbiAgICAgICAgICAgICAgICAgICAgbWluQXJlYSA9IGFyZWE7XG4gICAgICAgICAgICAgICAgICAgIGluZGV4ID0gaTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gaW5kZXg7XG4gICAgfSxcblxuICAgIC8vIHNvcnRzIG5vZGUgY2hpbGRyZW4gYnkgdGhlIGJlc3QgYXhpcyBmb3Igc3BsaXRcbiAgICBfY2hvb3NlU3BsaXRBeGlzOiBmdW5jdGlvbiAobm9kZSwgbSwgTSkge1xuXG4gICAgICAgIHZhciBjb21wYXJlTWluWCA9IG5vZGUubGVhZiA/IHRoaXMuY29tcGFyZU1pblggOiBjb21wYXJlTm9kZU1pblgsXG4gICAgICAgICAgICBjb21wYXJlTWluWSA9IG5vZGUubGVhZiA/IHRoaXMuY29tcGFyZU1pblkgOiBjb21wYXJlTm9kZU1pblksXG4gICAgICAgICAgICB4TWFyZ2luID0gdGhpcy5fYWxsRGlzdE1hcmdpbihub2RlLCBtLCBNLCBjb21wYXJlTWluWCksXG4gICAgICAgICAgICB5TWFyZ2luID0gdGhpcy5fYWxsRGlzdE1hcmdpbihub2RlLCBtLCBNLCBjb21wYXJlTWluWSk7XG5cbiAgICAgICAgLy8gaWYgdG90YWwgZGlzdHJpYnV0aW9ucyBtYXJnaW4gdmFsdWUgaXMgbWluaW1hbCBmb3IgeCwgc29ydCBieSBtaW5YLFxuICAgICAgICAvLyBvdGhlcndpc2UgaXQncyBhbHJlYWR5IHNvcnRlZCBieSBtaW5ZXG4gICAgICAgIGlmICh4TWFyZ2luIDwgeU1hcmdpbikgbm9kZS5jaGlsZHJlbi5zb3J0KGNvbXBhcmVNaW5YKTtcbiAgICB9LFxuXG4gICAgLy8gdG90YWwgbWFyZ2luIG9mIGFsbCBwb3NzaWJsZSBzcGxpdCBkaXN0cmlidXRpb25zIHdoZXJlIGVhY2ggbm9kZSBpcyBhdCBsZWFzdCBtIGZ1bGxcbiAgICBfYWxsRGlzdE1hcmdpbjogZnVuY3Rpb24gKG5vZGUsIG0sIE0sIGNvbXBhcmUpIHtcblxuICAgICAgICBub2RlLmNoaWxkcmVuLnNvcnQoY29tcGFyZSk7XG5cbiAgICAgICAgdmFyIHRvQkJveCA9IHRoaXMudG9CQm94LFxuICAgICAgICAgICAgbGVmdEJCb3ggPSBkaXN0QkJveChub2RlLCAwLCBtLCB0b0JCb3gpLFxuICAgICAgICAgICAgcmlnaHRCQm94ID0gZGlzdEJCb3gobm9kZSwgTSAtIG0sIE0sIHRvQkJveCksXG4gICAgICAgICAgICBtYXJnaW4gPSBiYm94TWFyZ2luKGxlZnRCQm94KSArIGJib3hNYXJnaW4ocmlnaHRCQm94KSxcbiAgICAgICAgICAgIGksIGNoaWxkO1xuXG4gICAgICAgIGZvciAoaSA9IG07IGkgPCBNIC0gbTsgaSsrKSB7XG4gICAgICAgICAgICBjaGlsZCA9IG5vZGUuY2hpbGRyZW5baV07XG4gICAgICAgICAgICBleHRlbmQobGVmdEJCb3gsIG5vZGUubGVhZiA/IHRvQkJveChjaGlsZCkgOiBjaGlsZCk7XG4gICAgICAgICAgICBtYXJnaW4gKz0gYmJveE1hcmdpbihsZWZ0QkJveCk7XG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKGkgPSBNIC0gbSAtIDE7IGkgPj0gbTsgaS0tKSB7XG4gICAgICAgICAgICBjaGlsZCA9IG5vZGUuY2hpbGRyZW5baV07XG4gICAgICAgICAgICBleHRlbmQocmlnaHRCQm94LCBub2RlLmxlYWYgPyB0b0JCb3goY2hpbGQpIDogY2hpbGQpO1xuICAgICAgICAgICAgbWFyZ2luICs9IGJib3hNYXJnaW4ocmlnaHRCQm94KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBtYXJnaW47XG4gICAgfSxcblxuICAgIF9hZGp1c3RQYXJlbnRCQm94ZXM6IGZ1bmN0aW9uIChiYm94LCBwYXRoLCBsZXZlbCkge1xuICAgICAgICAvLyBhZGp1c3QgYmJveGVzIGFsb25nIHRoZSBnaXZlbiB0cmVlIHBhdGhcbiAgICAgICAgZm9yICh2YXIgaSA9IGxldmVsOyBpID49IDA7IGktLSkge1xuICAgICAgICAgICAgZXh0ZW5kKHBhdGhbaV0sIGJib3gpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIF9jb25kZW5zZTogZnVuY3Rpb24gKHBhdGgpIHtcbiAgICAgICAgLy8gZ28gdGhyb3VnaCB0aGUgcGF0aCwgcmVtb3ZpbmcgZW1wdHkgbm9kZXMgYW5kIHVwZGF0aW5nIGJib3hlc1xuICAgICAgICBmb3IgKHZhciBpID0gcGF0aC5sZW5ndGggLSAxLCBzaWJsaW5nczsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgICAgIGlmIChwYXRoW2ldLmNoaWxkcmVuLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgIGlmIChpID4gMCkge1xuICAgICAgICAgICAgICAgICAgICBzaWJsaW5ncyA9IHBhdGhbaSAtIDFdLmNoaWxkcmVuO1xuICAgICAgICAgICAgICAgICAgICBzaWJsaW5ncy5zcGxpY2Uoc2libGluZ3MuaW5kZXhPZihwYXRoW2ldKSwgMSk7XG5cbiAgICAgICAgICAgICAgICB9IGVsc2UgdGhpcy5jbGVhcigpO1xuXG4gICAgICAgICAgICB9IGVsc2UgY2FsY0JCb3gocGF0aFtpXSwgdGhpcy50b0JCb3gpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIF9pbml0Rm9ybWF0OiBmdW5jdGlvbiAoZm9ybWF0KSB7XG4gICAgICAgIC8vIGRhdGEgZm9ybWF0IChtaW5YLCBtaW5ZLCBtYXhYLCBtYXhZIGFjY2Vzc29ycylcblxuICAgICAgICAvLyB1c2VzIGV2YWwtdHlwZSBmdW5jdGlvbiBjb21waWxhdGlvbiBpbnN0ZWFkIG9mIGp1c3QgYWNjZXB0aW5nIGEgdG9CQm94IGZ1bmN0aW9uXG4gICAgICAgIC8vIGJlY2F1c2UgdGhlIGFsZ29yaXRobXMgYXJlIHZlcnkgc2Vuc2l0aXZlIHRvIHNvcnRpbmcgZnVuY3Rpb25zIHBlcmZvcm1hbmNlLFxuICAgICAgICAvLyBzbyB0aGV5IHNob3VsZCBiZSBkZWFkIHNpbXBsZSBhbmQgd2l0aG91dCBpbm5lciBjYWxsc1xuXG4gICAgICAgIHZhciBjb21wYXJlQXJyID0gWydyZXR1cm4gYScsICcgLSBiJywgJzsnXTtcblxuICAgICAgICB0aGlzLmNvbXBhcmVNaW5YID0gbmV3IEZ1bmN0aW9uKCdhJywgJ2InLCBjb21wYXJlQXJyLmpvaW4oZm9ybWF0WzBdKSk7XG4gICAgICAgIHRoaXMuY29tcGFyZU1pblkgPSBuZXcgRnVuY3Rpb24oJ2EnLCAnYicsIGNvbXBhcmVBcnIuam9pbihmb3JtYXRbMV0pKTtcblxuICAgICAgICB0aGlzLnRvQkJveCA9IG5ldyBGdW5jdGlvbignYScsXG4gICAgICAgICAgICAncmV0dXJuIHttaW5YOiBhJyArIGZvcm1hdFswXSArXG4gICAgICAgICAgICAnLCBtaW5ZOiBhJyArIGZvcm1hdFsxXSArXG4gICAgICAgICAgICAnLCBtYXhYOiBhJyArIGZvcm1hdFsyXSArXG4gICAgICAgICAgICAnLCBtYXhZOiBhJyArIGZvcm1hdFszXSArICd9OycpO1xuICAgIH1cbn07XG5cbmZ1bmN0aW9uIGZpbmRJdGVtKGl0ZW0sIGl0ZW1zLCBlcXVhbHNGbikge1xuICAgIGlmICghZXF1YWxzRm4pIHJldHVybiBpdGVtcy5pbmRleE9mKGl0ZW0pO1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBpdGVtcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAoZXF1YWxzRm4oaXRlbSwgaXRlbXNbaV0pKSByZXR1cm4gaTtcbiAgICB9XG4gICAgcmV0dXJuIC0xO1xufVxuXG4vLyBjYWxjdWxhdGUgbm9kZSdzIGJib3ggZnJvbSBiYm94ZXMgb2YgaXRzIGNoaWxkcmVuXG5mdW5jdGlvbiBjYWxjQkJveChub2RlLCB0b0JCb3gpIHtcbiAgICBkaXN0QkJveChub2RlLCAwLCBub2RlLmNoaWxkcmVuLmxlbmd0aCwgdG9CQm94LCBub2RlKTtcbn1cblxuLy8gbWluIGJvdW5kaW5nIHJlY3RhbmdsZSBvZiBub2RlIGNoaWxkcmVuIGZyb20gayB0byBwLTFcbmZ1bmN0aW9uIGRpc3RCQm94KG5vZGUsIGssIHAsIHRvQkJveCwgZGVzdE5vZGUpIHtcbiAgICBpZiAoIWRlc3ROb2RlKSBkZXN0Tm9kZSA9IGNyZWF0ZU5vZGUobnVsbCk7XG4gICAgZGVzdE5vZGUubWluWCA9IEluZmluaXR5O1xuICAgIGRlc3ROb2RlLm1pblkgPSBJbmZpbml0eTtcbiAgICBkZXN0Tm9kZS5tYXhYID0gLUluZmluaXR5O1xuICAgIGRlc3ROb2RlLm1heFkgPSAtSW5maW5pdHk7XG5cbiAgICBmb3IgKHZhciBpID0gaywgY2hpbGQ7IGkgPCBwOyBpKyspIHtcbiAgICAgICAgY2hpbGQgPSBub2RlLmNoaWxkcmVuW2ldO1xuICAgICAgICBleHRlbmQoZGVzdE5vZGUsIG5vZGUubGVhZiA/IHRvQkJveChjaGlsZCkgOiBjaGlsZCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGRlc3ROb2RlO1xufVxuXG5mdW5jdGlvbiBleHRlbmQoYSwgYikge1xuICAgIGEubWluWCA9IE1hdGgubWluKGEubWluWCwgYi5taW5YKTtcbiAgICBhLm1pblkgPSBNYXRoLm1pbihhLm1pblksIGIubWluWSk7XG4gICAgYS5tYXhYID0gTWF0aC5tYXgoYS5tYXhYLCBiLm1heFgpO1xuICAgIGEubWF4WSA9IE1hdGgubWF4KGEubWF4WSwgYi5tYXhZKTtcbiAgICByZXR1cm4gYTtcbn1cblxuZnVuY3Rpb24gY29tcGFyZU5vZGVNaW5YKGEsIGIpIHsgcmV0dXJuIGEubWluWCAtIGIubWluWDsgfVxuZnVuY3Rpb24gY29tcGFyZU5vZGVNaW5ZKGEsIGIpIHsgcmV0dXJuIGEubWluWSAtIGIubWluWTsgfVxuXG5mdW5jdGlvbiBiYm94QXJlYShhKSAgIHsgcmV0dXJuIChhLm1heFggLSBhLm1pblgpICogKGEubWF4WSAtIGEubWluWSk7IH1cbmZ1bmN0aW9uIGJib3hNYXJnaW4oYSkgeyByZXR1cm4gKGEubWF4WCAtIGEubWluWCkgKyAoYS5tYXhZIC0gYS5taW5ZKTsgfVxuXG5mdW5jdGlvbiBlbmxhcmdlZEFyZWEoYSwgYikge1xuICAgIHJldHVybiAoTWF0aC5tYXgoYi5tYXhYLCBhLm1heFgpIC0gTWF0aC5taW4oYi5taW5YLCBhLm1pblgpKSAqXG4gICAgICAgICAgIChNYXRoLm1heChiLm1heFksIGEubWF4WSkgLSBNYXRoLm1pbihiLm1pblksIGEubWluWSkpO1xufVxuXG5mdW5jdGlvbiBpbnRlcnNlY3Rpb25BcmVhKGEsIGIpIHtcbiAgICB2YXIgbWluWCA9IE1hdGgubWF4KGEubWluWCwgYi5taW5YKSxcbiAgICAgICAgbWluWSA9IE1hdGgubWF4KGEubWluWSwgYi5taW5ZKSxcbiAgICAgICAgbWF4WCA9IE1hdGgubWluKGEubWF4WCwgYi5tYXhYKSxcbiAgICAgICAgbWF4WSA9IE1hdGgubWluKGEubWF4WSwgYi5tYXhZKTtcblxuICAgIHJldHVybiBNYXRoLm1heCgwLCBtYXhYIC0gbWluWCkgKlxuICAgICAgICAgICBNYXRoLm1heCgwLCBtYXhZIC0gbWluWSk7XG59XG5cbmZ1bmN0aW9uIGNvbnRhaW5zKGEsIGIpIHtcbiAgICByZXR1cm4gYS5taW5YIDw9IGIubWluWCAmJlxuICAgICAgICAgICBhLm1pblkgPD0gYi5taW5ZICYmXG4gICAgICAgICAgIGIubWF4WCA8PSBhLm1heFggJiZcbiAgICAgICAgICAgYi5tYXhZIDw9IGEubWF4WTtcbn1cblxuZnVuY3Rpb24gaW50ZXJzZWN0cyhhLCBiKSB7XG4gICAgcmV0dXJuIGIubWluWCA8PSBhLm1heFggJiZcbiAgICAgICAgICAgYi5taW5ZIDw9IGEubWF4WSAmJlxuICAgICAgICAgICBiLm1heFggPj0gYS5taW5YICYmXG4gICAgICAgICAgIGIubWF4WSA+PSBhLm1pblk7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZU5vZGUoY2hpbGRyZW4pIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBjaGlsZHJlbjogY2hpbGRyZW4sXG4gICAgICAgIGhlaWdodDogMSxcbiAgICAgICAgbGVhZjogdHJ1ZSxcbiAgICAgICAgbWluWDogSW5maW5pdHksXG4gICAgICAgIG1pblk6IEluZmluaXR5LFxuICAgICAgICBtYXhYOiAtSW5maW5pdHksXG4gICAgICAgIG1heFk6IC1JbmZpbml0eVxuICAgIH07XG59XG5cbi8vIHNvcnQgYW4gYXJyYXkgc28gdGhhdCBpdGVtcyBjb21lIGluIGdyb3VwcyBvZiBuIHVuc29ydGVkIGl0ZW1zLCB3aXRoIGdyb3VwcyBzb3J0ZWQgYmV0d2VlbiBlYWNoIG90aGVyO1xuLy8gY29tYmluZXMgc2VsZWN0aW9uIGFsZ29yaXRobSB3aXRoIGJpbmFyeSBkaXZpZGUgJiBjb25xdWVyIGFwcHJvYWNoXG5cbmZ1bmN0aW9uIG11bHRpU2VsZWN0KGFyciwgbGVmdCwgcmlnaHQsIG4sIGNvbXBhcmUpIHtcbiAgICB2YXIgc3RhY2sgPSBbbGVmdCwgcmlnaHRdLFxuICAgICAgICBtaWQ7XG5cbiAgICB3aGlsZSAoc3RhY2subGVuZ3RoKSB7XG4gICAgICAgIHJpZ2h0ID0gc3RhY2sucG9wKCk7XG4gICAgICAgIGxlZnQgPSBzdGFjay5wb3AoKTtcblxuICAgICAgICBpZiAocmlnaHQgLSBsZWZ0IDw9IG4pIGNvbnRpbnVlO1xuXG4gICAgICAgIG1pZCA9IGxlZnQgKyBNYXRoLmNlaWwoKHJpZ2h0IC0gbGVmdCkgLyBuIC8gMikgKiBuO1xuICAgICAgICBxdWlja3NlbGVjdChhcnIsIG1pZCwgbGVmdCwgcmlnaHQsIGNvbXBhcmUpO1xuXG4gICAgICAgIHN0YWNrLnB1c2gobGVmdCwgbWlkLCBtaWQsIHJpZ2h0KTtcbiAgICB9XG59XG4iLCIvKipcbiAqIEdlb0pTT04gQkJveFxuICpcbiAqIEBwcml2YXRlXG4gKiBAdHlwZWRlZiB7W251bWJlciwgbnVtYmVyLCBudW1iZXIsIG51bWJlcl19IEJCb3hcbiAqL1xuXG4vKipcbiAqIEdlb0pTT04gSWRcbiAqXG4gKiBAcHJpdmF0ZVxuICogQHR5cGVkZWYgeyhudW1iZXJ8c3RyaW5nKX0gSWRcbiAqL1xuXG4vKipcbiAqIEdlb0pTT04gRmVhdHVyZUNvbGxlY3Rpb25cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHR5cGVkZWYge09iamVjdH0gRmVhdHVyZUNvbGxlY3Rpb25cbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSB0eXBlXG4gKiBAcHJvcGVydHkgez9JZH0gaWRcbiAqIEBwcm9wZXJ0eSB7P0JCb3h9IGJib3hcbiAqIEBwcm9wZXJ0eSB7RmVhdHVyZVtdfSBmZWF0dXJlc1xuICovXG5cbi8qKlxuICogR2VvSlNPTiBGZWF0dXJlXG4gKlxuICogQHByaXZhdGVcbiAqIEB0eXBlZGVmIHtPYmplY3R9IEZlYXR1cmVcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSB0eXBlXG4gKiBAcHJvcGVydHkgez9JZH0gaWRcbiAqIEBwcm9wZXJ0eSB7P0JCb3h9IGJib3hcbiAqIEBwcm9wZXJ0eSB7Kn0gcHJvcGVydGllc1xuICogQHByb3BlcnR5IHtHZW9tZXRyeX0gZ2VvbWV0cnlcbiAqL1xuXG4vKipcbiAqIEdlb0pTT04gR2VvbWV0cnlcbiAqXG4gKiBAcHJpdmF0ZVxuICogQHR5cGVkZWYge09iamVjdH0gR2VvbWV0cnlcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSB0eXBlXG4gKiBAcHJvcGVydHkge2FueVtdfSBjb29yZGluYXRlc1xuICovXG5cbi8qKlxuICogQ2FsbGJhY2sgZm9yIGNvb3JkRWFjaFxuICpcbiAqIEBjYWxsYmFjayBjb29yZEVhY2hDYWxsYmFja1xuICogQHBhcmFtIHtBcnJheTxudW1iZXI+fSBjdXJyZW50Q29vcmQgVGhlIGN1cnJlbnQgY29vcmRpbmF0ZSBiZWluZyBwcm9jZXNzZWQuXG4gKiBAcGFyYW0ge251bWJlcn0gY29vcmRJbmRleCBUaGUgY3VycmVudCBpbmRleCBvZiB0aGUgY29vcmRpbmF0ZSBiZWluZyBwcm9jZXNzZWQuXG4gKiBTdGFydHMgYXQgaW5kZXggMC5cbiAqIEBwYXJhbSB7bnVtYmVyfSBmZWF0dXJlSW5kZXggVGhlIGN1cnJlbnQgaW5kZXggb2YgdGhlIGZlYXR1cmUgYmVpbmcgcHJvY2Vzc2VkLlxuICogQHBhcmFtIHtudW1iZXJ9IGZlYXR1cmVTdWJJbmRleCBUaGUgY3VycmVudCBzdWJJbmRleCBvZiB0aGUgZmVhdHVyZSBiZWluZyBwcm9jZXNzZWQuXG4gKi9cblxuLyoqXG4gKiBJdGVyYXRlIG92ZXIgY29vcmRpbmF0ZXMgaW4gYW55IEdlb0pTT04gb2JqZWN0LCBzaW1pbGFyIHRvIEFycmF5LmZvckVhY2goKVxuICpcbiAqIEBuYW1lIGNvb3JkRWFjaFxuICogQHBhcmFtIHsoRmVhdHVyZUNvbGxlY3Rpb258RmVhdHVyZXxHZW9tZXRyeSl9IGdlb2pzb24gYW55IEdlb0pTT04gb2JqZWN0XG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayBhIG1ldGhvZCB0aGF0IHRha2VzIChjdXJyZW50Q29vcmQsIGNvb3JkSW5kZXgsIGZlYXR1cmVJbmRleCwgZmVhdHVyZVN1YkluZGV4KVxuICogQHBhcmFtIHtib29sZWFufSBbZXhjbHVkZVdyYXBDb29yZD1mYWxzZV0gd2hldGhlciBvciBub3QgdG8gaW5jbHVkZSB0aGUgZmluYWwgY29vcmRpbmF0ZSBvZiBMaW5lYXJSaW5ncyB0aGF0IHdyYXBzIHRoZSByaW5nIGluIGl0cyBpdGVyYXRpb24uXG4gKiBAZXhhbXBsZVxuICogdmFyIGZlYXR1cmVzID0gdHVyZi5mZWF0dXJlQ29sbGVjdGlvbihbXG4gKiAgIHR1cmYucG9pbnQoWzI2LCAzN10sIHtcImZvb1wiOiBcImJhclwifSksXG4gKiAgIHR1cmYucG9pbnQoWzM2LCA1M10sIHtcImhlbGxvXCI6IFwid29ybGRcIn0pXG4gKiBdKTtcbiAqXG4gKiB0dXJmLmNvb3JkRWFjaChmZWF0dXJlcywgZnVuY3Rpb24gKGN1cnJlbnRDb29yZCwgY29vcmRJbmRleCwgZmVhdHVyZUluZGV4LCBmZWF0dXJlU3ViSW5kZXgpIHtcbiAqICAgLy89Y3VycmVudENvb3JkXG4gKiAgIC8vPWNvb3JkSW5kZXhcbiAqICAgLy89ZmVhdHVyZUluZGV4XG4gKiAgIC8vPWZlYXR1cmVTdWJJbmRleFxuICogfSk7XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb29yZEVhY2goZ2VvanNvbiwgY2FsbGJhY2ssIGV4Y2x1ZGVXcmFwQ29vcmQpIHtcbiAgICAvLyBIYW5kbGVzIG51bGwgR2VvbWV0cnkgLS0gU2tpcHMgdGhpcyBHZW9KU09OXG4gICAgaWYgKGdlb2pzb24gPT09IG51bGwpIHJldHVybjtcbiAgICB2YXIgZmVhdHVyZUluZGV4LCBnZW9tZXRyeUluZGV4LCBqLCBrLCBsLCBnZW9tZXRyeSwgc3RvcEcsIGNvb3JkcyxcbiAgICAgICAgZ2VvbWV0cnlNYXliZUNvbGxlY3Rpb24sXG4gICAgICAgIHdyYXBTaHJpbmsgPSAwLFxuICAgICAgICBjb29yZEluZGV4ID0gMCxcbiAgICAgICAgaXNHZW9tZXRyeUNvbGxlY3Rpb24sXG4gICAgICAgIHR5cGUgPSBnZW9qc29uLnR5cGUsXG4gICAgICAgIGlzRmVhdHVyZUNvbGxlY3Rpb24gPSB0eXBlID09PSAnRmVhdHVyZUNvbGxlY3Rpb24nLFxuICAgICAgICBpc0ZlYXR1cmUgPSB0eXBlID09PSAnRmVhdHVyZScsXG4gICAgICAgIHN0b3AgPSBpc0ZlYXR1cmVDb2xsZWN0aW9uID8gZ2VvanNvbi5mZWF0dXJlcy5sZW5ndGggOiAxO1xuXG4gICAgLy8gVGhpcyBsb2dpYyBtYXkgbG9vayBhIGxpdHRsZSB3ZWlyZC4gVGhlIHJlYXNvbiB3aHkgaXQgaXMgdGhhdCB3YXlcbiAgICAvLyBpcyBiZWNhdXNlIGl0J3MgdHJ5aW5nIHRvIGJlIGZhc3QuIEdlb0pTT04gc3VwcG9ydHMgbXVsdGlwbGUga2luZHNcbiAgICAvLyBvZiBvYmplY3RzIGF0IGl0cyByb290OiBGZWF0dXJlQ29sbGVjdGlvbiwgRmVhdHVyZXMsIEdlb21ldHJpZXMuXG4gICAgLy8gVGhpcyBmdW5jdGlvbiBoYXMgdGhlIHJlc3BvbnNpYmlsaXR5IG9mIGhhbmRsaW5nIGFsbCBvZiB0aGVtLCBhbmQgdGhhdFxuICAgIC8vIG1lYW5zIHRoYXQgc29tZSBvZiB0aGUgYGZvcmAgbG9vcHMgeW91IHNlZSBiZWxvdyBhY3R1YWxseSBqdXN0IGRvbid0IGFwcGx5XG4gICAgLy8gdG8gY2VydGFpbiBpbnB1dHMuIEZvciBpbnN0YW5jZSwgaWYgeW91IGdpdmUgdGhpcyBqdXN0IGFcbiAgICAvLyBQb2ludCBnZW9tZXRyeSwgdGhlbiBib3RoIGxvb3BzIGFyZSBzaG9ydC1jaXJjdWl0ZWQgYW5kIGFsbCB3ZSBkb1xuICAgIC8vIGlzIGdyYWR1YWxseSByZW5hbWUgdGhlIGlucHV0IHVudGlsIGl0J3MgY2FsbGVkICdnZW9tZXRyeScuXG4gICAgLy9cbiAgICAvLyBUaGlzIGFsc28gYWltcyB0byBhbGxvY2F0ZSBhcyBmZXcgcmVzb3VyY2VzIGFzIHBvc3NpYmxlOiBqdXN0IGFcbiAgICAvLyBmZXcgbnVtYmVycyBhbmQgYm9vbGVhbnMsIHJhdGhlciB0aGFuIGFueSB0ZW1wb3JhcnkgYXJyYXlzIGFzIHdvdWxkXG4gICAgLy8gYmUgcmVxdWlyZWQgd2l0aCB0aGUgbm9ybWFsaXphdGlvbiBhcHByb2FjaC5cbiAgICBmb3IgKGZlYXR1cmVJbmRleCA9IDA7IGZlYXR1cmVJbmRleCA8IHN0b3A7IGZlYXR1cmVJbmRleCsrKSB7XG4gICAgICAgIGdlb21ldHJ5TWF5YmVDb2xsZWN0aW9uID0gKGlzRmVhdHVyZUNvbGxlY3Rpb24gPyBnZW9qc29uLmZlYXR1cmVzW2ZlYXR1cmVJbmRleF0uZ2VvbWV0cnkgOlxuICAgICAgICAgICAgKGlzRmVhdHVyZSA/IGdlb2pzb24uZ2VvbWV0cnkgOiBnZW9qc29uKSk7XG4gICAgICAgIGlzR2VvbWV0cnlDb2xsZWN0aW9uID0gKGdlb21ldHJ5TWF5YmVDb2xsZWN0aW9uKSA/IGdlb21ldHJ5TWF5YmVDb2xsZWN0aW9uLnR5cGUgPT09ICdHZW9tZXRyeUNvbGxlY3Rpb24nIDogZmFsc2U7XG4gICAgICAgIHN0b3BHID0gaXNHZW9tZXRyeUNvbGxlY3Rpb24gPyBnZW9tZXRyeU1heWJlQ29sbGVjdGlvbi5nZW9tZXRyaWVzLmxlbmd0aCA6IDE7XG5cbiAgICAgICAgZm9yIChnZW9tZXRyeUluZGV4ID0gMDsgZ2VvbWV0cnlJbmRleCA8IHN0b3BHOyBnZW9tZXRyeUluZGV4KyspIHtcbiAgICAgICAgICAgIHZhciBmZWF0dXJlU3ViSW5kZXggPSAwO1xuICAgICAgICAgICAgZ2VvbWV0cnkgPSBpc0dlb21ldHJ5Q29sbGVjdGlvbiA/XG4gICAgICAgICAgICAgICAgZ2VvbWV0cnlNYXliZUNvbGxlY3Rpb24uZ2VvbWV0cmllc1tnZW9tZXRyeUluZGV4XSA6IGdlb21ldHJ5TWF5YmVDb2xsZWN0aW9uO1xuXG4gICAgICAgICAgICAvLyBIYW5kbGVzIG51bGwgR2VvbWV0cnkgLS0gU2tpcHMgdGhpcyBnZW9tZXRyeVxuICAgICAgICAgICAgaWYgKGdlb21ldHJ5ID09PSBudWxsKSBjb250aW51ZTtcbiAgICAgICAgICAgIGNvb3JkcyA9IGdlb21ldHJ5LmNvb3JkaW5hdGVzO1xuICAgICAgICAgICAgdmFyIGdlb21UeXBlID0gZ2VvbWV0cnkudHlwZTtcblxuICAgICAgICAgICAgd3JhcFNocmluayA9IChleGNsdWRlV3JhcENvb3JkICYmIChnZW9tVHlwZSA9PT0gJ1BvbHlnb24nIHx8IGdlb21UeXBlID09PSAnTXVsdGlQb2x5Z29uJykpID8gMSA6IDA7XG5cbiAgICAgICAgICAgIHN3aXRjaCAoZ2VvbVR5cGUpIHtcbiAgICAgICAgICAgIGNhc2UgbnVsbDpcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ1BvaW50JzpcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhjb29yZHMsIGNvb3JkSW5kZXgsIGZlYXR1cmVJbmRleCwgZmVhdHVyZVN1YkluZGV4KTtcbiAgICAgICAgICAgICAgICBjb29yZEluZGV4Kys7XG4gICAgICAgICAgICAgICAgZmVhdHVyZVN1YkluZGV4Kys7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICdMaW5lU3RyaW5nJzpcbiAgICAgICAgICAgIGNhc2UgJ011bHRpUG9pbnQnOlxuICAgICAgICAgICAgICAgIGZvciAoaiA9IDA7IGogPCBjb29yZHMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soY29vcmRzW2pdLCBjb29yZEluZGV4LCBmZWF0dXJlSW5kZXgsIGZlYXR1cmVTdWJJbmRleCk7XG4gICAgICAgICAgICAgICAgICAgIGNvb3JkSW5kZXgrKztcbiAgICAgICAgICAgICAgICAgICAgaWYgKGdlb21UeXBlID09PSAnTXVsdGlQb2ludCcpIGZlYXR1cmVTdWJJbmRleCsrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoZ2VvbVR5cGUgPT09ICdMaW5lU3RyaW5nJykgZmVhdHVyZVN1YkluZGV4Kys7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICdQb2x5Z29uJzpcbiAgICAgICAgICAgIGNhc2UgJ011bHRpTGluZVN0cmluZyc6XG4gICAgICAgICAgICAgICAgZm9yIChqID0gMDsgaiA8IGNvb3Jkcy5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGsgPSAwOyBrIDwgY29vcmRzW2pdLmxlbmd0aCAtIHdyYXBTaHJpbms7IGsrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soY29vcmRzW2pdW2tdLCBjb29yZEluZGV4LCBmZWF0dXJlSW5kZXgsIGZlYXR1cmVTdWJJbmRleCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb29yZEluZGV4Kys7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKGdlb21UeXBlID09PSAnTXVsdGlMaW5lU3RyaW5nJykgZmVhdHVyZVN1YkluZGV4Kys7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChnZW9tVHlwZSA9PT0gJ1BvbHlnb24nKSBmZWF0dXJlU3ViSW5kZXgrKztcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ011bHRpUG9seWdvbic6XG4gICAgICAgICAgICAgICAgZm9yIChqID0gMDsgaiA8IGNvb3Jkcy5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGsgPSAwOyBrIDwgY29vcmRzW2pdLmxlbmd0aDsgaysrKVxuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChsID0gMDsgbCA8IGNvb3Jkc1tqXVtrXS5sZW5ndGggLSB3cmFwU2hyaW5rOyBsKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayhjb29yZHNbal1ba11bbF0sIGNvb3JkSW5kZXgsIGZlYXR1cmVJbmRleCwgZmVhdHVyZVN1YkluZGV4KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb29yZEluZGV4Kys7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGZlYXR1cmVTdWJJbmRleCsrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ0dlb21ldHJ5Q29sbGVjdGlvbic6XG4gICAgICAgICAgICAgICAgZm9yIChqID0gMDsgaiA8IGdlb21ldHJ5Lmdlb21ldHJpZXMubGVuZ3RoOyBqKyspXG4gICAgICAgICAgICAgICAgICAgIGNvb3JkRWFjaChnZW9tZXRyeS5nZW9tZXRyaWVzW2pdLCBjYWxsYmFjaywgZXhjbHVkZVdyYXBDb29yZCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignVW5rbm93biBHZW9tZXRyeSBUeXBlJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG5cbi8qKlxuICogQ2FsbGJhY2sgZm9yIGNvb3JkUmVkdWNlXG4gKlxuICogVGhlIGZpcnN0IHRpbWUgdGhlIGNhbGxiYWNrIGZ1bmN0aW9uIGlzIGNhbGxlZCwgdGhlIHZhbHVlcyBwcm92aWRlZCBhcyBhcmd1bWVudHMgZGVwZW5kXG4gKiBvbiB3aGV0aGVyIHRoZSByZWR1Y2UgbWV0aG9kIGhhcyBhbiBpbml0aWFsVmFsdWUgYXJndW1lbnQuXG4gKlxuICogSWYgYW4gaW5pdGlhbFZhbHVlIGlzIHByb3ZpZGVkIHRvIHRoZSByZWR1Y2UgbWV0aG9kOlxuICogIC0gVGhlIHByZXZpb3VzVmFsdWUgYXJndW1lbnQgaXMgaW5pdGlhbFZhbHVlLlxuICogIC0gVGhlIGN1cnJlbnRWYWx1ZSBhcmd1bWVudCBpcyB0aGUgdmFsdWUgb2YgdGhlIGZpcnN0IGVsZW1lbnQgcHJlc2VudCBpbiB0aGUgYXJyYXkuXG4gKlxuICogSWYgYW4gaW5pdGlhbFZhbHVlIGlzIG5vdCBwcm92aWRlZDpcbiAqICAtIFRoZSBwcmV2aW91c1ZhbHVlIGFyZ3VtZW50IGlzIHRoZSB2YWx1ZSBvZiB0aGUgZmlyc3QgZWxlbWVudCBwcmVzZW50IGluIHRoZSBhcnJheS5cbiAqICAtIFRoZSBjdXJyZW50VmFsdWUgYXJndW1lbnQgaXMgdGhlIHZhbHVlIG9mIHRoZSBzZWNvbmQgZWxlbWVudCBwcmVzZW50IGluIHRoZSBhcnJheS5cbiAqXG4gKiBAY2FsbGJhY2sgY29vcmRSZWR1Y2VDYWxsYmFja1xuICogQHBhcmFtIHsqfSBwcmV2aW91c1ZhbHVlIFRoZSBhY2N1bXVsYXRlZCB2YWx1ZSBwcmV2aW91c2x5IHJldHVybmVkIGluIHRoZSBsYXN0IGludm9jYXRpb25cbiAqIG9mIHRoZSBjYWxsYmFjaywgb3IgaW5pdGlhbFZhbHVlLCBpZiBzdXBwbGllZC5cbiAqIEBwYXJhbSB7QXJyYXk8bnVtYmVyPn0gY3VycmVudENvb3JkIFRoZSBjdXJyZW50IGNvb3JkaW5hdGUgYmVpbmcgcHJvY2Vzc2VkLlxuICogQHBhcmFtIHtudW1iZXJ9IGNvb3JkSW5kZXggVGhlIGN1cnJlbnQgaW5kZXggb2YgdGhlIGNvb3JkaW5hdGUgYmVpbmcgcHJvY2Vzc2VkLlxuICogU3RhcnRzIGF0IGluZGV4IDAsIGlmIGFuIGluaXRpYWxWYWx1ZSBpcyBwcm92aWRlZCwgYW5kIGF0IGluZGV4IDEgb3RoZXJ3aXNlLlxuICogQHBhcmFtIHtudW1iZXJ9IGZlYXR1cmVJbmRleCBUaGUgY3VycmVudCBpbmRleCBvZiB0aGUgZmVhdHVyZSBiZWluZyBwcm9jZXNzZWQuXG4gKiBAcGFyYW0ge251bWJlcn0gZmVhdHVyZVN1YkluZGV4IFRoZSBjdXJyZW50IHN1YkluZGV4IG9mIHRoZSBmZWF0dXJlIGJlaW5nIHByb2Nlc3NlZC5cbiAqL1xuXG4vKipcbiAqIFJlZHVjZSBjb29yZGluYXRlcyBpbiBhbnkgR2VvSlNPTiBvYmplY3QsIHNpbWlsYXIgdG8gQXJyYXkucmVkdWNlKClcbiAqXG4gKiBAbmFtZSBjb29yZFJlZHVjZVxuICogQHBhcmFtIHtGZWF0dXJlQ29sbGVjdGlvbnxHZW9tZXRyeXxGZWF0dXJlfSBnZW9qc29uIGFueSBHZW9KU09OIG9iamVjdFxuICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgYSBtZXRob2QgdGhhdCB0YWtlcyAocHJldmlvdXNWYWx1ZSwgY3VycmVudENvb3JkLCBjb29yZEluZGV4KVxuICogQHBhcmFtIHsqfSBbaW5pdGlhbFZhbHVlXSBWYWx1ZSB0byB1c2UgYXMgdGhlIGZpcnN0IGFyZ3VtZW50IHRvIHRoZSBmaXJzdCBjYWxsIG9mIHRoZSBjYWxsYmFjay5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW2V4Y2x1ZGVXcmFwQ29vcmQ9ZmFsc2VdIHdoZXRoZXIgb3Igbm90IHRvIGluY2x1ZGUgdGhlIGZpbmFsIGNvb3JkaW5hdGUgb2YgTGluZWFyUmluZ3MgdGhhdCB3cmFwcyB0aGUgcmluZyBpbiBpdHMgaXRlcmF0aW9uLlxuICogQHJldHVybnMgeyp9IFRoZSB2YWx1ZSB0aGF0IHJlc3VsdHMgZnJvbSB0aGUgcmVkdWN0aW9uLlxuICogQGV4YW1wbGVcbiAqIHZhciBmZWF0dXJlcyA9IHR1cmYuZmVhdHVyZUNvbGxlY3Rpb24oW1xuICogICB0dXJmLnBvaW50KFsyNiwgMzddLCB7XCJmb29cIjogXCJiYXJcIn0pLFxuICogICB0dXJmLnBvaW50KFszNiwgNTNdLCB7XCJoZWxsb1wiOiBcIndvcmxkXCJ9KVxuICogXSk7XG4gKlxuICogdHVyZi5jb29yZFJlZHVjZShmZWF0dXJlcywgZnVuY3Rpb24gKHByZXZpb3VzVmFsdWUsIGN1cnJlbnRDb29yZCwgY29vcmRJbmRleCwgZmVhdHVyZUluZGV4LCBmZWF0dXJlU3ViSW5kZXgpIHtcbiAqICAgLy89cHJldmlvdXNWYWx1ZVxuICogICAvLz1jdXJyZW50Q29vcmRcbiAqICAgLy89Y29vcmRJbmRleFxuICogICAvLz1mZWF0dXJlSW5kZXhcbiAqICAgLy89ZmVhdHVyZVN1YkluZGV4XG4gKiAgIHJldHVybiBjdXJyZW50Q29vcmQ7XG4gKiB9KTtcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvb3JkUmVkdWNlKGdlb2pzb24sIGNhbGxiYWNrLCBpbml0aWFsVmFsdWUsIGV4Y2x1ZGVXcmFwQ29vcmQpIHtcbiAgICB2YXIgcHJldmlvdXNWYWx1ZSA9IGluaXRpYWxWYWx1ZTtcbiAgICBjb29yZEVhY2goZ2VvanNvbiwgZnVuY3Rpb24gKGN1cnJlbnRDb29yZCwgY29vcmRJbmRleCwgZmVhdHVyZUluZGV4LCBmZWF0dXJlU3ViSW5kZXgpIHtcbiAgICAgICAgaWYgKGNvb3JkSW5kZXggPT09IDAgJiYgaW5pdGlhbFZhbHVlID09PSB1bmRlZmluZWQpIHByZXZpb3VzVmFsdWUgPSBjdXJyZW50Q29vcmQ7XG4gICAgICAgIGVsc2UgcHJldmlvdXNWYWx1ZSA9IGNhbGxiYWNrKHByZXZpb3VzVmFsdWUsIGN1cnJlbnRDb29yZCwgY29vcmRJbmRleCwgZmVhdHVyZUluZGV4LCBmZWF0dXJlU3ViSW5kZXgpO1xuICAgIH0sIGV4Y2x1ZGVXcmFwQ29vcmQpO1xuICAgIHJldHVybiBwcmV2aW91c1ZhbHVlO1xufVxuXG4vKipcbiAqIENhbGxiYWNrIGZvciBwcm9wRWFjaFxuICpcbiAqIEBjYWxsYmFjayBwcm9wRWFjaENhbGxiYWNrXG4gKiBAcGFyYW0ge09iamVjdH0gY3VycmVudFByb3BlcnRpZXMgVGhlIGN1cnJlbnQgcHJvcGVydGllcyBiZWluZyBwcm9jZXNzZWQuXG4gKiBAcGFyYW0ge251bWJlcn0gZmVhdHVyZUluZGV4IFRoZSBpbmRleCBvZiB0aGUgY3VycmVudCBlbGVtZW50IGJlaW5nIHByb2Nlc3NlZCBpbiB0aGVcbiAqIGFycmF5LlN0YXJ0cyBhdCBpbmRleCAwLCBpZiBhbiBpbml0aWFsVmFsdWUgaXMgcHJvdmlkZWQsIGFuZCBhdCBpbmRleCAxIG90aGVyd2lzZS5cbiAqL1xuXG4vKipcbiAqIEl0ZXJhdGUgb3ZlciBwcm9wZXJ0aWVzIGluIGFueSBHZW9KU09OIG9iamVjdCwgc2ltaWxhciB0byBBcnJheS5mb3JFYWNoKClcbiAqXG4gKiBAbmFtZSBwcm9wRWFjaFxuICogQHBhcmFtIHsoRmVhdHVyZUNvbGxlY3Rpb258RmVhdHVyZSl9IGdlb2pzb24gYW55IEdlb0pTT04gb2JqZWN0XG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayBhIG1ldGhvZCB0aGF0IHRha2VzIChjdXJyZW50UHJvcGVydGllcywgZmVhdHVyZUluZGV4KVxuICogQGV4YW1wbGVcbiAqIHZhciBmZWF0dXJlcyA9IHR1cmYuZmVhdHVyZUNvbGxlY3Rpb24oW1xuICogICAgIHR1cmYucG9pbnQoWzI2LCAzN10sIHtmb286ICdiYXInfSksXG4gKiAgICAgdHVyZi5wb2ludChbMzYsIDUzXSwge2hlbGxvOiAnd29ybGQnfSlcbiAqIF0pO1xuICpcbiAqIHR1cmYucHJvcEVhY2goZmVhdHVyZXMsIGZ1bmN0aW9uIChjdXJyZW50UHJvcGVydGllcywgZmVhdHVyZUluZGV4KSB7XG4gKiAgIC8vPWN1cnJlbnRQcm9wZXJ0aWVzXG4gKiAgIC8vPWZlYXR1cmVJbmRleFxuICogfSk7XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwcm9wRWFjaChnZW9qc29uLCBjYWxsYmFjaykge1xuICAgIHZhciBpO1xuICAgIHN3aXRjaCAoZ2VvanNvbi50eXBlKSB7XG4gICAgY2FzZSAnRmVhdHVyZUNvbGxlY3Rpb24nOlxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgZ2VvanNvbi5mZWF0dXJlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY2FsbGJhY2soZ2VvanNvbi5mZWF0dXJlc1tpXS5wcm9wZXJ0aWVzLCBpKTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICBjYXNlICdGZWF0dXJlJzpcbiAgICAgICAgY2FsbGJhY2soZ2VvanNvbi5wcm9wZXJ0aWVzLCAwKTtcbiAgICAgICAgYnJlYWs7XG4gICAgfVxufVxuXG5cbi8qKlxuICogQ2FsbGJhY2sgZm9yIHByb3BSZWR1Y2VcbiAqXG4gKiBUaGUgZmlyc3QgdGltZSB0aGUgY2FsbGJhY2sgZnVuY3Rpb24gaXMgY2FsbGVkLCB0aGUgdmFsdWVzIHByb3ZpZGVkIGFzIGFyZ3VtZW50cyBkZXBlbmRcbiAqIG9uIHdoZXRoZXIgdGhlIHJlZHVjZSBtZXRob2QgaGFzIGFuIGluaXRpYWxWYWx1ZSBhcmd1bWVudC5cbiAqXG4gKiBJZiBhbiBpbml0aWFsVmFsdWUgaXMgcHJvdmlkZWQgdG8gdGhlIHJlZHVjZSBtZXRob2Q6XG4gKiAgLSBUaGUgcHJldmlvdXNWYWx1ZSBhcmd1bWVudCBpcyBpbml0aWFsVmFsdWUuXG4gKiAgLSBUaGUgY3VycmVudFZhbHVlIGFyZ3VtZW50IGlzIHRoZSB2YWx1ZSBvZiB0aGUgZmlyc3QgZWxlbWVudCBwcmVzZW50IGluIHRoZSBhcnJheS5cbiAqXG4gKiBJZiBhbiBpbml0aWFsVmFsdWUgaXMgbm90IHByb3ZpZGVkOlxuICogIC0gVGhlIHByZXZpb3VzVmFsdWUgYXJndW1lbnQgaXMgdGhlIHZhbHVlIG9mIHRoZSBmaXJzdCBlbGVtZW50IHByZXNlbnQgaW4gdGhlIGFycmF5LlxuICogIC0gVGhlIGN1cnJlbnRWYWx1ZSBhcmd1bWVudCBpcyB0aGUgdmFsdWUgb2YgdGhlIHNlY29uZCBlbGVtZW50IHByZXNlbnQgaW4gdGhlIGFycmF5LlxuICpcbiAqIEBjYWxsYmFjayBwcm9wUmVkdWNlQ2FsbGJhY2tcbiAqIEBwYXJhbSB7Kn0gcHJldmlvdXNWYWx1ZSBUaGUgYWNjdW11bGF0ZWQgdmFsdWUgcHJldmlvdXNseSByZXR1cm5lZCBpbiB0aGUgbGFzdCBpbnZvY2F0aW9uXG4gKiBvZiB0aGUgY2FsbGJhY2ssIG9yIGluaXRpYWxWYWx1ZSwgaWYgc3VwcGxpZWQuXG4gKiBAcGFyYW0geyp9IGN1cnJlbnRQcm9wZXJ0aWVzIFRoZSBjdXJyZW50IHByb3BlcnRpZXMgYmVpbmcgcHJvY2Vzc2VkLlxuICogQHBhcmFtIHtudW1iZXJ9IGZlYXR1cmVJbmRleCBUaGUgaW5kZXggb2YgdGhlIGN1cnJlbnQgZWxlbWVudCBiZWluZyBwcm9jZXNzZWQgaW4gdGhlXG4gKiBhcnJheS5TdGFydHMgYXQgaW5kZXggMCwgaWYgYW4gaW5pdGlhbFZhbHVlIGlzIHByb3ZpZGVkLCBhbmQgYXQgaW5kZXggMSBvdGhlcndpc2UuXG4gKi9cblxuLyoqXG4gKiBSZWR1Y2UgcHJvcGVydGllcyBpbiBhbnkgR2VvSlNPTiBvYmplY3QgaW50byBhIHNpbmdsZSB2YWx1ZSxcbiAqIHNpbWlsYXIgdG8gaG93IEFycmF5LnJlZHVjZSB3b3Jrcy4gSG93ZXZlciwgaW4gdGhpcyBjYXNlIHdlIGxhemlseSBydW5cbiAqIHRoZSByZWR1Y3Rpb24sIHNvIGFuIGFycmF5IG9mIGFsbCBwcm9wZXJ0aWVzIGlzIHVubmVjZXNzYXJ5LlxuICpcbiAqIEBuYW1lIHByb3BSZWR1Y2VcbiAqIEBwYXJhbSB7KEZlYXR1cmVDb2xsZWN0aW9ufEZlYXR1cmUpfSBnZW9qc29uIGFueSBHZW9KU09OIG9iamVjdFxuICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgYSBtZXRob2QgdGhhdCB0YWtlcyAocHJldmlvdXNWYWx1ZSwgY3VycmVudFByb3BlcnRpZXMsIGZlYXR1cmVJbmRleClcbiAqIEBwYXJhbSB7Kn0gW2luaXRpYWxWYWx1ZV0gVmFsdWUgdG8gdXNlIGFzIHRoZSBmaXJzdCBhcmd1bWVudCB0byB0aGUgZmlyc3QgY2FsbCBvZiB0aGUgY2FsbGJhY2suXG4gKiBAcmV0dXJucyB7Kn0gVGhlIHZhbHVlIHRoYXQgcmVzdWx0cyBmcm9tIHRoZSByZWR1Y3Rpb24uXG4gKiBAZXhhbXBsZVxuICogdmFyIGZlYXR1cmVzID0gdHVyZi5mZWF0dXJlQ29sbGVjdGlvbihbXG4gKiAgICAgdHVyZi5wb2ludChbMjYsIDM3XSwge2ZvbzogJ2Jhcid9KSxcbiAqICAgICB0dXJmLnBvaW50KFszNiwgNTNdLCB7aGVsbG86ICd3b3JsZCd9KVxuICogXSk7XG4gKlxuICogdHVyZi5wcm9wUmVkdWNlKGZlYXR1cmVzLCBmdW5jdGlvbiAocHJldmlvdXNWYWx1ZSwgY3VycmVudFByb3BlcnRpZXMsIGZlYXR1cmVJbmRleCkge1xuICogICAvLz1wcmV2aW91c1ZhbHVlXG4gKiAgIC8vPWN1cnJlbnRQcm9wZXJ0aWVzXG4gKiAgIC8vPWZlYXR1cmVJbmRleFxuICogICByZXR1cm4gY3VycmVudFByb3BlcnRpZXNcbiAqIH0pO1xuICovXG5leHBvcnQgZnVuY3Rpb24gcHJvcFJlZHVjZShnZW9qc29uLCBjYWxsYmFjaywgaW5pdGlhbFZhbHVlKSB7XG4gICAgdmFyIHByZXZpb3VzVmFsdWUgPSBpbml0aWFsVmFsdWU7XG4gICAgcHJvcEVhY2goZ2VvanNvbiwgZnVuY3Rpb24gKGN1cnJlbnRQcm9wZXJ0aWVzLCBmZWF0dXJlSW5kZXgpIHtcbiAgICAgICAgaWYgKGZlYXR1cmVJbmRleCA9PT0gMCAmJiBpbml0aWFsVmFsdWUgPT09IHVuZGVmaW5lZCkgcHJldmlvdXNWYWx1ZSA9IGN1cnJlbnRQcm9wZXJ0aWVzO1xuICAgICAgICBlbHNlIHByZXZpb3VzVmFsdWUgPSBjYWxsYmFjayhwcmV2aW91c1ZhbHVlLCBjdXJyZW50UHJvcGVydGllcywgZmVhdHVyZUluZGV4KTtcbiAgICB9KTtcbiAgICByZXR1cm4gcHJldmlvdXNWYWx1ZTtcbn1cblxuLyoqXG4gKiBDYWxsYmFjayBmb3IgZmVhdHVyZUVhY2hcbiAqXG4gKiBAY2FsbGJhY2sgZmVhdHVyZUVhY2hDYWxsYmFja1xuICogQHBhcmFtIHtGZWF0dXJlPGFueT59IGN1cnJlbnRGZWF0dXJlIFRoZSBjdXJyZW50IGZlYXR1cmUgYmVpbmcgcHJvY2Vzc2VkLlxuICogQHBhcmFtIHtudW1iZXJ9IGZlYXR1cmVJbmRleCBUaGUgaW5kZXggb2YgdGhlIGN1cnJlbnQgZWxlbWVudCBiZWluZyBwcm9jZXNzZWQgaW4gdGhlXG4gKiBhcnJheS5TdGFydHMgYXQgaW5kZXggMCwgaWYgYW4gaW5pdGlhbFZhbHVlIGlzIHByb3ZpZGVkLCBhbmQgYXQgaW5kZXggMSBvdGhlcndpc2UuXG4gKi9cblxuLyoqXG4gKiBJdGVyYXRlIG92ZXIgZmVhdHVyZXMgaW4gYW55IEdlb0pTT04gb2JqZWN0LCBzaW1pbGFyIHRvXG4gKiBBcnJheS5mb3JFYWNoLlxuICpcbiAqIEBuYW1lIGZlYXR1cmVFYWNoXG4gKiBAcGFyYW0geyhGZWF0dXJlQ29sbGVjdGlvbnxGZWF0dXJlfEdlb21ldHJ5KX0gZ2VvanNvbiBhbnkgR2VvSlNPTiBvYmplY3RcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIGEgbWV0aG9kIHRoYXQgdGFrZXMgKGN1cnJlbnRGZWF0dXJlLCBmZWF0dXJlSW5kZXgpXG4gKiBAZXhhbXBsZVxuICogdmFyIGZlYXR1cmVzID0gdHVyZi5mZWF0dXJlQ29sbGVjdGlvbihbXG4gKiAgIHR1cmYucG9pbnQoWzI2LCAzN10sIHtmb286ICdiYXInfSksXG4gKiAgIHR1cmYucG9pbnQoWzM2LCA1M10sIHtoZWxsbzogJ3dvcmxkJ30pXG4gKiBdKTtcbiAqXG4gKiB0dXJmLmZlYXR1cmVFYWNoKGZlYXR1cmVzLCBmdW5jdGlvbiAoY3VycmVudEZlYXR1cmUsIGZlYXR1cmVJbmRleCkge1xuICogICAvLz1jdXJyZW50RmVhdHVyZVxuICogICAvLz1mZWF0dXJlSW5kZXhcbiAqIH0pO1xuICovXG5leHBvcnQgZnVuY3Rpb24gZmVhdHVyZUVhY2goZ2VvanNvbiwgY2FsbGJhY2spIHtcbiAgICBpZiAoZ2VvanNvbi50eXBlID09PSAnRmVhdHVyZScpIHtcbiAgICAgICAgY2FsbGJhY2soZ2VvanNvbiwgMCk7XG4gICAgfSBlbHNlIGlmIChnZW9qc29uLnR5cGUgPT09ICdGZWF0dXJlQ29sbGVjdGlvbicpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBnZW9qc29uLmZlYXR1cmVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjYWxsYmFjayhnZW9qc29uLmZlYXR1cmVzW2ldLCBpKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuLyoqXG4gKiBDYWxsYmFjayBmb3IgZmVhdHVyZVJlZHVjZVxuICpcbiAqIFRoZSBmaXJzdCB0aW1lIHRoZSBjYWxsYmFjayBmdW5jdGlvbiBpcyBjYWxsZWQsIHRoZSB2YWx1ZXMgcHJvdmlkZWQgYXMgYXJndW1lbnRzIGRlcGVuZFxuICogb24gd2hldGhlciB0aGUgcmVkdWNlIG1ldGhvZCBoYXMgYW4gaW5pdGlhbFZhbHVlIGFyZ3VtZW50LlxuICpcbiAqIElmIGFuIGluaXRpYWxWYWx1ZSBpcyBwcm92aWRlZCB0byB0aGUgcmVkdWNlIG1ldGhvZDpcbiAqICAtIFRoZSBwcmV2aW91c1ZhbHVlIGFyZ3VtZW50IGlzIGluaXRpYWxWYWx1ZS5cbiAqICAtIFRoZSBjdXJyZW50VmFsdWUgYXJndW1lbnQgaXMgdGhlIHZhbHVlIG9mIHRoZSBmaXJzdCBlbGVtZW50IHByZXNlbnQgaW4gdGhlIGFycmF5LlxuICpcbiAqIElmIGFuIGluaXRpYWxWYWx1ZSBpcyBub3QgcHJvdmlkZWQ6XG4gKiAgLSBUaGUgcHJldmlvdXNWYWx1ZSBhcmd1bWVudCBpcyB0aGUgdmFsdWUgb2YgdGhlIGZpcnN0IGVsZW1lbnQgcHJlc2VudCBpbiB0aGUgYXJyYXkuXG4gKiAgLSBUaGUgY3VycmVudFZhbHVlIGFyZ3VtZW50IGlzIHRoZSB2YWx1ZSBvZiB0aGUgc2Vjb25kIGVsZW1lbnQgcHJlc2VudCBpbiB0aGUgYXJyYXkuXG4gKlxuICogQGNhbGxiYWNrIGZlYXR1cmVSZWR1Y2VDYWxsYmFja1xuICogQHBhcmFtIHsqfSBwcmV2aW91c1ZhbHVlIFRoZSBhY2N1bXVsYXRlZCB2YWx1ZSBwcmV2aW91c2x5IHJldHVybmVkIGluIHRoZSBsYXN0IGludm9jYXRpb25cbiAqIG9mIHRoZSBjYWxsYmFjaywgb3IgaW5pdGlhbFZhbHVlLCBpZiBzdXBwbGllZC5cbiAqIEBwYXJhbSB7RmVhdHVyZX0gY3VycmVudEZlYXR1cmUgVGhlIGN1cnJlbnQgRmVhdHVyZSBiZWluZyBwcm9jZXNzZWQuXG4gKiBAcGFyYW0ge251bWJlcn0gZmVhdHVyZUluZGV4IFRoZSBpbmRleCBvZiB0aGUgY3VycmVudCBlbGVtZW50IGJlaW5nIHByb2Nlc3NlZCBpbiB0aGVcbiAqIGFycmF5LlN0YXJ0cyBhdCBpbmRleCAwLCBpZiBhbiBpbml0aWFsVmFsdWUgaXMgcHJvdmlkZWQsIGFuZCBhdCBpbmRleCAxIG90aGVyd2lzZS5cbiAqL1xuXG4vKipcbiAqIFJlZHVjZSBmZWF0dXJlcyBpbiBhbnkgR2VvSlNPTiBvYmplY3QsIHNpbWlsYXIgdG8gQXJyYXkucmVkdWNlKCkuXG4gKlxuICogQG5hbWUgZmVhdHVyZVJlZHVjZVxuICogQHBhcmFtIHsoRmVhdHVyZUNvbGxlY3Rpb258RmVhdHVyZXxHZW9tZXRyeSl9IGdlb2pzb24gYW55IEdlb0pTT04gb2JqZWN0XG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayBhIG1ldGhvZCB0aGF0IHRha2VzIChwcmV2aW91c1ZhbHVlLCBjdXJyZW50RmVhdHVyZSwgZmVhdHVyZUluZGV4KVxuICogQHBhcmFtIHsqfSBbaW5pdGlhbFZhbHVlXSBWYWx1ZSB0byB1c2UgYXMgdGhlIGZpcnN0IGFyZ3VtZW50IHRvIHRoZSBmaXJzdCBjYWxsIG9mIHRoZSBjYWxsYmFjay5cbiAqIEByZXR1cm5zIHsqfSBUaGUgdmFsdWUgdGhhdCByZXN1bHRzIGZyb20gdGhlIHJlZHVjdGlvbi5cbiAqIEBleGFtcGxlXG4gKiB2YXIgZmVhdHVyZXMgPSB0dXJmLmZlYXR1cmVDb2xsZWN0aW9uKFtcbiAqICAgdHVyZi5wb2ludChbMjYsIDM3XSwge1wiZm9vXCI6IFwiYmFyXCJ9KSxcbiAqICAgdHVyZi5wb2ludChbMzYsIDUzXSwge1wiaGVsbG9cIjogXCJ3b3JsZFwifSlcbiAqIF0pO1xuICpcbiAqIHR1cmYuZmVhdHVyZVJlZHVjZShmZWF0dXJlcywgZnVuY3Rpb24gKHByZXZpb3VzVmFsdWUsIGN1cnJlbnRGZWF0dXJlLCBmZWF0dXJlSW5kZXgpIHtcbiAqICAgLy89cHJldmlvdXNWYWx1ZVxuICogICAvLz1jdXJyZW50RmVhdHVyZVxuICogICAvLz1mZWF0dXJlSW5kZXhcbiAqICAgcmV0dXJuIGN1cnJlbnRGZWF0dXJlXG4gKiB9KTtcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZlYXR1cmVSZWR1Y2UoZ2VvanNvbiwgY2FsbGJhY2ssIGluaXRpYWxWYWx1ZSkge1xuICAgIHZhciBwcmV2aW91c1ZhbHVlID0gaW5pdGlhbFZhbHVlO1xuICAgIGZlYXR1cmVFYWNoKGdlb2pzb24sIGZ1bmN0aW9uIChjdXJyZW50RmVhdHVyZSwgZmVhdHVyZUluZGV4KSB7XG4gICAgICAgIGlmIChmZWF0dXJlSW5kZXggPT09IDAgJiYgaW5pdGlhbFZhbHVlID09PSB1bmRlZmluZWQpIHByZXZpb3VzVmFsdWUgPSBjdXJyZW50RmVhdHVyZTtcbiAgICAgICAgZWxzZSBwcmV2aW91c1ZhbHVlID0gY2FsbGJhY2socHJldmlvdXNWYWx1ZSwgY3VycmVudEZlYXR1cmUsIGZlYXR1cmVJbmRleCk7XG4gICAgfSk7XG4gICAgcmV0dXJuIHByZXZpb3VzVmFsdWU7XG59XG5cbi8qKlxuICogR2V0IGFsbCBjb29yZGluYXRlcyBmcm9tIGFueSBHZW9KU09OIG9iamVjdC5cbiAqXG4gKiBAbmFtZSBjb29yZEFsbFxuICogQHBhcmFtIHsoRmVhdHVyZUNvbGxlY3Rpb258RmVhdHVyZXxHZW9tZXRyeSl9IGdlb2pzb24gYW55IEdlb0pTT04gb2JqZWN0XG4gKiBAcmV0dXJucyB7QXJyYXk8QXJyYXk8bnVtYmVyPj59IGNvb3JkaW5hdGUgcG9zaXRpb24gYXJyYXlcbiAqIEBleGFtcGxlXG4gKiB2YXIgZmVhdHVyZXMgPSB0dXJmLmZlYXR1cmVDb2xsZWN0aW9uKFtcbiAqICAgdHVyZi5wb2ludChbMjYsIDM3XSwge2ZvbzogJ2Jhcid9KSxcbiAqICAgdHVyZi5wb2ludChbMzYsIDUzXSwge2hlbGxvOiAnd29ybGQnfSlcbiAqIF0pO1xuICpcbiAqIHZhciBjb29yZHMgPSB0dXJmLmNvb3JkQWxsKGZlYXR1cmVzKTtcbiAqIC8vPSBbWzI2LCAzN10sIFszNiwgNTNdXVxuICovXG5leHBvcnQgZnVuY3Rpb24gY29vcmRBbGwoZ2VvanNvbikge1xuICAgIHZhciBjb29yZHMgPSBbXTtcbiAgICBjb29yZEVhY2goZ2VvanNvbiwgZnVuY3Rpb24gKGNvb3JkKSB7XG4gICAgICAgIGNvb3Jkcy5wdXNoKGNvb3JkKTtcbiAgICB9KTtcbiAgICByZXR1cm4gY29vcmRzO1xufVxuXG4vKipcbiAqIENhbGxiYWNrIGZvciBnZW9tRWFjaFxuICpcbiAqIEBjYWxsYmFjayBnZW9tRWFjaENhbGxiYWNrXG4gKiBAcGFyYW0ge0dlb21ldHJ5fSBjdXJyZW50R2VvbWV0cnkgVGhlIGN1cnJlbnQgZ2VvbWV0cnkgYmVpbmcgcHJvY2Vzc2VkLlxuICogQHBhcmFtIHtudW1iZXJ9IGN1cnJlbnRJbmRleCBUaGUgaW5kZXggb2YgdGhlIGN1cnJlbnQgZWxlbWVudCBiZWluZyBwcm9jZXNzZWQgaW4gdGhlXG4gKiBhcnJheS4gU3RhcnRzIGF0IGluZGV4IDAsIGlmIGFuIGluaXRpYWxWYWx1ZSBpcyBwcm92aWRlZCwgYW5kIGF0IGluZGV4IDEgb3RoZXJ3aXNlLlxuICogQHBhcmFtIHtudW1iZXJ9IGN1cnJlbnRQcm9wZXJ0aWVzIFRoZSBjdXJyZW50IGZlYXR1cmUgcHJvcGVydGllcyBiZWluZyBwcm9jZXNzZWQuXG4gKi9cblxuLyoqXG4gKiBJdGVyYXRlIG92ZXIgZWFjaCBnZW9tZXRyeSBpbiBhbnkgR2VvSlNPTiBvYmplY3QsIHNpbWlsYXIgdG8gQXJyYXkuZm9yRWFjaCgpXG4gKlxuICogQG5hbWUgZ2VvbUVhY2hcbiAqIEBwYXJhbSB7KEZlYXR1cmVDb2xsZWN0aW9ufEZlYXR1cmV8R2VvbWV0cnkpfSBnZW9qc29uIGFueSBHZW9KU09OIG9iamVjdFxuICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgYSBtZXRob2QgdGhhdCB0YWtlcyAoY3VycmVudEdlb21ldHJ5LCBmZWF0dXJlSW5kZXgsIGN1cnJlbnRQcm9wZXJ0aWVzKVxuICogQGV4YW1wbGVcbiAqIHZhciBmZWF0dXJlcyA9IHR1cmYuZmVhdHVyZUNvbGxlY3Rpb24oW1xuICogICAgIHR1cmYucG9pbnQoWzI2LCAzN10sIHtmb286ICdiYXInfSksXG4gKiAgICAgdHVyZi5wb2ludChbMzYsIDUzXSwge2hlbGxvOiAnd29ybGQnfSlcbiAqIF0pO1xuICpcbiAqIHR1cmYuZ2VvbUVhY2goZmVhdHVyZXMsIGZ1bmN0aW9uIChjdXJyZW50R2VvbWV0cnksIGZlYXR1cmVJbmRleCwgY3VycmVudFByb3BlcnRpZXMpIHtcbiAqICAgLy89Y3VycmVudEdlb21ldHJ5XG4gKiAgIC8vPWZlYXR1cmVJbmRleFxuICogICAvLz1jdXJyZW50UHJvcGVydGllc1xuICogfSk7XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZW9tRWFjaChnZW9qc29uLCBjYWxsYmFjaykge1xuICAgIHZhciBpLCBqLCBnLCBnZW9tZXRyeSwgc3RvcEcsXG4gICAgICAgIGdlb21ldHJ5TWF5YmVDb2xsZWN0aW9uLFxuICAgICAgICBpc0dlb21ldHJ5Q29sbGVjdGlvbixcbiAgICAgICAgZ2VvbWV0cnlQcm9wZXJ0aWVzLFxuICAgICAgICBmZWF0dXJlSW5kZXggPSAwLFxuICAgICAgICBpc0ZlYXR1cmVDb2xsZWN0aW9uID0gZ2VvanNvbi50eXBlID09PSAnRmVhdHVyZUNvbGxlY3Rpb24nLFxuICAgICAgICBpc0ZlYXR1cmUgPSBnZW9qc29uLnR5cGUgPT09ICdGZWF0dXJlJyxcbiAgICAgICAgc3RvcCA9IGlzRmVhdHVyZUNvbGxlY3Rpb24gPyBnZW9qc29uLmZlYXR1cmVzLmxlbmd0aCA6IDE7XG5cbiAgICAvLyBUaGlzIGxvZ2ljIG1heSBsb29rIGEgbGl0dGxlIHdlaXJkLiBUaGUgcmVhc29uIHdoeSBpdCBpcyB0aGF0IHdheVxuICAgIC8vIGlzIGJlY2F1c2UgaXQncyB0cnlpbmcgdG8gYmUgZmFzdC4gR2VvSlNPTiBzdXBwb3J0cyBtdWx0aXBsZSBraW5kc1xuICAgIC8vIG9mIG9iamVjdHMgYXQgaXRzIHJvb3Q6IEZlYXR1cmVDb2xsZWN0aW9uLCBGZWF0dXJlcywgR2VvbWV0cmllcy5cbiAgICAvLyBUaGlzIGZ1bmN0aW9uIGhhcyB0aGUgcmVzcG9uc2liaWxpdHkgb2YgaGFuZGxpbmcgYWxsIG9mIHRoZW0sIGFuZCB0aGF0XG4gICAgLy8gbWVhbnMgdGhhdCBzb21lIG9mIHRoZSBgZm9yYCBsb29wcyB5b3Ugc2VlIGJlbG93IGFjdHVhbGx5IGp1c3QgZG9uJ3QgYXBwbHlcbiAgICAvLyB0byBjZXJ0YWluIGlucHV0cy4gRm9yIGluc3RhbmNlLCBpZiB5b3UgZ2l2ZSB0aGlzIGp1c3QgYVxuICAgIC8vIFBvaW50IGdlb21ldHJ5LCB0aGVuIGJvdGggbG9vcHMgYXJlIHNob3J0LWNpcmN1aXRlZCBhbmQgYWxsIHdlIGRvXG4gICAgLy8gaXMgZ3JhZHVhbGx5IHJlbmFtZSB0aGUgaW5wdXQgdW50aWwgaXQncyBjYWxsZWQgJ2dlb21ldHJ5Jy5cbiAgICAvL1xuICAgIC8vIFRoaXMgYWxzbyBhaW1zIHRvIGFsbG9jYXRlIGFzIGZldyByZXNvdXJjZXMgYXMgcG9zc2libGU6IGp1c3QgYVxuICAgIC8vIGZldyBudW1iZXJzIGFuZCBib29sZWFucywgcmF0aGVyIHRoYW4gYW55IHRlbXBvcmFyeSBhcnJheXMgYXMgd291bGRcbiAgICAvLyBiZSByZXF1aXJlZCB3aXRoIHRoZSBub3JtYWxpemF0aW9uIGFwcHJvYWNoLlxuICAgIGZvciAoaSA9IDA7IGkgPCBzdG9wOyBpKyspIHtcblxuICAgICAgICBnZW9tZXRyeU1heWJlQ29sbGVjdGlvbiA9IChpc0ZlYXR1cmVDb2xsZWN0aW9uID8gZ2VvanNvbi5mZWF0dXJlc1tpXS5nZW9tZXRyeSA6XG4gICAgICAgICAgICAoaXNGZWF0dXJlID8gZ2VvanNvbi5nZW9tZXRyeSA6IGdlb2pzb24pKTtcbiAgICAgICAgZ2VvbWV0cnlQcm9wZXJ0aWVzID0gKGlzRmVhdHVyZUNvbGxlY3Rpb24gPyBnZW9qc29uLmZlYXR1cmVzW2ldLnByb3BlcnRpZXMgOlxuICAgICAgICAgICAgKGlzRmVhdHVyZSA/IGdlb2pzb24ucHJvcGVydGllcyA6IHt9KSk7XG4gICAgICAgIGlzR2VvbWV0cnlDb2xsZWN0aW9uID0gKGdlb21ldHJ5TWF5YmVDb2xsZWN0aW9uKSA/IGdlb21ldHJ5TWF5YmVDb2xsZWN0aW9uLnR5cGUgPT09ICdHZW9tZXRyeUNvbGxlY3Rpb24nIDogZmFsc2U7XG4gICAgICAgIHN0b3BHID0gaXNHZW9tZXRyeUNvbGxlY3Rpb24gPyBnZW9tZXRyeU1heWJlQ29sbGVjdGlvbi5nZW9tZXRyaWVzLmxlbmd0aCA6IDE7XG5cbiAgICAgICAgZm9yIChnID0gMDsgZyA8IHN0b3BHOyBnKyspIHtcbiAgICAgICAgICAgIGdlb21ldHJ5ID0gaXNHZW9tZXRyeUNvbGxlY3Rpb24gP1xuICAgICAgICAgICAgICAgIGdlb21ldHJ5TWF5YmVDb2xsZWN0aW9uLmdlb21ldHJpZXNbZ10gOiBnZW9tZXRyeU1heWJlQ29sbGVjdGlvbjtcblxuICAgICAgICAgICAgLy8gSGFuZGxlIG51bGwgR2VvbWV0cnlcbiAgICAgICAgICAgIGlmIChnZW9tZXRyeSA9PT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKG51bGwsIGZlYXR1cmVJbmRleCwgZ2VvbWV0cnlQcm9wZXJ0aWVzKTtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHN3aXRjaCAoZ2VvbWV0cnkudHlwZSkge1xuICAgICAgICAgICAgY2FzZSAnUG9pbnQnOlxuICAgICAgICAgICAgY2FzZSAnTGluZVN0cmluZyc6XG4gICAgICAgICAgICBjYXNlICdNdWx0aVBvaW50JzpcbiAgICAgICAgICAgIGNhc2UgJ1BvbHlnb24nOlxuICAgICAgICAgICAgY2FzZSAnTXVsdGlMaW5lU3RyaW5nJzpcbiAgICAgICAgICAgIGNhc2UgJ011bHRpUG9seWdvbic6IHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhnZW9tZXRyeSwgZmVhdHVyZUluZGV4LCBnZW9tZXRyeVByb3BlcnRpZXMpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2FzZSAnR2VvbWV0cnlDb2xsZWN0aW9uJzoge1xuICAgICAgICAgICAgICAgIGZvciAoaiA9IDA7IGogPCBnZW9tZXRyeS5nZW9tZXRyaWVzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKGdlb21ldHJ5Lmdlb21ldHJpZXNbal0sIGZlYXR1cmVJbmRleCwgZ2VvbWV0cnlQcm9wZXJ0aWVzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignVW5rbm93biBHZW9tZXRyeSBUeXBlJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy8gT25seSBpbmNyZWFzZSBgZmVhdHVyZUluZGV4YCBwZXIgZWFjaCBmZWF0dXJlXG4gICAgICAgIGZlYXR1cmVJbmRleCsrO1xuICAgIH1cbn1cblxuLyoqXG4gKiBDYWxsYmFjayBmb3IgZ2VvbVJlZHVjZVxuICpcbiAqIFRoZSBmaXJzdCB0aW1lIHRoZSBjYWxsYmFjayBmdW5jdGlvbiBpcyBjYWxsZWQsIHRoZSB2YWx1ZXMgcHJvdmlkZWQgYXMgYXJndW1lbnRzIGRlcGVuZFxuICogb24gd2hldGhlciB0aGUgcmVkdWNlIG1ldGhvZCBoYXMgYW4gaW5pdGlhbFZhbHVlIGFyZ3VtZW50LlxuICpcbiAqIElmIGFuIGluaXRpYWxWYWx1ZSBpcyBwcm92aWRlZCB0byB0aGUgcmVkdWNlIG1ldGhvZDpcbiAqICAtIFRoZSBwcmV2aW91c1ZhbHVlIGFyZ3VtZW50IGlzIGluaXRpYWxWYWx1ZS5cbiAqICAtIFRoZSBjdXJyZW50VmFsdWUgYXJndW1lbnQgaXMgdGhlIHZhbHVlIG9mIHRoZSBmaXJzdCBlbGVtZW50IHByZXNlbnQgaW4gdGhlIGFycmF5LlxuICpcbiAqIElmIGFuIGluaXRpYWxWYWx1ZSBpcyBub3QgcHJvdmlkZWQ6XG4gKiAgLSBUaGUgcHJldmlvdXNWYWx1ZSBhcmd1bWVudCBpcyB0aGUgdmFsdWUgb2YgdGhlIGZpcnN0IGVsZW1lbnQgcHJlc2VudCBpbiB0aGUgYXJyYXkuXG4gKiAgLSBUaGUgY3VycmVudFZhbHVlIGFyZ3VtZW50IGlzIHRoZSB2YWx1ZSBvZiB0aGUgc2Vjb25kIGVsZW1lbnQgcHJlc2VudCBpbiB0aGUgYXJyYXkuXG4gKlxuICogQGNhbGxiYWNrIGdlb21SZWR1Y2VDYWxsYmFja1xuICogQHBhcmFtIHsqfSBwcmV2aW91c1ZhbHVlIFRoZSBhY2N1bXVsYXRlZCB2YWx1ZSBwcmV2aW91c2x5IHJldHVybmVkIGluIHRoZSBsYXN0IGludm9jYXRpb25cbiAqIG9mIHRoZSBjYWxsYmFjaywgb3IgaW5pdGlhbFZhbHVlLCBpZiBzdXBwbGllZC5cbiAqIEBwYXJhbSB7R2VvbWV0cnl9IGN1cnJlbnRHZW9tZXRyeSBUaGUgY3VycmVudCBGZWF0dXJlIGJlaW5nIHByb2Nlc3NlZC5cbiAqIEBwYXJhbSB7bnVtYmVyfSBjdXJyZW50SW5kZXggVGhlIGluZGV4IG9mIHRoZSBjdXJyZW50IGVsZW1lbnQgYmVpbmcgcHJvY2Vzc2VkIGluIHRoZVxuICogYXJyYXkuU3RhcnRzIGF0IGluZGV4IDAsIGlmIGFuIGluaXRpYWxWYWx1ZSBpcyBwcm92aWRlZCwgYW5kIGF0IGluZGV4IDEgb3RoZXJ3aXNlLlxuICogQHBhcmFtIHtPYmplY3R9IGN1cnJlbnRQcm9wZXJ0aWVzIFRoZSBjdXJyZW50IGZlYXR1cmUgcHJvcGVydGllcyBiZWluZyBwcm9jZXNzZWQuXG4gKi9cblxuLyoqXG4gKiBSZWR1Y2UgZ2VvbWV0cnkgaW4gYW55IEdlb0pTT04gb2JqZWN0LCBzaW1pbGFyIHRvIEFycmF5LnJlZHVjZSgpLlxuICpcbiAqIEBuYW1lIGdlb21SZWR1Y2VcbiAqIEBwYXJhbSB7KEZlYXR1cmVDb2xsZWN0aW9ufEZlYXR1cmV8R2VvbWV0cnkpfSBnZW9qc29uIGFueSBHZW9KU09OIG9iamVjdFxuICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgYSBtZXRob2QgdGhhdCB0YWtlcyAocHJldmlvdXNWYWx1ZSwgY3VycmVudEdlb21ldHJ5LCBmZWF0dXJlSW5kZXgsIGN1cnJlbnRQcm9wZXJ0aWVzKVxuICogQHBhcmFtIHsqfSBbaW5pdGlhbFZhbHVlXSBWYWx1ZSB0byB1c2UgYXMgdGhlIGZpcnN0IGFyZ3VtZW50IHRvIHRoZSBmaXJzdCBjYWxsIG9mIHRoZSBjYWxsYmFjay5cbiAqIEByZXR1cm5zIHsqfSBUaGUgdmFsdWUgdGhhdCByZXN1bHRzIGZyb20gdGhlIHJlZHVjdGlvbi5cbiAqIEBleGFtcGxlXG4gKiB2YXIgZmVhdHVyZXMgPSB0dXJmLmZlYXR1cmVDb2xsZWN0aW9uKFtcbiAqICAgICB0dXJmLnBvaW50KFsyNiwgMzddLCB7Zm9vOiAnYmFyJ30pLFxuICogICAgIHR1cmYucG9pbnQoWzM2LCA1M10sIHtoZWxsbzogJ3dvcmxkJ30pXG4gKiBdKTtcbiAqXG4gKiB0dXJmLmdlb21SZWR1Y2UoZmVhdHVyZXMsIGZ1bmN0aW9uIChwcmV2aW91c1ZhbHVlLCBjdXJyZW50R2VvbWV0cnksIGZlYXR1cmVJbmRleCwgY3VycmVudFByb3BlcnRpZXMpIHtcbiAqICAgLy89cHJldmlvdXNWYWx1ZVxuICogICAvLz1jdXJyZW50R2VvbWV0cnlcbiAqICAgLy89ZmVhdHVyZUluZGV4XG4gKiAgIC8vPWN1cnJlbnRQcm9wZXJ0aWVzXG4gKiAgIHJldHVybiBjdXJyZW50R2VvbWV0cnlcbiAqIH0pO1xuICovXG5leHBvcnQgZnVuY3Rpb24gZ2VvbVJlZHVjZShnZW9qc29uLCBjYWxsYmFjaywgaW5pdGlhbFZhbHVlKSB7XG4gICAgdmFyIHByZXZpb3VzVmFsdWUgPSBpbml0aWFsVmFsdWU7XG4gICAgZ2VvbUVhY2goZ2VvanNvbiwgZnVuY3Rpb24gKGN1cnJlbnRHZW9tZXRyeSwgY3VycmVudEluZGV4LCBjdXJyZW50UHJvcGVydGllcykge1xuICAgICAgICBpZiAoY3VycmVudEluZGV4ID09PSAwICYmIGluaXRpYWxWYWx1ZSA9PT0gdW5kZWZpbmVkKSBwcmV2aW91c1ZhbHVlID0gY3VycmVudEdlb21ldHJ5O1xuICAgICAgICBlbHNlIHByZXZpb3VzVmFsdWUgPSBjYWxsYmFjayhwcmV2aW91c1ZhbHVlLCBjdXJyZW50R2VvbWV0cnksIGN1cnJlbnRJbmRleCwgY3VycmVudFByb3BlcnRpZXMpO1xuICAgIH0pO1xuICAgIHJldHVybiBwcmV2aW91c1ZhbHVlO1xufVxuXG4vKipcbiAqIENhbGxiYWNrIGZvciBmbGF0dGVuRWFjaFxuICpcbiAqIEBjYWxsYmFjayBmbGF0dGVuRWFjaENhbGxiYWNrXG4gKiBAcGFyYW0ge0ZlYXR1cmV9IGN1cnJlbnRGZWF0dXJlIFRoZSBjdXJyZW50IGZsYXR0ZW5lZCBmZWF0dXJlIGJlaW5nIHByb2Nlc3NlZC5cbiAqIEBwYXJhbSB7bnVtYmVyfSBmZWF0dXJlSW5kZXggVGhlIGluZGV4IG9mIHRoZSBjdXJyZW50IGVsZW1lbnQgYmVpbmcgcHJvY2Vzc2VkIGluIHRoZVxuICogYXJyYXkuIFN0YXJ0cyBhdCBpbmRleCAwLCBpZiBhbiBpbml0aWFsVmFsdWUgaXMgcHJvdmlkZWQsIGFuZCBhdCBpbmRleCAxIG90aGVyd2lzZS5cbiAqIEBwYXJhbSB7bnVtYmVyfSBmZWF0dXJlU3ViSW5kZXggVGhlIHN1YmluZGV4IG9mIHRoZSBjdXJyZW50IGVsZW1lbnQgYmVpbmcgcHJvY2Vzc2VkIGluIHRoZVxuICogYXJyYXkuIFN0YXJ0cyBhdCBpbmRleCAwIGFuZCBpbmNyZWFzZXMgaWYgdGhlIGZsYXR0ZW5lZCBmZWF0dXJlIHdhcyBhIG11bHRpLWdlb21ldHJ5LlxuICovXG5cbi8qKlxuICogSXRlcmF0ZSBvdmVyIGZsYXR0ZW5lZCBmZWF0dXJlcyBpbiBhbnkgR2VvSlNPTiBvYmplY3QsIHNpbWlsYXIgdG9cbiAqIEFycmF5LmZvckVhY2guXG4gKlxuICogQG5hbWUgZmxhdHRlbkVhY2hcbiAqIEBwYXJhbSB7KEZlYXR1cmVDb2xsZWN0aW9ufEZlYXR1cmV8R2VvbWV0cnkpfSBnZW9qc29uIGFueSBHZW9KU09OIG9iamVjdFxuICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgYSBtZXRob2QgdGhhdCB0YWtlcyAoY3VycmVudEZlYXR1cmUsIGZlYXR1cmVJbmRleCwgZmVhdHVyZVN1YkluZGV4KVxuICogQGV4YW1wbGVcbiAqIHZhciBmZWF0dXJlcyA9IHR1cmYuZmVhdHVyZUNvbGxlY3Rpb24oW1xuICogICAgIHR1cmYucG9pbnQoWzI2LCAzN10sIHtmb286ICdiYXInfSksXG4gKiAgICAgdHVyZi5tdWx0aVBvaW50KFtbNDAsIDMwXSwgWzM2LCA1M11dLCB7aGVsbG86ICd3b3JsZCd9KVxuICogXSk7XG4gKlxuICogdHVyZi5mbGF0dGVuRWFjaChmZWF0dXJlcywgZnVuY3Rpb24gKGN1cnJlbnRGZWF0dXJlLCBmZWF0dXJlSW5kZXgsIGZlYXR1cmVTdWJJbmRleCkge1xuICogICAvLz1jdXJyZW50RmVhdHVyZVxuICogICAvLz1mZWF0dXJlSW5kZXhcbiAqICAgLy89ZmVhdHVyZVN1YkluZGV4XG4gKiB9KTtcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZsYXR0ZW5FYWNoKGdlb2pzb24sIGNhbGxiYWNrKSB7XG4gICAgZ2VvbUVhY2goZ2VvanNvbiwgZnVuY3Rpb24gKGdlb21ldHJ5LCBmZWF0dXJlSW5kZXgsIHByb3BlcnRpZXMpIHtcbiAgICAgICAgLy8gQ2FsbGJhY2sgZm9yIHNpbmdsZSBnZW9tZXRyeVxuICAgICAgICB2YXIgdHlwZSA9IChnZW9tZXRyeSA9PT0gbnVsbCkgPyBudWxsIDogZ2VvbWV0cnkudHlwZTtcbiAgICAgICAgc3dpdGNoICh0eXBlKSB7XG4gICAgICAgIGNhc2UgbnVsbDpcbiAgICAgICAgY2FzZSAnUG9pbnQnOlxuICAgICAgICBjYXNlICdMaW5lU3RyaW5nJzpcbiAgICAgICAgY2FzZSAnUG9seWdvbic6XG4gICAgICAgICAgICBjYWxsYmFjayhmZWF0dXJlKGdlb21ldHJ5LCBwcm9wZXJ0aWVzKSwgZmVhdHVyZUluZGV4LCAwKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBnZW9tVHlwZTtcblxuICAgICAgICAvLyBDYWxsYmFjayBmb3IgbXVsdGktZ2VvbWV0cnlcbiAgICAgICAgc3dpdGNoICh0eXBlKSB7XG4gICAgICAgIGNhc2UgJ011bHRpUG9pbnQnOlxuICAgICAgICAgICAgZ2VvbVR5cGUgPSAnUG9pbnQnO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ011bHRpTGluZVN0cmluZyc6XG4gICAgICAgICAgICBnZW9tVHlwZSA9ICdMaW5lU3RyaW5nJztcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdNdWx0aVBvbHlnb24nOlxuICAgICAgICAgICAgZ2VvbVR5cGUgPSAnUG9seWdvbic7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuXG4gICAgICAgIGdlb21ldHJ5LmNvb3JkaW5hdGVzLmZvckVhY2goZnVuY3Rpb24gKGNvb3JkaW5hdGUsIGZlYXR1cmVTdWJJbmRleCkge1xuICAgICAgICAgICAgdmFyIGdlb20gPSB7XG4gICAgICAgICAgICAgICAgdHlwZTogZ2VvbVR5cGUsXG4gICAgICAgICAgICAgICAgY29vcmRpbmF0ZXM6IGNvb3JkaW5hdGVcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBjYWxsYmFjayhmZWF0dXJlKGdlb20sIHByb3BlcnRpZXMpLCBmZWF0dXJlSW5kZXgsIGZlYXR1cmVTdWJJbmRleCk7XG4gICAgICAgIH0pO1xuXG4gICAgfSk7XG59XG5cbi8qKlxuICogQ2FsbGJhY2sgZm9yIGZsYXR0ZW5SZWR1Y2VcbiAqXG4gKiBUaGUgZmlyc3QgdGltZSB0aGUgY2FsbGJhY2sgZnVuY3Rpb24gaXMgY2FsbGVkLCB0aGUgdmFsdWVzIHByb3ZpZGVkIGFzIGFyZ3VtZW50cyBkZXBlbmRcbiAqIG9uIHdoZXRoZXIgdGhlIHJlZHVjZSBtZXRob2QgaGFzIGFuIGluaXRpYWxWYWx1ZSBhcmd1bWVudC5cbiAqXG4gKiBJZiBhbiBpbml0aWFsVmFsdWUgaXMgcHJvdmlkZWQgdG8gdGhlIHJlZHVjZSBtZXRob2Q6XG4gKiAgLSBUaGUgcHJldmlvdXNWYWx1ZSBhcmd1bWVudCBpcyBpbml0aWFsVmFsdWUuXG4gKiAgLSBUaGUgY3VycmVudFZhbHVlIGFyZ3VtZW50IGlzIHRoZSB2YWx1ZSBvZiB0aGUgZmlyc3QgZWxlbWVudCBwcmVzZW50IGluIHRoZSBhcnJheS5cbiAqXG4gKiBJZiBhbiBpbml0aWFsVmFsdWUgaXMgbm90IHByb3ZpZGVkOlxuICogIC0gVGhlIHByZXZpb3VzVmFsdWUgYXJndW1lbnQgaXMgdGhlIHZhbHVlIG9mIHRoZSBmaXJzdCBlbGVtZW50IHByZXNlbnQgaW4gdGhlIGFycmF5LlxuICogIC0gVGhlIGN1cnJlbnRWYWx1ZSBhcmd1bWVudCBpcyB0aGUgdmFsdWUgb2YgdGhlIHNlY29uZCBlbGVtZW50IHByZXNlbnQgaW4gdGhlIGFycmF5LlxuICpcbiAqIEBjYWxsYmFjayBmbGF0dGVuUmVkdWNlQ2FsbGJhY2tcbiAqIEBwYXJhbSB7Kn0gcHJldmlvdXNWYWx1ZSBUaGUgYWNjdW11bGF0ZWQgdmFsdWUgcHJldmlvdXNseSByZXR1cm5lZCBpbiB0aGUgbGFzdCBpbnZvY2F0aW9uXG4gKiBvZiB0aGUgY2FsbGJhY2ssIG9yIGluaXRpYWxWYWx1ZSwgaWYgc3VwcGxpZWQuXG4gKiBAcGFyYW0ge0ZlYXR1cmV9IGN1cnJlbnRGZWF0dXJlIFRoZSBjdXJyZW50IEZlYXR1cmUgYmVpbmcgcHJvY2Vzc2VkLlxuICogQHBhcmFtIHtudW1iZXJ9IGZlYXR1cmVJbmRleCBUaGUgaW5kZXggb2YgdGhlIGN1cnJlbnQgZWxlbWVudCBiZWluZyBwcm9jZXNzZWQgaW4gdGhlXG4gKiBhcnJheS5TdGFydHMgYXQgaW5kZXggMCwgaWYgYW4gaW5pdGlhbFZhbHVlIGlzIHByb3ZpZGVkLCBhbmQgYXQgaW5kZXggMSBvdGhlcndpc2UuXG4gKiBAcGFyYW0ge251bWJlcn0gZmVhdHVyZVN1YkluZGV4IFRoZSBzdWJpbmRleCBvZiB0aGUgY3VycmVudCBlbGVtZW50IGJlaW5nIHByb2Nlc3NlZCBpbiB0aGVcbiAqIGFycmF5LiBTdGFydHMgYXQgaW5kZXggMCBhbmQgaW5jcmVhc2VzIGlmIHRoZSBmbGF0dGVuZWQgZmVhdHVyZSB3YXMgYSBtdWx0aS1nZW9tZXRyeS5cbiAqL1xuXG4vKipcbiAqIFJlZHVjZSBmbGF0dGVuZWQgZmVhdHVyZXMgaW4gYW55IEdlb0pTT04gb2JqZWN0LCBzaW1pbGFyIHRvIEFycmF5LnJlZHVjZSgpLlxuICpcbiAqIEBuYW1lIGZsYXR0ZW5SZWR1Y2VcbiAqIEBwYXJhbSB7KEZlYXR1cmVDb2xsZWN0aW9ufEZlYXR1cmV8R2VvbWV0cnkpfSBnZW9qc29uIGFueSBHZW9KU09OIG9iamVjdFxuICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgYSBtZXRob2QgdGhhdCB0YWtlcyAocHJldmlvdXNWYWx1ZSwgY3VycmVudEZlYXR1cmUsIGZlYXR1cmVJbmRleCwgZmVhdHVyZVN1YkluZGV4KVxuICogQHBhcmFtIHsqfSBbaW5pdGlhbFZhbHVlXSBWYWx1ZSB0byB1c2UgYXMgdGhlIGZpcnN0IGFyZ3VtZW50IHRvIHRoZSBmaXJzdCBjYWxsIG9mIHRoZSBjYWxsYmFjay5cbiAqIEByZXR1cm5zIHsqfSBUaGUgdmFsdWUgdGhhdCByZXN1bHRzIGZyb20gdGhlIHJlZHVjdGlvbi5cbiAqIEBleGFtcGxlXG4gKiB2YXIgZmVhdHVyZXMgPSB0dXJmLmZlYXR1cmVDb2xsZWN0aW9uKFtcbiAqICAgICB0dXJmLnBvaW50KFsyNiwgMzddLCB7Zm9vOiAnYmFyJ30pLFxuICogICAgIHR1cmYubXVsdGlQb2ludChbWzQwLCAzMF0sIFszNiwgNTNdXSwge2hlbGxvOiAnd29ybGQnfSlcbiAqIF0pO1xuICpcbiAqIHR1cmYuZmxhdHRlblJlZHVjZShmZWF0dXJlcywgZnVuY3Rpb24gKHByZXZpb3VzVmFsdWUsIGN1cnJlbnRGZWF0dXJlLCBmZWF0dXJlSW5kZXgsIGZlYXR1cmVTdWJJbmRleCkge1xuICogICAvLz1wcmV2aW91c1ZhbHVlXG4gKiAgIC8vPWN1cnJlbnRGZWF0dXJlXG4gKiAgIC8vPWZlYXR1cmVJbmRleFxuICogICAvLz1mZWF0dXJlU3ViSW5kZXhcbiAqICAgcmV0dXJuIGN1cnJlbnRGZWF0dXJlXG4gKiB9KTtcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZsYXR0ZW5SZWR1Y2UoZ2VvanNvbiwgY2FsbGJhY2ssIGluaXRpYWxWYWx1ZSkge1xuICAgIHZhciBwcmV2aW91c1ZhbHVlID0gaW5pdGlhbFZhbHVlO1xuICAgIGZsYXR0ZW5FYWNoKGdlb2pzb24sIGZ1bmN0aW9uIChjdXJyZW50RmVhdHVyZSwgZmVhdHVyZUluZGV4LCBmZWF0dXJlU3ViSW5kZXgpIHtcbiAgICAgICAgaWYgKGZlYXR1cmVJbmRleCA9PT0gMCAmJiBmZWF0dXJlU3ViSW5kZXggPT09IDAgJiYgaW5pdGlhbFZhbHVlID09PSB1bmRlZmluZWQpIHByZXZpb3VzVmFsdWUgPSBjdXJyZW50RmVhdHVyZTtcbiAgICAgICAgZWxzZSBwcmV2aW91c1ZhbHVlID0gY2FsbGJhY2socHJldmlvdXNWYWx1ZSwgY3VycmVudEZlYXR1cmUsIGZlYXR1cmVJbmRleCwgZmVhdHVyZVN1YkluZGV4KTtcbiAgICB9KTtcbiAgICByZXR1cm4gcHJldmlvdXNWYWx1ZTtcbn1cblxuLyoqXG4gKiBDYWxsYmFjayBmb3Igc2VnbWVudEVhY2hcbiAqXG4gKiBAY2FsbGJhY2sgc2VnbWVudEVhY2hDYWxsYmFja1xuICogQHBhcmFtIHtGZWF0dXJlPExpbmVTdHJpbmc+fSBjdXJyZW50U2VnbWVudCBUaGUgY3VycmVudCBzZWdtZW50IGJlaW5nIHByb2Nlc3NlZC5cbiAqIEBwYXJhbSB7bnVtYmVyfSBmZWF0dXJlSW5kZXggVGhlIGZlYXR1cmVJbmRleCBjdXJyZW50bHkgYmVpbmcgcHJvY2Vzc2VkLCBzdGFydHMgYXQgaW5kZXggMC5cbiAqIEBwYXJhbSB7bnVtYmVyfSBmZWF0dXJlU3ViSW5kZXggVGhlIGZlYXR1cmVTdWJJbmRleCBjdXJyZW50bHkgYmVpbmcgcHJvY2Vzc2VkLCBzdGFydHMgYXQgaW5kZXggMC5cbiAqIEBwYXJhbSB7bnVtYmVyfSBzZWdtZW50SW5kZXggVGhlIHNlZ21lbnRJbmRleCBjdXJyZW50bHkgYmVpbmcgcHJvY2Vzc2VkLCBzdGFydHMgYXQgaW5kZXggMC5cbiAqIEByZXR1cm5zIHt2b2lkfVxuICovXG5cbi8qKlxuICogSXRlcmF0ZSBvdmVyIDItdmVydGV4IGxpbmUgc2VnbWVudCBpbiBhbnkgR2VvSlNPTiBvYmplY3QsIHNpbWlsYXIgdG8gQXJyYXkuZm9yRWFjaCgpXG4gKiAoTXVsdGkpUG9pbnQgZ2VvbWV0cmllcyBkbyBub3QgY29udGFpbiBzZWdtZW50cyB0aGVyZWZvcmUgdGhleSBhcmUgaWdub3JlZCBkdXJpbmcgdGhpcyBvcGVyYXRpb24uXG4gKlxuICogQHBhcmFtIHsoRmVhdHVyZUNvbGxlY3Rpb258RmVhdHVyZXxHZW9tZXRyeSl9IGdlb2pzb24gYW55IEdlb0pTT05cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIGEgbWV0aG9kIHRoYXQgdGFrZXMgKGN1cnJlbnRTZWdtZW50LCBmZWF0dXJlSW5kZXgsIGZlYXR1cmVTdWJJbmRleClcbiAqIEByZXR1cm5zIHt2b2lkfVxuICogQGV4YW1wbGVcbiAqIHZhciBwb2x5Z29uID0gdHVyZi5wb2x5Z29uKFtbWy01MCwgNV0sIFstNDAsIC0xMF0sIFstNTAsIC0xMF0sIFstNDAsIDVdLCBbLTUwLCA1XV1dKTtcbiAqXG4gKiAvLyBJdGVyYXRlIG92ZXIgR2VvSlNPTiBieSAyLXZlcnRleCBzZWdtZW50c1xuICogdHVyZi5zZWdtZW50RWFjaChwb2x5Z29uLCBmdW5jdGlvbiAoY3VycmVudFNlZ21lbnQsIGZlYXR1cmVJbmRleCwgZmVhdHVyZVN1YkluZGV4LCBzZWdtZW50SW5kZXgpIHtcbiAqICAgLy89IGN1cnJlbnRTZWdtZW50XG4gKiAgIC8vPSBmZWF0dXJlSW5kZXhcbiAqICAgLy89IGZlYXR1cmVTdWJJbmRleFxuICogICAvLz0gc2VnbWVudEluZGV4XG4gKiB9KTtcbiAqXG4gKiAvLyBDYWxjdWxhdGUgdGhlIHRvdGFsIG51bWJlciBvZiBzZWdtZW50c1xuICogdmFyIHRvdGFsID0gMDtcbiAqIHR1cmYuc2VnbWVudEVhY2gocG9seWdvbiwgZnVuY3Rpb24gKCkge1xuICogICAgIHRvdGFsKys7XG4gKiB9KTtcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNlZ21lbnRFYWNoKGdlb2pzb24sIGNhbGxiYWNrKSB7XG4gICAgZmxhdHRlbkVhY2goZ2VvanNvbiwgZnVuY3Rpb24gKGZlYXR1cmUsIGZlYXR1cmVJbmRleCwgZmVhdHVyZVN1YkluZGV4KSB7XG4gICAgICAgIHZhciBzZWdtZW50SW5kZXggPSAwO1xuXG4gICAgICAgIC8vIEV4Y2x1ZGUgbnVsbCBHZW9tZXRyaWVzXG4gICAgICAgIGlmICghZmVhdHVyZS5nZW9tZXRyeSkgcmV0dXJuO1xuICAgICAgICAvLyAoTXVsdGkpUG9pbnQgZ2VvbWV0cmllcyBkbyBub3QgY29udGFpbiBzZWdtZW50cyB0aGVyZWZvcmUgdGhleSBhcmUgaWdub3JlZCBkdXJpbmcgdGhpcyBvcGVyYXRpb24uXG4gICAgICAgIHZhciB0eXBlID0gZmVhdHVyZS5nZW9tZXRyeS50eXBlO1xuICAgICAgICBpZiAodHlwZSA9PT0gJ1BvaW50JyB8fCB0eXBlID09PSAnTXVsdGlQb2ludCcpIHJldHVybjtcblxuICAgICAgICAvLyBHZW5lcmF0ZSAyLXZlcnRleCBsaW5lIHNlZ21lbnRzXG4gICAgICAgIGNvb3JkUmVkdWNlKGZlYXR1cmUsIGZ1bmN0aW9uIChwcmV2aW91c0Nvb3JkcywgY3VycmVudENvb3JkKSB7XG4gICAgICAgICAgICB2YXIgY3VycmVudFNlZ21lbnQgPSBsaW5lU3RyaW5nKFtwcmV2aW91c0Nvb3JkcywgY3VycmVudENvb3JkXSwgZmVhdHVyZS5wcm9wZXJ0aWVzKTtcbiAgICAgICAgICAgIGNhbGxiYWNrKGN1cnJlbnRTZWdtZW50LCBmZWF0dXJlSW5kZXgsIGZlYXR1cmVTdWJJbmRleCwgc2VnbWVudEluZGV4KTtcbiAgICAgICAgICAgIHNlZ21lbnRJbmRleCsrO1xuICAgICAgICAgICAgcmV0dXJuIGN1cnJlbnRDb29yZDtcbiAgICAgICAgfSk7XG4gICAgfSk7XG59XG5cbi8qKlxuICogQ2FsbGJhY2sgZm9yIHNlZ21lbnRSZWR1Y2VcbiAqXG4gKiBUaGUgZmlyc3QgdGltZSB0aGUgY2FsbGJhY2sgZnVuY3Rpb24gaXMgY2FsbGVkLCB0aGUgdmFsdWVzIHByb3ZpZGVkIGFzIGFyZ3VtZW50cyBkZXBlbmRcbiAqIG9uIHdoZXRoZXIgdGhlIHJlZHVjZSBtZXRob2QgaGFzIGFuIGluaXRpYWxWYWx1ZSBhcmd1bWVudC5cbiAqXG4gKiBJZiBhbiBpbml0aWFsVmFsdWUgaXMgcHJvdmlkZWQgdG8gdGhlIHJlZHVjZSBtZXRob2Q6XG4gKiAgLSBUaGUgcHJldmlvdXNWYWx1ZSBhcmd1bWVudCBpcyBpbml0aWFsVmFsdWUuXG4gKiAgLSBUaGUgY3VycmVudFZhbHVlIGFyZ3VtZW50IGlzIHRoZSB2YWx1ZSBvZiB0aGUgZmlyc3QgZWxlbWVudCBwcmVzZW50IGluIHRoZSBhcnJheS5cbiAqXG4gKiBJZiBhbiBpbml0aWFsVmFsdWUgaXMgbm90IHByb3ZpZGVkOlxuICogIC0gVGhlIHByZXZpb3VzVmFsdWUgYXJndW1lbnQgaXMgdGhlIHZhbHVlIG9mIHRoZSBmaXJzdCBlbGVtZW50IHByZXNlbnQgaW4gdGhlIGFycmF5LlxuICogIC0gVGhlIGN1cnJlbnRWYWx1ZSBhcmd1bWVudCBpcyB0aGUgdmFsdWUgb2YgdGhlIHNlY29uZCBlbGVtZW50IHByZXNlbnQgaW4gdGhlIGFycmF5LlxuICpcbiAqIEBjYWxsYmFjayBzZWdtZW50UmVkdWNlQ2FsbGJhY2tcbiAqIEBwYXJhbSB7Kn0gW3ByZXZpb3VzVmFsdWVdIFRoZSBhY2N1bXVsYXRlZCB2YWx1ZSBwcmV2aW91c2x5IHJldHVybmVkIGluIHRoZSBsYXN0IGludm9jYXRpb25cbiAqIG9mIHRoZSBjYWxsYmFjaywgb3IgaW5pdGlhbFZhbHVlLCBpZiBzdXBwbGllZC5cbiAqIEBwYXJhbSB7RmVhdHVyZTxMaW5lU3RyaW5nPn0gW2N1cnJlbnRTZWdtZW50XSBUaGUgY3VycmVudCBzZWdtZW50IGJlaW5nIHByb2Nlc3NlZC5cbiAqIEBwYXJhbSB7bnVtYmVyfSBmZWF0dXJlSW5kZXggVGhlIGZlYXR1cmVJbmRleCBjdXJyZW50bHkgYmVpbmcgcHJvY2Vzc2VkLCBzdGFydHMgYXQgaW5kZXggMC5cbiAqIEBwYXJhbSB7bnVtYmVyfSBmZWF0dXJlU3ViSW5kZXggVGhlIGZlYXR1cmVTdWJJbmRleCBjdXJyZW50bHkgYmVpbmcgcHJvY2Vzc2VkLCBzdGFydHMgYXQgaW5kZXggMC5cbiAqIEBwYXJhbSB7bnVtYmVyfSBzZWdtZW50SW5kZXggVGhlIHNlZ21lbnRJbmRleCBjdXJyZW50bHkgYmVpbmcgcHJvY2Vzc2VkLCBzdGFydHMgYXQgaW5kZXggMC5cbiAqL1xuXG4vKipcbiAqIFJlZHVjZSAyLXZlcnRleCBsaW5lIHNlZ21lbnQgaW4gYW55IEdlb0pTT04gb2JqZWN0LCBzaW1pbGFyIHRvIEFycmF5LnJlZHVjZSgpXG4gKiAoTXVsdGkpUG9pbnQgZ2VvbWV0cmllcyBkbyBub3QgY29udGFpbiBzZWdtZW50cyB0aGVyZWZvcmUgdGhleSBhcmUgaWdub3JlZCBkdXJpbmcgdGhpcyBvcGVyYXRpb24uXG4gKlxuICogQHBhcmFtIHsoRmVhdHVyZUNvbGxlY3Rpb258RmVhdHVyZXxHZW9tZXRyeSl9IGdlb2pzb24gYW55IEdlb0pTT05cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIGEgbWV0aG9kIHRoYXQgdGFrZXMgKHByZXZpb3VzVmFsdWUsIGN1cnJlbnRTZWdtZW50LCBjdXJyZW50SW5kZXgpXG4gKiBAcGFyYW0geyp9IFtpbml0aWFsVmFsdWVdIFZhbHVlIHRvIHVzZSBhcyB0aGUgZmlyc3QgYXJndW1lbnQgdG8gdGhlIGZpcnN0IGNhbGwgb2YgdGhlIGNhbGxiYWNrLlxuICogQHJldHVybnMge3ZvaWR9XG4gKiBAZXhhbXBsZVxuICogdmFyIHBvbHlnb24gPSB0dXJmLnBvbHlnb24oW1tbLTUwLCA1XSwgWy00MCwgLTEwXSwgWy01MCwgLTEwXSwgWy00MCwgNV0sIFstNTAsIDVdXV0pO1xuICpcbiAqIC8vIEl0ZXJhdGUgb3ZlciBHZW9KU09OIGJ5IDItdmVydGV4IHNlZ21lbnRzXG4gKiB0dXJmLnNlZ21lbnRSZWR1Y2UocG9seWdvbiwgZnVuY3Rpb24gKHByZXZpb3VzU2VnbWVudCwgY3VycmVudFNlZ21lbnQsIGZlYXR1cmVJbmRleCwgZmVhdHVyZVN1YkluZGV4LCBzZWdtZW50SW5kZXgpIHtcbiAqICAgLy89IHByZXZpb3VzU2VnbWVudFxuICogICAvLz0gY3VycmVudFNlZ21lbnRcbiAqICAgLy89IGZlYXR1cmVJbmRleFxuICogICAvLz0gZmVhdHVyZVN1YkluZGV4XG4gKiAgIC8vPSBzZWdtZW50SW5leFxuICogICByZXR1cm4gY3VycmVudFNlZ21lbnRcbiAqIH0pO1xuICpcbiAqIC8vIENhbGN1bGF0ZSB0aGUgdG90YWwgbnVtYmVyIG9mIHNlZ21lbnRzXG4gKiB2YXIgaW5pdGlhbFZhbHVlID0gMFxuICogdmFyIHRvdGFsID0gdHVyZi5zZWdtZW50UmVkdWNlKHBvbHlnb24sIGZ1bmN0aW9uIChwcmV2aW91c1ZhbHVlKSB7XG4gKiAgICAgcHJldmlvdXNWYWx1ZSsrO1xuICogICAgIHJldHVybiBwcmV2aW91c1ZhbHVlO1xuICogfSwgaW5pdGlhbFZhbHVlKTtcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNlZ21lbnRSZWR1Y2UoZ2VvanNvbiwgY2FsbGJhY2ssIGluaXRpYWxWYWx1ZSkge1xuICAgIHZhciBwcmV2aW91c1ZhbHVlID0gaW5pdGlhbFZhbHVlO1xuICAgIHZhciBzdGFydGVkID0gZmFsc2U7XG4gICAgc2VnbWVudEVhY2goZ2VvanNvbiwgZnVuY3Rpb24gKGN1cnJlbnRTZWdtZW50LCBmZWF0dXJlSW5kZXgsIGZlYXR1cmVTdWJJbmRleCwgc2VnbWVudEluZGV4KSB7XG4gICAgICAgIGlmIChzdGFydGVkID09PSBmYWxzZSAmJiBpbml0aWFsVmFsdWUgPT09IHVuZGVmaW5lZCkgcHJldmlvdXNWYWx1ZSA9IGN1cnJlbnRTZWdtZW50O1xuICAgICAgICBlbHNlIHByZXZpb3VzVmFsdWUgPSBjYWxsYmFjayhwcmV2aW91c1ZhbHVlLCBjdXJyZW50U2VnbWVudCwgZmVhdHVyZUluZGV4LCBmZWF0dXJlU3ViSW5kZXgsIHNlZ21lbnRJbmRleCk7XG4gICAgICAgIHN0YXJ0ZWQgPSB0cnVlO1xuICAgIH0pO1xuICAgIHJldHVybiBwcmV2aW91c1ZhbHVlO1xufVxuXG4vKipcbiAqIENyZWF0ZSBGZWF0dXJlXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7R2VvbWV0cnl9IGdlb21ldHJ5IEdlb0pTT04gR2VvbWV0cnlcbiAqIEBwYXJhbSB7T2JqZWN0fSBwcm9wZXJ0aWVzIFByb3BlcnRpZXNcbiAqIEByZXR1cm5zIHtGZWF0dXJlfSBHZW9KU09OIEZlYXR1cmVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZlYXR1cmUoZ2VvbWV0cnksIHByb3BlcnRpZXMpIHtcbiAgICBpZiAoZ2VvbWV0cnkgPT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IEVycm9yKCdObyBnZW9tZXRyeSBwYXNzZWQnKTtcblxuICAgIHJldHVybiB7XG4gICAgICAgIHR5cGU6ICdGZWF0dXJlJyxcbiAgICAgICAgcHJvcGVydGllczogcHJvcGVydGllcyB8fCB7fSxcbiAgICAgICAgZ2VvbWV0cnk6IGdlb21ldHJ5XG4gICAgfTtcbn1cblxuLyoqXG4gKiBDcmVhdGUgTGluZVN0cmluZ1xuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge0FycmF5PEFycmF5PG51bWJlcj4+fSBjb29yZGluYXRlcyBMaW5lIENvb3JkaW5hdGVzXG4gKiBAcGFyYW0ge09iamVjdH0gcHJvcGVydGllcyBQcm9wZXJ0aWVzXG4gKiBAcmV0dXJucyB7RmVhdHVyZTxMaW5lU3RyaW5nPn0gR2VvSlNPTiBMaW5lU3RyaW5nIEZlYXR1cmVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGxpbmVTdHJpbmcoY29vcmRpbmF0ZXMsIHByb3BlcnRpZXMpIHtcbiAgICBpZiAoIWNvb3JkaW5hdGVzKSB0aHJvdyBuZXcgRXJyb3IoJ05vIGNvb3JkaW5hdGVzIHBhc3NlZCcpO1xuICAgIGlmIChjb29yZGluYXRlcy5sZW5ndGggPCAyKSB0aHJvdyBuZXcgRXJyb3IoJ0Nvb3JkaW5hdGVzIG11c3QgYmUgYW4gYXJyYXkgb2YgdHdvIG9yIG1vcmUgcG9zaXRpb25zJyk7XG5cbiAgICByZXR1cm4ge1xuICAgICAgICB0eXBlOiAnRmVhdHVyZScsXG4gICAgICAgIHByb3BlcnRpZXM6IHByb3BlcnRpZXMgfHwge30sXG4gICAgICAgIGdlb21ldHJ5OiB7XG4gICAgICAgICAgICB0eXBlOiAnTGluZVN0cmluZycsXG4gICAgICAgICAgICBjb29yZGluYXRlczogY29vcmRpbmF0ZXNcbiAgICAgICAgfVxuICAgIH07XG59XG5cblxuLyoqXG4gKiBDYWxsYmFjayBmb3IgbGluZUVhY2hcbiAqXG4gKiBAY2FsbGJhY2sgbGluZUVhY2hDYWxsYmFja1xuICogQHBhcmFtIHtGZWF0dXJlPExpbmVTdHJpbmc+fSBjdXJyZW50TGluZSBUaGUgY3VycmVudCBMaW5lU3RyaW5nfExpbmVhclJpbmcgYmVpbmcgcHJvY2Vzc2VkLlxuICogQHBhcmFtIHtudW1iZXJ9IGxpbmVJbmRleCBUaGUgaW5kZXggb2YgdGhlIGN1cnJlbnQgZWxlbWVudCBiZWluZyBwcm9jZXNzZWQgaW4gdGhlIGFycmF5LCBzdGFydHMgYXQgaW5kZXggMC5cbiAqIEBwYXJhbSB7bnVtYmVyfSBsaW5lU3ViSW5kZXggVGhlIHN1Yi1pbmRleCBvZiB0aGUgY3VycmVudCBsaW5lIGJlaW5nIHByb2Nlc3NlZCBhdCBpbmRleCAwXG4gKi9cblxuLyoqXG4gKiBJdGVyYXRlIG92ZXIgbGluZSBvciByaW5nIGNvb3JkaW5hdGVzIGluIExpbmVTdHJpbmcsIFBvbHlnb24sIE11bHRpTGluZVN0cmluZywgTXVsdGlQb2x5Z29uIEZlYXR1cmVzIG9yIEdlb21ldHJpZXMsXG4gKiBzaW1pbGFyIHRvIEFycmF5LmZvckVhY2guXG4gKlxuICogQG5hbWUgbGluZUVhY2hcbiAqIEBwYXJhbSB7R2VvbWV0cnl8RmVhdHVyZTxMaW5lU3RyaW5nfFBvbHlnb258TXVsdGlMaW5lU3RyaW5nfE11bHRpUG9seWdvbj59IGdlb2pzb24gb2JqZWN0XG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayBhIG1ldGhvZCB0aGF0IHRha2VzIChjdXJyZW50TGluZSwgbGluZUluZGV4LCBsaW5lU3ViSW5kZXgpXG4gKiBAZXhhbXBsZVxuICogdmFyIG10TG4gPSB0dXJmLm11bHRpTGluZVN0cmluZyhbXG4gKiAgIHR1cmYubGluZVN0cmluZyhbWzI2LCAzN10sIFszNSwgNDVdXSksXG4gKiAgIHR1cmYubGluZVN0cmluZyhbWzM2LCA1M10sIFszOCwgNTBdLCBbNDEsIDU1XV0pXG4gKiBdKTtcbiAqXG4gKiB0dXJmLmxpbmVFYWNoKG10TG4sIGZ1bmN0aW9uIChjdXJyZW50TGluZSwgbGluZUluZGV4KSB7XG4gKiAgIC8vPWN1cnJlbnRMaW5lXG4gKiAgIC8vPWxpbmVJbmRleFxuICogfSk7XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBsaW5lRWFjaChnZW9qc29uLCBjYWxsYmFjaykge1xuICAgIC8vIHZhbGlkYXRpb25cbiAgICBpZiAoIWdlb2pzb24pIHRocm93IG5ldyBFcnJvcignZ2VvanNvbiBpcyByZXF1aXJlZCcpO1xuICAgIHZhciB0eXBlID0gZ2VvanNvbi5nZW9tZXRyeSA/IGdlb2pzb24uZ2VvbWV0cnkudHlwZSA6IGdlb2pzb24udHlwZTtcbiAgICBpZiAoIXR5cGUpIHRocm93IG5ldyBFcnJvcignaW52YWxpZCBnZW9qc29uJyk7XG4gICAgaWYgKHR5cGUgPT09ICdGZWF0dXJlQ29sbGVjdGlvbicpIHRocm93IG5ldyBFcnJvcignRmVhdHVyZUNvbGxlY3Rpb24gaXMgbm90IHN1cHBvcnRlZCcpO1xuICAgIGlmICh0eXBlID09PSAnR2VvbWV0cnlDb2xsZWN0aW9uJykgdGhyb3cgbmV3IEVycm9yKCdHZW9tZXRyeUNvbGxlY3Rpb24gaXMgbm90IHN1cHBvcnRlZCcpO1xuICAgIHZhciBjb29yZGluYXRlcyA9IGdlb2pzb24uZ2VvbWV0cnkgPyBnZW9qc29uLmdlb21ldHJ5LmNvb3JkaW5hdGVzIDogZ2VvanNvbi5jb29yZGluYXRlcztcbiAgICBpZiAoIWNvb3JkaW5hdGVzKSB0aHJvdyBuZXcgRXJyb3IoJ2dlb2pzb24gbXVzdCBjb250YWluIGNvb3JkaW5hdGVzJyk7XG5cbiAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICBjYXNlICdMaW5lU3RyaW5nJzpcbiAgICAgICAgY2FsbGJhY2soY29vcmRpbmF0ZXMsIDAsIDApO1xuICAgICAgICByZXR1cm47XG4gICAgY2FzZSAnUG9seWdvbic6XG4gICAgY2FzZSAnTXVsdGlMaW5lU3RyaW5nJzpcbiAgICAgICAgdmFyIHN1YkluZGV4ID0gMDtcbiAgICAgICAgZm9yICh2YXIgbGluZSA9IDA7IGxpbmUgPCBjb29yZGluYXRlcy5sZW5ndGg7IGxpbmUrKykge1xuICAgICAgICAgICAgaWYgKHR5cGUgPT09ICdNdWx0aUxpbmVTdHJpbmcnKSBzdWJJbmRleCA9IGxpbmU7XG4gICAgICAgICAgICBjYWxsYmFjayhjb29yZGluYXRlc1tsaW5lXSwgbGluZSwgc3ViSW5kZXgpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybjtcbiAgICBjYXNlICdNdWx0aVBvbHlnb24nOlxuICAgICAgICBmb3IgKHZhciBtdWx0aSA9IDA7IG11bHRpIDwgY29vcmRpbmF0ZXMubGVuZ3RoOyBtdWx0aSsrKSB7XG4gICAgICAgICAgICBmb3IgKHZhciByaW5nID0gMDsgcmluZyA8IGNvb3JkaW5hdGVzW211bHRpXS5sZW5ndGg7IHJpbmcrKykge1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKGNvb3JkaW5hdGVzW211bHRpXVtyaW5nXSwgcmluZywgbXVsdGkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybjtcbiAgICBkZWZhdWx0OlxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IodHlwZSArICcgZ2VvbWV0cnkgbm90IHN1cHBvcnRlZCcpO1xuICAgIH1cbn1cblxuLyoqXG4gKiBDYWxsYmFjayBmb3IgbGluZVJlZHVjZVxuICpcbiAqIFRoZSBmaXJzdCB0aW1lIHRoZSBjYWxsYmFjayBmdW5jdGlvbiBpcyBjYWxsZWQsIHRoZSB2YWx1ZXMgcHJvdmlkZWQgYXMgYXJndW1lbnRzIGRlcGVuZFxuICogb24gd2hldGhlciB0aGUgcmVkdWNlIG1ldGhvZCBoYXMgYW4gaW5pdGlhbFZhbHVlIGFyZ3VtZW50LlxuICpcbiAqIElmIGFuIGluaXRpYWxWYWx1ZSBpcyBwcm92aWRlZCB0byB0aGUgcmVkdWNlIG1ldGhvZDpcbiAqICAtIFRoZSBwcmV2aW91c1ZhbHVlIGFyZ3VtZW50IGlzIGluaXRpYWxWYWx1ZS5cbiAqICAtIFRoZSBjdXJyZW50VmFsdWUgYXJndW1lbnQgaXMgdGhlIHZhbHVlIG9mIHRoZSBmaXJzdCBlbGVtZW50IHByZXNlbnQgaW4gdGhlIGFycmF5LlxuICpcbiAqIElmIGFuIGluaXRpYWxWYWx1ZSBpcyBub3QgcHJvdmlkZWQ6XG4gKiAgLSBUaGUgcHJldmlvdXNWYWx1ZSBhcmd1bWVudCBpcyB0aGUgdmFsdWUgb2YgdGhlIGZpcnN0IGVsZW1lbnQgcHJlc2VudCBpbiB0aGUgYXJyYXkuXG4gKiAgLSBUaGUgY3VycmVudFZhbHVlIGFyZ3VtZW50IGlzIHRoZSB2YWx1ZSBvZiB0aGUgc2Vjb25kIGVsZW1lbnQgcHJlc2VudCBpbiB0aGUgYXJyYXkuXG4gKlxuICogQGNhbGxiYWNrIGxpbmVSZWR1Y2VDYWxsYmFja1xuICogQHBhcmFtIHsqfSBwcmV2aW91c1ZhbHVlIFRoZSBhY2N1bXVsYXRlZCB2YWx1ZSBwcmV2aW91c2x5IHJldHVybmVkIGluIHRoZSBsYXN0IGludm9jYXRpb25cbiAqIG9mIHRoZSBjYWxsYmFjaywgb3IgaW5pdGlhbFZhbHVlLCBpZiBzdXBwbGllZC5cbiAqIEBwYXJhbSB7RmVhdHVyZTxMaW5lU3RyaW5nPn0gY3VycmVudExpbmUgVGhlIGN1cnJlbnQgTGluZVN0cmluZ3xMaW5lYXJSaW5nIGJlaW5nIHByb2Nlc3NlZC5cbiAqIEBwYXJhbSB7bnVtYmVyfSBsaW5lSW5kZXggVGhlIGluZGV4IG9mIHRoZSBjdXJyZW50IGVsZW1lbnQgYmVpbmcgcHJvY2Vzc2VkIGluIHRoZVxuICogYXJyYXkuIFN0YXJ0cyBhdCBpbmRleCAwLCBpZiBhbiBpbml0aWFsVmFsdWUgaXMgcHJvdmlkZWQsIGFuZCBhdCBpbmRleCAxIG90aGVyd2lzZS5cbiAqIEBwYXJhbSB7bnVtYmVyfSBsaW5lU3ViSW5kZXggVGhlIHN1Yi1pbmRleCBvZiB0aGUgY3VycmVudCBsaW5lIGJlaW5nIHByb2Nlc3NlZCBhdCBpbmRleCAwXG4gKi9cblxuLyoqXG4gKiBSZWR1Y2UgZmVhdHVyZXMgaW4gYW55IEdlb0pTT04gb2JqZWN0LCBzaW1pbGFyIHRvIEFycmF5LnJlZHVjZSgpLlxuICpcbiAqIEBuYW1lIGxpbmVSZWR1Y2VcbiAqIEBwYXJhbSB7R2VvbWV0cnl8RmVhdHVyZTxMaW5lU3RyaW5nfFBvbHlnb258TXVsdGlMaW5lU3RyaW5nfE11bHRpUG9seWdvbj59IGdlb2pzb24gb2JqZWN0XG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayBhIG1ldGhvZCB0aGF0IHRha2VzIChwcmV2aW91c1ZhbHVlLCBjdXJyZW50RmVhdHVyZSwgZmVhdHVyZUluZGV4KVxuICogQHBhcmFtIHsqfSBbaW5pdGlhbFZhbHVlXSBWYWx1ZSB0byB1c2UgYXMgdGhlIGZpcnN0IGFyZ3VtZW50IHRvIHRoZSBmaXJzdCBjYWxsIG9mIHRoZSBjYWxsYmFjay5cbiAqIEByZXR1cm5zIHsqfSBUaGUgdmFsdWUgdGhhdCByZXN1bHRzIGZyb20gdGhlIHJlZHVjdGlvbi5cbiAqIEBleGFtcGxlXG4gKiB2YXIgbXRwID0gdHVyZi5tdWx0aVBvbHlnb24oW1xuICogICB0dXJmLnBvbHlnb24oW1tbMTIsNDhdLFsyLDQxXSxbMjQsMzhdLFsxMiw0OF1dLCBbWzksNDRdLFsxMyw0MV0sWzEzLDQ1XSxbOSw0NF1dXSksXG4gKiAgIHR1cmYucG9seWdvbihbW1s1LCA1XSwgWzAsIDBdLCBbMiwgMl0sIFs0LCA0XSwgWzUsIDVdXV0pXG4gKiBdKTtcbiAqXG4gKiB0dXJmLmxpbmVSZWR1Y2UobXRwLCBmdW5jdGlvbiAocHJldmlvdXNWYWx1ZSwgY3VycmVudExpbmUsIGxpbmVJbmRleCwgbGluZVN1YkluZGV4KSB7XG4gKiAgIC8vPXByZXZpb3VzVmFsdWVcbiAqICAgLy89Y3VycmVudExpbmVcbiAqICAgLy89bGluZUluZGV4XG4gKiAgIC8vPWxpbmVTdWJJbmRleFxuICogICByZXR1cm4gY3VycmVudExpbmVcbiAqIH0sIDIpO1xuICovXG5leHBvcnQgZnVuY3Rpb24gbGluZVJlZHVjZShnZW9qc29uLCBjYWxsYmFjaywgaW5pdGlhbFZhbHVlKSB7XG4gICAgdmFyIHByZXZpb3VzVmFsdWUgPSBpbml0aWFsVmFsdWU7XG4gICAgbGluZUVhY2goZ2VvanNvbiwgZnVuY3Rpb24gKGN1cnJlbnRMaW5lLCBsaW5lSW5kZXgsIGxpbmVTdWJJbmRleCkge1xuICAgICAgICBpZiAobGluZUluZGV4ID09PSAwICYmIGluaXRpYWxWYWx1ZSA9PT0gdW5kZWZpbmVkKSBwcmV2aW91c1ZhbHVlID0gY3VycmVudExpbmU7XG4gICAgICAgIGVsc2UgcHJldmlvdXNWYWx1ZSA9IGNhbGxiYWNrKHByZXZpb3VzVmFsdWUsIGN1cnJlbnRMaW5lLCBsaW5lSW5kZXgsIGxpbmVTdWJJbmRleCk7XG4gICAgfSk7XG4gICAgcmV0dXJuIHByZXZpb3VzVmFsdWU7XG59XG4iLCJ2YXIgcmJ1c2ggPSByZXF1aXJlKCdyYnVzaCcpO1xudmFyIG1ldGEgPSByZXF1aXJlKCdAdHVyZi9tZXRhJyk7XG52YXIgZmVhdHVyZUVhY2ggPSBtZXRhLmZlYXR1cmVFYWNoO1xudmFyIGNvb3JkRWFjaCA9IG1ldGEuY29vcmRFYWNoO1xuXG4vKipcbiAqIEdlb0pTT04gaW1wbGVtZW50YXRpb24gb2YgW1JCdXNoXShodHRwczovL2dpdGh1Yi5jb20vbW91cm5lci9yYnVzaCNyYnVzaCkgc3BhdGlhbCBpbmRleC5cbiAqXG4gKiBAbmFtZSByYnVzaFxuICogQHBhcmFtIHtudW1iZXJ9IFttYXhFbnRyaWVzPTldIGRlZmluZXMgdGhlIG1heGltdW0gbnVtYmVyIG9mIGVudHJpZXMgaW4gYSB0cmVlIG5vZGUuIDkgKHVzZWQgYnkgZGVmYXVsdCkgaXMgYVxuICogcmVhc29uYWJsZSBjaG9pY2UgZm9yIG1vc3QgYXBwbGljYXRpb25zLiBIaWdoZXIgdmFsdWUgbWVhbnMgZmFzdGVyIGluc2VydGlvbiBhbmQgc2xvd2VyIHNlYXJjaCwgYW5kIHZpY2UgdmVyc2EuXG4gKiBAcmV0dXJucyB7UkJ1c2h9IEdlb0pTT04gUkJ1c2hcbiAqIEBleGFtcGxlXG4gKiB2YXIgcmJ1c2ggPSByZXF1aXJlKCdnZW9qc29uLXJidXNoJylcbiAqIHZhciB0cmVlID0gcmJ1c2goKVxuICovXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChtYXhFbnRyaWVzKSB7XG4gICAgdmFyIHRyZWUgPSByYnVzaChtYXhFbnRyaWVzKTtcbiAgICAvKipcbiAgICAgKiBbaW5zZXJ0XShodHRwczovL2dpdGh1Yi5jb20vbW91cm5lci9yYnVzaCNkYXRhLWZvcm1hdClcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7RmVhdHVyZTxhbnk+fSBmZWF0dXJlIGluc2VydCBzaW5nbGUgR2VvSlNPTiBGZWF0dXJlXG4gICAgICogQHJldHVybnMge1JCdXNofSBHZW9KU09OIFJCdXNoXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiB2YXIgcG9seWdvbiA9IHtcbiAgICAgKiAgIFwidHlwZVwiOiBcIkZlYXR1cmVcIixcbiAgICAgKiAgIFwicHJvcGVydGllc1wiOiB7fSxcbiAgICAgKiAgIFwiZ2VvbWV0cnlcIjoge1xuICAgICAqICAgICBcInR5cGVcIjogXCJQb2x5Z29uXCIsXG4gICAgICogICAgIFwiY29vcmRpbmF0ZXNcIjogW1tbLTc4LCA0MV0sIFstNjcsIDQxXSwgWy02NywgNDhdLCBbLTc4LCA0OF0sIFstNzgsIDQxXV1dXG4gICAgICogICB9XG4gICAgICogfVxuICAgICAqIHRyZWUuaW5zZXJ0KHBvbHlnb24pXG4gICAgICovXG4gICAgdHJlZS5pbnNlcnQgPSBmdW5jdGlvbiAoZmVhdHVyZSkge1xuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShmZWF0dXJlKSkge1xuICAgICAgICAgICAgdmFyIGJib3ggPSBmZWF0dXJlO1xuICAgICAgICAgICAgZmVhdHVyZSA9IGJib3hQb2x5Z29uKGJib3gpO1xuICAgICAgICAgICAgZmVhdHVyZS5iYm94ID0gYmJveDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGZlYXR1cmUuYmJveCA9IGZlYXR1cmUuYmJveCA/IGZlYXR1cmUuYmJveCA6IHR1cmZCQm94KGZlYXR1cmUpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByYnVzaC5wcm90b3R5cGUuaW5zZXJ0LmNhbGwodGhpcywgZmVhdHVyZSk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFtsb2FkXShodHRwczovL2dpdGh1Yi5jb20vbW91cm5lci9yYnVzaCNidWxrLWluc2VydGluZy1kYXRhKVxuICAgICAqXG4gICAgICogQHBhcmFtIHtCQm94W118RmVhdHVyZUNvbGxlY3Rpb248YW55Pn0gZmVhdHVyZXMgbG9hZCBlbnRpcmUgR2VvSlNPTiBGZWF0dXJlQ29sbGVjdGlvblxuICAgICAqIEByZXR1cm5zIHtSQnVzaH0gR2VvSlNPTiBSQnVzaFxuICAgICAqIEBleGFtcGxlXG4gICAgICogdmFyIHBvbHlnb25zID0ge1xuICAgICAqICAgXCJ0eXBlXCI6IFwiRmVhdHVyZUNvbGxlY3Rpb25cIixcbiAgICAgKiAgIFwiZmVhdHVyZXNcIjogW1xuICAgICAqICAgICB7XG4gICAgICogICAgICAgXCJ0eXBlXCI6IFwiRmVhdHVyZVwiLFxuICAgICAqICAgICAgIFwicHJvcGVydGllc1wiOiB7fSxcbiAgICAgKiAgICAgICBcImdlb21ldHJ5XCI6IHtcbiAgICAgKiAgICAgICAgIFwidHlwZVwiOiBcIlBvbHlnb25cIixcbiAgICAgKiAgICAgICAgIFwiY29vcmRpbmF0ZXNcIjogW1tbLTc4LCA0MV0sIFstNjcsIDQxXSwgWy02NywgNDhdLCBbLTc4LCA0OF0sIFstNzgsIDQxXV1dXG4gICAgICogICAgICAgfVxuICAgICAqICAgICB9LFxuICAgICAqICAgICB7XG4gICAgICogICAgICAgXCJ0eXBlXCI6IFwiRmVhdHVyZVwiLFxuICAgICAqICAgICAgIFwicHJvcGVydGllc1wiOiB7fSxcbiAgICAgKiAgICAgICBcImdlb21ldHJ5XCI6IHtcbiAgICAgKiAgICAgICAgIFwidHlwZVwiOiBcIlBvbHlnb25cIixcbiAgICAgKiAgICAgICAgIFwiY29vcmRpbmF0ZXNcIjogW1tbLTkzLCAzMl0sIFstODMsIDMyXSwgWy04MywgMzldLCBbLTkzLCAzOV0sIFstOTMsIDMyXV1dXG4gICAgICogICAgICAgfVxuICAgICAqICAgICB9XG4gICAgICogICBdXG4gICAgICogfVxuICAgICAqIHRyZWUubG9hZChwb2x5Z29ucylcbiAgICAgKi9cbiAgICB0cmVlLmxvYWQgPSBmdW5jdGlvbiAoZmVhdHVyZXMpIHtcbiAgICAgICAgdmFyIGxvYWQgPSBbXTtcbiAgICAgICAgLy8gTG9hZCBhbiBBcnJheSBvZiBCQm94XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KGZlYXR1cmVzKSkge1xuICAgICAgICAgICAgZmVhdHVyZXMuZm9yRWFjaChmdW5jdGlvbiAoYmJveCkge1xuICAgICAgICAgICAgICAgIHZhciBmZWF0dXJlID0gYmJveFBvbHlnb24oYmJveCk7XG4gICAgICAgICAgICAgICAgZmVhdHVyZS5iYm94ID0gYmJveDtcbiAgICAgICAgICAgICAgICBsb2FkLnB1c2goZmVhdHVyZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIExvYWQgRmVhdHVyZUNvbGxlY3Rpb25cbiAgICAgICAgICAgIGZlYXR1cmVFYWNoKGZlYXR1cmVzLCBmdW5jdGlvbiAoZmVhdHVyZSkge1xuICAgICAgICAgICAgICAgIGZlYXR1cmUuYmJveCA9IGZlYXR1cmUuYmJveCA/IGZlYXR1cmUuYmJveCA6IHR1cmZCQm94KGZlYXR1cmUpO1xuICAgICAgICAgICAgICAgIGxvYWQucHVzaChmZWF0dXJlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByYnVzaC5wcm90b3R5cGUubG9hZC5jYWxsKHRoaXMsIGxvYWQpO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBbcmVtb3ZlXShodHRwczovL2dpdGh1Yi5jb20vbW91cm5lci9yYnVzaCNyZW1vdmluZy1kYXRhKVxuICAgICAqXG4gICAgICogQHBhcmFtIHtCQm94fEZlYXR1cmU8YW55Pn0gZmVhdHVyZSByZW1vdmUgc2luZ2xlIEdlb0pTT04gRmVhdHVyZVxuICAgICAqIEByZXR1cm5zIHtSQnVzaH0gR2VvSlNPTiBSQnVzaFxuICAgICAqIEBleGFtcGxlXG4gICAgICogdmFyIHBvbHlnb24gPSB7XG4gICAgICogICBcInR5cGVcIjogXCJGZWF0dXJlXCIsXG4gICAgICogICBcInByb3BlcnRpZXNcIjoge30sXG4gICAgICogICBcImdlb21ldHJ5XCI6IHtcbiAgICAgKiAgICAgXCJ0eXBlXCI6IFwiUG9seWdvblwiLFxuICAgICAqICAgICBcImNvb3JkaW5hdGVzXCI6IFtbWy03OCwgNDFdLCBbLTY3LCA0MV0sIFstNjcsIDQ4XSwgWy03OCwgNDhdLCBbLTc4LCA0MV1dXVxuICAgICAqICAgfVxuICAgICAqIH1cbiAgICAgKiB0cmVlLnJlbW92ZShwb2x5Z29uKVxuICAgICAqL1xuICAgIHRyZWUucmVtb3ZlID0gZnVuY3Rpb24gKGZlYXR1cmUpIHtcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoZmVhdHVyZSkpIHtcbiAgICAgICAgICAgIHZhciBiYm94ID0gZmVhdHVyZTtcbiAgICAgICAgICAgIGZlYXR1cmUgPSBiYm94UG9seWdvbihiYm94KTtcbiAgICAgICAgICAgIGZlYXR1cmUuYmJveCA9IGJib3g7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJidXNoLnByb3RvdHlwZS5yZW1vdmUuY2FsbCh0aGlzLCBmZWF0dXJlKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogW2NsZWFyXShodHRwczovL2dpdGh1Yi5jb20vbW91cm5lci9yYnVzaCNyZW1vdmluZy1kYXRhKVxuICAgICAqXG4gICAgICogQHJldHVybnMge1JCdXNofSBHZW9KU09OIFJidXNoXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiB0cmVlLmNsZWFyKClcbiAgICAgKi9cbiAgICB0cmVlLmNsZWFyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gcmJ1c2gucHJvdG90eXBlLmNsZWFyLmNhbGwodGhpcyk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFtzZWFyY2hdKGh0dHBzOi8vZ2l0aHViLmNvbS9tb3VybmVyL3JidXNoI3NlYXJjaClcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7QkJveHxGZWF0dXJlQ29sbGVjdGlvbnxGZWF0dXJlPGFueT59IGdlb2pzb24gc2VhcmNoIHdpdGggR2VvSlNPTlxuICAgICAqIEByZXR1cm5zIHtGZWF0dXJlQ29sbGVjdGlvbjxhbnk+fSBhbGwgZmVhdHVyZXMgdGhhdCBpbnRlcnNlY3RzIHdpdGggdGhlIGdpdmVuIEdlb0pTT04uXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiB2YXIgcG9seWdvbiA9IHtcbiAgICAgKiAgIFwidHlwZVwiOiBcIkZlYXR1cmVcIixcbiAgICAgKiAgIFwicHJvcGVydGllc1wiOiB7fSxcbiAgICAgKiAgIFwiZ2VvbWV0cnlcIjoge1xuICAgICAqICAgICBcInR5cGVcIjogXCJQb2x5Z29uXCIsXG4gICAgICogICAgIFwiY29vcmRpbmF0ZXNcIjogW1tbLTc4LCA0MV0sIFstNjcsIDQxXSwgWy02NywgNDhdLCBbLTc4LCA0OF0sIFstNzgsIDQxXV1dXG4gICAgICogICB9XG4gICAgICogfVxuICAgICAqIHRyZWUuc2VhcmNoKHBvbHlnb24pXG4gICAgICovXG4gICAgdHJlZS5zZWFyY2ggPSBmdW5jdGlvbiAoZ2VvanNvbikge1xuICAgICAgICB2YXIgZmVhdHVyZXMgPSByYnVzaC5wcm90b3R5cGUuc2VhcmNoLmNhbGwodGhpcywgdGhpcy50b0JCb3goZ2VvanNvbikpO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdHlwZTogJ0ZlYXR1cmVDb2xsZWN0aW9uJyxcbiAgICAgICAgICAgIGZlYXR1cmVzOiBmZWF0dXJlc1xuICAgICAgICB9O1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBbY29sbGlkZXNdKGh0dHBzOi8vZ2l0aHViLmNvbS9tb3VybmVyL3JidXNoI2NvbGxpc2lvbnMpXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge0JCb3h8RmVhdHVyZUNvbGxlY3Rpb258RmVhdHVyZTxhbnk+fSBnZW9qc29uIGNvbGxpZGVzIHdpdGggR2VvSlNPTlxuICAgICAqIEByZXR1cm5zIHtib29sZWFufSB0cnVlIGlmIHRoZXJlIGFyZSBhbnkgaXRlbXMgaW50ZXJzZWN0aW5nIHRoZSBnaXZlbiBHZW9KU09OLCBvdGhlcndpc2UgZmFsc2UuXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiB2YXIgcG9seWdvbiA9IHtcbiAgICAgKiAgIFwidHlwZVwiOiBcIkZlYXR1cmVcIixcbiAgICAgKiAgIFwicHJvcGVydGllc1wiOiB7fSxcbiAgICAgKiAgIFwiZ2VvbWV0cnlcIjoge1xuICAgICAqICAgICBcInR5cGVcIjogXCJQb2x5Z29uXCIsXG4gICAgICogICAgIFwiY29vcmRpbmF0ZXNcIjogW1tbLTc4LCA0MV0sIFstNjcsIDQxXSwgWy02NywgNDhdLCBbLTc4LCA0OF0sIFstNzgsIDQxXV1dXG4gICAgICogICB9XG4gICAgICogfVxuICAgICAqIHRyZWUuY29sbGlkZXMocG9seWdvbilcbiAgICAgKi9cbiAgICB0cmVlLmNvbGxpZGVzID0gZnVuY3Rpb24gKGdlb2pzb24pIHtcbiAgICAgICAgcmV0dXJuIHJidXNoLnByb3RvdHlwZS5jb2xsaWRlcy5jYWxsKHRoaXMsIHRoaXMudG9CQm94KGdlb2pzb24pKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogW2FsbF0oaHR0cHM6Ly9naXRodWIuY29tL21vdXJuZXIvcmJ1c2gjc2VhcmNoKVxuICAgICAqXG4gICAgICogQHJldHVybnMge0ZlYXR1cmVDb2xsZWN0aW9uPGFueT59IGFsbCB0aGUgZmVhdHVyZXMgaW4gUkJ1c2hcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIHRyZWUuYWxsKClcbiAgICAgKiAvLz1GZWF0dXJlQ29sbGVjdGlvblxuICAgICAqL1xuICAgIHRyZWUuYWxsID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgZmVhdHVyZXMgPSByYnVzaC5wcm90b3R5cGUuYWxsLmNhbGwodGhpcyk7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB0eXBlOiAnRmVhdHVyZUNvbGxlY3Rpb24nLFxuICAgICAgICAgICAgZmVhdHVyZXM6IGZlYXR1cmVzXG4gICAgICAgIH07XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFt0b0pTT05dKGh0dHBzOi8vZ2l0aHViLmNvbS9tb3VybmVyL3JidXNoI2V4cG9ydC1hbmQtaW1wb3J0KVxuICAgICAqXG4gICAgICogQHJldHVybnMge2FueX0gZXhwb3J0IGRhdGEgYXMgSlNPTiBvYmplY3RcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIHZhciBleHBvcnRlZCA9IHRyZWUudG9KU09OKClcbiAgICAgKiAvLz1KU09OIG9iamVjdFxuICAgICAqL1xuICAgIHRyZWUudG9KU09OID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gcmJ1c2gucHJvdG90eXBlLnRvSlNPTi5jYWxsKHRoaXMpO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBbZnJvbUpTT05dKGh0dHBzOi8vZ2l0aHViLmNvbS9tb3VybmVyL3JidXNoI2V4cG9ydC1hbmQtaW1wb3J0KVxuICAgICAqXG4gICAgICogQHBhcmFtIHthbnl9IGpzb24gaW1wb3J0IHByZXZpb3VzbHkgZXhwb3J0ZWQgZGF0YVxuICAgICAqIEByZXR1cm5zIHtSQnVzaH0gR2VvSlNPTiBSQnVzaFxuICAgICAqIEBleGFtcGxlXG4gICAgICogdmFyIGV4cG9ydGVkID0ge1xuICAgICAqICAgXCJjaGlsZHJlblwiOiBbXG4gICAgICogICAgIHtcbiAgICAgKiAgICAgICBcInR5cGVcIjogXCJGZWF0dXJlXCIsXG4gICAgICogICAgICAgXCJnZW9tZXRyeVwiOiB7XG4gICAgICogICAgICAgICBcInR5cGVcIjogXCJQb2ludFwiLFxuICAgICAqICAgICAgICAgXCJjb29yZGluYXRlc1wiOiBbMTEwLCA1MF1cbiAgICAgKiAgICAgICB9LFxuICAgICAqICAgICAgIFwicHJvcGVydGllc1wiOiB7fSxcbiAgICAgKiAgICAgICBcImJib3hcIjogWzExMCwgNTAsIDExMCwgNTBdXG4gICAgICogICAgIH1cbiAgICAgKiAgIF0sXG4gICAgICogICBcImhlaWdodFwiOiAxLFxuICAgICAqICAgXCJsZWFmXCI6IHRydWUsXG4gICAgICogICBcIm1pblhcIjogMTEwLFxuICAgICAqICAgXCJtaW5ZXCI6IDUwLFxuICAgICAqICAgXCJtYXhYXCI6IDExMCxcbiAgICAgKiAgIFwibWF4WVwiOiA1MFxuICAgICAqIH1cbiAgICAgKiB0cmVlLmZyb21KU09OKGV4cG9ydGVkKVxuICAgICAqL1xuICAgIHRyZWUuZnJvbUpTT04gPSBmdW5jdGlvbiAoanNvbikge1xuICAgICAgICByZXR1cm4gcmJ1c2gucHJvdG90eXBlLmZyb21KU09OLmNhbGwodGhpcywganNvbik7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIENvbnZlcnRzIEdlb0pTT04gdG8ge21pblgsIG1pblksIG1heFgsIG1heFl9IHNjaGVtYVxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKiBAcGFyYW0ge0JCb3h8RmVhdHVyZUNvbGxlY3Rpb3xGZWF0dXJlPGFueT59IGdlb2pzb24gZmVhdHVyZShzKSB0byByZXRyaWV2ZSBCQm94IGZyb21cbiAgICAgKiBAcmV0dXJucyB7T2JqZWN0fSBjb252ZXJ0ZWQgdG8ge21pblgsIG1pblksIG1heFgsIG1heFl9XG4gICAgICovXG4gICAgdHJlZS50b0JCb3ggPSBmdW5jdGlvbiAoZ2VvanNvbikge1xuICAgICAgICB2YXIgYmJveDtcbiAgICAgICAgaWYgKGdlb2pzb24uYmJveCkgYmJveCA9IGdlb2pzb24uYmJveDtcbiAgICAgICAgZWxzZSBpZiAoQXJyYXkuaXNBcnJheShnZW9qc29uKSAmJiBnZW9qc29uLmxlbmd0aCA9PT0gNCkgYmJveCA9IGdlb2pzb247XG4gICAgICAgIGVsc2UgYmJveCA9IHR1cmZCQm94KGdlb2pzb24pO1xuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBtaW5YOiBiYm94WzBdLFxuICAgICAgICAgICAgbWluWTogYmJveFsxXSxcbiAgICAgICAgICAgIG1heFg6IGJib3hbMl0sXG4gICAgICAgICAgICBtYXhZOiBiYm94WzNdXG4gICAgICAgIH07XG4gICAgfTtcbiAgICByZXR1cm4gdHJlZTtcbn07XG5cbi8qKlxuICogVGFrZXMgYSBiYm94IGFuZCByZXR1cm5zIGFuIGVxdWl2YWxlbnQge0BsaW5rIFBvbHlnb258cG9seWdvbn0uXG4gKlxuICogQHByaXZhdGVcbiAqIEBuYW1lIGJib3hQb2x5Z29uXG4gKiBAcGFyYW0ge0FycmF5PG51bWJlcj59IGJib3ggZXh0ZW50IGluIFttaW5YLCBtaW5ZLCBtYXhYLCBtYXhZXSBvcmRlclxuICogQHJldHVybnMge0ZlYXR1cmU8UG9seWdvbj59IGEgUG9seWdvbiByZXByZXNlbnRhdGlvbiBvZiB0aGUgYm91bmRpbmcgYm94XG4gKiBAZXhhbXBsZVxuICogdmFyIGJib3ggPSBbMCwgMCwgMTAsIDEwXTtcbiAqXG4gKiB2YXIgcG9seSA9IHR1cmYuYmJveFBvbHlnb24oYmJveCk7XG4gKlxuICogLy9hZGRUb01hcFxuICogdmFyIGFkZFRvTWFwID0gW3BvbHldXG4gKi9cbmZ1bmN0aW9uIGJib3hQb2x5Z29uKGJib3gpIHtcbiAgICB2YXIgbG93TGVmdCA9IFtiYm94WzBdLCBiYm94WzFdXTtcbiAgICB2YXIgdG9wTGVmdCA9IFtiYm94WzBdLCBiYm94WzNdXTtcbiAgICB2YXIgdG9wUmlnaHQgPSBbYmJveFsyXSwgYmJveFszXV07XG4gICAgdmFyIGxvd1JpZ2h0ID0gW2Jib3hbMl0sIGJib3hbMV1dO1xuICAgIHZhciBjb29yZGluYXRlcyA9IFtbbG93TGVmdCwgbG93UmlnaHQsIHRvcFJpZ2h0LCB0b3BMZWZ0LCBsb3dMZWZ0XV07XG5cbiAgICByZXR1cm4ge1xuICAgICAgICB0eXBlOiAnRmVhdHVyZScsXG4gICAgICAgIGJib3g6IGJib3gsXG4gICAgICAgIHByb3BlcnRpZXM6IHt9LFxuICAgICAgICBnZW9tZXRyeToge1xuICAgICAgICAgICAgdHlwZTogJ1BvbHlnb24nLFxuICAgICAgICAgICAgY29vcmRpbmF0ZXM6IGNvb3JkaW5hdGVzXG4gICAgICAgIH1cbiAgICB9O1xufVxuXG4vKipcbiAqIFRha2VzIGEgc2V0IG9mIGZlYXR1cmVzLCBjYWxjdWxhdGVzIHRoZSBiYm94IG9mIGFsbCBpbnB1dCBmZWF0dXJlcywgYW5kIHJldHVybnMgYSBib3VuZGluZyBib3guXG4gKlxuICogQHByaXZhdGVcbiAqIEBuYW1lIGJib3hcbiAqIEBwYXJhbSB7RmVhdHVyZUNvbGxlY3Rpb258RmVhdHVyZTxhbnk+fSBnZW9qc29uIGlucHV0IGZlYXR1cmVzXG4gKiBAcmV0dXJucyB7QXJyYXk8bnVtYmVyPn0gYmJveCBleHRlbnQgaW4gW21pblgsIG1pblksIG1heFgsIG1heFldIG9yZGVyXG4gKiBAZXhhbXBsZVxuICogdmFyIGxpbmUgPSB0dXJmLmxpbmVTdHJpbmcoW1stNzQsIDQwXSwgWy03OCwgNDJdLCBbLTgyLCAzNV1dKTtcbiAqIHZhciBiYm94ID0gdHVyZi5iYm94KGxpbmUpO1xuICogdmFyIGJib3hQb2x5Z29uID0gdHVyZi5iYm94UG9seWdvbihiYm94KTtcbiAqXG4gKiAvL2FkZFRvTWFwXG4gKiB2YXIgYWRkVG9NYXAgPSBbbGluZSwgYmJveFBvbHlnb25dXG4gKi9cbmZ1bmN0aW9uIHR1cmZCQm94KGdlb2pzb24pIHtcbiAgICB2YXIgYmJveCA9IFtJbmZpbml0eSwgSW5maW5pdHksIC1JbmZpbml0eSwgLUluZmluaXR5XTtcbiAgICBjb29yZEVhY2goZ2VvanNvbiwgZnVuY3Rpb24gKGNvb3JkKSB7XG4gICAgICAgIGlmIChiYm94WzBdID4gY29vcmRbMF0pIGJib3hbMF0gPSBjb29yZFswXTtcbiAgICAgICAgaWYgKGJib3hbMV0gPiBjb29yZFsxXSkgYmJveFsxXSA9IGNvb3JkWzFdO1xuICAgICAgICBpZiAoYmJveFsyXSA8IGNvb3JkWzBdKSBiYm94WzJdID0gY29vcmRbMF07XG4gICAgICAgIGlmIChiYm94WzNdIDwgY29vcmRbMV0pIGJib3hbM10gPSBjb29yZFsxXTtcbiAgICB9KTtcbiAgICByZXR1cm4gYmJveDtcbn1cbiIsImltcG9ydCAqIGFzIG1hcHRhbGtzIGZyb20gJ21hcHRhbGtzJztcbmltcG9ydCByYnVzaCBmcm9tICdnZW9qc29uLXJidXNoJztcblxuY29uc3Qgb3B0aW9ucyA9IHtcbiAgICAnbW9kZSc6ICdsaW5lJyxcbiAgICAndG9sZXJhbmNlJzoxMCxcbiAgICAnc3ltYm9sJzp7XG4gICAgICAgICdtYXJrZXJUeXBlJzogJ2VsbGlwc2UnLFxuICAgICAgICAnbWFya2VyRmlsbCc6ICcjMGY4OWY1JyxcbiAgICAgICAgJ21hcmtlckxpbmVDb2xvcic6ICcjZmZmJyxcbiAgICAgICAgJ21hcmtlckxpbmVXaWR0aCc6IDIsXG4gICAgICAgICdtYXJrZXJMaW5lT3BhY2l0eSc6IDEsXG4gICAgICAgICdtYXJrZXJXaWR0aCc6IDE1LFxuICAgICAgICAnbWFya2VySGVpZ2h0JzogMTVcbiAgICB9XG59O1xuXG4vKipcbiAqIEEgc25hcCB0b29sIHVzZWQgZm9yIG1vdXNlIHBvaW50IHRvIGFkc29yYiBnZW9tZXRyaWVzLCBpdCBleHRlbmRzIG1hcHRhbGtzLkNsYXNzLlxuICpcbiAqIFRoYW5rcyB0byByYnVzaCdzIGF1dGhvciwgdGhpcyBwbHVnaW5nIGhhcyB1c2VkIHRoZSByYnVzaCB0byBpbnNwZWN0IHN1cnJvdW5kaW5nIGdlb21ldHJpZXMgd2l0aGluIHRvbGVyYW5jZShodHRwczovL2dpdGh1Yi5jb20vbW91cm5lci9yYnVzaClcbiAqXG4gKiBAYXV0aG9yIGxpdWJnaXRodWIoaHR0cHM6Ly9naXRodWIuY29tL2xpdWJnaXRodWIpXG4gKlxuICogTUlUIExpY2Vuc2VcbiAqL1xuZXhwb3J0IGNsYXNzIFNuYXBUb29sIGV4dGVuZHMgbWFwdGFsa3MuQ2xhc3Mge1xuICAgIGNvbnN0cnVjdG9yKG9wdGlvbnMpIHtcbiAgICAgICAgc3VwZXIob3B0aW9ucyk7XG4gICAgICAgIHRoaXMudHJlZSA9IHJidXNoKCk7XG4gICAgfVxuXG4gICAgZ2V0TW9kZSgpIHtcbiAgICAgICAgdGhpcy5fbW9kZSA9ICF0aGlzLl9tb2RlID8gdGhpcy5vcHRpb25zWydtb2RlJ10gOiB0aGlzLl9tb2RlO1xuICAgICAgICBpZiAodGhpcy5fY2hlY2tNb2RlKHRoaXMuX21vZGUpKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fbW9kZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignc25hcCBtb2RlIGlzIGludmFsaWQnKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHNldE1vZGUobW9kZSkge1xuICAgICAgICBpZiAodGhpcy5fY2hlY2tNb2RlKHRoaXMuX21vZGUpKSB7XG4gICAgICAgICAgICB0aGlzLl9tb2RlID0gbW9kZTtcbiAgICAgICAgICAgIGlmICh0aGlzLnNuYXBsYXllcikge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLnNuYXBsYXllciBpbnN0YW5jZW9mIEFycmF5KSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYWxsTGF5ZXJzR2VvbWV0cmllcyA9IFtdO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnNuYXBsYXllci5mb3JFYWNoKGZ1bmN0aW9uICh0ZW1wTGF5ZXIsIGluZGV4KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB0ZW1wR2VvbWV0cmllcyA9IHRlbXBMYXllci5nZXRHZW9tZXRyaWVzKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmFsbExheWVyc0dlb21ldHJpZXNbaW5kZXhdID0gdGhpcy5fY29tcG9zaXRHZW9tZXRyaWVzKHRlbXBHZW9tZXRyaWVzKTtcbiAgICAgICAgICAgICAgICAgICAgfS5iaW5kKHRoaXMpKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hbGxHZW9tZXRyaWVzID0gW10uY29uY2F0KC4uLnRoaXMuYWxsTGF5ZXJzR2VvbWV0cmllcyk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZ2VvbWV0cmllcyA9IHRoaXMuc25hcGxheWVyLmdldEdlb21ldHJpZXMoKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hbGxHZW9tZXRyaWVzID0gdGhpcy5fY29tcG9zaXRHZW9tZXRyaWVzKGdlb21ldHJpZXMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignc25hcCBtb2RlIGlzIGludmFsaWQnKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7TWFwfSBtYXAgb2JqZWN0XG4gICAgICogV2hlbiB1c2luZyB0aGUgc25hcCB0b29sLCB5b3Ugc2hvdWxkIGFkZCBpdCB0byBhIG1hcCBmaXJzdGx5LnRoZSBlbmFibGUgbWV0aG9kIGV4Y3V0ZSBkZWZhdWx0XG4gICAgICovXG4gICAgYWRkVG8obWFwKSB7XG4gICAgICAgIGNvbnN0IGlkID0gYCR7bWFwdGFsa3MuSU5URVJOQUxfTEFZRVJfUFJFRklYfV9zbmFwdG9gO1xuICAgICAgICB0aGlzLl9tb3VzZW1vdmVMYXllciA9IG5ldyBtYXB0YWxrcy5WZWN0b3JMYXllcihpZCkuYWRkVG8obWFwKTtcbiAgICAgICAgdGhpcy5fbWFwID0gbWFwO1xuICAgICAgICB0aGlzLmFsbEdlb21ldHJpZXMgPSBbXTtcbiAgICAgICAgdGhpcy5lbmFibGUoKTtcbiAgICB9XG5cbiAgICByZW1vdmUoKSB7XG4gICAgICAgIHRoaXMuZGlzYWJsZSgpO1xuICAgICAgICBpZiAodGhpcy5fbW91c2Vtb3ZlTGF5ZXIpIHtcbiAgICAgICAgICAgIHRoaXMuX21vdXNlbW92ZUxheWVyLnJlbW92ZSgpO1xuICAgICAgICAgICAgZGVsZXRlIHRoaXMuX21vdXNlbW92ZUxheWVyO1xuICAgICAgICB9XG4gICAgfVxuICAgIGdldE1hcCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX21hcDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gc25hcCBtb2RlXG4gICAgICogbW9kZSBzaG91bGQgYmUgZWl0aGVyICdwb2ludCcgb3IgJ2xpbmUnXG4gICAgICovXG4gICAgX2NoZWNrTW9kZShtb2RlKSB7XG4gICAgICAgIGlmIChtb2RlID09PSAncG9pbnQnIHx8IG1vZGUgPT09ICdsaW5lJykge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTdGFydCBzbmFwIGludGVyYWN0aW9uXG4gICAgICovXG4gICAgZW5hYmxlKCkge1xuICAgICAgICBjb25zdCBtYXAgPSB0aGlzLmdldE1hcCgpO1xuICAgICAgICBpZiAodGhpcy5zbmFwbGF5ZXIpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLnNuYXBsYXllciBpbnN0YW5jZW9mIEFycmF5KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5hbGxMYXllcnNHZW9tZXRyaWVzID0gW107XG4gICAgICAgICAgICAgICAgdGhpcy5zbmFwbGF5ZXIuZm9yRWFjaChmdW5jdGlvbiAodGVtcExheWVyLCBpbmRleCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB0ZW1wR2VvbWV0cmllcyA9IHRlbXBMYXllci5nZXRHZW9tZXRyaWVzKCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYWxsTGF5ZXJzR2VvbWV0cmllc1tpbmRleF0gPSB0aGlzLl9jb21wb3NpdEdlb21ldHJpZXModGVtcEdlb21ldHJpZXMpO1xuICAgICAgICAgICAgICAgIH0uYmluZCh0aGlzKSk7XG4gICAgICAgICAgICAgICAgdGhpcy5hbGxHZW9tZXRyaWVzID0gW10uY29uY2F0KC4uLnRoaXMuYWxsTGF5ZXJzR2VvbWV0cmllcyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnN0IGdlb21ldHJpZXMgPSB0aGlzLnNuYXBsYXllci5nZXRHZW9tZXRyaWVzKCk7XG4gICAgICAgICAgICAgICAgdGhpcy5hbGxHZW9tZXRyaWVzID0gdGhpcy5fY29tcG9zaXRHZW9tZXRyaWVzKGdlb21ldHJpZXMpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuYWxsR2VvbWV0cmllcykge1xuICAgICAgICAgICAgaWYgKCF0aGlzLl9tb3VzZW1vdmUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9yZWdpc3RlckV2ZW50cyhtYXApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHRoaXMuX21vdXNlbW92ZUxheWVyKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fbW91c2Vtb3ZlTGF5ZXIuc2hvdygpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCd5b3Ugc2hvdWxkIHNldCBnZW9tZXRyaWVzIHdoaWNoIGFyZSBzbmFwcGVkIHRvIGZpcnN0bHkhJyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBFbmQgc25hcCBpbnRlcmFjdGlvblxuICAgICAqL1xuICAgIGRpc2FibGUoKSB7XG4gICAgICAgIGNvbnN0IG1hcCA9IHRoaXMuZ2V0TWFwKCk7XG4gICAgICAgIG1hcC5vZmYoJ21vdXNlbW92ZSB0b3VjaHN0YXJ0JywgdGhpcy5fbW91c2Vtb3ZlKTtcbiAgICAgICAgbWFwLm9mZignbW91c2Vkb3duJywgdGhpcy5fbW91c2Vkb3duLCB0aGlzKTtcbiAgICAgICAgbWFwLm9mZignbW91c2V1cCcsIHRoaXMuX21vdXNldXAsIHRoaXMpO1xuICAgICAgICBpZiAodGhpcy5fbW91c2Vtb3ZlTGF5ZXIpIHtcbiAgICAgICAgICAgIHRoaXMuX21vdXNlbW92ZUxheWVyLmhpZGUoKTtcbiAgICAgICAgfVxuICAgICAgICBkZWxldGUgdGhpcy5fbW91c2Vtb3ZlO1xuICAgICAgICB0aGlzLmFsbEdlb21ldHJpZXMgPSBbXTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge0dlb21ldHJ5fHxBcnJheTxHZW9tZXRyeT59IGdlb21ldHJpZXMgdG8gc25hcCB0b1xuICAgICAqIFNldCBnZW9tZXJpZXMgdG8gYW4gYXJyYXkgZm9yIHNuYXBwaW5nIHRvXG4gICAgICovXG4gICAgc2V0R2VvbWV0cmllcyhnZW9tZXRyaWVzKSB7XG4gICAgICAgIGdlb21ldHJpZXMgPSAoZ2VvbWV0cmllcyBpbnN0YW5jZW9mIEFycmF5KSA/IGdlb21ldHJpZXMgOiBbZ2VvbWV0cmllc107XG4gICAgICAgIHRoaXMuYWxsR2VvbWV0cmllcyA9IHRoaXMuX2NvbXBvc2l0R2VvbWV0cmllcyhnZW9tZXRyaWVzKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge0xheWVyfHxtYXB0YWxrLlZlY3RvckxheWVyfHxBcnJheS48TGF5ZXI+fHxBcnJheS48bWFwdGFsay5WZWN0b3JMYXllcj59IGxheWVyIHRvIHNuYXAgdG9cbiAgICAgKiBTZXQgbGF5ZXIgZm9yIHNuYXBwaW5nIHRvXG4gICAgICovXG4gICAgc2V0TGF5ZXIobGF5ZXIpIHtcbiAgICAgICAgaWYgKGxheWVyIGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICAgICAgICAgIHRoaXMuc25hcGxheWVyID0gW107XG4gICAgICAgICAgICB0aGlzLmFsbExheWVyc0dlb21ldHJpZXMgPSBbXTtcbiAgICAgICAgICAgIGxheWVyLmZvckVhY2goZnVuY3Rpb24gKHRlbXBMYXllciwgaW5kZXgpIHtcbiAgICAgICAgICAgICAgICBpZiAodGVtcExheWVyIGluc3RhbmNlb2YgbWFwdGFsa3MuVmVjdG9yTGF5ZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zbmFwbGF5ZXIucHVzaCh0ZW1wTGF5ZXIpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB0ZW1wR2VvbWV0cmllcyA9IHRlbXBMYXllci5nZXRHZW9tZXRyaWVzKCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYWxsTGF5ZXJzR2VvbWV0cmllc1tpbmRleF0gPSB0aGlzLl9jb21wb3NpdEdlb21ldHJpZXModGVtcEdlb21ldHJpZXMpO1xuICAgICAgICAgICAgICAgICAgICB0ZW1wTGF5ZXIub24oJ2FkZGdlbycsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHRlbXBHZW9tZXRyaWVzID0gdGhpcy5zbmFwbGF5ZXJbaW5kZXhdLmdldEdlb21ldHJpZXMoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYWxsTGF5ZXJzR2VvbWV0cmllc1tpbmRleF0gPSB0aGlzLl9jb21wb3NpdEdlb21ldHJpZXModGVtcEdlb21ldHJpZXMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5hbGxHZW9tZXRyaWVzID0gW10uY29uY2F0KC4uLnRoaXMuYWxsTGF5ZXJzR2VvbWV0cmllcyk7XG4gICAgICAgICAgICAgICAgICAgIH0sIHRoaXMpO1xuICAgICAgICAgICAgICAgICAgICB0ZW1wTGF5ZXIub24oJ2NsZWFyJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5hbGxMYXllcnNHZW9tZXRyaWVzLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmFsbEdlb21ldHJpZXMgPSBbXS5jb25jYXQoLi4udGhpcy5hbGxMYXllcnNHZW9tZXRyaWVzKTtcbiAgICAgICAgICAgICAgICAgICAgfSwgdGhpcyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfS5iaW5kKHRoaXMpKTtcbiAgICAgICAgICAgIHRoaXMuYWxsR2VvbWV0cmllcyA9IFtdLmNvbmNhdCguLi50aGlzLmFsbExheWVyc0dlb21ldHJpZXMpO1xuICAgICAgICAgICAgdGhpcy5fbW91c2Vtb3ZlTGF5ZXIuYnJpbmdUb0Zyb250KCk7XG4gICAgICAgIH0gZWxzZSBpZiAobGF5ZXIgaW5zdGFuY2VvZiBtYXB0YWxrcy5WZWN0b3JMYXllcikge1xuICAgICAgICAgICAgY29uc3QgZ2VvbWV0cmllcyA9IGxheWVyLmdldEdlb21ldHJpZXMoKTtcbiAgICAgICAgICAgIHRoaXMuc25hcGxheWVyID0gbGF5ZXI7XG4gICAgICAgICAgICB0aGlzLmFsbEdlb21ldHJpZXMgPSB0aGlzLl9jb21wb3NpdEdlb21ldHJpZXMoZ2VvbWV0cmllcyk7XG4gICAgICAgICAgICBsYXllci5vbignYWRkZ2VvJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGdlb21ldHJpZXMgPSB0aGlzLnNuYXBsYXllci5nZXRHZW9tZXRyaWVzKCk7XG4gICAgICAgICAgICAgICAgdGhpcy5hbGxHZW9tZXRyaWVzID0gdGhpcy5fY29tcG9zaXRHZW9tZXRyaWVzKGdlb21ldHJpZXMpO1xuICAgICAgICAgICAgfSwgdGhpcyk7XG4gICAgICAgICAgICB0aGlzLnNuYXBsYXllci5vbignY2xlYXInLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fY2xlYXJHZW9tZXRyaWVzKCk7XG4gICAgICAgICAgICB9LCB0aGlzKTtcbiAgICAgICAgICAgIHRoaXMuX21vdXNlbW92ZUxheWVyLmJyaW5nVG9Gcm9udCgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtkcmF3VG9vbHx8bWFwdGFsa3MuRHJhd1Rvb2x9IGRyYXdpbmcgdG9vbFxuICAgICAqIFdoZW4gaW50ZXJhY3Rpbmcgd2l0aCBhIGRyYXd0b29sLCB5b3Ugc2hvdWxkIGJpbmQgdGhlIGRyYXd0b29sIG9iamVjdCB0byB0aGlzIHNuYXB0byB0b29sXG4gICAgICovXG4gICAgYmluZERyYXdUb29sKGRyYXdUb29sKSB7XG4gICAgICAgIGlmIChkcmF3VG9vbCBpbnN0YW5jZW9mIG1hcHRhbGtzLkRyYXdUb29sKSB7XG4gICAgICAgICAgICBkcmF3VG9vbC5vbignZHJhd3N0YXJ0JywgKGUpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5zbmFwUG9pbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fcmVzZXRDb29yZGluYXRlcyhlLnRhcmdldC5fZ2VvbWV0cnksIHRoaXMuc25hcFBvaW50KTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fcmVzZXRDbGlja1BvaW50KGUudGFyZ2V0Ll9jbGlja0Nvb3JkcywgdGhpcy5zbmFwUG9pbnQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sIHRoaXMpO1xuICAgICAgICAgICAgZHJhd1Rvb2wub24oJ21vdXNlbW92ZScsIChlKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuc25hcFBvaW50KSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG1vZGUgPSBlLnRhcmdldC5nZXRNb2RlKCk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG1hcCA9IGUudGFyZ2V0LmdldE1hcCgpO1xuICAgICAgICAgICAgICAgICAgICBpZiAobW9kZSA9PT0gJ2NpcmNsZScgfHwgbW9kZSA9PT0gJ2ZyZWVIYW5kQ2lyY2xlJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcmFkaXVzID0gbWFwLmNvbXB1dGVMZW5ndGgoZS50YXJnZXQuX2dlb21ldHJ5LmdldENlbnRlcigpLCB0aGlzLnNuYXBQb2ludCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBlLnRhcmdldC5fZ2VvbWV0cnkuc2V0UmFkaXVzKHJhZGl1cyk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAobW9kZSA9PT0gJ2VsbGlwc2UnIHx8IG1vZGUgPT09ICdmcmVlSGFuZEVsbGlwc2UnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBjZW50ZXIgPSBlLnRhcmdldC5fZ2VvbWV0cnkuZ2V0Q2VudGVyKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCByeCA9IG1hcC5jb21wdXRlTGVuZ3RoKGNlbnRlciwgbmV3IG1hcHRhbGtzLkNvb3JkaW5hdGUoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHg6IHRoaXMuc25hcFBvaW50LngsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeTogY2VudGVyLnlcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHJ5ID0gbWFwLmNvbXB1dGVMZW5ndGgoY2VudGVyLCBuZXcgbWFwdGFsa3MuQ29vcmRpbmF0ZSh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeDogY2VudGVyLngsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeTogdGhpcy5zbmFwUG9pbnQueVxuICAgICAgICAgICAgICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZS50YXJnZXQuX2dlb21ldHJ5LnNldFdpZHRoKHJ4ICogMik7XG4gICAgICAgICAgICAgICAgICAgICAgICBlLnRhcmdldC5fZ2VvbWV0cnkuc2V0SGVpZ2h0KHJ5ICogMik7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAobW9kZSA9PT0gJ3JlY3RhbmdsZScgfHwgbW9kZSA9PT0gJ2ZyZWVIYW5kUmVjdGFuZ2xlJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgY29udGFpbmVyUG9pbnQgPSBtYXAuY29vcmRUb0NvbnRhaW5lclBvaW50KG5ldyBtYXB0YWxrcy5Db29yZGluYXRlKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB4OiB0aGlzLnNuYXBQb2ludC54LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHk6IHRoaXMuc25hcFBvaW50LnlcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGZpcnN0Q2xpY2sgPSBtYXAuY29vcmRUb0NvbnRhaW5lclBvaW50KGUudGFyZ2V0Ll9nZW9tZXRyeS5nZXRGaXJzdENvb3JkaW5hdGUoKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCByaW5nID0gW1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFtmaXJzdENsaWNrLngsIGZpcnN0Q2xpY2sueV0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgW2NvbnRhaW5lclBvaW50LngsIGZpcnN0Q2xpY2sueV0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgW2NvbnRhaW5lclBvaW50LngsIGNvbnRhaW5lclBvaW50LnldLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFtmaXJzdENsaWNrLngsIGNvbnRhaW5lclBvaW50LnldXG4gICAgICAgICAgICAgICAgICAgICAgICBdO1xuICAgICAgICAgICAgICAgICAgICAgICAgZS50YXJnZXQuX2dlb21ldHJ5LnNldENvb3JkaW5hdGVzKHJpbmcubWFwKGMgPT4gbWFwLmNvbnRhaW5lclBvaW50VG9Db29yZChuZXcgbWFwdGFsa3MuUG9pbnQoYykpKSk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9yZXNldENvb3JkaW5hdGVzKGUudGFyZ2V0Ll9nZW9tZXRyeSwgdGhpcy5zbmFwUG9pbnQpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSwgdGhpcyk7XG4gICAgICAgICAgICBkcmF3VG9vbC5vbignZHJhd3ZlcnRleCcsIChlKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuc25hcFBvaW50KSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3Jlc2V0Q29vcmRpbmF0ZXMoZS50YXJnZXQuX2dlb21ldHJ5LCB0aGlzLnNuYXBQb2ludCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3Jlc2V0Q2xpY2tQb2ludChlLnRhcmdldC5fY2xpY2tDb29yZHMsIHRoaXMuc25hcFBvaW50KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LCB0aGlzKTtcbiAgICAgICAgICAgIGRyYXdUb29sLm9uKCdkcmF3ZW5kJywgKGUpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5zbmFwUG9pbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbW9kZSA9IGUudGFyZ2V0LmdldE1vZGUoKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbWFwID0gZS50YXJnZXQuZ2V0TWFwKCk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGdlb21ldHJ5ID0gZS5nZW9tZXRyeTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG1vZGUgPT09ICdjaXJjbGUnIHx8IG1vZGUgPT09ICdmcmVlSGFuZENpcmNsZScpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHJhZGl1cyA9IG1hcC5jb21wdXRlTGVuZ3RoKGUudGFyZ2V0Ll9nZW9tZXRyeS5nZXRDZW50ZXIoKSwgdGhpcy5zbmFwUG9pbnQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZ2VvbWV0cnkuc2V0UmFkaXVzKHJhZGl1cyk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAobW9kZSA9PT0gJ2VsbGlwc2UnIHx8IG1vZGUgPT09ICdmcmVlSGFuZEVsbGlwc2UnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBjZW50ZXIgPSBnZW9tZXRyeS5nZXRDZW50ZXIoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHJ4ID0gbWFwLmNvbXB1dGVMZW5ndGgoY2VudGVyLCBuZXcgbWFwdGFsa3MuQ29vcmRpbmF0ZSh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeDogdGhpcy5zbmFwUG9pbnQueCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB5OiBjZW50ZXIueVxuICAgICAgICAgICAgICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcnkgPSBtYXAuY29tcHV0ZUxlbmd0aChjZW50ZXIsIG5ldyBtYXB0YWxrcy5Db29yZGluYXRlKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB4OiBjZW50ZXIueCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB5OiB0aGlzLnNuYXBQb2ludC55XG4gICAgICAgICAgICAgICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBnZW9tZXRyeS5zZXRXaWR0aChyeCAqIDIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZ2VvbWV0cnkuc2V0SGVpZ2h0KHJ5ICogMik7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAobW9kZSA9PT0gJ3JlY3RhbmdsZScgfHwgbW9kZSA9PT0gJ2ZyZWVIYW5kUmVjdGFuZ2xlJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgY29udGFpbmVyUG9pbnQgPSBtYXAuY29vcmRUb0NvbnRhaW5lclBvaW50KG5ldyBtYXB0YWxrcy5Db29yZGluYXRlKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB4OiB0aGlzLnNuYXBQb2ludC54LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHk6IHRoaXMuc25hcFBvaW50LnlcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGZpcnN0Q2xpY2sgPSBtYXAuY29vcmRUb0NvbnRhaW5lclBvaW50KGdlb21ldHJ5LmdldEZpcnN0Q29vcmRpbmF0ZSgpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHJpbmcgPSBbXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgW2ZpcnN0Q2xpY2sueCwgZmlyc3RDbGljay55XSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBbY29udGFpbmVyUG9pbnQueCwgZmlyc3RDbGljay55XSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBbY29udGFpbmVyUG9pbnQueCwgY29udGFpbmVyUG9pbnQueV0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgW2ZpcnN0Q2xpY2sueCwgY29udGFpbmVyUG9pbnQueV1cbiAgICAgICAgICAgICAgICAgICAgICAgIF07XG4gICAgICAgICAgICAgICAgICAgICAgICBnZW9tZXRyeS5zZXRDb29yZGluYXRlcyhyaW5nLm1hcChjID0+IG1hcC5jb250YWluZXJQb2ludFRvQ29vcmQobmV3IG1hcHRhbGtzLlBvaW50KGMpKSkpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fcmVzZXRDb29yZGluYXRlcyhnZW9tZXRyeSwgdGhpcy5zbmFwUG9pbnQpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSwgdGhpcyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBfcmVzZXRDb29yZGluYXRlcyhnZW9tZXRyeSwgc25hcFBvaW50KSB7XG4gICAgICAgIGlmICghZ2VvbWV0cnkpIHJldHVybiBnZW9tZXRyeTtcbiAgICAgICAgY29uc3QgY29vcmRzID0gZ2VvbWV0cnkuZ2V0Q29vcmRpbmF0ZXMoKTtcbiAgICAgICAgaWYgKGdlb21ldHJ5IGluc3RhbmNlb2YgbWFwdGFsa3MuUG9seWdvbikge1xuICAgICAgICAgICAgaWYgKGdlb21ldHJ5IGluc3RhbmNlb2YgbWFwdGFsa3MuQ2lyY2xlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGdlb21ldHJ5O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIGNvb3JkaW5hdGVzID0gY29vcmRzWzBdO1xuICAgICAgICAgICAgaWYgKGNvb3JkaW5hdGVzIGluc3RhbmNlb2YgQXJyYXkgJiYgY29vcmRpbmF0ZXMubGVuZ3RoID4gMikge1xuICAgICAgICAgICAgICAgIGNvb3JkaW5hdGVzW2Nvb3JkaW5hdGVzLmxlbmd0aCAtIDJdLnggPSBzbmFwUG9pbnQueDtcbiAgICAgICAgICAgICAgICBjb29yZGluYXRlc1tjb29yZGluYXRlcy5sZW5ndGggLSAyXS55ID0gc25hcFBvaW50Lnk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoY29vcmRzIGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICAgICAgICAgIGNvb3Jkc1tjb29yZHMubGVuZ3RoIC0gMV0ueCA9IHNuYXBQb2ludC54O1xuICAgICAgICAgICAgY29vcmRzW2Nvb3Jkcy5sZW5ndGggLSAxXS55ID0gc25hcFBvaW50Lnk7XG4gICAgICAgIH0gZWxzZSBpZiAoY29vcmRzIGluc3RhbmNlb2YgbWFwdGFsa3MuQ29vcmRpbmF0ZSkge1xuICAgICAgICAgICAgY29vcmRzLnggPSBzbmFwUG9pbnQueDtcbiAgICAgICAgICAgIGNvb3Jkcy55ID0gc25hcFBvaW50Lnk7XG4gICAgICAgIH1cbiAgICAgICAgZ2VvbWV0cnkuc2V0Q29vcmRpbmF0ZXMoY29vcmRzKTtcbiAgICAgICAgcmV0dXJuIGdlb21ldHJ5O1xuICAgIH1cblxuICAgIF9yZXNldENsaWNrUG9pbnQoY2xpY2tDb29yZHMsIHNuYXBQb2ludCkge1xuICAgICAgICBpZiAoIWNsaWNrQ29vcmRzKSByZXR1cm47XG4gICAgICAgIGNvbnN0IG1hcCA9IHRoaXMuZ2V0TWFwKCk7XG4gICAgICAgIGNvbnN0IGNsaWNrUG9pbnQgPSBtYXAuX3BvaW50VG9QcmoobWFwLmNvb3JkaW5hdGVUb1BvaW50KHNuYXBQb2ludCkpO1xuICAgICAgICBjbGlja0Nvb3Jkc1tjbGlja0Nvb3Jkcy5sZW5ndGggLSAxXS54ID0gY2xpY2tQb2ludC54O1xuICAgICAgICBjbGlja0Nvb3Jkc1tjbGlja0Nvb3Jkcy5sZW5ndGggLSAxXS55ID0gY2xpY2tQb2ludC55O1xuICAgIH1cblxuICAgIF9hZGRHZW9tZXRyaWVzKGdlb21ldHJpZXMpIHtcbiAgICAgICAgZ2VvbWV0cmllcyA9IChnZW9tZXRyaWVzIGluc3RhbmNlb2YgQXJyYXkpID8gZ2VvbWV0cmllcyA6IFtnZW9tZXRyaWVzXTtcbiAgICAgICAgY29uc3QgYWRkR2VvbWV0cmllcyA9IHRoaXMuX2NvbXBvc2l0R2VvbWV0cmllcyhnZW9tZXRyaWVzKTtcbiAgICAgICAgdGhpcy5hbGxHZW9tZXRyaWVzID0gdGhpcy5hbGxHZW9tZXRyaWVzLmNvbmNhdChhZGRHZW9tZXRyaWVzKTtcbiAgICB9XG5cbiAgICBfY2xlYXJHZW9tZXRyaWVzKCkge1xuICAgICAgICB0aGlzLmFkZEdlb21ldHJpZXMgPSBbXTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge0Nvb3JkaW5hdGV9IG1vdXNlJ3MgY29vcmRpbmF0ZSBvbiBtYXBcbiAgICAgKiBVc2luZyBhIHBvaW50IHRvIGluc3BlY3QgdGhlIHN1cnJvdW5kaW5nIGdlb21ldHJpZXNcbiAgICAgKi9cbiAgICBfcHJlcGFyZUdlb21ldHJpZXMoY29vcmRpbmF0ZSkge1xuICAgICAgICBpZiAodGhpcy5hbGxHZW9tZXRyaWVzKSB7XG4gICAgICAgICAgICBjb25zdCBhbGxHZW9Jbkdlb2pzb24gPSB0aGlzLmFsbEdlb21ldHJpZXM7XG4gICAgICAgICAgICB0aGlzLnRyZWUuY2xlYXIoKTtcbiAgICAgICAgICAgIHRoaXMudHJlZS5sb2FkKHtcbiAgICAgICAgICAgICAgICAndHlwZSc6ICdGZWF0dXJlQ29sbGVjdGlvbicsXG4gICAgICAgICAgICAgICAgJ2ZlYXR1cmVzJzphbGxHZW9Jbkdlb2pzb25cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdGhpcy5pbnNwZWN0RXh0ZW50ID0gdGhpcy5fY3JlYXRlSW5zcGVjdEV4dGVudChjb29yZGluYXRlKTtcbiAgICAgICAgICAgIGNvbnN0IGF2YWlsR2VvbWV0cmllcyA9IHRoaXMudHJlZS5zZWFyY2godGhpcy5pbnNwZWN0RXh0ZW50KTtcbiAgICAgICAgICAgIHJldHVybiBhdmFpbEdlb21ldHJpZXM7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgX2NvbXBvc2l0R2VvbWV0cmllcyhnZW9tZXRyaWVzKSB7XG4gICAgICAgIGxldCBnZW9zID0gW107XG4gICAgICAgIGNvbnN0IG1vZGUgPSB0aGlzLmdldE1vZGUoKTtcbiAgICAgICAgaWYgKG1vZGUgPT09ICdwb2ludCcpIHtcbiAgICAgICAgICAgIGdlb3MgPSB0aGlzLl9jb21wb3NpdFRvUG9pbnRzKGdlb21ldHJpZXMpO1xuICAgICAgICB9IGVsc2UgaWYgKG1vZGUgPT09ICdsaW5lJykge1xuICAgICAgICAgICAgZ2VvcyA9IHRoaXMuX2NvbXBvc2l0VG9MaW5lcyhnZW9tZXRyaWVzKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZ2VvcztcbiAgICB9XG5cbiAgICBfY29tcG9zaXRUb1BvaW50cyhnZW9tZXRyaWVzKSB7XG4gICAgICAgIGxldCBnZW9zID0gW107XG4gICAgICAgIGdlb21ldHJpZXMuZm9yRWFjaChmdW5jdGlvbiAoZ2VvKSB7XG4gICAgICAgICAgICBnZW9zID0gZ2Vvcy5jb25jYXQodGhpcy5fcGFyc2VyVG9Qb2ludHMoZ2VvKSk7XG4gICAgICAgIH0uYmluZCh0aGlzKSk7XG4gICAgICAgIHJldHVybiBnZW9zO1xuICAgIH1cblxuICAgIF9jcmVhdGVNYXJrZXJzKGNvb3Jkcykge1xuICAgICAgICBjb25zdCBtYXJrZXJzID0gW107XG4gICAgICAgIGNvb3Jkcy5mb3JFYWNoKGZ1bmN0aW9uIChjb29yZCkge1xuICAgICAgICAgICAgaWYgKGNvb3JkIGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICAgICAgICAgICAgICBjb29yZC5mb3JFYWNoKGZ1bmN0aW9uIChfY29vcmQpIHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IF9nZW8gPSBuZXcgbWFwdGFsa3MuTWFya2VyKF9jb29yZCwge1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge31cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIF9nZW8gPSBfZ2VvLnRvR2VvSlNPTigpO1xuICAgICAgICAgICAgICAgICAgICBtYXJrZXJzLnB1c2goX2dlbyk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGxldCBfZ2VvID0gbmV3IG1hcHRhbGtzLk1hcmtlcihjb29yZCwge1xuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOnt9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgX2dlbyA9IF9nZW8udG9HZW9KU09OKCk7XG4gICAgICAgICAgICAgICAgbWFya2Vycy5wdXNoKF9nZW8pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIG1hcmtlcnM7XG4gICAgfVxuXG4gICAgX3BhcnNlclRvUG9pbnRzKGdlbykge1xuICAgICAgICBjb25zdCB0eXBlID0gZ2VvLmdldFR5cGUoKTtcbiAgICAgICAgbGV0IGNvb3JkaW5hdGVzID0gbnVsbDtcbiAgICAgICAgaWYgKHR5cGUgPT09ICdDaXJjbGUnIHx8IHR5cGUgPT09ICdFbGxpcHNlJykge1xuICAgICAgICAgICAgY29vcmRpbmF0ZXMgPSBnZW8uZ2V0U2hlbGwoKTtcbiAgICAgICAgfSBlbHNlXG4gICAgICAgICAgICBjb29yZGluYXRlcyA9IGdlby5nZXRDb29yZGluYXRlcygpO1xuICAgICAgICBsZXQgZ2VvcyA9IFtdO1xuICAgICAgICAvL3R3byBjYXNlcyxvbmUgaXMgc2luZ2xlIGdlb21ldHJ5LGFuZCBhbm90aGVyIGlzIG11bHRpIGdlb21ldHJpZXNcbiAgICAgICAgaWYgKGNvb3JkaW5hdGVzWzBdIGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICAgICAgICAgIGNvb3JkaW5hdGVzLmZvckVhY2goZnVuY3Rpb24gKGNvb3Jkcykge1xuICAgICAgICAgICAgICAgIGNvbnN0IF9tYXJrZXJzID0gdGhpcy5fY3JlYXRlTWFya2Vycyhjb29yZHMpO1xuICAgICAgICAgICAgICAgIGdlb3MgPSBnZW9zLmNvbmNhdChfbWFya2Vycyk7XG4gICAgICAgICAgICB9LmJpbmQodGhpcykpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKCEoY29vcmRpbmF0ZXMgaW5zdGFuY2VvZiBBcnJheSkpIHtcbiAgICAgICAgICAgICAgICBjb29yZGluYXRlcyA9IFtjb29yZGluYXRlc107XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBfbWFya2VycyA9IHRoaXMuX2NyZWF0ZU1hcmtlcnMoY29vcmRpbmF0ZXMpO1xuICAgICAgICAgICAgZ2VvcyA9IGdlb3MuY29uY2F0KF9tYXJrZXJzKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZ2VvcztcbiAgICB9XG5cbiAgICBfY29tcG9zaXRUb0xpbmVzKGdlb21ldHJpZXMpIHtcbiAgICAgICAgbGV0IGdlb3MgPSBbXTtcbiAgICAgICAgZ2VvbWV0cmllcy5mb3JFYWNoKGZ1bmN0aW9uIChnZW8pIHtcbiAgICAgICAgICAgIHN3aXRjaCAoZ2VvLmdldFR5cGUoKSkge1xuICAgICAgICAgICAgY2FzZSAnUG9pbnQnOiB7XG4gICAgICAgICAgICAgICAgY29uc3QgX2dlbyA9IGdlby50b0dlb0pTT04oKTtcbiAgICAgICAgICAgICAgICBfZ2VvLnByb3BlcnRpZXMgPSB7fTtcbiAgICAgICAgICAgICAgICBnZW9zLnB1c2goX2dlbyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICdMaW5lU3RyaW5nJzpcbiAgICAgICAgICAgIGNhc2UgJ1BvbHlnb24nOlxuICAgICAgICAgICAgICAgIGdlb3MgPSBnZW9zLmNvbmNhdCh0aGlzLl9wYXJzZXJHZW9tZXRyaWVzKGdlbywgMSkpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cblxuICAgICAgICB9LmJpbmQodGhpcykpO1xuICAgICAgICByZXR1cm4gZ2VvcztcbiAgICB9XG5cbiAgICBfcGFyc2VyR2VvbWV0cmllcyhnZW8sIF9sZW4pIHtcbiAgICAgICAgY29uc3QgY29vcmRpbmF0ZXMgPSBnZW8uZ2V0Q29vcmRpbmF0ZXMoKTtcbiAgICAgICAgbGV0IGdlb3MgPSBbXTtcbiAgICAgICAgLy90d28gY2FzZXMsb25lIGlzIHNpbmdsZSBnZW9tZXRyeSxhbmQgYW5vdGhlciBpcyBtdWx0aSBnZW9tZXRyaWVzXG4gICAgICAgIGlmIChjb29yZGluYXRlc1swXSBpbnN0YW5jZW9mIEFycmF5KSB7XG4gICAgICAgICAgICBjb29yZGluYXRlcy5mb3JFYWNoKGZ1bmN0aW9uIChjb29yZHMpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBfbGluZXMgPSB0aGlzLl9jcmVhdGVMaW5lKGNvb3JkcywgX2xlbiwgZ2VvKTtcbiAgICAgICAgICAgICAgICBnZW9zID0gZ2Vvcy5jb25jYXQoX2xpbmVzKTtcbiAgICAgICAgICAgIH0uYmluZCh0aGlzKSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zdCBfbGluZXMgPSB0aGlzLl9jcmVhdGVMaW5lKGNvb3JkaW5hdGVzLCBfbGVuLCBnZW8pO1xuICAgICAgICAgICAgZ2VvcyA9IGdlb3MuY29uY2F0KF9saW5lcyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGdlb3M7XG4gICAgfVxuXG4gICAgX2NyZWF0ZUxpbmUoY29vcmRpbmF0ZXMsIF9sZW5ndGgsIGdlbykge1xuICAgICAgICBjb25zdCBsaW5lcyA9IFtdO1xuICAgICAgICBjb25zdCBsZW4gPSBjb29yZGluYXRlcy5sZW5ndGggLSBfbGVuZ3RoO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCBsaW5lID0gbmV3IG1hcHRhbGtzLkxpbmVTdHJpbmcoW2Nvb3JkaW5hdGVzW2ldLCBjb29yZGluYXRlc1tpICsgMV1dLCB7XG4gICAgICAgICAgICAgICAgcHJvcGVydGllcyA6IHtcbiAgICAgICAgICAgICAgICAgICAgb2JqIDogZ2VvXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBsaW5lcy5wdXNoKGxpbmUudG9HZW9KU09OKCkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBsaW5lcztcbiAgICB9XG5cbiAgICBfY3JlYXRlSW5zcGVjdEV4dGVudChjb29yZGluYXRlKSB7XG4gICAgICAgIGNvbnN0IHRvbGVyYW5jZSA9ICghdGhpcy5vcHRpb25zWyd0b2xlcmFuY2UnXSkgPyAxMCA6IHRoaXMub3B0aW9uc1sndG9sZXJhbmNlJ107XG4gICAgICAgIGNvbnN0IG1hcCA9IHRoaXMuZ2V0TWFwKCk7XG4gICAgICAgIGNvbnN0IHpvb20gPSBtYXAuZ2V0Wm9vbSgpO1xuICAgICAgICBjb25zdCBzY3JlZW5Qb2ludCA9IG1hcC5jb29yZGluYXRlVG9Qb2ludChjb29yZGluYXRlLCB6b29tKTtcbiAgICAgICAgY29uc3QgbGVmdHRvcCA9IG1hcC5wb2ludFRvQ29vcmRpbmF0ZShuZXcgbWFwdGFsa3MuUG9pbnQoW3NjcmVlblBvaW50LnggLSB0b2xlcmFuY2UsIHNjcmVlblBvaW50LnkgLSB0b2xlcmFuY2VdKSwgem9vbSk7XG4gICAgICAgIGNvbnN0IHJpZ2h0dG9wID0gbWFwLnBvaW50VG9Db29yZGluYXRlKG5ldyBtYXB0YWxrcy5Qb2ludChbc2NyZWVuUG9pbnQueCArIHRvbGVyYW5jZSwgc2NyZWVuUG9pbnQueSAtIHRvbGVyYW5jZV0pLCB6b29tKTtcbiAgICAgICAgY29uc3QgbGVmdGJvdHRvbSA9IG1hcC5wb2ludFRvQ29vcmRpbmF0ZShuZXcgbWFwdGFsa3MuUG9pbnQoW3NjcmVlblBvaW50LnggLSB0b2xlcmFuY2UsIHNjcmVlblBvaW50LnkgKyB0b2xlcmFuY2VdKSwgem9vbSk7XG4gICAgICAgIGNvbnN0IHJpZ2h0Ym90dG9tID0gbWFwLnBvaW50VG9Db29yZGluYXRlKG5ldyBtYXB0YWxrcy5Qb2ludChbc2NyZWVuUG9pbnQueCArIHRvbGVyYW5jZSwgc2NyZWVuUG9pbnQueSArIHRvbGVyYW5jZV0pLCB6b29tKTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICd0eXBlJzogJ0ZlYXR1cmUnLFxuICAgICAgICAgICAgJ3Byb3BlcnRpZXMnOiB7fSxcbiAgICAgICAgICAgICdnZW9tZXRyeSc6IHtcbiAgICAgICAgICAgICAgICAndHlwZSc6ICdQb2x5Z29uJyxcbiAgICAgICAgICAgICAgICAnY29vcmRpbmF0ZXMnOiBbW1tsZWZ0dG9wLngsIGxlZnR0b3AueV0sIFtyaWdodHRvcC54LCByaWdodHRvcC55XSwgW3JpZ2h0Ym90dG9tLngsIHJpZ2h0Ym90dG9tLnldLCBbbGVmdGJvdHRvbS54LCBsZWZ0Ym90dG9tLnldXV1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge01hcH1cbiAgICAgKiBSZWdpc3RlciBtb3VzZW1vdmUgZXZlbnRcbiAgICAgKi9cbiAgICBfcmVnaXN0ZXJFdmVudHMobWFwKSB7XG4gICAgICAgIHRoaXMuX25lZWRGaW5kR2VvbWV0cnkgPSB0cnVlO1xuICAgICAgICB0aGlzLl9tb3VzZW1vdmUgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgdGhpcy5tb3VzZVBvaW50ID0gZS5jb29yZGluYXRlO1xuICAgICAgICAgICAgaWYgKCF0aGlzLl9tYXJrZXIpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9tYXJrZXIgPSBuZXcgbWFwdGFsa3MuTWFya2VyKGUuY29vcmRpbmF0ZSwge1xuICAgICAgICAgICAgICAgICAgICAnc3ltYm9sJyA6IHRoaXMub3B0aW9uc1snc3ltYm9sJ11cbiAgICAgICAgICAgICAgICB9KS5hZGRUbyh0aGlzLl9tb3VzZW1vdmVMYXllcik7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuX21hcmtlci5zZXRDb29yZGluYXRlcyhlLmNvb3JkaW5hdGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy9pbmRpY2F0ZSBmaW5kIGdlb21ldHJ5XG4gICAgICAgICAgICBpZiAoIXRoaXMuX25lZWRGaW5kR2VvbWV0cnkpIHJldHVybjtcbiAgICAgICAgICAgIGNvbnN0IGF2YWlsR2VvbWV0cmllcyA9IHRoaXMuX2ZpbmRHZW9tZXRyeShlLmNvb3JkaW5hdGUpO1xuICAgICAgICAgICAgaWYgKGF2YWlsR2VvbWV0cmllcy5mZWF0dXJlcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zbmFwUG9pbnQgPSB0aGlzLl9nZXRTbmFwUG9pbnQoYXZhaWxHZW9tZXRyaWVzKTtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5zbmFwUG9pbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fbWFya2VyLnNldENvb3JkaW5hdGVzKFt0aGlzLnNuYXBQb2ludC54LCB0aGlzLnNuYXBQb2ludC55XSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLnNuYXBQb2ludCA9IG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIHRoaXMuX21vdXNlZG93biA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoaXMuX25lZWRGaW5kR2VvbWV0cnkgPSBmYWxzZTtcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5fbW91c2V1cCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoaXMuX25lZWRGaW5kR2VvbWV0cnkgPSB0cnVlO1xuICAgICAgICB9O1xuICAgICAgICBtYXAub24oJ21vdXNlbW92ZSB0b3VjaHN0YXJ0JywgdGhpcy5fbW91c2Vtb3ZlLCB0aGlzKTtcbiAgICAgICAgbWFwLm9uKCdtb3VzZWRvd24nLCB0aGlzLl9tb3VzZWRvd24sIHRoaXMpO1xuICAgICAgICBtYXAub24oJ21vdXNldXAnLCB0aGlzLl9tb3VzZXVwLCB0aGlzKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge0FycmF5PGdlb21ldHJ5Pn0gYXZhaWxhYmxlIGdlb21ldHJpZXMgd2hpY2ggYXJlIHN1cnJvdW5kZWRcbiAgICAgKiBDYWxjdWxhdGUgdGhlIGRpc3RhbmNlIGZyb20gbW91c2UgcG9pbnQgdG8gZXZlcnkgZ2VvbWV0cnlcbiAgICAgKi9cbiAgICBfc2V0RGlzdGFuY2UoZ2Vvcykge1xuICAgICAgICBjb25zdCBnZW9PYmplY3RzID0gW107XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZ2Vvcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY29uc3QgZ2VvID0gZ2Vvc1tpXTtcbiAgICAgICAgICAgIGlmIChnZW8uZ2VvbWV0cnkudHlwZSA9PT0gJ0xpbmVTdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZGlzdGFuY2UgPSB0aGlzLl9kaXN0VG9Qb2x5bGluZSh0aGlzLm1vdXNlUG9pbnQsIGdlbyk7XG4gICAgICAgICAgICAgICAgLy9nZW8ucHJvcGVydGllcy5kaXN0YW5jZSA9IGRpc3RhbmNlO1xuICAgICAgICAgICAgICAgIGdlb09iamVjdHMucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgIGdlb09iamVjdCA6IGdlbyxcbiAgICAgICAgICAgICAgICAgICAgZGlzdGFuY2UgOiBkaXN0YW5jZVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChnZW8uZ2VvbWV0cnkudHlwZSA9PT0gJ1BvaW50Jykge1xuICAgICAgICAgICAgICAgIGNvbnN0IGRpc3RhbmNlID0gdGhpcy5fZGlzdFRvUG9pbnQodGhpcy5tb3VzZVBvaW50LCBnZW8pO1xuICAgICAgICAgICAgICAgIC8vQ29tcG9zaXRlIGFuIG9iamVjdCBpbmNsdWRpbmcgZ2VvbWV0cnkgYW5kIGRpc3RhbmNlXG4gICAgICAgICAgICAgICAgZ2VvT2JqZWN0cy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgZ2VvT2JqZWN0IDogZ2VvLFxuICAgICAgICAgICAgICAgICAgICBkaXN0YW5jZSA6IGRpc3RhbmNlXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGdlb09iamVjdHM7XG4gICAgfVxuXG4gICAgX2ZpbmROZWFyZXN0R2VvbWV0cmllcyhnZW9zKSB7XG4gICAgICAgIGxldCBnZW9PYmplY3RzID0gdGhpcy5fc2V0RGlzdGFuY2UoZ2Vvcyk7XG4gICAgICAgIGdlb09iamVjdHMgPSBnZW9PYmplY3RzLnNvcnQodGhpcy5fY29tcGFyZShnZW9PYmplY3RzLCAnZGlzdGFuY2UnKSk7XG4gICAgICAgIHJldHVybiBnZW9PYmplY3RzWzBdO1xuICAgIH1cblxuICAgIF9maW5kR2VvbWV0cnkoY29vcmRpbmF0ZSkge1xuICAgICAgICBjb25zdCBhdmFpbEdlaW1ldHJpZXMgPSB0aGlzLl9wcmVwYXJlR2VvbWV0cmllcyhjb29yZGluYXRlKTtcbiAgICAgICAgcmV0dXJuIGF2YWlsR2VpbWV0cmllcztcbiAgICB9XG5cbiAgICBfZ2V0U25hcFBvaW50KGF2YWlsR2VvbWV0cmllcykge1xuICAgICAgICBjb25zdCBfbmVhcmVzdEdlb21ldHJ5ID0gdGhpcy5fZmluZE5lYXJlc3RHZW9tZXRyaWVzKGF2YWlsR2VvbWV0cmllcy5mZWF0dXJlcyk7XG4gICAgICAgIGxldCBzbmFwUG9pbnQgPSBudWxsO1xuICAgICAgICBpZiAoIXRoaXMuX3ZhbGlkRGlzdGFuY2UoX25lYXJlc3RHZW9tZXRyeS5kaXN0YW5jZSkpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIC8vd2hlbiBpdCdzIHBvaW50LCByZXR1cm4gaXRzZWxmXG4gICAgICAgIGlmIChfbmVhcmVzdEdlb21ldHJ5Lmdlb09iamVjdC5nZW9tZXRyeS50eXBlID09PSAnUG9pbnQnKSB7XG4gICAgICAgICAgICBzbmFwUG9pbnQgPSB7XG4gICAgICAgICAgICAgICAgeCA6IF9uZWFyZXN0R2VvbWV0cnkuZ2VvT2JqZWN0Lmdlb21ldHJ5LmNvb3JkaW5hdGVzWzBdLFxuICAgICAgICAgICAgICAgIHkgOiBfbmVhcmVzdEdlb21ldHJ5Lmdlb09iamVjdC5nZW9tZXRyeS5jb29yZGluYXRlc1sxXVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSBlbHNlIGlmIChfbmVhcmVzdEdlb21ldHJ5Lmdlb09iamVjdC5nZW9tZXRyeS50eXBlID09PSAnTGluZVN0cmluZycpIHtcbiAgICAgICAgICAgIC8vd2hlbiBpdCdzIGxpbmUscmV0dXJuIHRoZSB2ZXJ0aWNhbCBpbnNlY3QgcG9pbnRcbiAgICAgICAgICAgIGNvbnN0IG5lYXJlc3RMaW5lID0gdGhpcy5fc2V0RXF1YXRpb24oX25lYXJlc3RHZW9tZXRyeS5nZW9PYmplY3QpO1xuICAgICAgICAgICAgLy93aGV0aGVyIGsgZXhpc3RzXG4gICAgICAgICAgICBpZiAobmVhcmVzdExpbmUuQSA9PT0gMCkge1xuICAgICAgICAgICAgICAgIHNuYXBQb2ludCA9IHtcbiAgICAgICAgICAgICAgICAgICAgeDogdGhpcy5tb3VzZVBvaW50LngsXG4gICAgICAgICAgICAgICAgICAgIHk6IF9uZWFyZXN0R2VvbWV0cnkuZ2VvT2JqZWN0Lmdlb21ldHJ5LmNvb3JkaW5hdGVzWzBdWzFdXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAobmVhcmVzdExpbmUuQSA9PT0gSW5maW5pdHkpIHtcbiAgICAgICAgICAgICAgICBzbmFwUG9pbnQgPSB7XG4gICAgICAgICAgICAgICAgICAgIHg6IF9uZWFyZXN0R2VvbWV0cnkuZ2VvT2JqZWN0Lmdlb21ldHJ5LmNvb3JkaW5hdGVzWzBdWzBdLFxuICAgICAgICAgICAgICAgICAgICB5OiB0aGlzLm1vdXNlUG9pbnQueVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnN0IGsgPSBuZWFyZXN0TGluZS5CIC8gbmVhcmVzdExpbmUuQTtcbiAgICAgICAgICAgICAgICBjb25zdCB2ZXJ0aWNhbExpbmUgPSB0aGlzLl9zZXRWZXJ0aUVxdWF0aW9uKGssIHRoaXMubW91c2VQb2ludCk7XG4gICAgICAgICAgICAgICAgc25hcFBvaW50ID0gdGhpcy5fc29sdmVFcXVhdGlvbihuZWFyZXN0TGluZSwgdmVydGljYWxMaW5lKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gc25hcFBvaW50O1xuICAgIH1cblxuICAgIC8vQ2FsY3VsYXRlIHRoZSBkaXN0YW5jZSBmcm9tIGEgcG9pbnQgdG8gYSBsaW5lXG4gICAgX2Rpc3RUb1BvbHlsaW5lKHBvaW50LCBsaW5lKSB7XG4gICAgICAgIGNvbnN0IGVxdWF0aW9uID0gdGhpcy5fc2V0RXF1YXRpb24obGluZSk7XG4gICAgICAgIGNvbnN0IEEgPSBlcXVhdGlvbi5BO1xuICAgICAgICBjb25zdCBCID0gZXF1YXRpb24uQjtcbiAgICAgICAgY29uc3QgQyA9IGVxdWF0aW9uLkM7XG4gICAgICAgIGNvbnN0IGRpc3RhbmNlID0gTWF0aC5hYnMoKEEgKiBwb2ludC54ICsgQiAqIHBvaW50LnkgKyBDKSAvIE1hdGguc3FydChNYXRoLnBvdyhBLCAyKSArIE1hdGgucG93KEIsIDIpKSk7XG4gICAgICAgIHJldHVybiBkaXN0YW5jZTtcbiAgICB9XG5cbiAgICBfdmFsaWREaXN0YW5jZShkaXN0YW5jZSkge1xuICAgICAgICBjb25zdCBtYXAgPSB0aGlzLmdldE1hcCgpO1xuICAgICAgICBjb25zdCByZXNvbHV0aW9uID0gbWFwLmdldFJlc29sdXRpb24oKTtcbiAgICAgICAgY29uc3QgdG9sZXJhbmNlID0gdGhpcy5vcHRpb25zWyd0b2xlcmFuY2UnXTtcbiAgICAgICAgaWYgKGRpc3RhbmNlIC8gcmVzb2x1dGlvbiA+IHRvbGVyYW5jZSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBfZGlzdFRvUG9pbnQobW91c2VQb2ludCwgdG9Qb2ludCkge1xuICAgICAgICBjb25zdCBmcm9tID0gW21vdXNlUG9pbnQueCwgbW91c2VQb2ludC55XTtcbiAgICAgICAgY29uc3QgdG8gPSB0b1BvaW50Lmdlb21ldHJ5LmNvb3JkaW5hdGVzO1xuICAgICAgICByZXR1cm4gTWF0aC5zcXJ0KE1hdGgucG93KGZyb21bMF0gLSB0b1swXSwgMikgKyBNYXRoLnBvdyhmcm9tWzFdIC0gdG9bMV0sIDIpKTtcbiAgICB9XG4gICAgLy9jcmVhdGUgYSBsaW5lJ3MgZXF1YXRpb25cbiAgICBfc2V0RXF1YXRpb24obGluZSkge1xuICAgICAgICBjb25zdCBjb29yZHMgPSBsaW5lLmdlb21ldHJ5LmNvb3JkaW5hdGVzO1xuICAgICAgICBjb25zdCBmcm9tID0gY29vcmRzWzBdO1xuICAgICAgICBjb25zdCB0byA9IGNvb3Jkc1sxXTtcbiAgICAgICAgY29uc3QgayA9IE51bWJlcigoZnJvbVsxXSAtIHRvWzFdKSAvIChmcm9tWzBdIC0gdG9bMF0pLnRvU3RyaW5nKCkpO1xuICAgICAgICBjb25zdCBBID0gaztcbiAgICAgICAgY29uc3QgQiA9IC0xO1xuICAgICAgICBjb25zdCBDID0gZnJvbVsxXSAtIGsgKiBmcm9tWzBdO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgQSA6IEEsXG4gICAgICAgICAgICBCIDogQixcbiAgICAgICAgICAgIEMgOiBDXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgX3NldFZlcnRpRXF1YXRpb24oaywgcG9pbnQpIHtcbiAgICAgICAgY29uc3QgYiA9IHBvaW50LnkgLSBrICogcG9pbnQueDtcbiAgICAgICAgY29uc3QgQSA9IGs7XG4gICAgICAgIGNvbnN0IEIgPSAtMTtcbiAgICAgICAgY29uc3QgQyA9IGI7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBBIDogQSxcbiAgICAgICAgICAgIEIgOiBCLFxuICAgICAgICAgICAgQyA6IENcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBfc29sdmVFcXVhdGlvbihlcXVhdGlvblcsIGVxdWF0aW9uVSkge1xuICAgICAgICBjb25zdCBBMSA9IGVxdWF0aW9uVy5BLCBCMSA9IGVxdWF0aW9uVy5CLCBDMSA9IGVxdWF0aW9uVy5DO1xuICAgICAgICBjb25zdCBBMiA9IGVxdWF0aW9uVS5BLCBCMiA9IGVxdWF0aW9uVS5CLCBDMiA9IGVxdWF0aW9uVS5DO1xuICAgICAgICBjb25zdCB4ID0gKEIxICogQzIgLSBDMSAqIEIyKSAvIChBMSAqIEIyIC0gQTIgKiBCMSk7XG4gICAgICAgIGNvbnN0IHkgPSAoQTEgKiBDMiAtIEEyICogQzEpIC8gKEIxICogQTIgLSBCMiAqIEExKTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHg6eCxcbiAgICAgICAgICAgIHk6eVxuICAgICAgICB9O1xuICAgIH1cblxuICAgIF9jb21wYXJlKGRhdGEsIHByb3BlcnR5TmFtZSkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKG9iamVjdDEsIG9iamVjdDIpIHtcbiAgICAgICAgICAgIGNvbnN0IHZhbHVlMSA9IG9iamVjdDFbcHJvcGVydHlOYW1lXTtcbiAgICAgICAgICAgIGNvbnN0IHZhbHVlMiA9IG9iamVjdDJbcHJvcGVydHlOYW1lXTtcbiAgICAgICAgICAgIGlmICh2YWx1ZTIgPCB2YWx1ZTEpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gMTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodmFsdWUyID4gdmFsdWUxKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG59XG5cblNuYXBUb29sLm1lcmdlT3B0aW9ucyhvcHRpb25zKTtcbiJdLCJuYW1lcyI6WyJnbG9iYWwiLCJmYWN0b3J5IiwibW9kdWxlIiwidGhpcyIsInF1aWNrc2VsZWN0IiwiYXJyIiwiayIsImxlZnQiLCJyaWdodCIsImNvbXBhcmUiLCJxdWlja3NlbGVjdFN0ZXAiLCJsZW5ndGgiLCJkZWZhdWx0Q29tcGFyZSIsIm4iLCJtIiwieiIsIk1hdGgiLCJsb2ciLCJzIiwiZXhwIiwic2QiLCJzcXJ0IiwibmV3TGVmdCIsIm1heCIsImZsb29yIiwibmV3UmlnaHQiLCJtaW4iLCJ0IiwiaSIsImoiLCJzd2FwIiwidG1wIiwiYSIsImIiLCJyYnVzaCIsIm1heEVudHJpZXMiLCJmb3JtYXQiLCJfbWF4RW50cmllcyIsIl9taW5FbnRyaWVzIiwiY2VpbCIsIl9pbml0Rm9ybWF0IiwiY2xlYXIiLCJwcm90b3R5cGUiLCJhbGwiLCJfYWxsIiwiZGF0YSIsInNlYXJjaCIsImJib3giLCJub2RlIiwicmVzdWx0IiwidG9CQm94IiwiaW50ZXJzZWN0cyIsIm5vZGVzVG9TZWFyY2giLCJsZW4iLCJjaGlsZCIsImNoaWxkQkJveCIsImNoaWxkcmVuIiwibGVhZiIsInB1c2giLCJjb250YWlucyIsInBvcCIsImNvbGxpZGVzIiwibG9hZCIsImluc2VydCIsIl9idWlsZCIsInNsaWNlIiwiaGVpZ2h0IiwiX3NwbGl0Um9vdCIsInRtcE5vZGUiLCJfaW5zZXJ0IiwiaXRlbSIsImNyZWF0ZU5vZGUiLCJyZW1vdmUiLCJlcXVhbHNGbiIsInBhdGgiLCJpbmRleGVzIiwicGFyZW50IiwiaW5kZXgiLCJnb2luZ1VwIiwiZmluZEl0ZW0iLCJzcGxpY2UiLCJfY29uZGVuc2UiLCJjb21wYXJlTWluWCIsImNvbXBhcmVOb2RlTWluWCIsImNvbXBhcmVNaW5ZIiwiY29tcGFyZU5vZGVNaW5ZIiwidG9KU09OIiwiZnJvbUpTT04iLCJhcHBseSIsIml0ZW1zIiwiTiIsIk0iLCJjYWxjQkJveCIsInBvdyIsIk4yIiwiTjEiLCJyaWdodDIiLCJyaWdodDMiLCJtdWx0aVNlbGVjdCIsIl9jaG9vc2VTdWJ0cmVlIiwibGV2ZWwiLCJ0YXJnZXROb2RlIiwiYXJlYSIsImVubGFyZ2VtZW50IiwibWluQXJlYSIsIm1pbkVubGFyZ2VtZW50IiwiSW5maW5pdHkiLCJiYm94QXJlYSIsImVubGFyZ2VkQXJlYSIsImlzTm9kZSIsImluc2VydFBhdGgiLCJleHRlbmQiLCJfc3BsaXQiLCJfYWRqdXN0UGFyZW50QkJveGVzIiwiX2Nob29zZVNwbGl0QXhpcyIsInNwbGl0SW5kZXgiLCJfY2hvb3NlU3BsaXRJbmRleCIsIm5ld05vZGUiLCJiYm94MSIsImJib3gyIiwib3ZlcmxhcCIsIm1pbk92ZXJsYXAiLCJkaXN0QkJveCIsImludGVyc2VjdGlvbkFyZWEiLCJ4TWFyZ2luIiwiX2FsbERpc3RNYXJnaW4iLCJ5TWFyZ2luIiwic29ydCIsImxlZnRCQm94IiwicmlnaHRCQm94IiwibWFyZ2luIiwiYmJveE1hcmdpbiIsInNpYmxpbmdzIiwiaW5kZXhPZiIsImNvbXBhcmVBcnIiLCJGdW5jdGlvbiIsImpvaW4iLCJwIiwiZGVzdE5vZGUiLCJtaW5YIiwibWluWSIsIm1heFgiLCJtYXhZIiwic3RhY2siLCJtaWQiLCJjb29yZEVhY2giLCJnZW9qc29uIiwiY2FsbGJhY2siLCJleGNsdWRlV3JhcENvb3JkIiwiZmVhdHVyZUluZGV4IiwiZ2VvbWV0cnlJbmRleCIsImwiLCJnZW9tZXRyeSIsInN0b3BHIiwiY29vcmRzIiwiZ2VvbWV0cnlNYXliZUNvbGxlY3Rpb24iLCJ3cmFwU2hyaW5rIiwiY29vcmRJbmRleCIsImlzR2VvbWV0cnlDb2xsZWN0aW9uIiwidHlwZSIsImlzRmVhdHVyZUNvbGxlY3Rpb24iLCJpc0ZlYXR1cmUiLCJzdG9wIiwiZmVhdHVyZXMiLCJnZW9tZXRyaWVzIiwiZmVhdHVyZVN1YkluZGV4IiwiY29vcmRpbmF0ZXMiLCJnZW9tVHlwZSIsIkVycm9yIiwiY29vcmRSZWR1Y2UiLCJpbml0aWFsVmFsdWUiLCJwcmV2aW91c1ZhbHVlIiwiY3VycmVudENvb3JkIiwidW5kZWZpbmVkIiwicHJvcEVhY2giLCJwcm9wZXJ0aWVzIiwicHJvcFJlZHVjZSIsImN1cnJlbnRQcm9wZXJ0aWVzIiwiZmVhdHVyZUVhY2giLCJmZWF0dXJlUmVkdWNlIiwiY3VycmVudEZlYXR1cmUiLCJjb29yZEFsbCIsImNvb3JkIiwiZ2VvbUVhY2giLCJnIiwiZ2VvbWV0cnlQcm9wZXJ0aWVzIiwiZ2VvbVJlZHVjZSIsImN1cnJlbnRHZW9tZXRyeSIsImN1cnJlbnRJbmRleCIsImZsYXR0ZW5FYWNoIiwiZmVhdHVyZSIsImZvckVhY2giLCJjb29yZGluYXRlIiwiZ2VvbSIsImZsYXR0ZW5SZWR1Y2UiLCJzZWdtZW50RWFjaCIsInNlZ21lbnRJbmRleCIsInByZXZpb3VzQ29vcmRzIiwiY3VycmVudFNlZ21lbnQiLCJsaW5lU3RyaW5nIiwic2VnbWVudFJlZHVjZSIsInN0YXJ0ZWQiLCJsaW5lRWFjaCIsInN1YkluZGV4IiwibGluZSIsIm11bHRpIiwicmluZyIsImxpbmVSZWR1Y2UiLCJjdXJyZW50TGluZSIsImxpbmVJbmRleCIsImxpbmVTdWJJbmRleCIsIm1ldGEiLCJ0cmVlIiwiQXJyYXkiLCJpc0FycmF5IiwiYmJveFBvbHlnb24iLCJ0dXJmQkJveCIsImNhbGwiLCJqc29uIiwibG93TGVmdCIsInRvcExlZnQiLCJ0b3BSaWdodCIsImxvd1JpZ2h0Iiwib3B0aW9ucyIsIlNuYXBUb29sIiwiZ2V0TW9kZSIsIl9tb2RlIiwiX2NoZWNrTW9kZSIsInNldE1vZGUiLCJtb2RlIiwic25hcGxheWVyIiwiYWxsTGF5ZXJzR2VvbWV0cmllcyIsInRlbXBMYXllciIsInRlbXBHZW9tZXRyaWVzIiwiZ2V0R2VvbWV0cmllcyIsIl9jb21wb3NpdEdlb21ldHJpZXMiLCJiaW5kIiwiYWxsR2VvbWV0cmllcyIsImNvbmNhdCIsImFkZFRvIiwibWFwIiwiaWQiLCJtYXB0YWxrcyIsIl9tb3VzZW1vdmVMYXllciIsIl9tYXAiLCJlbmFibGUiLCJkaXNhYmxlIiwiZ2V0TWFwIiwiX21vdXNlbW92ZSIsIl9yZWdpc3RlckV2ZW50cyIsInNob3ciLCJvZmYiLCJfbW91c2Vkb3duIiwiX21vdXNldXAiLCJoaWRlIiwic2V0R2VvbWV0cmllcyIsInNldExheWVyIiwibGF5ZXIiLCJvbiIsImJyaW5nVG9Gcm9udCIsIl9jbGVhckdlb21ldHJpZXMiLCJiaW5kRHJhd1Rvb2wiLCJkcmF3VG9vbCIsImUiLCJzbmFwUG9pbnQiLCJfcmVzZXRDb29yZGluYXRlcyIsInRhcmdldCIsIl9nZW9tZXRyeSIsIl9yZXNldENsaWNrUG9pbnQiLCJfY2xpY2tDb29yZHMiLCJyYWRpdXMiLCJjb21wdXRlTGVuZ3RoIiwiZ2V0Q2VudGVyIiwic2V0UmFkaXVzIiwiY2VudGVyIiwicngiLCJ4IiwieSIsInJ5Iiwic2V0V2lkdGgiLCJzZXRIZWlnaHQiLCJjb250YWluZXJQb2ludCIsImNvb3JkVG9Db250YWluZXJQb2ludCIsImZpcnN0Q2xpY2siLCJnZXRGaXJzdENvb3JkaW5hdGUiLCJzZXRDb29yZGluYXRlcyIsImMiLCJjb250YWluZXJQb2ludFRvQ29vcmQiLCJnZXRDb29yZGluYXRlcyIsImNsaWNrQ29vcmRzIiwiY2xpY2tQb2ludCIsIl9wb2ludFRvUHJqIiwiY29vcmRpbmF0ZVRvUG9pbnQiLCJfYWRkR2VvbWV0cmllcyIsImFkZEdlb21ldHJpZXMiLCJfcHJlcGFyZUdlb21ldHJpZXMiLCJhbGxHZW9Jbkdlb2pzb24iLCJpbnNwZWN0RXh0ZW50IiwiX2NyZWF0ZUluc3BlY3RFeHRlbnQiLCJhdmFpbEdlb21ldHJpZXMiLCJnZW9zIiwiX2NvbXBvc2l0VG9Qb2ludHMiLCJfY29tcG9zaXRUb0xpbmVzIiwiZ2VvIiwiX3BhcnNlclRvUG9pbnRzIiwiX2NyZWF0ZU1hcmtlcnMiLCJtYXJrZXJzIiwiX2Nvb3JkIiwiX2dlbyIsInRvR2VvSlNPTiIsImdldFR5cGUiLCJnZXRTaGVsbCIsIl9tYXJrZXJzIiwiX3BhcnNlckdlb21ldHJpZXMiLCJfbGVuIiwiX2xpbmVzIiwiX2NyZWF0ZUxpbmUiLCJfbGVuZ3RoIiwibGluZXMiLCJvYmoiLCJ0b2xlcmFuY2UiLCJ6b29tIiwiZ2V0Wm9vbSIsInNjcmVlblBvaW50IiwibGVmdHRvcCIsInBvaW50VG9Db29yZGluYXRlIiwicmlnaHR0b3AiLCJsZWZ0Ym90dG9tIiwicmlnaHRib3R0b20iLCJfbmVlZEZpbmRHZW9tZXRyeSIsIm1vdXNlUG9pbnQiLCJfbWFya2VyIiwiX2ZpbmRHZW9tZXRyeSIsIl9nZXRTbmFwUG9pbnQiLCJfc2V0RGlzdGFuY2UiLCJnZW9PYmplY3RzIiwiZGlzdGFuY2UiLCJfZGlzdFRvUG9seWxpbmUiLCJnZW9PYmplY3QiLCJfZGlzdFRvUG9pbnQiLCJfZmluZE5lYXJlc3RHZW9tZXRyaWVzIiwiX2NvbXBhcmUiLCJhdmFpbEdlaW1ldHJpZXMiLCJfbmVhcmVzdEdlb21ldHJ5IiwiX3ZhbGlkRGlzdGFuY2UiLCJuZWFyZXN0TGluZSIsIl9zZXRFcXVhdGlvbiIsIkEiLCJCIiwidmVydGljYWxMaW5lIiwiX3NldFZlcnRpRXF1YXRpb24iLCJfc29sdmVFcXVhdGlvbiIsInBvaW50IiwiZXF1YXRpb24iLCJDIiwiYWJzIiwicmVzb2x1dGlvbiIsImdldFJlc29sdXRpb24iLCJ0b1BvaW50IiwiZnJvbSIsInRvIiwiTnVtYmVyIiwidG9TdHJpbmciLCJlcXVhdGlvblciLCJlcXVhdGlvblUiLCJBMSIsIkIxIiwiQzEiLCJBMiIsIkIyIiwiQzIiLCJwcm9wZXJ0eU5hbWUiLCJvYmplY3QxIiwib2JqZWN0MiIsInZhbHVlMSIsInZhbHVlMiIsIm1lcmdlT3B0aW9ucyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztFQUFDLGFBQVVBLE1BQVYsRUFBa0JDLE9BQWxCLEVBQTJCO0VBQzNCLElBQStEQyxjQUFBLEdBQWlCRCxPQUFPLEVBQXZGLEFBQUE7RUFHQSxHQUpBLEVBSUNF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
