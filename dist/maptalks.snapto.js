/*!
 * maptalks.snapto v0.1.12
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFwdGFsa3Muc25hcHRvLmpzIiwic291cmNlcyI6WyIuLi9ub2RlX21vZHVsZXMvcXVpY2tzZWxlY3QvcXVpY2tzZWxlY3QuanMiLCIuLi9ub2RlX21vZHVsZXMvcmJ1c2gvaW5kZXguanMiLCIuLi9ub2RlX21vZHVsZXMvQHR1cmYvbWV0YS9pbmRleC5qcyIsIi4uL25vZGVfbW9kdWxlcy9nZW9qc29uLXJidXNoL2luZGV4LmpzIiwiLi4vaW5kZXguanMiXSwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIChnbG9iYWwsIGZhY3RvcnkpIHtcblx0dHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnICYmIHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnID8gbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KCkgOlxuXHR0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQgPyBkZWZpbmUoZmFjdG9yeSkgOlxuXHQoZ2xvYmFsLnF1aWNrc2VsZWN0ID0gZmFjdG9yeSgpKTtcbn0odGhpcywgKGZ1bmN0aW9uICgpIHsgJ3VzZSBzdHJpY3QnO1xuXG5mdW5jdGlvbiBxdWlja3NlbGVjdChhcnIsIGssIGxlZnQsIHJpZ2h0LCBjb21wYXJlKSB7XG4gICAgcXVpY2tzZWxlY3RTdGVwKGFyciwgaywgbGVmdCB8fCAwLCByaWdodCB8fCAoYXJyLmxlbmd0aCAtIDEpLCBjb21wYXJlIHx8IGRlZmF1bHRDb21wYXJlKTtcbn1cblxuZnVuY3Rpb24gcXVpY2tzZWxlY3RTdGVwKGFyciwgaywgbGVmdCwgcmlnaHQsIGNvbXBhcmUpIHtcblxuICAgIHdoaWxlIChyaWdodCA+IGxlZnQpIHtcbiAgICAgICAgaWYgKHJpZ2h0IC0gbGVmdCA+IDYwMCkge1xuICAgICAgICAgICAgdmFyIG4gPSByaWdodCAtIGxlZnQgKyAxO1xuICAgICAgICAgICAgdmFyIG0gPSBrIC0gbGVmdCArIDE7XG4gICAgICAgICAgICB2YXIgeiA9IE1hdGgubG9nKG4pO1xuICAgICAgICAgICAgdmFyIHMgPSAwLjUgKiBNYXRoLmV4cCgyICogeiAvIDMpO1xuICAgICAgICAgICAgdmFyIHNkID0gMC41ICogTWF0aC5zcXJ0KHogKiBzICogKG4gLSBzKSAvIG4pICogKG0gLSBuIC8gMiA8IDAgPyAtMSA6IDEpO1xuICAgICAgICAgICAgdmFyIG5ld0xlZnQgPSBNYXRoLm1heChsZWZ0LCBNYXRoLmZsb29yKGsgLSBtICogcyAvIG4gKyBzZCkpO1xuICAgICAgICAgICAgdmFyIG5ld1JpZ2h0ID0gTWF0aC5taW4ocmlnaHQsIE1hdGguZmxvb3IoayArIChuIC0gbSkgKiBzIC8gbiArIHNkKSk7XG4gICAgICAgICAgICBxdWlja3NlbGVjdFN0ZXAoYXJyLCBrLCBuZXdMZWZ0LCBuZXdSaWdodCwgY29tcGFyZSk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgdCA9IGFycltrXTtcbiAgICAgICAgdmFyIGkgPSBsZWZ0O1xuICAgICAgICB2YXIgaiA9IHJpZ2h0O1xuXG4gICAgICAgIHN3YXAoYXJyLCBsZWZ0LCBrKTtcbiAgICAgICAgaWYgKGNvbXBhcmUoYXJyW3JpZ2h0XSwgdCkgPiAwKSBzd2FwKGFyciwgbGVmdCwgcmlnaHQpO1xuXG4gICAgICAgIHdoaWxlIChpIDwgaikge1xuICAgICAgICAgICAgc3dhcChhcnIsIGksIGopO1xuICAgICAgICAgICAgaSsrO1xuICAgICAgICAgICAgai0tO1xuICAgICAgICAgICAgd2hpbGUgKGNvbXBhcmUoYXJyW2ldLCB0KSA8IDApIGkrKztcbiAgICAgICAgICAgIHdoaWxlIChjb21wYXJlKGFycltqXSwgdCkgPiAwKSBqLS07XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoY29tcGFyZShhcnJbbGVmdF0sIHQpID09PSAwKSBzd2FwKGFyciwgbGVmdCwgaik7XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgaisrO1xuICAgICAgICAgICAgc3dhcChhcnIsIGosIHJpZ2h0KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChqIDw9IGspIGxlZnQgPSBqICsgMTtcbiAgICAgICAgaWYgKGsgPD0gaikgcmlnaHQgPSBqIC0gMTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHN3YXAoYXJyLCBpLCBqKSB7XG4gICAgdmFyIHRtcCA9IGFycltpXTtcbiAgICBhcnJbaV0gPSBhcnJbal07XG4gICAgYXJyW2pdID0gdG1wO1xufVxuXG5mdW5jdGlvbiBkZWZhdWx0Q29tcGFyZShhLCBiKSB7XG4gICAgcmV0dXJuIGEgPCBiID8gLTEgOiBhID4gYiA/IDEgOiAwO1xufVxuXG5yZXR1cm4gcXVpY2tzZWxlY3Q7XG5cbn0pKSk7XG4iLCIndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0gcmJ1c2g7XG5tb2R1bGUuZXhwb3J0cy5kZWZhdWx0ID0gcmJ1c2g7XG5cbnZhciBxdWlja3NlbGVjdCA9IHJlcXVpcmUoJ3F1aWNrc2VsZWN0Jyk7XG5cbmZ1bmN0aW9uIHJidXNoKG1heEVudHJpZXMsIGZvcm1hdCkge1xuICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiByYnVzaCkpIHJldHVybiBuZXcgcmJ1c2gobWF4RW50cmllcywgZm9ybWF0KTtcblxuICAgIC8vIG1heCBlbnRyaWVzIGluIGEgbm9kZSBpcyA5IGJ5IGRlZmF1bHQ7IG1pbiBub2RlIGZpbGwgaXMgNDAlIGZvciBiZXN0IHBlcmZvcm1hbmNlXG4gICAgdGhpcy5fbWF4RW50cmllcyA9IE1hdGgubWF4KDQsIG1heEVudHJpZXMgfHwgOSk7XG4gICAgdGhpcy5fbWluRW50cmllcyA9IE1hdGgubWF4KDIsIE1hdGguY2VpbCh0aGlzLl9tYXhFbnRyaWVzICogMC40KSk7XG5cbiAgICBpZiAoZm9ybWF0KSB7XG4gICAgICAgIHRoaXMuX2luaXRGb3JtYXQoZm9ybWF0KTtcbiAgICB9XG5cbiAgICB0aGlzLmNsZWFyKCk7XG59XG5cbnJidXNoLnByb3RvdHlwZSA9IHtcblxuICAgIGFsbDogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fYWxsKHRoaXMuZGF0YSwgW10pO1xuICAgIH0sXG5cbiAgICBzZWFyY2g6IGZ1bmN0aW9uIChiYm94KSB7XG5cbiAgICAgICAgdmFyIG5vZGUgPSB0aGlzLmRhdGEsXG4gICAgICAgICAgICByZXN1bHQgPSBbXSxcbiAgICAgICAgICAgIHRvQkJveCA9IHRoaXMudG9CQm94O1xuXG4gICAgICAgIGlmICghaW50ZXJzZWN0cyhiYm94LCBub2RlKSkgcmV0dXJuIHJlc3VsdDtcblxuICAgICAgICB2YXIgbm9kZXNUb1NlYXJjaCA9IFtdLFxuICAgICAgICAgICAgaSwgbGVuLCBjaGlsZCwgY2hpbGRCQm94O1xuXG4gICAgICAgIHdoaWxlIChub2RlKSB7XG4gICAgICAgICAgICBmb3IgKGkgPSAwLCBsZW4gPSBub2RlLmNoaWxkcmVuLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG5cbiAgICAgICAgICAgICAgICBjaGlsZCA9IG5vZGUuY2hpbGRyZW5baV07XG4gICAgICAgICAgICAgICAgY2hpbGRCQm94ID0gbm9kZS5sZWFmID8gdG9CQm94KGNoaWxkKSA6IGNoaWxkO1xuXG4gICAgICAgICAgICAgICAgaWYgKGludGVyc2VjdHMoYmJveCwgY2hpbGRCQm94KSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAobm9kZS5sZWFmKSByZXN1bHQucHVzaChjaGlsZCk7XG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKGNvbnRhaW5zKGJib3gsIGNoaWxkQkJveCkpIHRoaXMuX2FsbChjaGlsZCwgcmVzdWx0KTtcbiAgICAgICAgICAgICAgICAgICAgZWxzZSBub2Rlc1RvU2VhcmNoLnB1c2goY2hpbGQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG5vZGUgPSBub2Rlc1RvU2VhcmNoLnBvcCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9LFxuXG4gICAgY29sbGlkZXM6IGZ1bmN0aW9uIChiYm94KSB7XG5cbiAgICAgICAgdmFyIG5vZGUgPSB0aGlzLmRhdGEsXG4gICAgICAgICAgICB0b0JCb3ggPSB0aGlzLnRvQkJveDtcblxuICAgICAgICBpZiAoIWludGVyc2VjdHMoYmJveCwgbm9kZSkpIHJldHVybiBmYWxzZTtcblxuICAgICAgICB2YXIgbm9kZXNUb1NlYXJjaCA9IFtdLFxuICAgICAgICAgICAgaSwgbGVuLCBjaGlsZCwgY2hpbGRCQm94O1xuXG4gICAgICAgIHdoaWxlIChub2RlKSB7XG4gICAgICAgICAgICBmb3IgKGkgPSAwLCBsZW4gPSBub2RlLmNoaWxkcmVuLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG5cbiAgICAgICAgICAgICAgICBjaGlsZCA9IG5vZGUuY2hpbGRyZW5baV07XG4gICAgICAgICAgICAgICAgY2hpbGRCQm94ID0gbm9kZS5sZWFmID8gdG9CQm94KGNoaWxkKSA6IGNoaWxkO1xuXG4gICAgICAgICAgICAgICAgaWYgKGludGVyc2VjdHMoYmJveCwgY2hpbGRCQm94KSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAobm9kZS5sZWFmIHx8IGNvbnRhaW5zKGJib3gsIGNoaWxkQkJveCkpIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgICAgICBub2Rlc1RvU2VhcmNoLnB1c2goY2hpbGQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG5vZGUgPSBub2Rlc1RvU2VhcmNoLnBvcCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0sXG5cbiAgICBsb2FkOiBmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgICBpZiAoIShkYXRhICYmIGRhdGEubGVuZ3RoKSkgcmV0dXJuIHRoaXM7XG5cbiAgICAgICAgaWYgKGRhdGEubGVuZ3RoIDwgdGhpcy5fbWluRW50cmllcykge1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IGRhdGEubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgICAgICB0aGlzLmluc2VydChkYXRhW2ldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gcmVjdXJzaXZlbHkgYnVpbGQgdGhlIHRyZWUgd2l0aCB0aGUgZ2l2ZW4gZGF0YSBmcm9tIHNjcmF0Y2ggdXNpbmcgT01UIGFsZ29yaXRobVxuICAgICAgICB2YXIgbm9kZSA9IHRoaXMuX2J1aWxkKGRhdGEuc2xpY2UoKSwgMCwgZGF0YS5sZW5ndGggLSAxLCAwKTtcblxuICAgICAgICBpZiAoIXRoaXMuZGF0YS5jaGlsZHJlbi5sZW5ndGgpIHtcbiAgICAgICAgICAgIC8vIHNhdmUgYXMgaXMgaWYgdHJlZSBpcyBlbXB0eVxuICAgICAgICAgICAgdGhpcy5kYXRhID0gbm9kZTtcblxuICAgICAgICB9IGVsc2UgaWYgKHRoaXMuZGF0YS5oZWlnaHQgPT09IG5vZGUuaGVpZ2h0KSB7XG4gICAgICAgICAgICAvLyBzcGxpdCByb290IGlmIHRyZWVzIGhhdmUgdGhlIHNhbWUgaGVpZ2h0XG4gICAgICAgICAgICB0aGlzLl9zcGxpdFJvb3QodGhpcy5kYXRhLCBub2RlKTtcblxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKHRoaXMuZGF0YS5oZWlnaHQgPCBub2RlLmhlaWdodCkge1xuICAgICAgICAgICAgICAgIC8vIHN3YXAgdHJlZXMgaWYgaW5zZXJ0ZWQgb25lIGlzIGJpZ2dlclxuICAgICAgICAgICAgICAgIHZhciB0bXBOb2RlID0gdGhpcy5kYXRhO1xuICAgICAgICAgICAgICAgIHRoaXMuZGF0YSA9IG5vZGU7XG4gICAgICAgICAgICAgICAgbm9kZSA9IHRtcE5vZGU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIGluc2VydCB0aGUgc21hbGwgdHJlZSBpbnRvIHRoZSBsYXJnZSB0cmVlIGF0IGFwcHJvcHJpYXRlIGxldmVsXG4gICAgICAgICAgICB0aGlzLl9pbnNlcnQobm9kZSwgdGhpcy5kYXRhLmhlaWdodCAtIG5vZGUuaGVpZ2h0IC0gMSwgdHJ1ZSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgaW5zZXJ0OiBmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgICBpZiAoaXRlbSkgdGhpcy5faW5zZXJ0KGl0ZW0sIHRoaXMuZGF0YS5oZWlnaHQgLSAxKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIGNsZWFyOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuZGF0YSA9IGNyZWF0ZU5vZGUoW10pO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgcmVtb3ZlOiBmdW5jdGlvbiAoaXRlbSwgZXF1YWxzRm4pIHtcbiAgICAgICAgaWYgKCFpdGVtKSByZXR1cm4gdGhpcztcblxuICAgICAgICB2YXIgbm9kZSA9IHRoaXMuZGF0YSxcbiAgICAgICAgICAgIGJib3ggPSB0aGlzLnRvQkJveChpdGVtKSxcbiAgICAgICAgICAgIHBhdGggPSBbXSxcbiAgICAgICAgICAgIGluZGV4ZXMgPSBbXSxcbiAgICAgICAgICAgIGksIHBhcmVudCwgaW5kZXgsIGdvaW5nVXA7XG5cbiAgICAgICAgLy8gZGVwdGgtZmlyc3QgaXRlcmF0aXZlIHRyZWUgdHJhdmVyc2FsXG4gICAgICAgIHdoaWxlIChub2RlIHx8IHBhdGgubGVuZ3RoKSB7XG5cbiAgICAgICAgICAgIGlmICghbm9kZSkgeyAvLyBnbyB1cFxuICAgICAgICAgICAgICAgIG5vZGUgPSBwYXRoLnBvcCgpO1xuICAgICAgICAgICAgICAgIHBhcmVudCA9IHBhdGhbcGF0aC5sZW5ndGggLSAxXTtcbiAgICAgICAgICAgICAgICBpID0gaW5kZXhlcy5wb3AoKTtcbiAgICAgICAgICAgICAgICBnb2luZ1VwID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKG5vZGUubGVhZikgeyAvLyBjaGVjayBjdXJyZW50IG5vZGVcbiAgICAgICAgICAgICAgICBpbmRleCA9IGZpbmRJdGVtKGl0ZW0sIG5vZGUuY2hpbGRyZW4sIGVxdWFsc0ZuKTtcblxuICAgICAgICAgICAgICAgIGlmIChpbmRleCAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gaXRlbSBmb3VuZCwgcmVtb3ZlIHRoZSBpdGVtIGFuZCBjb25kZW5zZSB0cmVlIHVwd2FyZHNcbiAgICAgICAgICAgICAgICAgICAgbm9kZS5jaGlsZHJlbi5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICAgICAgICAgICAgICBwYXRoLnB1c2gobm9kZSk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2NvbmRlbnNlKHBhdGgpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICghZ29pbmdVcCAmJiAhbm9kZS5sZWFmICYmIGNvbnRhaW5zKG5vZGUsIGJib3gpKSB7IC8vIGdvIGRvd25cbiAgICAgICAgICAgICAgICBwYXRoLnB1c2gobm9kZSk7XG4gICAgICAgICAgICAgICAgaW5kZXhlcy5wdXNoKGkpO1xuICAgICAgICAgICAgICAgIGkgPSAwO1xuICAgICAgICAgICAgICAgIHBhcmVudCA9IG5vZGU7XG4gICAgICAgICAgICAgICAgbm9kZSA9IG5vZGUuY2hpbGRyZW5bMF07XG5cbiAgICAgICAgICAgIH0gZWxzZSBpZiAocGFyZW50KSB7IC8vIGdvIHJpZ2h0XG4gICAgICAgICAgICAgICAgaSsrO1xuICAgICAgICAgICAgICAgIG5vZGUgPSBwYXJlbnQuY2hpbGRyZW5baV07XG4gICAgICAgICAgICAgICAgZ29pbmdVcCA9IGZhbHNlO1xuXG4gICAgICAgICAgICB9IGVsc2Ugbm9kZSA9IG51bGw7IC8vIG5vdGhpbmcgZm91bmRcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICB0b0JCb3g6IGZ1bmN0aW9uIChpdGVtKSB7IHJldHVybiBpdGVtOyB9LFxuXG4gICAgY29tcGFyZU1pblg6IGNvbXBhcmVOb2RlTWluWCxcbiAgICBjb21wYXJlTWluWTogY29tcGFyZU5vZGVNaW5ZLFxuXG4gICAgdG9KU09OOiBmdW5jdGlvbiAoKSB7IHJldHVybiB0aGlzLmRhdGE7IH0sXG5cbiAgICBmcm9tSlNPTjogZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgICAgdGhpcy5kYXRhID0gZGF0YTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIF9hbGw6IGZ1bmN0aW9uIChub2RlLCByZXN1bHQpIHtcbiAgICAgICAgdmFyIG5vZGVzVG9TZWFyY2ggPSBbXTtcbiAgICAgICAgd2hpbGUgKG5vZGUpIHtcbiAgICAgICAgICAgIGlmIChub2RlLmxlYWYpIHJlc3VsdC5wdXNoLmFwcGx5KHJlc3VsdCwgbm9kZS5jaGlsZHJlbik7XG4gICAgICAgICAgICBlbHNlIG5vZGVzVG9TZWFyY2gucHVzaC5hcHBseShub2Rlc1RvU2VhcmNoLCBub2RlLmNoaWxkcmVuKTtcblxuICAgICAgICAgICAgbm9kZSA9IG5vZGVzVG9TZWFyY2gucG9wKCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9LFxuXG4gICAgX2J1aWxkOiBmdW5jdGlvbiAoaXRlbXMsIGxlZnQsIHJpZ2h0LCBoZWlnaHQpIHtcblxuICAgICAgICB2YXIgTiA9IHJpZ2h0IC0gbGVmdCArIDEsXG4gICAgICAgICAgICBNID0gdGhpcy5fbWF4RW50cmllcyxcbiAgICAgICAgICAgIG5vZGU7XG5cbiAgICAgICAgaWYgKE4gPD0gTSkge1xuICAgICAgICAgICAgLy8gcmVhY2hlZCBsZWFmIGxldmVsOyByZXR1cm4gbGVhZlxuICAgICAgICAgICAgbm9kZSA9IGNyZWF0ZU5vZGUoaXRlbXMuc2xpY2UobGVmdCwgcmlnaHQgKyAxKSk7XG4gICAgICAgICAgICBjYWxjQkJveChub2RlLCB0aGlzLnRvQkJveCk7XG4gICAgICAgICAgICByZXR1cm4gbm9kZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghaGVpZ2h0KSB7XG4gICAgICAgICAgICAvLyB0YXJnZXQgaGVpZ2h0IG9mIHRoZSBidWxrLWxvYWRlZCB0cmVlXG4gICAgICAgICAgICBoZWlnaHQgPSBNYXRoLmNlaWwoTWF0aC5sb2coTikgLyBNYXRoLmxvZyhNKSk7XG5cbiAgICAgICAgICAgIC8vIHRhcmdldCBudW1iZXIgb2Ygcm9vdCBlbnRyaWVzIHRvIG1heGltaXplIHN0b3JhZ2UgdXRpbGl6YXRpb25cbiAgICAgICAgICAgIE0gPSBNYXRoLmNlaWwoTiAvIE1hdGgucG93KE0sIGhlaWdodCAtIDEpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIG5vZGUgPSBjcmVhdGVOb2RlKFtdKTtcbiAgICAgICAgbm9kZS5sZWFmID0gZmFsc2U7XG4gICAgICAgIG5vZGUuaGVpZ2h0ID0gaGVpZ2h0O1xuXG4gICAgICAgIC8vIHNwbGl0IHRoZSBpdGVtcyBpbnRvIE0gbW9zdGx5IHNxdWFyZSB0aWxlc1xuXG4gICAgICAgIHZhciBOMiA9IE1hdGguY2VpbChOIC8gTSksXG4gICAgICAgICAgICBOMSA9IE4yICogTWF0aC5jZWlsKE1hdGguc3FydChNKSksXG4gICAgICAgICAgICBpLCBqLCByaWdodDIsIHJpZ2h0MztcblxuICAgICAgICBtdWx0aVNlbGVjdChpdGVtcywgbGVmdCwgcmlnaHQsIE4xLCB0aGlzLmNvbXBhcmVNaW5YKTtcblxuICAgICAgICBmb3IgKGkgPSBsZWZ0OyBpIDw9IHJpZ2h0OyBpICs9IE4xKSB7XG5cbiAgICAgICAgICAgIHJpZ2h0MiA9IE1hdGgubWluKGkgKyBOMSAtIDEsIHJpZ2h0KTtcblxuICAgICAgICAgICAgbXVsdGlTZWxlY3QoaXRlbXMsIGksIHJpZ2h0MiwgTjIsIHRoaXMuY29tcGFyZU1pblkpO1xuXG4gICAgICAgICAgICBmb3IgKGogPSBpOyBqIDw9IHJpZ2h0MjsgaiArPSBOMikge1xuXG4gICAgICAgICAgICAgICAgcmlnaHQzID0gTWF0aC5taW4oaiArIE4yIC0gMSwgcmlnaHQyKTtcblxuICAgICAgICAgICAgICAgIC8vIHBhY2sgZWFjaCBlbnRyeSByZWN1cnNpdmVseVxuICAgICAgICAgICAgICAgIG5vZGUuY2hpbGRyZW4ucHVzaCh0aGlzLl9idWlsZChpdGVtcywgaiwgcmlnaHQzLCBoZWlnaHQgLSAxKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBjYWxjQkJveChub2RlLCB0aGlzLnRvQkJveCk7XG5cbiAgICAgICAgcmV0dXJuIG5vZGU7XG4gICAgfSxcblxuICAgIF9jaG9vc2VTdWJ0cmVlOiBmdW5jdGlvbiAoYmJveCwgbm9kZSwgbGV2ZWwsIHBhdGgpIHtcblxuICAgICAgICB2YXIgaSwgbGVuLCBjaGlsZCwgdGFyZ2V0Tm9kZSwgYXJlYSwgZW5sYXJnZW1lbnQsIG1pbkFyZWEsIG1pbkVubGFyZ2VtZW50O1xuXG4gICAgICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICAgICAgICBwYXRoLnB1c2gobm9kZSk7XG5cbiAgICAgICAgICAgIGlmIChub2RlLmxlYWYgfHwgcGF0aC5sZW5ndGggLSAxID09PSBsZXZlbCkgYnJlYWs7XG5cbiAgICAgICAgICAgIG1pbkFyZWEgPSBtaW5FbmxhcmdlbWVudCA9IEluZmluaXR5O1xuXG4gICAgICAgICAgICBmb3IgKGkgPSAwLCBsZW4gPSBub2RlLmNoaWxkcmVuLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICAgICAgY2hpbGQgPSBub2RlLmNoaWxkcmVuW2ldO1xuICAgICAgICAgICAgICAgIGFyZWEgPSBiYm94QXJlYShjaGlsZCk7XG4gICAgICAgICAgICAgICAgZW5sYXJnZW1lbnQgPSBlbmxhcmdlZEFyZWEoYmJveCwgY2hpbGQpIC0gYXJlYTtcblxuICAgICAgICAgICAgICAgIC8vIGNob29zZSBlbnRyeSB3aXRoIHRoZSBsZWFzdCBhcmVhIGVubGFyZ2VtZW50XG4gICAgICAgICAgICAgICAgaWYgKGVubGFyZ2VtZW50IDwgbWluRW5sYXJnZW1lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgbWluRW5sYXJnZW1lbnQgPSBlbmxhcmdlbWVudDtcbiAgICAgICAgICAgICAgICAgICAgbWluQXJlYSA9IGFyZWEgPCBtaW5BcmVhID8gYXJlYSA6IG1pbkFyZWE7XG4gICAgICAgICAgICAgICAgICAgIHRhcmdldE5vZGUgPSBjaGlsZDtcblxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoZW5sYXJnZW1lbnQgPT09IG1pbkVubGFyZ2VtZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIG90aGVyd2lzZSBjaG9vc2Ugb25lIHdpdGggdGhlIHNtYWxsZXN0IGFyZWFcbiAgICAgICAgICAgICAgICAgICAgaWYgKGFyZWEgPCBtaW5BcmVhKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtaW5BcmVhID0gYXJlYTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldE5vZGUgPSBjaGlsZDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgbm9kZSA9IHRhcmdldE5vZGUgfHwgbm9kZS5jaGlsZHJlblswXTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBub2RlO1xuICAgIH0sXG5cbiAgICBfaW5zZXJ0OiBmdW5jdGlvbiAoaXRlbSwgbGV2ZWwsIGlzTm9kZSkge1xuXG4gICAgICAgIHZhciB0b0JCb3ggPSB0aGlzLnRvQkJveCxcbiAgICAgICAgICAgIGJib3ggPSBpc05vZGUgPyBpdGVtIDogdG9CQm94KGl0ZW0pLFxuICAgICAgICAgICAgaW5zZXJ0UGF0aCA9IFtdO1xuXG4gICAgICAgIC8vIGZpbmQgdGhlIGJlc3Qgbm9kZSBmb3IgYWNjb21tb2RhdGluZyB0aGUgaXRlbSwgc2F2aW5nIGFsbCBub2RlcyBhbG9uZyB0aGUgcGF0aCB0b29cbiAgICAgICAgdmFyIG5vZGUgPSB0aGlzLl9jaG9vc2VTdWJ0cmVlKGJib3gsIHRoaXMuZGF0YSwgbGV2ZWwsIGluc2VydFBhdGgpO1xuXG4gICAgICAgIC8vIHB1dCB0aGUgaXRlbSBpbnRvIHRoZSBub2RlXG4gICAgICAgIG5vZGUuY2hpbGRyZW4ucHVzaChpdGVtKTtcbiAgICAgICAgZXh0ZW5kKG5vZGUsIGJib3gpO1xuXG4gICAgICAgIC8vIHNwbGl0IG9uIG5vZGUgb3ZlcmZsb3c7IHByb3BhZ2F0ZSB1cHdhcmRzIGlmIG5lY2Vzc2FyeVxuICAgICAgICB3aGlsZSAobGV2ZWwgPj0gMCkge1xuICAgICAgICAgICAgaWYgKGluc2VydFBhdGhbbGV2ZWxdLmNoaWxkcmVuLmxlbmd0aCA+IHRoaXMuX21heEVudHJpZXMpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9zcGxpdChpbnNlcnRQYXRoLCBsZXZlbCk7XG4gICAgICAgICAgICAgICAgbGV2ZWwtLTtcbiAgICAgICAgICAgIH0gZWxzZSBicmVhaztcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGFkanVzdCBiYm94ZXMgYWxvbmcgdGhlIGluc2VydGlvbiBwYXRoXG4gICAgICAgIHRoaXMuX2FkanVzdFBhcmVudEJCb3hlcyhiYm94LCBpbnNlcnRQYXRoLCBsZXZlbCk7XG4gICAgfSxcblxuICAgIC8vIHNwbGl0IG92ZXJmbG93ZWQgbm9kZSBpbnRvIHR3b1xuICAgIF9zcGxpdDogZnVuY3Rpb24gKGluc2VydFBhdGgsIGxldmVsKSB7XG5cbiAgICAgICAgdmFyIG5vZGUgPSBpbnNlcnRQYXRoW2xldmVsXSxcbiAgICAgICAgICAgIE0gPSBub2RlLmNoaWxkcmVuLmxlbmd0aCxcbiAgICAgICAgICAgIG0gPSB0aGlzLl9taW5FbnRyaWVzO1xuXG4gICAgICAgIHRoaXMuX2Nob29zZVNwbGl0QXhpcyhub2RlLCBtLCBNKTtcblxuICAgICAgICB2YXIgc3BsaXRJbmRleCA9IHRoaXMuX2Nob29zZVNwbGl0SW5kZXgobm9kZSwgbSwgTSk7XG5cbiAgICAgICAgdmFyIG5ld05vZGUgPSBjcmVhdGVOb2RlKG5vZGUuY2hpbGRyZW4uc3BsaWNlKHNwbGl0SW5kZXgsIG5vZGUuY2hpbGRyZW4ubGVuZ3RoIC0gc3BsaXRJbmRleCkpO1xuICAgICAgICBuZXdOb2RlLmhlaWdodCA9IG5vZGUuaGVpZ2h0O1xuICAgICAgICBuZXdOb2RlLmxlYWYgPSBub2RlLmxlYWY7XG5cbiAgICAgICAgY2FsY0JCb3gobm9kZSwgdGhpcy50b0JCb3gpO1xuICAgICAgICBjYWxjQkJveChuZXdOb2RlLCB0aGlzLnRvQkJveCk7XG5cbiAgICAgICAgaWYgKGxldmVsKSBpbnNlcnRQYXRoW2xldmVsIC0gMV0uY2hpbGRyZW4ucHVzaChuZXdOb2RlKTtcbiAgICAgICAgZWxzZSB0aGlzLl9zcGxpdFJvb3Qobm9kZSwgbmV3Tm9kZSk7XG4gICAgfSxcblxuICAgIF9zcGxpdFJvb3Q6IGZ1bmN0aW9uIChub2RlLCBuZXdOb2RlKSB7XG4gICAgICAgIC8vIHNwbGl0IHJvb3Qgbm9kZVxuICAgICAgICB0aGlzLmRhdGEgPSBjcmVhdGVOb2RlKFtub2RlLCBuZXdOb2RlXSk7XG4gICAgICAgIHRoaXMuZGF0YS5oZWlnaHQgPSBub2RlLmhlaWdodCArIDE7XG4gICAgICAgIHRoaXMuZGF0YS5sZWFmID0gZmFsc2U7XG4gICAgICAgIGNhbGNCQm94KHRoaXMuZGF0YSwgdGhpcy50b0JCb3gpO1xuICAgIH0sXG5cbiAgICBfY2hvb3NlU3BsaXRJbmRleDogZnVuY3Rpb24gKG5vZGUsIG0sIE0pIHtcblxuICAgICAgICB2YXIgaSwgYmJveDEsIGJib3gyLCBvdmVybGFwLCBhcmVhLCBtaW5PdmVybGFwLCBtaW5BcmVhLCBpbmRleDtcblxuICAgICAgICBtaW5PdmVybGFwID0gbWluQXJlYSA9IEluZmluaXR5O1xuXG4gICAgICAgIGZvciAoaSA9IG07IGkgPD0gTSAtIG07IGkrKykge1xuICAgICAgICAgICAgYmJveDEgPSBkaXN0QkJveChub2RlLCAwLCBpLCB0aGlzLnRvQkJveCk7XG4gICAgICAgICAgICBiYm94MiA9IGRpc3RCQm94KG5vZGUsIGksIE0sIHRoaXMudG9CQm94KTtcblxuICAgICAgICAgICAgb3ZlcmxhcCA9IGludGVyc2VjdGlvbkFyZWEoYmJveDEsIGJib3gyKTtcbiAgICAgICAgICAgIGFyZWEgPSBiYm94QXJlYShiYm94MSkgKyBiYm94QXJlYShiYm94Mik7XG5cbiAgICAgICAgICAgIC8vIGNob29zZSBkaXN0cmlidXRpb24gd2l0aCBtaW5pbXVtIG92ZXJsYXBcbiAgICAgICAgICAgIGlmIChvdmVybGFwIDwgbWluT3ZlcmxhcCkge1xuICAgICAgICAgICAgICAgIG1pbk92ZXJsYXAgPSBvdmVybGFwO1xuICAgICAgICAgICAgICAgIGluZGV4ID0gaTtcblxuICAgICAgICAgICAgICAgIG1pbkFyZWEgPSBhcmVhIDwgbWluQXJlYSA/IGFyZWEgOiBtaW5BcmVhO1xuXG4gICAgICAgICAgICB9IGVsc2UgaWYgKG92ZXJsYXAgPT09IG1pbk92ZXJsYXApIHtcbiAgICAgICAgICAgICAgICAvLyBvdGhlcndpc2UgY2hvb3NlIGRpc3RyaWJ1dGlvbiB3aXRoIG1pbmltdW0gYXJlYVxuICAgICAgICAgICAgICAgIGlmIChhcmVhIDwgbWluQXJlYSkge1xuICAgICAgICAgICAgICAgICAgICBtaW5BcmVhID0gYXJlYTtcbiAgICAgICAgICAgICAgICAgICAgaW5kZXggPSBpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBpbmRleDtcbiAgICB9LFxuXG4gICAgLy8gc29ydHMgbm9kZSBjaGlsZHJlbiBieSB0aGUgYmVzdCBheGlzIGZvciBzcGxpdFxuICAgIF9jaG9vc2VTcGxpdEF4aXM6IGZ1bmN0aW9uIChub2RlLCBtLCBNKSB7XG5cbiAgICAgICAgdmFyIGNvbXBhcmVNaW5YID0gbm9kZS5sZWFmID8gdGhpcy5jb21wYXJlTWluWCA6IGNvbXBhcmVOb2RlTWluWCxcbiAgICAgICAgICAgIGNvbXBhcmVNaW5ZID0gbm9kZS5sZWFmID8gdGhpcy5jb21wYXJlTWluWSA6IGNvbXBhcmVOb2RlTWluWSxcbiAgICAgICAgICAgIHhNYXJnaW4gPSB0aGlzLl9hbGxEaXN0TWFyZ2luKG5vZGUsIG0sIE0sIGNvbXBhcmVNaW5YKSxcbiAgICAgICAgICAgIHlNYXJnaW4gPSB0aGlzLl9hbGxEaXN0TWFyZ2luKG5vZGUsIG0sIE0sIGNvbXBhcmVNaW5ZKTtcblxuICAgICAgICAvLyBpZiB0b3RhbCBkaXN0cmlidXRpb25zIG1hcmdpbiB2YWx1ZSBpcyBtaW5pbWFsIGZvciB4LCBzb3J0IGJ5IG1pblgsXG4gICAgICAgIC8vIG90aGVyd2lzZSBpdCdzIGFscmVhZHkgc29ydGVkIGJ5IG1pbllcbiAgICAgICAgaWYgKHhNYXJnaW4gPCB5TWFyZ2luKSBub2RlLmNoaWxkcmVuLnNvcnQoY29tcGFyZU1pblgpO1xuICAgIH0sXG5cbiAgICAvLyB0b3RhbCBtYXJnaW4gb2YgYWxsIHBvc3NpYmxlIHNwbGl0IGRpc3RyaWJ1dGlvbnMgd2hlcmUgZWFjaCBub2RlIGlzIGF0IGxlYXN0IG0gZnVsbFxuICAgIF9hbGxEaXN0TWFyZ2luOiBmdW5jdGlvbiAobm9kZSwgbSwgTSwgY29tcGFyZSkge1xuXG4gICAgICAgIG5vZGUuY2hpbGRyZW4uc29ydChjb21wYXJlKTtcblxuICAgICAgICB2YXIgdG9CQm94ID0gdGhpcy50b0JCb3gsXG4gICAgICAgICAgICBsZWZ0QkJveCA9IGRpc3RCQm94KG5vZGUsIDAsIG0sIHRvQkJveCksXG4gICAgICAgICAgICByaWdodEJCb3ggPSBkaXN0QkJveChub2RlLCBNIC0gbSwgTSwgdG9CQm94KSxcbiAgICAgICAgICAgIG1hcmdpbiA9IGJib3hNYXJnaW4obGVmdEJCb3gpICsgYmJveE1hcmdpbihyaWdodEJCb3gpLFxuICAgICAgICAgICAgaSwgY2hpbGQ7XG5cbiAgICAgICAgZm9yIChpID0gbTsgaSA8IE0gLSBtOyBpKyspIHtcbiAgICAgICAgICAgIGNoaWxkID0gbm9kZS5jaGlsZHJlbltpXTtcbiAgICAgICAgICAgIGV4dGVuZChsZWZ0QkJveCwgbm9kZS5sZWFmID8gdG9CQm94KGNoaWxkKSA6IGNoaWxkKTtcbiAgICAgICAgICAgIG1hcmdpbiArPSBiYm94TWFyZ2luKGxlZnRCQm94KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAoaSA9IE0gLSBtIC0gMTsgaSA+PSBtOyBpLS0pIHtcbiAgICAgICAgICAgIGNoaWxkID0gbm9kZS5jaGlsZHJlbltpXTtcbiAgICAgICAgICAgIGV4dGVuZChyaWdodEJCb3gsIG5vZGUubGVhZiA/IHRvQkJveChjaGlsZCkgOiBjaGlsZCk7XG4gICAgICAgICAgICBtYXJnaW4gKz0gYmJveE1hcmdpbihyaWdodEJCb3gpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG1hcmdpbjtcbiAgICB9LFxuXG4gICAgX2FkanVzdFBhcmVudEJCb3hlczogZnVuY3Rpb24gKGJib3gsIHBhdGgsIGxldmVsKSB7XG4gICAgICAgIC8vIGFkanVzdCBiYm94ZXMgYWxvbmcgdGhlIGdpdmVuIHRyZWUgcGF0aFxuICAgICAgICBmb3IgKHZhciBpID0gbGV2ZWw7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgICAgICBleHRlbmQocGF0aFtpXSwgYmJveCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgX2NvbmRlbnNlOiBmdW5jdGlvbiAocGF0aCkge1xuICAgICAgICAvLyBnbyB0aHJvdWdoIHRoZSBwYXRoLCByZW1vdmluZyBlbXB0eSBub2RlcyBhbmQgdXBkYXRpbmcgYmJveGVzXG4gICAgICAgIGZvciAodmFyIGkgPSBwYXRoLmxlbmd0aCAtIDEsIHNpYmxpbmdzOyBpID49IDA7IGktLSkge1xuICAgICAgICAgICAgaWYgKHBhdGhbaV0uY2hpbGRyZW4ubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgaWYgKGkgPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHNpYmxpbmdzID0gcGF0aFtpIC0gMV0uY2hpbGRyZW47XG4gICAgICAgICAgICAgICAgICAgIHNpYmxpbmdzLnNwbGljZShzaWJsaW5ncy5pbmRleE9mKHBhdGhbaV0pLCAxKTtcblxuICAgICAgICAgICAgICAgIH0gZWxzZSB0aGlzLmNsZWFyKCk7XG5cbiAgICAgICAgICAgIH0gZWxzZSBjYWxjQkJveChwYXRoW2ldLCB0aGlzLnRvQkJveCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgX2luaXRGb3JtYXQ6IGZ1bmN0aW9uIChmb3JtYXQpIHtcbiAgICAgICAgLy8gZGF0YSBmb3JtYXQgKG1pblgsIG1pblksIG1heFgsIG1heFkgYWNjZXNzb3JzKVxuXG4gICAgICAgIC8vIHVzZXMgZXZhbC10eXBlIGZ1bmN0aW9uIGNvbXBpbGF0aW9uIGluc3RlYWQgb2YganVzdCBhY2NlcHRpbmcgYSB0b0JCb3ggZnVuY3Rpb25cbiAgICAgICAgLy8gYmVjYXVzZSB0aGUgYWxnb3JpdGhtcyBhcmUgdmVyeSBzZW5zaXRpdmUgdG8gc29ydGluZyBmdW5jdGlvbnMgcGVyZm9ybWFuY2UsXG4gICAgICAgIC8vIHNvIHRoZXkgc2hvdWxkIGJlIGRlYWQgc2ltcGxlIGFuZCB3aXRob3V0IGlubmVyIGNhbGxzXG5cbiAgICAgICAgdmFyIGNvbXBhcmVBcnIgPSBbJ3JldHVybiBhJywgJyAtIGInLCAnOyddO1xuXG4gICAgICAgIHRoaXMuY29tcGFyZU1pblggPSBuZXcgRnVuY3Rpb24oJ2EnLCAnYicsIGNvbXBhcmVBcnIuam9pbihmb3JtYXRbMF0pKTtcbiAgICAgICAgdGhpcy5jb21wYXJlTWluWSA9IG5ldyBGdW5jdGlvbignYScsICdiJywgY29tcGFyZUFyci5qb2luKGZvcm1hdFsxXSkpO1xuXG4gICAgICAgIHRoaXMudG9CQm94ID0gbmV3IEZ1bmN0aW9uKCdhJyxcbiAgICAgICAgICAgICdyZXR1cm4ge21pblg6IGEnICsgZm9ybWF0WzBdICtcbiAgICAgICAgICAgICcsIG1pblk6IGEnICsgZm9ybWF0WzFdICtcbiAgICAgICAgICAgICcsIG1heFg6IGEnICsgZm9ybWF0WzJdICtcbiAgICAgICAgICAgICcsIG1heFk6IGEnICsgZm9ybWF0WzNdICsgJ307Jyk7XG4gICAgfVxufTtcblxuZnVuY3Rpb24gZmluZEl0ZW0oaXRlbSwgaXRlbXMsIGVxdWFsc0ZuKSB7XG4gICAgaWYgKCFlcXVhbHNGbikgcmV0dXJuIGl0ZW1zLmluZGV4T2YoaXRlbSk7XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGl0ZW1zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChlcXVhbHNGbihpdGVtLCBpdGVtc1tpXSkpIHJldHVybiBpO1xuICAgIH1cbiAgICByZXR1cm4gLTE7XG59XG5cbi8vIGNhbGN1bGF0ZSBub2RlJ3MgYmJveCBmcm9tIGJib3hlcyBvZiBpdHMgY2hpbGRyZW5cbmZ1bmN0aW9uIGNhbGNCQm94KG5vZGUsIHRvQkJveCkge1xuICAgIGRpc3RCQm94KG5vZGUsIDAsIG5vZGUuY2hpbGRyZW4ubGVuZ3RoLCB0b0JCb3gsIG5vZGUpO1xufVxuXG4vLyBtaW4gYm91bmRpbmcgcmVjdGFuZ2xlIG9mIG5vZGUgY2hpbGRyZW4gZnJvbSBrIHRvIHAtMVxuZnVuY3Rpb24gZGlzdEJCb3gobm9kZSwgaywgcCwgdG9CQm94LCBkZXN0Tm9kZSkge1xuICAgIGlmICghZGVzdE5vZGUpIGRlc3ROb2RlID0gY3JlYXRlTm9kZShudWxsKTtcbiAgICBkZXN0Tm9kZS5taW5YID0gSW5maW5pdHk7XG4gICAgZGVzdE5vZGUubWluWSA9IEluZmluaXR5O1xuICAgIGRlc3ROb2RlLm1heFggPSAtSW5maW5pdHk7XG4gICAgZGVzdE5vZGUubWF4WSA9IC1JbmZpbml0eTtcblxuICAgIGZvciAodmFyIGkgPSBrLCBjaGlsZDsgaSA8IHA7IGkrKykge1xuICAgICAgICBjaGlsZCA9IG5vZGUuY2hpbGRyZW5baV07XG4gICAgICAgIGV4dGVuZChkZXN0Tm9kZSwgbm9kZS5sZWFmID8gdG9CQm94KGNoaWxkKSA6IGNoaWxkKTtcbiAgICB9XG5cbiAgICByZXR1cm4gZGVzdE5vZGU7XG59XG5cbmZ1bmN0aW9uIGV4dGVuZChhLCBiKSB7XG4gICAgYS5taW5YID0gTWF0aC5taW4oYS5taW5YLCBiLm1pblgpO1xuICAgIGEubWluWSA9IE1hdGgubWluKGEubWluWSwgYi5taW5ZKTtcbiAgICBhLm1heFggPSBNYXRoLm1heChhLm1heFgsIGIubWF4WCk7XG4gICAgYS5tYXhZID0gTWF0aC5tYXgoYS5tYXhZLCBiLm1heFkpO1xuICAgIHJldHVybiBhO1xufVxuXG5mdW5jdGlvbiBjb21wYXJlTm9kZU1pblgoYSwgYikgeyByZXR1cm4gYS5taW5YIC0gYi5taW5YOyB9XG5mdW5jdGlvbiBjb21wYXJlTm9kZU1pblkoYSwgYikgeyByZXR1cm4gYS5taW5ZIC0gYi5taW5ZOyB9XG5cbmZ1bmN0aW9uIGJib3hBcmVhKGEpICAgeyByZXR1cm4gKGEubWF4WCAtIGEubWluWCkgKiAoYS5tYXhZIC0gYS5taW5ZKTsgfVxuZnVuY3Rpb24gYmJveE1hcmdpbihhKSB7IHJldHVybiAoYS5tYXhYIC0gYS5taW5YKSArIChhLm1heFkgLSBhLm1pblkpOyB9XG5cbmZ1bmN0aW9uIGVubGFyZ2VkQXJlYShhLCBiKSB7XG4gICAgcmV0dXJuIChNYXRoLm1heChiLm1heFgsIGEubWF4WCkgLSBNYXRoLm1pbihiLm1pblgsIGEubWluWCkpICpcbiAgICAgICAgICAgKE1hdGgubWF4KGIubWF4WSwgYS5tYXhZKSAtIE1hdGgubWluKGIubWluWSwgYS5taW5ZKSk7XG59XG5cbmZ1bmN0aW9uIGludGVyc2VjdGlvbkFyZWEoYSwgYikge1xuICAgIHZhciBtaW5YID0gTWF0aC5tYXgoYS5taW5YLCBiLm1pblgpLFxuICAgICAgICBtaW5ZID0gTWF0aC5tYXgoYS5taW5ZLCBiLm1pblkpLFxuICAgICAgICBtYXhYID0gTWF0aC5taW4oYS5tYXhYLCBiLm1heFgpLFxuICAgICAgICBtYXhZID0gTWF0aC5taW4oYS5tYXhZLCBiLm1heFkpO1xuXG4gICAgcmV0dXJuIE1hdGgubWF4KDAsIG1heFggLSBtaW5YKSAqXG4gICAgICAgICAgIE1hdGgubWF4KDAsIG1heFkgLSBtaW5ZKTtcbn1cblxuZnVuY3Rpb24gY29udGFpbnMoYSwgYikge1xuICAgIHJldHVybiBhLm1pblggPD0gYi5taW5YICYmXG4gICAgICAgICAgIGEubWluWSA8PSBiLm1pblkgJiZcbiAgICAgICAgICAgYi5tYXhYIDw9IGEubWF4WCAmJlxuICAgICAgICAgICBiLm1heFkgPD0gYS5tYXhZO1xufVxuXG5mdW5jdGlvbiBpbnRlcnNlY3RzKGEsIGIpIHtcbiAgICByZXR1cm4gYi5taW5YIDw9IGEubWF4WCAmJlxuICAgICAgICAgICBiLm1pblkgPD0gYS5tYXhZICYmXG4gICAgICAgICAgIGIubWF4WCA+PSBhLm1pblggJiZcbiAgICAgICAgICAgYi5tYXhZID49IGEubWluWTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlTm9kZShjaGlsZHJlbikge1xuICAgIHJldHVybiB7XG4gICAgICAgIGNoaWxkcmVuOiBjaGlsZHJlbixcbiAgICAgICAgaGVpZ2h0OiAxLFxuICAgICAgICBsZWFmOiB0cnVlLFxuICAgICAgICBtaW5YOiBJbmZpbml0eSxcbiAgICAgICAgbWluWTogSW5maW5pdHksXG4gICAgICAgIG1heFg6IC1JbmZpbml0eSxcbiAgICAgICAgbWF4WTogLUluZmluaXR5XG4gICAgfTtcbn1cblxuLy8gc29ydCBhbiBhcnJheSBzbyB0aGF0IGl0ZW1zIGNvbWUgaW4gZ3JvdXBzIG9mIG4gdW5zb3J0ZWQgaXRlbXMsIHdpdGggZ3JvdXBzIHNvcnRlZCBiZXR3ZWVuIGVhY2ggb3RoZXI7XG4vLyBjb21iaW5lcyBzZWxlY3Rpb24gYWxnb3JpdGhtIHdpdGggYmluYXJ5IGRpdmlkZSAmIGNvbnF1ZXIgYXBwcm9hY2hcblxuZnVuY3Rpb24gbXVsdGlTZWxlY3QoYXJyLCBsZWZ0LCByaWdodCwgbiwgY29tcGFyZSkge1xuICAgIHZhciBzdGFjayA9IFtsZWZ0LCByaWdodF0sXG4gICAgICAgIG1pZDtcblxuICAgIHdoaWxlIChzdGFjay5sZW5ndGgpIHtcbiAgICAgICAgcmlnaHQgPSBzdGFjay5wb3AoKTtcbiAgICAgICAgbGVmdCA9IHN0YWNrLnBvcCgpO1xuXG4gICAgICAgIGlmIChyaWdodCAtIGxlZnQgPD0gbikgY29udGludWU7XG5cbiAgICAgICAgbWlkID0gbGVmdCArIE1hdGguY2VpbCgocmlnaHQgLSBsZWZ0KSAvIG4gLyAyKSAqIG47XG4gICAgICAgIHF1aWNrc2VsZWN0KGFyciwgbWlkLCBsZWZ0LCByaWdodCwgY29tcGFyZSk7XG5cbiAgICAgICAgc3RhY2sucHVzaChsZWZ0LCBtaWQsIG1pZCwgcmlnaHQpO1xuICAgIH1cbn1cbiIsIi8qKlxuICogR2VvSlNPTiBCQm94XG4gKlxuICogQHByaXZhdGVcbiAqIEB0eXBlZGVmIHtbbnVtYmVyLCBudW1iZXIsIG51bWJlciwgbnVtYmVyXX0gQkJveFxuICovXG5cbi8qKlxuICogR2VvSlNPTiBJZFxuICpcbiAqIEBwcml2YXRlXG4gKiBAdHlwZWRlZiB7KG51bWJlcnxzdHJpbmcpfSBJZFxuICovXG5cbi8qKlxuICogR2VvSlNPTiBGZWF0dXJlQ29sbGVjdGlvblxuICpcbiAqIEBwcml2YXRlXG4gKiBAdHlwZWRlZiB7T2JqZWN0fSBGZWF0dXJlQ29sbGVjdGlvblxuICogQHByb3BlcnR5IHtzdHJpbmd9IHR5cGVcbiAqIEBwcm9wZXJ0eSB7P0lkfSBpZFxuICogQHByb3BlcnR5IHs/QkJveH0gYmJveFxuICogQHByb3BlcnR5IHtGZWF0dXJlW119IGZlYXR1cmVzXG4gKi9cblxuLyoqXG4gKiBHZW9KU09OIEZlYXR1cmVcbiAqXG4gKiBAcHJpdmF0ZVxuICogQHR5cGVkZWYge09iamVjdH0gRmVhdHVyZVxuICogQHByb3BlcnR5IHtzdHJpbmd9IHR5cGVcbiAqIEBwcm9wZXJ0eSB7P0lkfSBpZFxuICogQHByb3BlcnR5IHs/QkJveH0gYmJveFxuICogQHByb3BlcnR5IHsqfSBwcm9wZXJ0aWVzXG4gKiBAcHJvcGVydHkge0dlb21ldHJ5fSBnZW9tZXRyeVxuICovXG5cbi8qKlxuICogR2VvSlNPTiBHZW9tZXRyeVxuICpcbiAqIEBwcml2YXRlXG4gKiBAdHlwZWRlZiB7T2JqZWN0fSBHZW9tZXRyeVxuICogQHByb3BlcnR5IHtzdHJpbmd9IHR5cGVcbiAqIEBwcm9wZXJ0eSB7YW55W119IGNvb3JkaW5hdGVzXG4gKi9cblxuLyoqXG4gKiBDYWxsYmFjayBmb3IgY29vcmRFYWNoXG4gKlxuICogQGNhbGxiYWNrIGNvb3JkRWFjaENhbGxiYWNrXG4gKiBAcGFyYW0ge0FycmF5PG51bWJlcj59IGN1cnJlbnRDb29yZCBUaGUgY3VycmVudCBjb29yZGluYXRlIGJlaW5nIHByb2Nlc3NlZC5cbiAqIEBwYXJhbSB7bnVtYmVyfSBjb29yZEluZGV4IFRoZSBjdXJyZW50IGluZGV4IG9mIHRoZSBjb29yZGluYXRlIGJlaW5nIHByb2Nlc3NlZC5cbiAqIFN0YXJ0cyBhdCBpbmRleCAwLlxuICogQHBhcmFtIHtudW1iZXJ9IGZlYXR1cmVJbmRleCBUaGUgY3VycmVudCBpbmRleCBvZiB0aGUgZmVhdHVyZSBiZWluZyBwcm9jZXNzZWQuXG4gKiBAcGFyYW0ge251bWJlcn0gZmVhdHVyZVN1YkluZGV4IFRoZSBjdXJyZW50IHN1YkluZGV4IG9mIHRoZSBmZWF0dXJlIGJlaW5nIHByb2Nlc3NlZC5cbiAqL1xuXG4vKipcbiAqIEl0ZXJhdGUgb3ZlciBjb29yZGluYXRlcyBpbiBhbnkgR2VvSlNPTiBvYmplY3QsIHNpbWlsYXIgdG8gQXJyYXkuZm9yRWFjaCgpXG4gKlxuICogQG5hbWUgY29vcmRFYWNoXG4gKiBAcGFyYW0geyhGZWF0dXJlQ29sbGVjdGlvbnxGZWF0dXJlfEdlb21ldHJ5KX0gZ2VvanNvbiBhbnkgR2VvSlNPTiBvYmplY3RcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIGEgbWV0aG9kIHRoYXQgdGFrZXMgKGN1cnJlbnRDb29yZCwgY29vcmRJbmRleCwgZmVhdHVyZUluZGV4LCBmZWF0dXJlU3ViSW5kZXgpXG4gKiBAcGFyYW0ge2Jvb2xlYW59IFtleGNsdWRlV3JhcENvb3JkPWZhbHNlXSB3aGV0aGVyIG9yIG5vdCB0byBpbmNsdWRlIHRoZSBmaW5hbCBjb29yZGluYXRlIG9mIExpbmVhclJpbmdzIHRoYXQgd3JhcHMgdGhlIHJpbmcgaW4gaXRzIGl0ZXJhdGlvbi5cbiAqIEBleGFtcGxlXG4gKiB2YXIgZmVhdHVyZXMgPSB0dXJmLmZlYXR1cmVDb2xsZWN0aW9uKFtcbiAqICAgdHVyZi5wb2ludChbMjYsIDM3XSwge1wiZm9vXCI6IFwiYmFyXCJ9KSxcbiAqICAgdHVyZi5wb2ludChbMzYsIDUzXSwge1wiaGVsbG9cIjogXCJ3b3JsZFwifSlcbiAqIF0pO1xuICpcbiAqIHR1cmYuY29vcmRFYWNoKGZlYXR1cmVzLCBmdW5jdGlvbiAoY3VycmVudENvb3JkLCBjb29yZEluZGV4LCBmZWF0dXJlSW5kZXgsIGZlYXR1cmVTdWJJbmRleCkge1xuICogICAvLz1jdXJyZW50Q29vcmRcbiAqICAgLy89Y29vcmRJbmRleFxuICogICAvLz1mZWF0dXJlSW5kZXhcbiAqICAgLy89ZmVhdHVyZVN1YkluZGV4XG4gKiB9KTtcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvb3JkRWFjaChnZW9qc29uLCBjYWxsYmFjaywgZXhjbHVkZVdyYXBDb29yZCkge1xuICAgIC8vIEhhbmRsZXMgbnVsbCBHZW9tZXRyeSAtLSBTa2lwcyB0aGlzIEdlb0pTT05cbiAgICBpZiAoZ2VvanNvbiA9PT0gbnVsbCkgcmV0dXJuO1xuICAgIHZhciBmZWF0dXJlSW5kZXgsIGdlb21ldHJ5SW5kZXgsIGosIGssIGwsIGdlb21ldHJ5LCBzdG9wRywgY29vcmRzLFxuICAgICAgICBnZW9tZXRyeU1heWJlQ29sbGVjdGlvbixcbiAgICAgICAgd3JhcFNocmluayA9IDAsXG4gICAgICAgIGNvb3JkSW5kZXggPSAwLFxuICAgICAgICBpc0dlb21ldHJ5Q29sbGVjdGlvbixcbiAgICAgICAgdHlwZSA9IGdlb2pzb24udHlwZSxcbiAgICAgICAgaXNGZWF0dXJlQ29sbGVjdGlvbiA9IHR5cGUgPT09ICdGZWF0dXJlQ29sbGVjdGlvbicsXG4gICAgICAgIGlzRmVhdHVyZSA9IHR5cGUgPT09ICdGZWF0dXJlJyxcbiAgICAgICAgc3RvcCA9IGlzRmVhdHVyZUNvbGxlY3Rpb24gPyBnZW9qc29uLmZlYXR1cmVzLmxlbmd0aCA6IDE7XG5cbiAgICAvLyBUaGlzIGxvZ2ljIG1heSBsb29rIGEgbGl0dGxlIHdlaXJkLiBUaGUgcmVhc29uIHdoeSBpdCBpcyB0aGF0IHdheVxuICAgIC8vIGlzIGJlY2F1c2UgaXQncyB0cnlpbmcgdG8gYmUgZmFzdC4gR2VvSlNPTiBzdXBwb3J0cyBtdWx0aXBsZSBraW5kc1xuICAgIC8vIG9mIG9iamVjdHMgYXQgaXRzIHJvb3Q6IEZlYXR1cmVDb2xsZWN0aW9uLCBGZWF0dXJlcywgR2VvbWV0cmllcy5cbiAgICAvLyBUaGlzIGZ1bmN0aW9uIGhhcyB0aGUgcmVzcG9uc2liaWxpdHkgb2YgaGFuZGxpbmcgYWxsIG9mIHRoZW0sIGFuZCB0aGF0XG4gICAgLy8gbWVhbnMgdGhhdCBzb21lIG9mIHRoZSBgZm9yYCBsb29wcyB5b3Ugc2VlIGJlbG93IGFjdHVhbGx5IGp1c3QgZG9uJ3QgYXBwbHlcbiAgICAvLyB0byBjZXJ0YWluIGlucHV0cy4gRm9yIGluc3RhbmNlLCBpZiB5b3UgZ2l2ZSB0aGlzIGp1c3QgYVxuICAgIC8vIFBvaW50IGdlb21ldHJ5LCB0aGVuIGJvdGggbG9vcHMgYXJlIHNob3J0LWNpcmN1aXRlZCBhbmQgYWxsIHdlIGRvXG4gICAgLy8gaXMgZ3JhZHVhbGx5IHJlbmFtZSB0aGUgaW5wdXQgdW50aWwgaXQncyBjYWxsZWQgJ2dlb21ldHJ5Jy5cbiAgICAvL1xuICAgIC8vIFRoaXMgYWxzbyBhaW1zIHRvIGFsbG9jYXRlIGFzIGZldyByZXNvdXJjZXMgYXMgcG9zc2libGU6IGp1c3QgYVxuICAgIC8vIGZldyBudW1iZXJzIGFuZCBib29sZWFucywgcmF0aGVyIHRoYW4gYW55IHRlbXBvcmFyeSBhcnJheXMgYXMgd291bGRcbiAgICAvLyBiZSByZXF1aXJlZCB3aXRoIHRoZSBub3JtYWxpemF0aW9uIGFwcHJvYWNoLlxuICAgIGZvciAoZmVhdHVyZUluZGV4ID0gMDsgZmVhdHVyZUluZGV4IDwgc3RvcDsgZmVhdHVyZUluZGV4KyspIHtcbiAgICAgICAgZ2VvbWV0cnlNYXliZUNvbGxlY3Rpb24gPSAoaXNGZWF0dXJlQ29sbGVjdGlvbiA/IGdlb2pzb24uZmVhdHVyZXNbZmVhdHVyZUluZGV4XS5nZW9tZXRyeSA6XG4gICAgICAgICAgICAoaXNGZWF0dXJlID8gZ2VvanNvbi5nZW9tZXRyeSA6IGdlb2pzb24pKTtcbiAgICAgICAgaXNHZW9tZXRyeUNvbGxlY3Rpb24gPSAoZ2VvbWV0cnlNYXliZUNvbGxlY3Rpb24pID8gZ2VvbWV0cnlNYXliZUNvbGxlY3Rpb24udHlwZSA9PT0gJ0dlb21ldHJ5Q29sbGVjdGlvbicgOiBmYWxzZTtcbiAgICAgICAgc3RvcEcgPSBpc0dlb21ldHJ5Q29sbGVjdGlvbiA/IGdlb21ldHJ5TWF5YmVDb2xsZWN0aW9uLmdlb21ldHJpZXMubGVuZ3RoIDogMTtcblxuICAgICAgICBmb3IgKGdlb21ldHJ5SW5kZXggPSAwOyBnZW9tZXRyeUluZGV4IDwgc3RvcEc7IGdlb21ldHJ5SW5kZXgrKykge1xuICAgICAgICAgICAgdmFyIGZlYXR1cmVTdWJJbmRleCA9IDA7XG4gICAgICAgICAgICBnZW9tZXRyeSA9IGlzR2VvbWV0cnlDb2xsZWN0aW9uID9cbiAgICAgICAgICAgICAgICBnZW9tZXRyeU1heWJlQ29sbGVjdGlvbi5nZW9tZXRyaWVzW2dlb21ldHJ5SW5kZXhdIDogZ2VvbWV0cnlNYXliZUNvbGxlY3Rpb247XG5cbiAgICAgICAgICAgIC8vIEhhbmRsZXMgbnVsbCBHZW9tZXRyeSAtLSBTa2lwcyB0aGlzIGdlb21ldHJ5XG4gICAgICAgICAgICBpZiAoZ2VvbWV0cnkgPT09IG51bGwpIGNvbnRpbnVlO1xuICAgICAgICAgICAgY29vcmRzID0gZ2VvbWV0cnkuY29vcmRpbmF0ZXM7XG4gICAgICAgICAgICB2YXIgZ2VvbVR5cGUgPSBnZW9tZXRyeS50eXBlO1xuXG4gICAgICAgICAgICB3cmFwU2hyaW5rID0gKGV4Y2x1ZGVXcmFwQ29vcmQgJiYgKGdlb21UeXBlID09PSAnUG9seWdvbicgfHwgZ2VvbVR5cGUgPT09ICdNdWx0aVBvbHlnb24nKSkgPyAxIDogMDtcblxuICAgICAgICAgICAgc3dpdGNoIChnZW9tVHlwZSkge1xuICAgICAgICAgICAgY2FzZSBudWxsOlxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnUG9pbnQnOlxuICAgICAgICAgICAgICAgIGNhbGxiYWNrKGNvb3JkcywgY29vcmRJbmRleCwgZmVhdHVyZUluZGV4LCBmZWF0dXJlU3ViSW5kZXgpO1xuICAgICAgICAgICAgICAgIGNvb3JkSW5kZXgrKztcbiAgICAgICAgICAgICAgICBmZWF0dXJlU3ViSW5kZXgrKztcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ0xpbmVTdHJpbmcnOlxuICAgICAgICAgICAgY2FzZSAnTXVsdGlQb2ludCc6XG4gICAgICAgICAgICAgICAgZm9yIChqID0gMDsgaiA8IGNvb3Jkcy5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayhjb29yZHNbal0sIGNvb3JkSW5kZXgsIGZlYXR1cmVJbmRleCwgZmVhdHVyZVN1YkluZGV4KTtcbiAgICAgICAgICAgICAgICAgICAgY29vcmRJbmRleCsrO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZ2VvbVR5cGUgPT09ICdNdWx0aVBvaW50JykgZmVhdHVyZVN1YkluZGV4Kys7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChnZW9tVHlwZSA9PT0gJ0xpbmVTdHJpbmcnKSBmZWF0dXJlU3ViSW5kZXgrKztcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ1BvbHlnb24nOlxuICAgICAgICAgICAgY2FzZSAnTXVsdGlMaW5lU3RyaW5nJzpcbiAgICAgICAgICAgICAgICBmb3IgKGogPSAwOyBqIDwgY29vcmRzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAoayA9IDA7IGsgPCBjb29yZHNbal0ubGVuZ3RoIC0gd3JhcFNocmluazsgaysrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayhjb29yZHNbal1ba10sIGNvb3JkSW5kZXgsIGZlYXR1cmVJbmRleCwgZmVhdHVyZVN1YkluZGV4KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvb3JkSW5kZXgrKztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoZ2VvbVR5cGUgPT09ICdNdWx0aUxpbmVTdHJpbmcnKSBmZWF0dXJlU3ViSW5kZXgrKztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGdlb21UeXBlID09PSAnUG9seWdvbicpIGZlYXR1cmVTdWJJbmRleCsrO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnTXVsdGlQb2x5Z29uJzpcbiAgICAgICAgICAgICAgICBmb3IgKGogPSAwOyBqIDwgY29vcmRzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAoayA9IDA7IGsgPCBjb29yZHNbal0ubGVuZ3RoOyBrKyspXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGwgPSAwOyBsIDwgY29vcmRzW2pdW2tdLmxlbmd0aCAtIHdyYXBTaHJpbms7IGwrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKGNvb3Jkc1tqXVtrXVtsXSwgY29vcmRJbmRleCwgZmVhdHVyZUluZGV4LCBmZWF0dXJlU3ViSW5kZXgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvb3JkSW5kZXgrKztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZmVhdHVyZVN1YkluZGV4Kys7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnR2VvbWV0cnlDb2xsZWN0aW9uJzpcbiAgICAgICAgICAgICAgICBmb3IgKGogPSAwOyBqIDwgZ2VvbWV0cnkuZ2VvbWV0cmllcy5sZW5ndGg7IGorKylcbiAgICAgICAgICAgICAgICAgICAgY29vcmRFYWNoKGdlb21ldHJ5Lmdlb21ldHJpZXNbal0sIGNhbGxiYWNrLCBleGNsdWRlV3JhcENvb3JkKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdVbmtub3duIEdlb21ldHJ5IFR5cGUnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cblxuLyoqXG4gKiBDYWxsYmFjayBmb3IgY29vcmRSZWR1Y2VcbiAqXG4gKiBUaGUgZmlyc3QgdGltZSB0aGUgY2FsbGJhY2sgZnVuY3Rpb24gaXMgY2FsbGVkLCB0aGUgdmFsdWVzIHByb3ZpZGVkIGFzIGFyZ3VtZW50cyBkZXBlbmRcbiAqIG9uIHdoZXRoZXIgdGhlIHJlZHVjZSBtZXRob2QgaGFzIGFuIGluaXRpYWxWYWx1ZSBhcmd1bWVudC5cbiAqXG4gKiBJZiBhbiBpbml0aWFsVmFsdWUgaXMgcHJvdmlkZWQgdG8gdGhlIHJlZHVjZSBtZXRob2Q6XG4gKiAgLSBUaGUgcHJldmlvdXNWYWx1ZSBhcmd1bWVudCBpcyBpbml0aWFsVmFsdWUuXG4gKiAgLSBUaGUgY3VycmVudFZhbHVlIGFyZ3VtZW50IGlzIHRoZSB2YWx1ZSBvZiB0aGUgZmlyc3QgZWxlbWVudCBwcmVzZW50IGluIHRoZSBhcnJheS5cbiAqXG4gKiBJZiBhbiBpbml0aWFsVmFsdWUgaXMgbm90IHByb3ZpZGVkOlxuICogIC0gVGhlIHByZXZpb3VzVmFsdWUgYXJndW1lbnQgaXMgdGhlIHZhbHVlIG9mIHRoZSBmaXJzdCBlbGVtZW50IHByZXNlbnQgaW4gdGhlIGFycmF5LlxuICogIC0gVGhlIGN1cnJlbnRWYWx1ZSBhcmd1bWVudCBpcyB0aGUgdmFsdWUgb2YgdGhlIHNlY29uZCBlbGVtZW50IHByZXNlbnQgaW4gdGhlIGFycmF5LlxuICpcbiAqIEBjYWxsYmFjayBjb29yZFJlZHVjZUNhbGxiYWNrXG4gKiBAcGFyYW0geyp9IHByZXZpb3VzVmFsdWUgVGhlIGFjY3VtdWxhdGVkIHZhbHVlIHByZXZpb3VzbHkgcmV0dXJuZWQgaW4gdGhlIGxhc3QgaW52b2NhdGlvblxuICogb2YgdGhlIGNhbGxiYWNrLCBvciBpbml0aWFsVmFsdWUsIGlmIHN1cHBsaWVkLlxuICogQHBhcmFtIHtBcnJheTxudW1iZXI+fSBjdXJyZW50Q29vcmQgVGhlIGN1cnJlbnQgY29vcmRpbmF0ZSBiZWluZyBwcm9jZXNzZWQuXG4gKiBAcGFyYW0ge251bWJlcn0gY29vcmRJbmRleCBUaGUgY3VycmVudCBpbmRleCBvZiB0aGUgY29vcmRpbmF0ZSBiZWluZyBwcm9jZXNzZWQuXG4gKiBTdGFydHMgYXQgaW5kZXggMCwgaWYgYW4gaW5pdGlhbFZhbHVlIGlzIHByb3ZpZGVkLCBhbmQgYXQgaW5kZXggMSBvdGhlcndpc2UuXG4gKiBAcGFyYW0ge251bWJlcn0gZmVhdHVyZUluZGV4IFRoZSBjdXJyZW50IGluZGV4IG9mIHRoZSBmZWF0dXJlIGJlaW5nIHByb2Nlc3NlZC5cbiAqIEBwYXJhbSB7bnVtYmVyfSBmZWF0dXJlU3ViSW5kZXggVGhlIGN1cnJlbnQgc3ViSW5kZXggb2YgdGhlIGZlYXR1cmUgYmVpbmcgcHJvY2Vzc2VkLlxuICovXG5cbi8qKlxuICogUmVkdWNlIGNvb3JkaW5hdGVzIGluIGFueSBHZW9KU09OIG9iamVjdCwgc2ltaWxhciB0byBBcnJheS5yZWR1Y2UoKVxuICpcbiAqIEBuYW1lIGNvb3JkUmVkdWNlXG4gKiBAcGFyYW0ge0ZlYXR1cmVDb2xsZWN0aW9ufEdlb21ldHJ5fEZlYXR1cmV9IGdlb2pzb24gYW55IEdlb0pTT04gb2JqZWN0XG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayBhIG1ldGhvZCB0aGF0IHRha2VzIChwcmV2aW91c1ZhbHVlLCBjdXJyZW50Q29vcmQsIGNvb3JkSW5kZXgpXG4gKiBAcGFyYW0geyp9IFtpbml0aWFsVmFsdWVdIFZhbHVlIHRvIHVzZSBhcyB0aGUgZmlyc3QgYXJndW1lbnQgdG8gdGhlIGZpcnN0IGNhbGwgb2YgdGhlIGNhbGxiYWNrLlxuICogQHBhcmFtIHtib29sZWFufSBbZXhjbHVkZVdyYXBDb29yZD1mYWxzZV0gd2hldGhlciBvciBub3QgdG8gaW5jbHVkZSB0aGUgZmluYWwgY29vcmRpbmF0ZSBvZiBMaW5lYXJSaW5ncyB0aGF0IHdyYXBzIHRoZSByaW5nIGluIGl0cyBpdGVyYXRpb24uXG4gKiBAcmV0dXJucyB7Kn0gVGhlIHZhbHVlIHRoYXQgcmVzdWx0cyBmcm9tIHRoZSByZWR1Y3Rpb24uXG4gKiBAZXhhbXBsZVxuICogdmFyIGZlYXR1cmVzID0gdHVyZi5mZWF0dXJlQ29sbGVjdGlvbihbXG4gKiAgIHR1cmYucG9pbnQoWzI2LCAzN10sIHtcImZvb1wiOiBcImJhclwifSksXG4gKiAgIHR1cmYucG9pbnQoWzM2LCA1M10sIHtcImhlbGxvXCI6IFwid29ybGRcIn0pXG4gKiBdKTtcbiAqXG4gKiB0dXJmLmNvb3JkUmVkdWNlKGZlYXR1cmVzLCBmdW5jdGlvbiAocHJldmlvdXNWYWx1ZSwgY3VycmVudENvb3JkLCBjb29yZEluZGV4LCBmZWF0dXJlSW5kZXgsIGZlYXR1cmVTdWJJbmRleCkge1xuICogICAvLz1wcmV2aW91c1ZhbHVlXG4gKiAgIC8vPWN1cnJlbnRDb29yZFxuICogICAvLz1jb29yZEluZGV4XG4gKiAgIC8vPWZlYXR1cmVJbmRleFxuICogICAvLz1mZWF0dXJlU3ViSW5kZXhcbiAqICAgcmV0dXJuIGN1cnJlbnRDb29yZDtcbiAqIH0pO1xuICovXG5leHBvcnQgZnVuY3Rpb24gY29vcmRSZWR1Y2UoZ2VvanNvbiwgY2FsbGJhY2ssIGluaXRpYWxWYWx1ZSwgZXhjbHVkZVdyYXBDb29yZCkge1xuICAgIHZhciBwcmV2aW91c1ZhbHVlID0gaW5pdGlhbFZhbHVlO1xuICAgIGNvb3JkRWFjaChnZW9qc29uLCBmdW5jdGlvbiAoY3VycmVudENvb3JkLCBjb29yZEluZGV4LCBmZWF0dXJlSW5kZXgsIGZlYXR1cmVTdWJJbmRleCkge1xuICAgICAgICBpZiAoY29vcmRJbmRleCA9PT0gMCAmJiBpbml0aWFsVmFsdWUgPT09IHVuZGVmaW5lZCkgcHJldmlvdXNWYWx1ZSA9IGN1cnJlbnRDb29yZDtcbiAgICAgICAgZWxzZSBwcmV2aW91c1ZhbHVlID0gY2FsbGJhY2socHJldmlvdXNWYWx1ZSwgY3VycmVudENvb3JkLCBjb29yZEluZGV4LCBmZWF0dXJlSW5kZXgsIGZlYXR1cmVTdWJJbmRleCk7XG4gICAgfSwgZXhjbHVkZVdyYXBDb29yZCk7XG4gICAgcmV0dXJuIHByZXZpb3VzVmFsdWU7XG59XG5cbi8qKlxuICogQ2FsbGJhY2sgZm9yIHByb3BFYWNoXG4gKlxuICogQGNhbGxiYWNrIHByb3BFYWNoQ2FsbGJhY2tcbiAqIEBwYXJhbSB7T2JqZWN0fSBjdXJyZW50UHJvcGVydGllcyBUaGUgY3VycmVudCBwcm9wZXJ0aWVzIGJlaW5nIHByb2Nlc3NlZC5cbiAqIEBwYXJhbSB7bnVtYmVyfSBmZWF0dXJlSW5kZXggVGhlIGluZGV4IG9mIHRoZSBjdXJyZW50IGVsZW1lbnQgYmVpbmcgcHJvY2Vzc2VkIGluIHRoZVxuICogYXJyYXkuU3RhcnRzIGF0IGluZGV4IDAsIGlmIGFuIGluaXRpYWxWYWx1ZSBpcyBwcm92aWRlZCwgYW5kIGF0IGluZGV4IDEgb3RoZXJ3aXNlLlxuICovXG5cbi8qKlxuICogSXRlcmF0ZSBvdmVyIHByb3BlcnRpZXMgaW4gYW55IEdlb0pTT04gb2JqZWN0LCBzaW1pbGFyIHRvIEFycmF5LmZvckVhY2goKVxuICpcbiAqIEBuYW1lIHByb3BFYWNoXG4gKiBAcGFyYW0geyhGZWF0dXJlQ29sbGVjdGlvbnxGZWF0dXJlKX0gZ2VvanNvbiBhbnkgR2VvSlNPTiBvYmplY3RcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIGEgbWV0aG9kIHRoYXQgdGFrZXMgKGN1cnJlbnRQcm9wZXJ0aWVzLCBmZWF0dXJlSW5kZXgpXG4gKiBAZXhhbXBsZVxuICogdmFyIGZlYXR1cmVzID0gdHVyZi5mZWF0dXJlQ29sbGVjdGlvbihbXG4gKiAgICAgdHVyZi5wb2ludChbMjYsIDM3XSwge2ZvbzogJ2Jhcid9KSxcbiAqICAgICB0dXJmLnBvaW50KFszNiwgNTNdLCB7aGVsbG86ICd3b3JsZCd9KVxuICogXSk7XG4gKlxuICogdHVyZi5wcm9wRWFjaChmZWF0dXJlcywgZnVuY3Rpb24gKGN1cnJlbnRQcm9wZXJ0aWVzLCBmZWF0dXJlSW5kZXgpIHtcbiAqICAgLy89Y3VycmVudFByb3BlcnRpZXNcbiAqICAgLy89ZmVhdHVyZUluZGV4XG4gKiB9KTtcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHByb3BFYWNoKGdlb2pzb24sIGNhbGxiYWNrKSB7XG4gICAgdmFyIGk7XG4gICAgc3dpdGNoIChnZW9qc29uLnR5cGUpIHtcbiAgICBjYXNlICdGZWF0dXJlQ29sbGVjdGlvbic6XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBnZW9qc29uLmZlYXR1cmVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjYWxsYmFjayhnZW9qc29uLmZlYXR1cmVzW2ldLnByb3BlcnRpZXMsIGkpO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgIGNhc2UgJ0ZlYXR1cmUnOlxuICAgICAgICBjYWxsYmFjayhnZW9qc29uLnByb3BlcnRpZXMsIDApO1xuICAgICAgICBicmVhaztcbiAgICB9XG59XG5cblxuLyoqXG4gKiBDYWxsYmFjayBmb3IgcHJvcFJlZHVjZVxuICpcbiAqIFRoZSBmaXJzdCB0aW1lIHRoZSBjYWxsYmFjayBmdW5jdGlvbiBpcyBjYWxsZWQsIHRoZSB2YWx1ZXMgcHJvdmlkZWQgYXMgYXJndW1lbnRzIGRlcGVuZFxuICogb24gd2hldGhlciB0aGUgcmVkdWNlIG1ldGhvZCBoYXMgYW4gaW5pdGlhbFZhbHVlIGFyZ3VtZW50LlxuICpcbiAqIElmIGFuIGluaXRpYWxWYWx1ZSBpcyBwcm92aWRlZCB0byB0aGUgcmVkdWNlIG1ldGhvZDpcbiAqICAtIFRoZSBwcmV2aW91c1ZhbHVlIGFyZ3VtZW50IGlzIGluaXRpYWxWYWx1ZS5cbiAqICAtIFRoZSBjdXJyZW50VmFsdWUgYXJndW1lbnQgaXMgdGhlIHZhbHVlIG9mIHRoZSBmaXJzdCBlbGVtZW50IHByZXNlbnQgaW4gdGhlIGFycmF5LlxuICpcbiAqIElmIGFuIGluaXRpYWxWYWx1ZSBpcyBub3QgcHJvdmlkZWQ6XG4gKiAgLSBUaGUgcHJldmlvdXNWYWx1ZSBhcmd1bWVudCBpcyB0aGUgdmFsdWUgb2YgdGhlIGZpcnN0IGVsZW1lbnQgcHJlc2VudCBpbiB0aGUgYXJyYXkuXG4gKiAgLSBUaGUgY3VycmVudFZhbHVlIGFyZ3VtZW50IGlzIHRoZSB2YWx1ZSBvZiB0aGUgc2Vjb25kIGVsZW1lbnQgcHJlc2VudCBpbiB0aGUgYXJyYXkuXG4gKlxuICogQGNhbGxiYWNrIHByb3BSZWR1Y2VDYWxsYmFja1xuICogQHBhcmFtIHsqfSBwcmV2aW91c1ZhbHVlIFRoZSBhY2N1bXVsYXRlZCB2YWx1ZSBwcmV2aW91c2x5IHJldHVybmVkIGluIHRoZSBsYXN0IGludm9jYXRpb25cbiAqIG9mIHRoZSBjYWxsYmFjaywgb3IgaW5pdGlhbFZhbHVlLCBpZiBzdXBwbGllZC5cbiAqIEBwYXJhbSB7Kn0gY3VycmVudFByb3BlcnRpZXMgVGhlIGN1cnJlbnQgcHJvcGVydGllcyBiZWluZyBwcm9jZXNzZWQuXG4gKiBAcGFyYW0ge251bWJlcn0gZmVhdHVyZUluZGV4IFRoZSBpbmRleCBvZiB0aGUgY3VycmVudCBlbGVtZW50IGJlaW5nIHByb2Nlc3NlZCBpbiB0aGVcbiAqIGFycmF5LlN0YXJ0cyBhdCBpbmRleCAwLCBpZiBhbiBpbml0aWFsVmFsdWUgaXMgcHJvdmlkZWQsIGFuZCBhdCBpbmRleCAxIG90aGVyd2lzZS5cbiAqL1xuXG4vKipcbiAqIFJlZHVjZSBwcm9wZXJ0aWVzIGluIGFueSBHZW9KU09OIG9iamVjdCBpbnRvIGEgc2luZ2xlIHZhbHVlLFxuICogc2ltaWxhciB0byBob3cgQXJyYXkucmVkdWNlIHdvcmtzLiBIb3dldmVyLCBpbiB0aGlzIGNhc2Ugd2UgbGF6aWx5IHJ1blxuICogdGhlIHJlZHVjdGlvbiwgc28gYW4gYXJyYXkgb2YgYWxsIHByb3BlcnRpZXMgaXMgdW5uZWNlc3NhcnkuXG4gKlxuICogQG5hbWUgcHJvcFJlZHVjZVxuICogQHBhcmFtIHsoRmVhdHVyZUNvbGxlY3Rpb258RmVhdHVyZSl9IGdlb2pzb24gYW55IEdlb0pTT04gb2JqZWN0XG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayBhIG1ldGhvZCB0aGF0IHRha2VzIChwcmV2aW91c1ZhbHVlLCBjdXJyZW50UHJvcGVydGllcywgZmVhdHVyZUluZGV4KVxuICogQHBhcmFtIHsqfSBbaW5pdGlhbFZhbHVlXSBWYWx1ZSB0byB1c2UgYXMgdGhlIGZpcnN0IGFyZ3VtZW50IHRvIHRoZSBmaXJzdCBjYWxsIG9mIHRoZSBjYWxsYmFjay5cbiAqIEByZXR1cm5zIHsqfSBUaGUgdmFsdWUgdGhhdCByZXN1bHRzIGZyb20gdGhlIHJlZHVjdGlvbi5cbiAqIEBleGFtcGxlXG4gKiB2YXIgZmVhdHVyZXMgPSB0dXJmLmZlYXR1cmVDb2xsZWN0aW9uKFtcbiAqICAgICB0dXJmLnBvaW50KFsyNiwgMzddLCB7Zm9vOiAnYmFyJ30pLFxuICogICAgIHR1cmYucG9pbnQoWzM2LCA1M10sIHtoZWxsbzogJ3dvcmxkJ30pXG4gKiBdKTtcbiAqXG4gKiB0dXJmLnByb3BSZWR1Y2UoZmVhdHVyZXMsIGZ1bmN0aW9uIChwcmV2aW91c1ZhbHVlLCBjdXJyZW50UHJvcGVydGllcywgZmVhdHVyZUluZGV4KSB7XG4gKiAgIC8vPXByZXZpb3VzVmFsdWVcbiAqICAgLy89Y3VycmVudFByb3BlcnRpZXNcbiAqICAgLy89ZmVhdHVyZUluZGV4XG4gKiAgIHJldHVybiBjdXJyZW50UHJvcGVydGllc1xuICogfSk7XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwcm9wUmVkdWNlKGdlb2pzb24sIGNhbGxiYWNrLCBpbml0aWFsVmFsdWUpIHtcbiAgICB2YXIgcHJldmlvdXNWYWx1ZSA9IGluaXRpYWxWYWx1ZTtcbiAgICBwcm9wRWFjaChnZW9qc29uLCBmdW5jdGlvbiAoY3VycmVudFByb3BlcnRpZXMsIGZlYXR1cmVJbmRleCkge1xuICAgICAgICBpZiAoZmVhdHVyZUluZGV4ID09PSAwICYmIGluaXRpYWxWYWx1ZSA9PT0gdW5kZWZpbmVkKSBwcmV2aW91c1ZhbHVlID0gY3VycmVudFByb3BlcnRpZXM7XG4gICAgICAgIGVsc2UgcHJldmlvdXNWYWx1ZSA9IGNhbGxiYWNrKHByZXZpb3VzVmFsdWUsIGN1cnJlbnRQcm9wZXJ0aWVzLCBmZWF0dXJlSW5kZXgpO1xuICAgIH0pO1xuICAgIHJldHVybiBwcmV2aW91c1ZhbHVlO1xufVxuXG4vKipcbiAqIENhbGxiYWNrIGZvciBmZWF0dXJlRWFjaFxuICpcbiAqIEBjYWxsYmFjayBmZWF0dXJlRWFjaENhbGxiYWNrXG4gKiBAcGFyYW0ge0ZlYXR1cmU8YW55Pn0gY3VycmVudEZlYXR1cmUgVGhlIGN1cnJlbnQgZmVhdHVyZSBiZWluZyBwcm9jZXNzZWQuXG4gKiBAcGFyYW0ge251bWJlcn0gZmVhdHVyZUluZGV4IFRoZSBpbmRleCBvZiB0aGUgY3VycmVudCBlbGVtZW50IGJlaW5nIHByb2Nlc3NlZCBpbiB0aGVcbiAqIGFycmF5LlN0YXJ0cyBhdCBpbmRleCAwLCBpZiBhbiBpbml0aWFsVmFsdWUgaXMgcHJvdmlkZWQsIGFuZCBhdCBpbmRleCAxIG90aGVyd2lzZS5cbiAqL1xuXG4vKipcbiAqIEl0ZXJhdGUgb3ZlciBmZWF0dXJlcyBpbiBhbnkgR2VvSlNPTiBvYmplY3QsIHNpbWlsYXIgdG9cbiAqIEFycmF5LmZvckVhY2guXG4gKlxuICogQG5hbWUgZmVhdHVyZUVhY2hcbiAqIEBwYXJhbSB7KEZlYXR1cmVDb2xsZWN0aW9ufEZlYXR1cmV8R2VvbWV0cnkpfSBnZW9qc29uIGFueSBHZW9KU09OIG9iamVjdFxuICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgYSBtZXRob2QgdGhhdCB0YWtlcyAoY3VycmVudEZlYXR1cmUsIGZlYXR1cmVJbmRleClcbiAqIEBleGFtcGxlXG4gKiB2YXIgZmVhdHVyZXMgPSB0dXJmLmZlYXR1cmVDb2xsZWN0aW9uKFtcbiAqICAgdHVyZi5wb2ludChbMjYsIDM3XSwge2ZvbzogJ2Jhcid9KSxcbiAqICAgdHVyZi5wb2ludChbMzYsIDUzXSwge2hlbGxvOiAnd29ybGQnfSlcbiAqIF0pO1xuICpcbiAqIHR1cmYuZmVhdHVyZUVhY2goZmVhdHVyZXMsIGZ1bmN0aW9uIChjdXJyZW50RmVhdHVyZSwgZmVhdHVyZUluZGV4KSB7XG4gKiAgIC8vPWN1cnJlbnRGZWF0dXJlXG4gKiAgIC8vPWZlYXR1cmVJbmRleFxuICogfSk7XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBmZWF0dXJlRWFjaChnZW9qc29uLCBjYWxsYmFjaykge1xuICAgIGlmIChnZW9qc29uLnR5cGUgPT09ICdGZWF0dXJlJykge1xuICAgICAgICBjYWxsYmFjayhnZW9qc29uLCAwKTtcbiAgICB9IGVsc2UgaWYgKGdlb2pzb24udHlwZSA9PT0gJ0ZlYXR1cmVDb2xsZWN0aW9uJykge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGdlb2pzb24uZmVhdHVyZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNhbGxiYWNrKGdlb2pzb24uZmVhdHVyZXNbaV0sIGkpO1xuICAgICAgICB9XG4gICAgfVxufVxuXG4vKipcbiAqIENhbGxiYWNrIGZvciBmZWF0dXJlUmVkdWNlXG4gKlxuICogVGhlIGZpcnN0IHRpbWUgdGhlIGNhbGxiYWNrIGZ1bmN0aW9uIGlzIGNhbGxlZCwgdGhlIHZhbHVlcyBwcm92aWRlZCBhcyBhcmd1bWVudHMgZGVwZW5kXG4gKiBvbiB3aGV0aGVyIHRoZSByZWR1Y2UgbWV0aG9kIGhhcyBhbiBpbml0aWFsVmFsdWUgYXJndW1lbnQuXG4gKlxuICogSWYgYW4gaW5pdGlhbFZhbHVlIGlzIHByb3ZpZGVkIHRvIHRoZSByZWR1Y2UgbWV0aG9kOlxuICogIC0gVGhlIHByZXZpb3VzVmFsdWUgYXJndW1lbnQgaXMgaW5pdGlhbFZhbHVlLlxuICogIC0gVGhlIGN1cnJlbnRWYWx1ZSBhcmd1bWVudCBpcyB0aGUgdmFsdWUgb2YgdGhlIGZpcnN0IGVsZW1lbnQgcHJlc2VudCBpbiB0aGUgYXJyYXkuXG4gKlxuICogSWYgYW4gaW5pdGlhbFZhbHVlIGlzIG5vdCBwcm92aWRlZDpcbiAqICAtIFRoZSBwcmV2aW91c1ZhbHVlIGFyZ3VtZW50IGlzIHRoZSB2YWx1ZSBvZiB0aGUgZmlyc3QgZWxlbWVudCBwcmVzZW50IGluIHRoZSBhcnJheS5cbiAqICAtIFRoZSBjdXJyZW50VmFsdWUgYXJndW1lbnQgaXMgdGhlIHZhbHVlIG9mIHRoZSBzZWNvbmQgZWxlbWVudCBwcmVzZW50IGluIHRoZSBhcnJheS5cbiAqXG4gKiBAY2FsbGJhY2sgZmVhdHVyZVJlZHVjZUNhbGxiYWNrXG4gKiBAcGFyYW0geyp9IHByZXZpb3VzVmFsdWUgVGhlIGFjY3VtdWxhdGVkIHZhbHVlIHByZXZpb3VzbHkgcmV0dXJuZWQgaW4gdGhlIGxhc3QgaW52b2NhdGlvblxuICogb2YgdGhlIGNhbGxiYWNrLCBvciBpbml0aWFsVmFsdWUsIGlmIHN1cHBsaWVkLlxuICogQHBhcmFtIHtGZWF0dXJlfSBjdXJyZW50RmVhdHVyZSBUaGUgY3VycmVudCBGZWF0dXJlIGJlaW5nIHByb2Nlc3NlZC5cbiAqIEBwYXJhbSB7bnVtYmVyfSBmZWF0dXJlSW5kZXggVGhlIGluZGV4IG9mIHRoZSBjdXJyZW50IGVsZW1lbnQgYmVpbmcgcHJvY2Vzc2VkIGluIHRoZVxuICogYXJyYXkuU3RhcnRzIGF0IGluZGV4IDAsIGlmIGFuIGluaXRpYWxWYWx1ZSBpcyBwcm92aWRlZCwgYW5kIGF0IGluZGV4IDEgb3RoZXJ3aXNlLlxuICovXG5cbi8qKlxuICogUmVkdWNlIGZlYXR1cmVzIGluIGFueSBHZW9KU09OIG9iamVjdCwgc2ltaWxhciB0byBBcnJheS5yZWR1Y2UoKS5cbiAqXG4gKiBAbmFtZSBmZWF0dXJlUmVkdWNlXG4gKiBAcGFyYW0geyhGZWF0dXJlQ29sbGVjdGlvbnxGZWF0dXJlfEdlb21ldHJ5KX0gZ2VvanNvbiBhbnkgR2VvSlNPTiBvYmplY3RcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIGEgbWV0aG9kIHRoYXQgdGFrZXMgKHByZXZpb3VzVmFsdWUsIGN1cnJlbnRGZWF0dXJlLCBmZWF0dXJlSW5kZXgpXG4gKiBAcGFyYW0geyp9IFtpbml0aWFsVmFsdWVdIFZhbHVlIHRvIHVzZSBhcyB0aGUgZmlyc3QgYXJndW1lbnQgdG8gdGhlIGZpcnN0IGNhbGwgb2YgdGhlIGNhbGxiYWNrLlxuICogQHJldHVybnMgeyp9IFRoZSB2YWx1ZSB0aGF0IHJlc3VsdHMgZnJvbSB0aGUgcmVkdWN0aW9uLlxuICogQGV4YW1wbGVcbiAqIHZhciBmZWF0dXJlcyA9IHR1cmYuZmVhdHVyZUNvbGxlY3Rpb24oW1xuICogICB0dXJmLnBvaW50KFsyNiwgMzddLCB7XCJmb29cIjogXCJiYXJcIn0pLFxuICogICB0dXJmLnBvaW50KFszNiwgNTNdLCB7XCJoZWxsb1wiOiBcIndvcmxkXCJ9KVxuICogXSk7XG4gKlxuICogdHVyZi5mZWF0dXJlUmVkdWNlKGZlYXR1cmVzLCBmdW5jdGlvbiAocHJldmlvdXNWYWx1ZSwgY3VycmVudEZlYXR1cmUsIGZlYXR1cmVJbmRleCkge1xuICogICAvLz1wcmV2aW91c1ZhbHVlXG4gKiAgIC8vPWN1cnJlbnRGZWF0dXJlXG4gKiAgIC8vPWZlYXR1cmVJbmRleFxuICogICByZXR1cm4gY3VycmVudEZlYXR1cmVcbiAqIH0pO1xuICovXG5leHBvcnQgZnVuY3Rpb24gZmVhdHVyZVJlZHVjZShnZW9qc29uLCBjYWxsYmFjaywgaW5pdGlhbFZhbHVlKSB7XG4gICAgdmFyIHByZXZpb3VzVmFsdWUgPSBpbml0aWFsVmFsdWU7XG4gICAgZmVhdHVyZUVhY2goZ2VvanNvbiwgZnVuY3Rpb24gKGN1cnJlbnRGZWF0dXJlLCBmZWF0dXJlSW5kZXgpIHtcbiAgICAgICAgaWYgKGZlYXR1cmVJbmRleCA9PT0gMCAmJiBpbml0aWFsVmFsdWUgPT09IHVuZGVmaW5lZCkgcHJldmlvdXNWYWx1ZSA9IGN1cnJlbnRGZWF0dXJlO1xuICAgICAgICBlbHNlIHByZXZpb3VzVmFsdWUgPSBjYWxsYmFjayhwcmV2aW91c1ZhbHVlLCBjdXJyZW50RmVhdHVyZSwgZmVhdHVyZUluZGV4KTtcbiAgICB9KTtcbiAgICByZXR1cm4gcHJldmlvdXNWYWx1ZTtcbn1cblxuLyoqXG4gKiBHZXQgYWxsIGNvb3JkaW5hdGVzIGZyb20gYW55IEdlb0pTT04gb2JqZWN0LlxuICpcbiAqIEBuYW1lIGNvb3JkQWxsXG4gKiBAcGFyYW0geyhGZWF0dXJlQ29sbGVjdGlvbnxGZWF0dXJlfEdlb21ldHJ5KX0gZ2VvanNvbiBhbnkgR2VvSlNPTiBvYmplY3RcbiAqIEByZXR1cm5zIHtBcnJheTxBcnJheTxudW1iZXI+Pn0gY29vcmRpbmF0ZSBwb3NpdGlvbiBhcnJheVxuICogQGV4YW1wbGVcbiAqIHZhciBmZWF0dXJlcyA9IHR1cmYuZmVhdHVyZUNvbGxlY3Rpb24oW1xuICogICB0dXJmLnBvaW50KFsyNiwgMzddLCB7Zm9vOiAnYmFyJ30pLFxuICogICB0dXJmLnBvaW50KFszNiwgNTNdLCB7aGVsbG86ICd3b3JsZCd9KVxuICogXSk7XG4gKlxuICogdmFyIGNvb3JkcyA9IHR1cmYuY29vcmRBbGwoZmVhdHVyZXMpO1xuICogLy89IFtbMjYsIDM3XSwgWzM2LCA1M11dXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb29yZEFsbChnZW9qc29uKSB7XG4gICAgdmFyIGNvb3JkcyA9IFtdO1xuICAgIGNvb3JkRWFjaChnZW9qc29uLCBmdW5jdGlvbiAoY29vcmQpIHtcbiAgICAgICAgY29vcmRzLnB1c2goY29vcmQpO1xuICAgIH0pO1xuICAgIHJldHVybiBjb29yZHM7XG59XG5cbi8qKlxuICogQ2FsbGJhY2sgZm9yIGdlb21FYWNoXG4gKlxuICogQGNhbGxiYWNrIGdlb21FYWNoQ2FsbGJhY2tcbiAqIEBwYXJhbSB7R2VvbWV0cnl9IGN1cnJlbnRHZW9tZXRyeSBUaGUgY3VycmVudCBnZW9tZXRyeSBiZWluZyBwcm9jZXNzZWQuXG4gKiBAcGFyYW0ge251bWJlcn0gY3VycmVudEluZGV4IFRoZSBpbmRleCBvZiB0aGUgY3VycmVudCBlbGVtZW50IGJlaW5nIHByb2Nlc3NlZCBpbiB0aGVcbiAqIGFycmF5LiBTdGFydHMgYXQgaW5kZXggMCwgaWYgYW4gaW5pdGlhbFZhbHVlIGlzIHByb3ZpZGVkLCBhbmQgYXQgaW5kZXggMSBvdGhlcndpc2UuXG4gKiBAcGFyYW0ge251bWJlcn0gY3VycmVudFByb3BlcnRpZXMgVGhlIGN1cnJlbnQgZmVhdHVyZSBwcm9wZXJ0aWVzIGJlaW5nIHByb2Nlc3NlZC5cbiAqL1xuXG4vKipcbiAqIEl0ZXJhdGUgb3ZlciBlYWNoIGdlb21ldHJ5IGluIGFueSBHZW9KU09OIG9iamVjdCwgc2ltaWxhciB0byBBcnJheS5mb3JFYWNoKClcbiAqXG4gKiBAbmFtZSBnZW9tRWFjaFxuICogQHBhcmFtIHsoRmVhdHVyZUNvbGxlY3Rpb258RmVhdHVyZXxHZW9tZXRyeSl9IGdlb2pzb24gYW55IEdlb0pTT04gb2JqZWN0XG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayBhIG1ldGhvZCB0aGF0IHRha2VzIChjdXJyZW50R2VvbWV0cnksIGZlYXR1cmVJbmRleCwgY3VycmVudFByb3BlcnRpZXMpXG4gKiBAZXhhbXBsZVxuICogdmFyIGZlYXR1cmVzID0gdHVyZi5mZWF0dXJlQ29sbGVjdGlvbihbXG4gKiAgICAgdHVyZi5wb2ludChbMjYsIDM3XSwge2ZvbzogJ2Jhcid9KSxcbiAqICAgICB0dXJmLnBvaW50KFszNiwgNTNdLCB7aGVsbG86ICd3b3JsZCd9KVxuICogXSk7XG4gKlxuICogdHVyZi5nZW9tRWFjaChmZWF0dXJlcywgZnVuY3Rpb24gKGN1cnJlbnRHZW9tZXRyeSwgZmVhdHVyZUluZGV4LCBjdXJyZW50UHJvcGVydGllcykge1xuICogICAvLz1jdXJyZW50R2VvbWV0cnlcbiAqICAgLy89ZmVhdHVyZUluZGV4XG4gKiAgIC8vPWN1cnJlbnRQcm9wZXJ0aWVzXG4gKiB9KTtcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdlb21FYWNoKGdlb2pzb24sIGNhbGxiYWNrKSB7XG4gICAgdmFyIGksIGosIGcsIGdlb21ldHJ5LCBzdG9wRyxcbiAgICAgICAgZ2VvbWV0cnlNYXliZUNvbGxlY3Rpb24sXG4gICAgICAgIGlzR2VvbWV0cnlDb2xsZWN0aW9uLFxuICAgICAgICBnZW9tZXRyeVByb3BlcnRpZXMsXG4gICAgICAgIGZlYXR1cmVJbmRleCA9IDAsXG4gICAgICAgIGlzRmVhdHVyZUNvbGxlY3Rpb24gPSBnZW9qc29uLnR5cGUgPT09ICdGZWF0dXJlQ29sbGVjdGlvbicsXG4gICAgICAgIGlzRmVhdHVyZSA9IGdlb2pzb24udHlwZSA9PT0gJ0ZlYXR1cmUnLFxuICAgICAgICBzdG9wID0gaXNGZWF0dXJlQ29sbGVjdGlvbiA/IGdlb2pzb24uZmVhdHVyZXMubGVuZ3RoIDogMTtcblxuICAgIC8vIFRoaXMgbG9naWMgbWF5IGxvb2sgYSBsaXR0bGUgd2VpcmQuIFRoZSByZWFzb24gd2h5IGl0IGlzIHRoYXQgd2F5XG4gICAgLy8gaXMgYmVjYXVzZSBpdCdzIHRyeWluZyB0byBiZSBmYXN0LiBHZW9KU09OIHN1cHBvcnRzIG11bHRpcGxlIGtpbmRzXG4gICAgLy8gb2Ygb2JqZWN0cyBhdCBpdHMgcm9vdDogRmVhdHVyZUNvbGxlY3Rpb24sIEZlYXR1cmVzLCBHZW9tZXRyaWVzLlxuICAgIC8vIFRoaXMgZnVuY3Rpb24gaGFzIHRoZSByZXNwb25zaWJpbGl0eSBvZiBoYW5kbGluZyBhbGwgb2YgdGhlbSwgYW5kIHRoYXRcbiAgICAvLyBtZWFucyB0aGF0IHNvbWUgb2YgdGhlIGBmb3JgIGxvb3BzIHlvdSBzZWUgYmVsb3cgYWN0dWFsbHkganVzdCBkb24ndCBhcHBseVxuICAgIC8vIHRvIGNlcnRhaW4gaW5wdXRzLiBGb3IgaW5zdGFuY2UsIGlmIHlvdSBnaXZlIHRoaXMganVzdCBhXG4gICAgLy8gUG9pbnQgZ2VvbWV0cnksIHRoZW4gYm90aCBsb29wcyBhcmUgc2hvcnQtY2lyY3VpdGVkIGFuZCBhbGwgd2UgZG9cbiAgICAvLyBpcyBncmFkdWFsbHkgcmVuYW1lIHRoZSBpbnB1dCB1bnRpbCBpdCdzIGNhbGxlZCAnZ2VvbWV0cnknLlxuICAgIC8vXG4gICAgLy8gVGhpcyBhbHNvIGFpbXMgdG8gYWxsb2NhdGUgYXMgZmV3IHJlc291cmNlcyBhcyBwb3NzaWJsZToganVzdCBhXG4gICAgLy8gZmV3IG51bWJlcnMgYW5kIGJvb2xlYW5zLCByYXRoZXIgdGhhbiBhbnkgdGVtcG9yYXJ5IGFycmF5cyBhcyB3b3VsZFxuICAgIC8vIGJlIHJlcXVpcmVkIHdpdGggdGhlIG5vcm1hbGl6YXRpb24gYXBwcm9hY2guXG4gICAgZm9yIChpID0gMDsgaSA8IHN0b3A7IGkrKykge1xuXG4gICAgICAgIGdlb21ldHJ5TWF5YmVDb2xsZWN0aW9uID0gKGlzRmVhdHVyZUNvbGxlY3Rpb24gPyBnZW9qc29uLmZlYXR1cmVzW2ldLmdlb21ldHJ5IDpcbiAgICAgICAgICAgIChpc0ZlYXR1cmUgPyBnZW9qc29uLmdlb21ldHJ5IDogZ2VvanNvbikpO1xuICAgICAgICBnZW9tZXRyeVByb3BlcnRpZXMgPSAoaXNGZWF0dXJlQ29sbGVjdGlvbiA/IGdlb2pzb24uZmVhdHVyZXNbaV0ucHJvcGVydGllcyA6XG4gICAgICAgICAgICAoaXNGZWF0dXJlID8gZ2VvanNvbi5wcm9wZXJ0aWVzIDoge30pKTtcbiAgICAgICAgaXNHZW9tZXRyeUNvbGxlY3Rpb24gPSAoZ2VvbWV0cnlNYXliZUNvbGxlY3Rpb24pID8gZ2VvbWV0cnlNYXliZUNvbGxlY3Rpb24udHlwZSA9PT0gJ0dlb21ldHJ5Q29sbGVjdGlvbicgOiBmYWxzZTtcbiAgICAgICAgc3RvcEcgPSBpc0dlb21ldHJ5Q29sbGVjdGlvbiA/IGdlb21ldHJ5TWF5YmVDb2xsZWN0aW9uLmdlb21ldHJpZXMubGVuZ3RoIDogMTtcblxuICAgICAgICBmb3IgKGcgPSAwOyBnIDwgc3RvcEc7IGcrKykge1xuICAgICAgICAgICAgZ2VvbWV0cnkgPSBpc0dlb21ldHJ5Q29sbGVjdGlvbiA/XG4gICAgICAgICAgICAgICAgZ2VvbWV0cnlNYXliZUNvbGxlY3Rpb24uZ2VvbWV0cmllc1tnXSA6IGdlb21ldHJ5TWF5YmVDb2xsZWN0aW9uO1xuXG4gICAgICAgICAgICAvLyBIYW5kbGUgbnVsbCBHZW9tZXRyeVxuICAgICAgICAgICAgaWYgKGdlb21ldHJ5ID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2sobnVsbCwgZmVhdHVyZUluZGV4LCBnZW9tZXRyeVByb3BlcnRpZXMpO1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc3dpdGNoIChnZW9tZXRyeS50eXBlKSB7XG4gICAgICAgICAgICBjYXNlICdQb2ludCc6XG4gICAgICAgICAgICBjYXNlICdMaW5lU3RyaW5nJzpcbiAgICAgICAgICAgIGNhc2UgJ011bHRpUG9pbnQnOlxuICAgICAgICAgICAgY2FzZSAnUG9seWdvbic6XG4gICAgICAgICAgICBjYXNlICdNdWx0aUxpbmVTdHJpbmcnOlxuICAgICAgICAgICAgY2FzZSAnTXVsdGlQb2x5Z29uJzoge1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKGdlb21ldHJ5LCBmZWF0dXJlSW5kZXgsIGdlb21ldHJ5UHJvcGVydGllcyk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXNlICdHZW9tZXRyeUNvbGxlY3Rpb24nOiB7XG4gICAgICAgICAgICAgICAgZm9yIChqID0gMDsgaiA8IGdlb21ldHJ5Lmdlb21ldHJpZXMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soZ2VvbWV0cnkuZ2VvbWV0cmllc1tqXSwgZmVhdHVyZUluZGV4LCBnZW9tZXRyeVByb3BlcnRpZXMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdVbmtub3duIEdlb21ldHJ5IFR5cGUnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvLyBPbmx5IGluY3JlYXNlIGBmZWF0dXJlSW5kZXhgIHBlciBlYWNoIGZlYXR1cmVcbiAgICAgICAgZmVhdHVyZUluZGV4Kys7XG4gICAgfVxufVxuXG4vKipcbiAqIENhbGxiYWNrIGZvciBnZW9tUmVkdWNlXG4gKlxuICogVGhlIGZpcnN0IHRpbWUgdGhlIGNhbGxiYWNrIGZ1bmN0aW9uIGlzIGNhbGxlZCwgdGhlIHZhbHVlcyBwcm92aWRlZCBhcyBhcmd1bWVudHMgZGVwZW5kXG4gKiBvbiB3aGV0aGVyIHRoZSByZWR1Y2UgbWV0aG9kIGhhcyBhbiBpbml0aWFsVmFsdWUgYXJndW1lbnQuXG4gKlxuICogSWYgYW4gaW5pdGlhbFZhbHVlIGlzIHByb3ZpZGVkIHRvIHRoZSByZWR1Y2UgbWV0aG9kOlxuICogIC0gVGhlIHByZXZpb3VzVmFsdWUgYXJndW1lbnQgaXMgaW5pdGlhbFZhbHVlLlxuICogIC0gVGhlIGN1cnJlbnRWYWx1ZSBhcmd1bWVudCBpcyB0aGUgdmFsdWUgb2YgdGhlIGZpcnN0IGVsZW1lbnQgcHJlc2VudCBpbiB0aGUgYXJyYXkuXG4gKlxuICogSWYgYW4gaW5pdGlhbFZhbHVlIGlzIG5vdCBwcm92aWRlZDpcbiAqICAtIFRoZSBwcmV2aW91c1ZhbHVlIGFyZ3VtZW50IGlzIHRoZSB2YWx1ZSBvZiB0aGUgZmlyc3QgZWxlbWVudCBwcmVzZW50IGluIHRoZSBhcnJheS5cbiAqICAtIFRoZSBjdXJyZW50VmFsdWUgYXJndW1lbnQgaXMgdGhlIHZhbHVlIG9mIHRoZSBzZWNvbmQgZWxlbWVudCBwcmVzZW50IGluIHRoZSBhcnJheS5cbiAqXG4gKiBAY2FsbGJhY2sgZ2VvbVJlZHVjZUNhbGxiYWNrXG4gKiBAcGFyYW0geyp9IHByZXZpb3VzVmFsdWUgVGhlIGFjY3VtdWxhdGVkIHZhbHVlIHByZXZpb3VzbHkgcmV0dXJuZWQgaW4gdGhlIGxhc3QgaW52b2NhdGlvblxuICogb2YgdGhlIGNhbGxiYWNrLCBvciBpbml0aWFsVmFsdWUsIGlmIHN1cHBsaWVkLlxuICogQHBhcmFtIHtHZW9tZXRyeX0gY3VycmVudEdlb21ldHJ5IFRoZSBjdXJyZW50IEZlYXR1cmUgYmVpbmcgcHJvY2Vzc2VkLlxuICogQHBhcmFtIHtudW1iZXJ9IGN1cnJlbnRJbmRleCBUaGUgaW5kZXggb2YgdGhlIGN1cnJlbnQgZWxlbWVudCBiZWluZyBwcm9jZXNzZWQgaW4gdGhlXG4gKiBhcnJheS5TdGFydHMgYXQgaW5kZXggMCwgaWYgYW4gaW5pdGlhbFZhbHVlIGlzIHByb3ZpZGVkLCBhbmQgYXQgaW5kZXggMSBvdGhlcndpc2UuXG4gKiBAcGFyYW0ge09iamVjdH0gY3VycmVudFByb3BlcnRpZXMgVGhlIGN1cnJlbnQgZmVhdHVyZSBwcm9wZXJ0aWVzIGJlaW5nIHByb2Nlc3NlZC5cbiAqL1xuXG4vKipcbiAqIFJlZHVjZSBnZW9tZXRyeSBpbiBhbnkgR2VvSlNPTiBvYmplY3QsIHNpbWlsYXIgdG8gQXJyYXkucmVkdWNlKCkuXG4gKlxuICogQG5hbWUgZ2VvbVJlZHVjZVxuICogQHBhcmFtIHsoRmVhdHVyZUNvbGxlY3Rpb258RmVhdHVyZXxHZW9tZXRyeSl9IGdlb2pzb24gYW55IEdlb0pTT04gb2JqZWN0XG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayBhIG1ldGhvZCB0aGF0IHRha2VzIChwcmV2aW91c1ZhbHVlLCBjdXJyZW50R2VvbWV0cnksIGZlYXR1cmVJbmRleCwgY3VycmVudFByb3BlcnRpZXMpXG4gKiBAcGFyYW0geyp9IFtpbml0aWFsVmFsdWVdIFZhbHVlIHRvIHVzZSBhcyB0aGUgZmlyc3QgYXJndW1lbnQgdG8gdGhlIGZpcnN0IGNhbGwgb2YgdGhlIGNhbGxiYWNrLlxuICogQHJldHVybnMgeyp9IFRoZSB2YWx1ZSB0aGF0IHJlc3VsdHMgZnJvbSB0aGUgcmVkdWN0aW9uLlxuICogQGV4YW1wbGVcbiAqIHZhciBmZWF0dXJlcyA9IHR1cmYuZmVhdHVyZUNvbGxlY3Rpb24oW1xuICogICAgIHR1cmYucG9pbnQoWzI2LCAzN10sIHtmb286ICdiYXInfSksXG4gKiAgICAgdHVyZi5wb2ludChbMzYsIDUzXSwge2hlbGxvOiAnd29ybGQnfSlcbiAqIF0pO1xuICpcbiAqIHR1cmYuZ2VvbVJlZHVjZShmZWF0dXJlcywgZnVuY3Rpb24gKHByZXZpb3VzVmFsdWUsIGN1cnJlbnRHZW9tZXRyeSwgZmVhdHVyZUluZGV4LCBjdXJyZW50UHJvcGVydGllcykge1xuICogICAvLz1wcmV2aW91c1ZhbHVlXG4gKiAgIC8vPWN1cnJlbnRHZW9tZXRyeVxuICogICAvLz1mZWF0dXJlSW5kZXhcbiAqICAgLy89Y3VycmVudFByb3BlcnRpZXNcbiAqICAgcmV0dXJuIGN1cnJlbnRHZW9tZXRyeVxuICogfSk7XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZW9tUmVkdWNlKGdlb2pzb24sIGNhbGxiYWNrLCBpbml0aWFsVmFsdWUpIHtcbiAgICB2YXIgcHJldmlvdXNWYWx1ZSA9IGluaXRpYWxWYWx1ZTtcbiAgICBnZW9tRWFjaChnZW9qc29uLCBmdW5jdGlvbiAoY3VycmVudEdlb21ldHJ5LCBjdXJyZW50SW5kZXgsIGN1cnJlbnRQcm9wZXJ0aWVzKSB7XG4gICAgICAgIGlmIChjdXJyZW50SW5kZXggPT09IDAgJiYgaW5pdGlhbFZhbHVlID09PSB1bmRlZmluZWQpIHByZXZpb3VzVmFsdWUgPSBjdXJyZW50R2VvbWV0cnk7XG4gICAgICAgIGVsc2UgcHJldmlvdXNWYWx1ZSA9IGNhbGxiYWNrKHByZXZpb3VzVmFsdWUsIGN1cnJlbnRHZW9tZXRyeSwgY3VycmVudEluZGV4LCBjdXJyZW50UHJvcGVydGllcyk7XG4gICAgfSk7XG4gICAgcmV0dXJuIHByZXZpb3VzVmFsdWU7XG59XG5cbi8qKlxuICogQ2FsbGJhY2sgZm9yIGZsYXR0ZW5FYWNoXG4gKlxuICogQGNhbGxiYWNrIGZsYXR0ZW5FYWNoQ2FsbGJhY2tcbiAqIEBwYXJhbSB7RmVhdHVyZX0gY3VycmVudEZlYXR1cmUgVGhlIGN1cnJlbnQgZmxhdHRlbmVkIGZlYXR1cmUgYmVpbmcgcHJvY2Vzc2VkLlxuICogQHBhcmFtIHtudW1iZXJ9IGZlYXR1cmVJbmRleCBUaGUgaW5kZXggb2YgdGhlIGN1cnJlbnQgZWxlbWVudCBiZWluZyBwcm9jZXNzZWQgaW4gdGhlXG4gKiBhcnJheS4gU3RhcnRzIGF0IGluZGV4IDAsIGlmIGFuIGluaXRpYWxWYWx1ZSBpcyBwcm92aWRlZCwgYW5kIGF0IGluZGV4IDEgb3RoZXJ3aXNlLlxuICogQHBhcmFtIHtudW1iZXJ9IGZlYXR1cmVTdWJJbmRleCBUaGUgc3ViaW5kZXggb2YgdGhlIGN1cnJlbnQgZWxlbWVudCBiZWluZyBwcm9jZXNzZWQgaW4gdGhlXG4gKiBhcnJheS4gU3RhcnRzIGF0IGluZGV4IDAgYW5kIGluY3JlYXNlcyBpZiB0aGUgZmxhdHRlbmVkIGZlYXR1cmUgd2FzIGEgbXVsdGktZ2VvbWV0cnkuXG4gKi9cblxuLyoqXG4gKiBJdGVyYXRlIG92ZXIgZmxhdHRlbmVkIGZlYXR1cmVzIGluIGFueSBHZW9KU09OIG9iamVjdCwgc2ltaWxhciB0b1xuICogQXJyYXkuZm9yRWFjaC5cbiAqXG4gKiBAbmFtZSBmbGF0dGVuRWFjaFxuICogQHBhcmFtIHsoRmVhdHVyZUNvbGxlY3Rpb258RmVhdHVyZXxHZW9tZXRyeSl9IGdlb2pzb24gYW55IEdlb0pTT04gb2JqZWN0XG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayBhIG1ldGhvZCB0aGF0IHRha2VzIChjdXJyZW50RmVhdHVyZSwgZmVhdHVyZUluZGV4LCBmZWF0dXJlU3ViSW5kZXgpXG4gKiBAZXhhbXBsZVxuICogdmFyIGZlYXR1cmVzID0gdHVyZi5mZWF0dXJlQ29sbGVjdGlvbihbXG4gKiAgICAgdHVyZi5wb2ludChbMjYsIDM3XSwge2ZvbzogJ2Jhcid9KSxcbiAqICAgICB0dXJmLm11bHRpUG9pbnQoW1s0MCwgMzBdLCBbMzYsIDUzXV0sIHtoZWxsbzogJ3dvcmxkJ30pXG4gKiBdKTtcbiAqXG4gKiB0dXJmLmZsYXR0ZW5FYWNoKGZlYXR1cmVzLCBmdW5jdGlvbiAoY3VycmVudEZlYXR1cmUsIGZlYXR1cmVJbmRleCwgZmVhdHVyZVN1YkluZGV4KSB7XG4gKiAgIC8vPWN1cnJlbnRGZWF0dXJlXG4gKiAgIC8vPWZlYXR1cmVJbmRleFxuICogICAvLz1mZWF0dXJlU3ViSW5kZXhcbiAqIH0pO1xuICovXG5leHBvcnQgZnVuY3Rpb24gZmxhdHRlbkVhY2goZ2VvanNvbiwgY2FsbGJhY2spIHtcbiAgICBnZW9tRWFjaChnZW9qc29uLCBmdW5jdGlvbiAoZ2VvbWV0cnksIGZlYXR1cmVJbmRleCwgcHJvcGVydGllcykge1xuICAgICAgICAvLyBDYWxsYmFjayBmb3Igc2luZ2xlIGdlb21ldHJ5XG4gICAgICAgIHZhciB0eXBlID0gKGdlb21ldHJ5ID09PSBudWxsKSA/IG51bGwgOiBnZW9tZXRyeS50eXBlO1xuICAgICAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgICAgY2FzZSBudWxsOlxuICAgICAgICBjYXNlICdQb2ludCc6XG4gICAgICAgIGNhc2UgJ0xpbmVTdHJpbmcnOlxuICAgICAgICBjYXNlICdQb2x5Z29uJzpcbiAgICAgICAgICAgIGNhbGxiYWNrKGZlYXR1cmUoZ2VvbWV0cnksIHByb3BlcnRpZXMpLCBmZWF0dXJlSW5kZXgsIDApO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGdlb21UeXBlO1xuXG4gICAgICAgIC8vIENhbGxiYWNrIGZvciBtdWx0aS1nZW9tZXRyeVxuICAgICAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgICAgY2FzZSAnTXVsdGlQb2ludCc6XG4gICAgICAgICAgICBnZW9tVHlwZSA9ICdQb2ludCc7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnTXVsdGlMaW5lU3RyaW5nJzpcbiAgICAgICAgICAgIGdlb21UeXBlID0gJ0xpbmVTdHJpbmcnO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ011bHRpUG9seWdvbic6XG4gICAgICAgICAgICBnZW9tVHlwZSA9ICdQb2x5Z29uJztcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG5cbiAgICAgICAgZ2VvbWV0cnkuY29vcmRpbmF0ZXMuZm9yRWFjaChmdW5jdGlvbiAoY29vcmRpbmF0ZSwgZmVhdHVyZVN1YkluZGV4KSB7XG4gICAgICAgICAgICB2YXIgZ2VvbSA9IHtcbiAgICAgICAgICAgICAgICB0eXBlOiBnZW9tVHlwZSxcbiAgICAgICAgICAgICAgICBjb29yZGluYXRlczogY29vcmRpbmF0ZVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGNhbGxiYWNrKGZlYXR1cmUoZ2VvbSwgcHJvcGVydGllcyksIGZlYXR1cmVJbmRleCwgZmVhdHVyZVN1YkluZGV4KTtcbiAgICAgICAgfSk7XG5cbiAgICB9KTtcbn1cblxuLyoqXG4gKiBDYWxsYmFjayBmb3IgZmxhdHRlblJlZHVjZVxuICpcbiAqIFRoZSBmaXJzdCB0aW1lIHRoZSBjYWxsYmFjayBmdW5jdGlvbiBpcyBjYWxsZWQsIHRoZSB2YWx1ZXMgcHJvdmlkZWQgYXMgYXJndW1lbnRzIGRlcGVuZFxuICogb24gd2hldGhlciB0aGUgcmVkdWNlIG1ldGhvZCBoYXMgYW4gaW5pdGlhbFZhbHVlIGFyZ3VtZW50LlxuICpcbiAqIElmIGFuIGluaXRpYWxWYWx1ZSBpcyBwcm92aWRlZCB0byB0aGUgcmVkdWNlIG1ldGhvZDpcbiAqICAtIFRoZSBwcmV2aW91c1ZhbHVlIGFyZ3VtZW50IGlzIGluaXRpYWxWYWx1ZS5cbiAqICAtIFRoZSBjdXJyZW50VmFsdWUgYXJndW1lbnQgaXMgdGhlIHZhbHVlIG9mIHRoZSBmaXJzdCBlbGVtZW50IHByZXNlbnQgaW4gdGhlIGFycmF5LlxuICpcbiAqIElmIGFuIGluaXRpYWxWYWx1ZSBpcyBub3QgcHJvdmlkZWQ6XG4gKiAgLSBUaGUgcHJldmlvdXNWYWx1ZSBhcmd1bWVudCBpcyB0aGUgdmFsdWUgb2YgdGhlIGZpcnN0IGVsZW1lbnQgcHJlc2VudCBpbiB0aGUgYXJyYXkuXG4gKiAgLSBUaGUgY3VycmVudFZhbHVlIGFyZ3VtZW50IGlzIHRoZSB2YWx1ZSBvZiB0aGUgc2Vjb25kIGVsZW1lbnQgcHJlc2VudCBpbiB0aGUgYXJyYXkuXG4gKlxuICogQGNhbGxiYWNrIGZsYXR0ZW5SZWR1Y2VDYWxsYmFja1xuICogQHBhcmFtIHsqfSBwcmV2aW91c1ZhbHVlIFRoZSBhY2N1bXVsYXRlZCB2YWx1ZSBwcmV2aW91c2x5IHJldHVybmVkIGluIHRoZSBsYXN0IGludm9jYXRpb25cbiAqIG9mIHRoZSBjYWxsYmFjaywgb3IgaW5pdGlhbFZhbHVlLCBpZiBzdXBwbGllZC5cbiAqIEBwYXJhbSB7RmVhdHVyZX0gY3VycmVudEZlYXR1cmUgVGhlIGN1cnJlbnQgRmVhdHVyZSBiZWluZyBwcm9jZXNzZWQuXG4gKiBAcGFyYW0ge251bWJlcn0gZmVhdHVyZUluZGV4IFRoZSBpbmRleCBvZiB0aGUgY3VycmVudCBlbGVtZW50IGJlaW5nIHByb2Nlc3NlZCBpbiB0aGVcbiAqIGFycmF5LlN0YXJ0cyBhdCBpbmRleCAwLCBpZiBhbiBpbml0aWFsVmFsdWUgaXMgcHJvdmlkZWQsIGFuZCBhdCBpbmRleCAxIG90aGVyd2lzZS5cbiAqIEBwYXJhbSB7bnVtYmVyfSBmZWF0dXJlU3ViSW5kZXggVGhlIHN1YmluZGV4IG9mIHRoZSBjdXJyZW50IGVsZW1lbnQgYmVpbmcgcHJvY2Vzc2VkIGluIHRoZVxuICogYXJyYXkuIFN0YXJ0cyBhdCBpbmRleCAwIGFuZCBpbmNyZWFzZXMgaWYgdGhlIGZsYXR0ZW5lZCBmZWF0dXJlIHdhcyBhIG11bHRpLWdlb21ldHJ5LlxuICovXG5cbi8qKlxuICogUmVkdWNlIGZsYXR0ZW5lZCBmZWF0dXJlcyBpbiBhbnkgR2VvSlNPTiBvYmplY3QsIHNpbWlsYXIgdG8gQXJyYXkucmVkdWNlKCkuXG4gKlxuICogQG5hbWUgZmxhdHRlblJlZHVjZVxuICogQHBhcmFtIHsoRmVhdHVyZUNvbGxlY3Rpb258RmVhdHVyZXxHZW9tZXRyeSl9IGdlb2pzb24gYW55IEdlb0pTT04gb2JqZWN0XG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayBhIG1ldGhvZCB0aGF0IHRha2VzIChwcmV2aW91c1ZhbHVlLCBjdXJyZW50RmVhdHVyZSwgZmVhdHVyZUluZGV4LCBmZWF0dXJlU3ViSW5kZXgpXG4gKiBAcGFyYW0geyp9IFtpbml0aWFsVmFsdWVdIFZhbHVlIHRvIHVzZSBhcyB0aGUgZmlyc3QgYXJndW1lbnQgdG8gdGhlIGZpcnN0IGNhbGwgb2YgdGhlIGNhbGxiYWNrLlxuICogQHJldHVybnMgeyp9IFRoZSB2YWx1ZSB0aGF0IHJlc3VsdHMgZnJvbSB0aGUgcmVkdWN0aW9uLlxuICogQGV4YW1wbGVcbiAqIHZhciBmZWF0dXJlcyA9IHR1cmYuZmVhdHVyZUNvbGxlY3Rpb24oW1xuICogICAgIHR1cmYucG9pbnQoWzI2LCAzN10sIHtmb286ICdiYXInfSksXG4gKiAgICAgdHVyZi5tdWx0aVBvaW50KFtbNDAsIDMwXSwgWzM2LCA1M11dLCB7aGVsbG86ICd3b3JsZCd9KVxuICogXSk7XG4gKlxuICogdHVyZi5mbGF0dGVuUmVkdWNlKGZlYXR1cmVzLCBmdW5jdGlvbiAocHJldmlvdXNWYWx1ZSwgY3VycmVudEZlYXR1cmUsIGZlYXR1cmVJbmRleCwgZmVhdHVyZVN1YkluZGV4KSB7XG4gKiAgIC8vPXByZXZpb3VzVmFsdWVcbiAqICAgLy89Y3VycmVudEZlYXR1cmVcbiAqICAgLy89ZmVhdHVyZUluZGV4XG4gKiAgIC8vPWZlYXR1cmVTdWJJbmRleFxuICogICByZXR1cm4gY3VycmVudEZlYXR1cmVcbiAqIH0pO1xuICovXG5leHBvcnQgZnVuY3Rpb24gZmxhdHRlblJlZHVjZShnZW9qc29uLCBjYWxsYmFjaywgaW5pdGlhbFZhbHVlKSB7XG4gICAgdmFyIHByZXZpb3VzVmFsdWUgPSBpbml0aWFsVmFsdWU7XG4gICAgZmxhdHRlbkVhY2goZ2VvanNvbiwgZnVuY3Rpb24gKGN1cnJlbnRGZWF0dXJlLCBmZWF0dXJlSW5kZXgsIGZlYXR1cmVTdWJJbmRleCkge1xuICAgICAgICBpZiAoZmVhdHVyZUluZGV4ID09PSAwICYmIGZlYXR1cmVTdWJJbmRleCA9PT0gMCAmJiBpbml0aWFsVmFsdWUgPT09IHVuZGVmaW5lZCkgcHJldmlvdXNWYWx1ZSA9IGN1cnJlbnRGZWF0dXJlO1xuICAgICAgICBlbHNlIHByZXZpb3VzVmFsdWUgPSBjYWxsYmFjayhwcmV2aW91c1ZhbHVlLCBjdXJyZW50RmVhdHVyZSwgZmVhdHVyZUluZGV4LCBmZWF0dXJlU3ViSW5kZXgpO1xuICAgIH0pO1xuICAgIHJldHVybiBwcmV2aW91c1ZhbHVlO1xufVxuXG4vKipcbiAqIENhbGxiYWNrIGZvciBzZWdtZW50RWFjaFxuICpcbiAqIEBjYWxsYmFjayBzZWdtZW50RWFjaENhbGxiYWNrXG4gKiBAcGFyYW0ge0ZlYXR1cmU8TGluZVN0cmluZz59IGN1cnJlbnRTZWdtZW50IFRoZSBjdXJyZW50IHNlZ21lbnQgYmVpbmcgcHJvY2Vzc2VkLlxuICogQHBhcmFtIHtudW1iZXJ9IGZlYXR1cmVJbmRleCBUaGUgZmVhdHVyZUluZGV4IGN1cnJlbnRseSBiZWluZyBwcm9jZXNzZWQsIHN0YXJ0cyBhdCBpbmRleCAwLlxuICogQHBhcmFtIHtudW1iZXJ9IGZlYXR1cmVTdWJJbmRleCBUaGUgZmVhdHVyZVN1YkluZGV4IGN1cnJlbnRseSBiZWluZyBwcm9jZXNzZWQsIHN0YXJ0cyBhdCBpbmRleCAwLlxuICogQHBhcmFtIHtudW1iZXJ9IHNlZ21lbnRJbmRleCBUaGUgc2VnbWVudEluZGV4IGN1cnJlbnRseSBiZWluZyBwcm9jZXNzZWQsIHN0YXJ0cyBhdCBpbmRleCAwLlxuICogQHJldHVybnMge3ZvaWR9XG4gKi9cblxuLyoqXG4gKiBJdGVyYXRlIG92ZXIgMi12ZXJ0ZXggbGluZSBzZWdtZW50IGluIGFueSBHZW9KU09OIG9iamVjdCwgc2ltaWxhciB0byBBcnJheS5mb3JFYWNoKClcbiAqIChNdWx0aSlQb2ludCBnZW9tZXRyaWVzIGRvIG5vdCBjb250YWluIHNlZ21lbnRzIHRoZXJlZm9yZSB0aGV5IGFyZSBpZ25vcmVkIGR1cmluZyB0aGlzIG9wZXJhdGlvbi5cbiAqXG4gKiBAcGFyYW0geyhGZWF0dXJlQ29sbGVjdGlvbnxGZWF0dXJlfEdlb21ldHJ5KX0gZ2VvanNvbiBhbnkgR2VvSlNPTlxuICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgYSBtZXRob2QgdGhhdCB0YWtlcyAoY3VycmVudFNlZ21lbnQsIGZlYXR1cmVJbmRleCwgZmVhdHVyZVN1YkluZGV4KVxuICogQHJldHVybnMge3ZvaWR9XG4gKiBAZXhhbXBsZVxuICogdmFyIHBvbHlnb24gPSB0dXJmLnBvbHlnb24oW1tbLTUwLCA1XSwgWy00MCwgLTEwXSwgWy01MCwgLTEwXSwgWy00MCwgNV0sIFstNTAsIDVdXV0pO1xuICpcbiAqIC8vIEl0ZXJhdGUgb3ZlciBHZW9KU09OIGJ5IDItdmVydGV4IHNlZ21lbnRzXG4gKiB0dXJmLnNlZ21lbnRFYWNoKHBvbHlnb24sIGZ1bmN0aW9uIChjdXJyZW50U2VnbWVudCwgZmVhdHVyZUluZGV4LCBmZWF0dXJlU3ViSW5kZXgsIHNlZ21lbnRJbmRleCkge1xuICogICAvLz0gY3VycmVudFNlZ21lbnRcbiAqICAgLy89IGZlYXR1cmVJbmRleFxuICogICAvLz0gZmVhdHVyZVN1YkluZGV4XG4gKiAgIC8vPSBzZWdtZW50SW5kZXhcbiAqIH0pO1xuICpcbiAqIC8vIENhbGN1bGF0ZSB0aGUgdG90YWwgbnVtYmVyIG9mIHNlZ21lbnRzXG4gKiB2YXIgdG90YWwgPSAwO1xuICogdHVyZi5zZWdtZW50RWFjaChwb2x5Z29uLCBmdW5jdGlvbiAoKSB7XG4gKiAgICAgdG90YWwrKztcbiAqIH0pO1xuICovXG5leHBvcnQgZnVuY3Rpb24gc2VnbWVudEVhY2goZ2VvanNvbiwgY2FsbGJhY2spIHtcbiAgICBmbGF0dGVuRWFjaChnZW9qc29uLCBmdW5jdGlvbiAoZmVhdHVyZSwgZmVhdHVyZUluZGV4LCBmZWF0dXJlU3ViSW5kZXgpIHtcbiAgICAgICAgdmFyIHNlZ21lbnRJbmRleCA9IDA7XG5cbiAgICAgICAgLy8gRXhjbHVkZSBudWxsIEdlb21ldHJpZXNcbiAgICAgICAgaWYgKCFmZWF0dXJlLmdlb21ldHJ5KSByZXR1cm47XG4gICAgICAgIC8vIChNdWx0aSlQb2ludCBnZW9tZXRyaWVzIGRvIG5vdCBjb250YWluIHNlZ21lbnRzIHRoZXJlZm9yZSB0aGV5IGFyZSBpZ25vcmVkIGR1cmluZyB0aGlzIG9wZXJhdGlvbi5cbiAgICAgICAgdmFyIHR5cGUgPSBmZWF0dXJlLmdlb21ldHJ5LnR5cGU7XG4gICAgICAgIGlmICh0eXBlID09PSAnUG9pbnQnIHx8IHR5cGUgPT09ICdNdWx0aVBvaW50JykgcmV0dXJuO1xuXG4gICAgICAgIC8vIEdlbmVyYXRlIDItdmVydGV4IGxpbmUgc2VnbWVudHNcbiAgICAgICAgY29vcmRSZWR1Y2UoZmVhdHVyZSwgZnVuY3Rpb24gKHByZXZpb3VzQ29vcmRzLCBjdXJyZW50Q29vcmQpIHtcbiAgICAgICAgICAgIHZhciBjdXJyZW50U2VnbWVudCA9IGxpbmVTdHJpbmcoW3ByZXZpb3VzQ29vcmRzLCBjdXJyZW50Q29vcmRdLCBmZWF0dXJlLnByb3BlcnRpZXMpO1xuICAgICAgICAgICAgY2FsbGJhY2soY3VycmVudFNlZ21lbnQsIGZlYXR1cmVJbmRleCwgZmVhdHVyZVN1YkluZGV4LCBzZWdtZW50SW5kZXgpO1xuICAgICAgICAgICAgc2VnbWVudEluZGV4Kys7XG4gICAgICAgICAgICByZXR1cm4gY3VycmVudENvb3JkO1xuICAgICAgICB9KTtcbiAgICB9KTtcbn1cblxuLyoqXG4gKiBDYWxsYmFjayBmb3Igc2VnbWVudFJlZHVjZVxuICpcbiAqIFRoZSBmaXJzdCB0aW1lIHRoZSBjYWxsYmFjayBmdW5jdGlvbiBpcyBjYWxsZWQsIHRoZSB2YWx1ZXMgcHJvdmlkZWQgYXMgYXJndW1lbnRzIGRlcGVuZFxuICogb24gd2hldGhlciB0aGUgcmVkdWNlIG1ldGhvZCBoYXMgYW4gaW5pdGlhbFZhbHVlIGFyZ3VtZW50LlxuICpcbiAqIElmIGFuIGluaXRpYWxWYWx1ZSBpcyBwcm92aWRlZCB0byB0aGUgcmVkdWNlIG1ldGhvZDpcbiAqICAtIFRoZSBwcmV2aW91c1ZhbHVlIGFyZ3VtZW50IGlzIGluaXRpYWxWYWx1ZS5cbiAqICAtIFRoZSBjdXJyZW50VmFsdWUgYXJndW1lbnQgaXMgdGhlIHZhbHVlIG9mIHRoZSBmaXJzdCBlbGVtZW50IHByZXNlbnQgaW4gdGhlIGFycmF5LlxuICpcbiAqIElmIGFuIGluaXRpYWxWYWx1ZSBpcyBub3QgcHJvdmlkZWQ6XG4gKiAgLSBUaGUgcHJldmlvdXNWYWx1ZSBhcmd1bWVudCBpcyB0aGUgdmFsdWUgb2YgdGhlIGZpcnN0IGVsZW1lbnQgcHJlc2VudCBpbiB0aGUgYXJyYXkuXG4gKiAgLSBUaGUgY3VycmVudFZhbHVlIGFyZ3VtZW50IGlzIHRoZSB2YWx1ZSBvZiB0aGUgc2Vjb25kIGVsZW1lbnQgcHJlc2VudCBpbiB0aGUgYXJyYXkuXG4gKlxuICogQGNhbGxiYWNrIHNlZ21lbnRSZWR1Y2VDYWxsYmFja1xuICogQHBhcmFtIHsqfSBbcHJldmlvdXNWYWx1ZV0gVGhlIGFjY3VtdWxhdGVkIHZhbHVlIHByZXZpb3VzbHkgcmV0dXJuZWQgaW4gdGhlIGxhc3QgaW52b2NhdGlvblxuICogb2YgdGhlIGNhbGxiYWNrLCBvciBpbml0aWFsVmFsdWUsIGlmIHN1cHBsaWVkLlxuICogQHBhcmFtIHtGZWF0dXJlPExpbmVTdHJpbmc+fSBbY3VycmVudFNlZ21lbnRdIFRoZSBjdXJyZW50IHNlZ21lbnQgYmVpbmcgcHJvY2Vzc2VkLlxuICogQHBhcmFtIHtudW1iZXJ9IGZlYXR1cmVJbmRleCBUaGUgZmVhdHVyZUluZGV4IGN1cnJlbnRseSBiZWluZyBwcm9jZXNzZWQsIHN0YXJ0cyBhdCBpbmRleCAwLlxuICogQHBhcmFtIHtudW1iZXJ9IGZlYXR1cmVTdWJJbmRleCBUaGUgZmVhdHVyZVN1YkluZGV4IGN1cnJlbnRseSBiZWluZyBwcm9jZXNzZWQsIHN0YXJ0cyBhdCBpbmRleCAwLlxuICogQHBhcmFtIHtudW1iZXJ9IHNlZ21lbnRJbmRleCBUaGUgc2VnbWVudEluZGV4IGN1cnJlbnRseSBiZWluZyBwcm9jZXNzZWQsIHN0YXJ0cyBhdCBpbmRleCAwLlxuICovXG5cbi8qKlxuICogUmVkdWNlIDItdmVydGV4IGxpbmUgc2VnbWVudCBpbiBhbnkgR2VvSlNPTiBvYmplY3QsIHNpbWlsYXIgdG8gQXJyYXkucmVkdWNlKClcbiAqIChNdWx0aSlQb2ludCBnZW9tZXRyaWVzIGRvIG5vdCBjb250YWluIHNlZ21lbnRzIHRoZXJlZm9yZSB0aGV5IGFyZSBpZ25vcmVkIGR1cmluZyB0aGlzIG9wZXJhdGlvbi5cbiAqXG4gKiBAcGFyYW0geyhGZWF0dXJlQ29sbGVjdGlvbnxGZWF0dXJlfEdlb21ldHJ5KX0gZ2VvanNvbiBhbnkgR2VvSlNPTlxuICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgYSBtZXRob2QgdGhhdCB0YWtlcyAocHJldmlvdXNWYWx1ZSwgY3VycmVudFNlZ21lbnQsIGN1cnJlbnRJbmRleClcbiAqIEBwYXJhbSB7Kn0gW2luaXRpYWxWYWx1ZV0gVmFsdWUgdG8gdXNlIGFzIHRoZSBmaXJzdCBhcmd1bWVudCB0byB0aGUgZmlyc3QgY2FsbCBvZiB0aGUgY2FsbGJhY2suXG4gKiBAcmV0dXJucyB7dm9pZH1cbiAqIEBleGFtcGxlXG4gKiB2YXIgcG9seWdvbiA9IHR1cmYucG9seWdvbihbW1stNTAsIDVdLCBbLTQwLCAtMTBdLCBbLTUwLCAtMTBdLCBbLTQwLCA1XSwgWy01MCwgNV1dXSk7XG4gKlxuICogLy8gSXRlcmF0ZSBvdmVyIEdlb0pTT04gYnkgMi12ZXJ0ZXggc2VnbWVudHNcbiAqIHR1cmYuc2VnbWVudFJlZHVjZShwb2x5Z29uLCBmdW5jdGlvbiAocHJldmlvdXNTZWdtZW50LCBjdXJyZW50U2VnbWVudCwgZmVhdHVyZUluZGV4LCBmZWF0dXJlU3ViSW5kZXgsIHNlZ21lbnRJbmRleCkge1xuICogICAvLz0gcHJldmlvdXNTZWdtZW50XG4gKiAgIC8vPSBjdXJyZW50U2VnbWVudFxuICogICAvLz0gZmVhdHVyZUluZGV4XG4gKiAgIC8vPSBmZWF0dXJlU3ViSW5kZXhcbiAqICAgLy89IHNlZ21lbnRJbmV4XG4gKiAgIHJldHVybiBjdXJyZW50U2VnbWVudFxuICogfSk7XG4gKlxuICogLy8gQ2FsY3VsYXRlIHRoZSB0b3RhbCBudW1iZXIgb2Ygc2VnbWVudHNcbiAqIHZhciBpbml0aWFsVmFsdWUgPSAwXG4gKiB2YXIgdG90YWwgPSB0dXJmLnNlZ21lbnRSZWR1Y2UocG9seWdvbiwgZnVuY3Rpb24gKHByZXZpb3VzVmFsdWUpIHtcbiAqICAgICBwcmV2aW91c1ZhbHVlKys7XG4gKiAgICAgcmV0dXJuIHByZXZpb3VzVmFsdWU7XG4gKiB9LCBpbml0aWFsVmFsdWUpO1xuICovXG5leHBvcnQgZnVuY3Rpb24gc2VnbWVudFJlZHVjZShnZW9qc29uLCBjYWxsYmFjaywgaW5pdGlhbFZhbHVlKSB7XG4gICAgdmFyIHByZXZpb3VzVmFsdWUgPSBpbml0aWFsVmFsdWU7XG4gICAgdmFyIHN0YXJ0ZWQgPSBmYWxzZTtcbiAgICBzZWdtZW50RWFjaChnZW9qc29uLCBmdW5jdGlvbiAoY3VycmVudFNlZ21lbnQsIGZlYXR1cmVJbmRleCwgZmVhdHVyZVN1YkluZGV4LCBzZWdtZW50SW5kZXgpIHtcbiAgICAgICAgaWYgKHN0YXJ0ZWQgPT09IGZhbHNlICYmIGluaXRpYWxWYWx1ZSA9PT0gdW5kZWZpbmVkKSBwcmV2aW91c1ZhbHVlID0gY3VycmVudFNlZ21lbnQ7XG4gICAgICAgIGVsc2UgcHJldmlvdXNWYWx1ZSA9IGNhbGxiYWNrKHByZXZpb3VzVmFsdWUsIGN1cnJlbnRTZWdtZW50LCBmZWF0dXJlSW5kZXgsIGZlYXR1cmVTdWJJbmRleCwgc2VnbWVudEluZGV4KTtcbiAgICAgICAgc3RhcnRlZCA9IHRydWU7XG4gICAgfSk7XG4gICAgcmV0dXJuIHByZXZpb3VzVmFsdWU7XG59XG5cbi8qKlxuICogQ3JlYXRlIEZlYXR1cmVcbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtHZW9tZXRyeX0gZ2VvbWV0cnkgR2VvSlNPTiBHZW9tZXRyeVxuICogQHBhcmFtIHtPYmplY3R9IHByb3BlcnRpZXMgUHJvcGVydGllc1xuICogQHJldHVybnMge0ZlYXR1cmV9IEdlb0pTT04gRmVhdHVyZVxuICovXG5leHBvcnQgZnVuY3Rpb24gZmVhdHVyZShnZW9tZXRyeSwgcHJvcGVydGllcykge1xuICAgIGlmIChnZW9tZXRyeSA9PT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgRXJyb3IoJ05vIGdlb21ldHJ5IHBhc3NlZCcpO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgdHlwZTogJ0ZlYXR1cmUnLFxuICAgICAgICBwcm9wZXJ0aWVzOiBwcm9wZXJ0aWVzIHx8IHt9LFxuICAgICAgICBnZW9tZXRyeTogZ2VvbWV0cnlcbiAgICB9O1xufVxuXG4vKipcbiAqIENyZWF0ZSBMaW5lU3RyaW5nXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7QXJyYXk8QXJyYXk8bnVtYmVyPj59IGNvb3JkaW5hdGVzIExpbmUgQ29vcmRpbmF0ZXNcbiAqIEBwYXJhbSB7T2JqZWN0fSBwcm9wZXJ0aWVzIFByb3BlcnRpZXNcbiAqIEByZXR1cm5zIHtGZWF0dXJlPExpbmVTdHJpbmc+fSBHZW9KU09OIExpbmVTdHJpbmcgRmVhdHVyZVxuICovXG5leHBvcnQgZnVuY3Rpb24gbGluZVN0cmluZyhjb29yZGluYXRlcywgcHJvcGVydGllcykge1xuICAgIGlmICghY29vcmRpbmF0ZXMpIHRocm93IG5ldyBFcnJvcignTm8gY29vcmRpbmF0ZXMgcGFzc2VkJyk7XG4gICAgaWYgKGNvb3JkaW5hdGVzLmxlbmd0aCA8IDIpIHRocm93IG5ldyBFcnJvcignQ29vcmRpbmF0ZXMgbXVzdCBiZSBhbiBhcnJheSBvZiB0d28gb3IgbW9yZSBwb3NpdGlvbnMnKTtcblxuICAgIHJldHVybiB7XG4gICAgICAgIHR5cGU6ICdGZWF0dXJlJyxcbiAgICAgICAgcHJvcGVydGllczogcHJvcGVydGllcyB8fCB7fSxcbiAgICAgICAgZ2VvbWV0cnk6IHtcbiAgICAgICAgICAgIHR5cGU6ICdMaW5lU3RyaW5nJyxcbiAgICAgICAgICAgIGNvb3JkaW5hdGVzOiBjb29yZGluYXRlc1xuICAgICAgICB9XG4gICAgfTtcbn1cblxuXG4vKipcbiAqIENhbGxiYWNrIGZvciBsaW5lRWFjaFxuICpcbiAqIEBjYWxsYmFjayBsaW5lRWFjaENhbGxiYWNrXG4gKiBAcGFyYW0ge0ZlYXR1cmU8TGluZVN0cmluZz59IGN1cnJlbnRMaW5lIFRoZSBjdXJyZW50IExpbmVTdHJpbmd8TGluZWFyUmluZyBiZWluZyBwcm9jZXNzZWQuXG4gKiBAcGFyYW0ge251bWJlcn0gbGluZUluZGV4IFRoZSBpbmRleCBvZiB0aGUgY3VycmVudCBlbGVtZW50IGJlaW5nIHByb2Nlc3NlZCBpbiB0aGUgYXJyYXksIHN0YXJ0cyBhdCBpbmRleCAwLlxuICogQHBhcmFtIHtudW1iZXJ9IGxpbmVTdWJJbmRleCBUaGUgc3ViLWluZGV4IG9mIHRoZSBjdXJyZW50IGxpbmUgYmVpbmcgcHJvY2Vzc2VkIGF0IGluZGV4IDBcbiAqL1xuXG4vKipcbiAqIEl0ZXJhdGUgb3ZlciBsaW5lIG9yIHJpbmcgY29vcmRpbmF0ZXMgaW4gTGluZVN0cmluZywgUG9seWdvbiwgTXVsdGlMaW5lU3RyaW5nLCBNdWx0aVBvbHlnb24gRmVhdHVyZXMgb3IgR2VvbWV0cmllcyxcbiAqIHNpbWlsYXIgdG8gQXJyYXkuZm9yRWFjaC5cbiAqXG4gKiBAbmFtZSBsaW5lRWFjaFxuICogQHBhcmFtIHtHZW9tZXRyeXxGZWF0dXJlPExpbmVTdHJpbmd8UG9seWdvbnxNdWx0aUxpbmVTdHJpbmd8TXVsdGlQb2x5Z29uPn0gZ2VvanNvbiBvYmplY3RcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIGEgbWV0aG9kIHRoYXQgdGFrZXMgKGN1cnJlbnRMaW5lLCBsaW5lSW5kZXgsIGxpbmVTdWJJbmRleClcbiAqIEBleGFtcGxlXG4gKiB2YXIgbXRMbiA9IHR1cmYubXVsdGlMaW5lU3RyaW5nKFtcbiAqICAgdHVyZi5saW5lU3RyaW5nKFtbMjYsIDM3XSwgWzM1LCA0NV1dKSxcbiAqICAgdHVyZi5saW5lU3RyaW5nKFtbMzYsIDUzXSwgWzM4LCA1MF0sIFs0MSwgNTVdXSlcbiAqIF0pO1xuICpcbiAqIHR1cmYubGluZUVhY2gobXRMbiwgZnVuY3Rpb24gKGN1cnJlbnRMaW5lLCBsaW5lSW5kZXgpIHtcbiAqICAgLy89Y3VycmVudExpbmVcbiAqICAgLy89bGluZUluZGV4XG4gKiB9KTtcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGxpbmVFYWNoKGdlb2pzb24sIGNhbGxiYWNrKSB7XG4gICAgLy8gdmFsaWRhdGlvblxuICAgIGlmICghZ2VvanNvbikgdGhyb3cgbmV3IEVycm9yKCdnZW9qc29uIGlzIHJlcXVpcmVkJyk7XG4gICAgdmFyIHR5cGUgPSBnZW9qc29uLmdlb21ldHJ5ID8gZ2VvanNvbi5nZW9tZXRyeS50eXBlIDogZ2VvanNvbi50eXBlO1xuICAgIGlmICghdHlwZSkgdGhyb3cgbmV3IEVycm9yKCdpbnZhbGlkIGdlb2pzb24nKTtcbiAgICBpZiAodHlwZSA9PT0gJ0ZlYXR1cmVDb2xsZWN0aW9uJykgdGhyb3cgbmV3IEVycm9yKCdGZWF0dXJlQ29sbGVjdGlvbiBpcyBub3Qgc3VwcG9ydGVkJyk7XG4gICAgaWYgKHR5cGUgPT09ICdHZW9tZXRyeUNvbGxlY3Rpb24nKSB0aHJvdyBuZXcgRXJyb3IoJ0dlb21ldHJ5Q29sbGVjdGlvbiBpcyBub3Qgc3VwcG9ydGVkJyk7XG4gICAgdmFyIGNvb3JkaW5hdGVzID0gZ2VvanNvbi5nZW9tZXRyeSA/IGdlb2pzb24uZ2VvbWV0cnkuY29vcmRpbmF0ZXMgOiBnZW9qc29uLmNvb3JkaW5hdGVzO1xuICAgIGlmICghY29vcmRpbmF0ZXMpIHRocm93IG5ldyBFcnJvcignZ2VvanNvbiBtdXN0IGNvbnRhaW4gY29vcmRpbmF0ZXMnKTtcblxuICAgIHN3aXRjaCAodHlwZSkge1xuICAgIGNhc2UgJ0xpbmVTdHJpbmcnOlxuICAgICAgICBjYWxsYmFjayhjb29yZGluYXRlcywgMCwgMCk7XG4gICAgICAgIHJldHVybjtcbiAgICBjYXNlICdQb2x5Z29uJzpcbiAgICBjYXNlICdNdWx0aUxpbmVTdHJpbmcnOlxuICAgICAgICB2YXIgc3ViSW5kZXggPSAwO1xuICAgICAgICBmb3IgKHZhciBsaW5lID0gMDsgbGluZSA8IGNvb3JkaW5hdGVzLmxlbmd0aDsgbGluZSsrKSB7XG4gICAgICAgICAgICBpZiAodHlwZSA9PT0gJ011bHRpTGluZVN0cmluZycpIHN1YkluZGV4ID0gbGluZTtcbiAgICAgICAgICAgIGNhbGxiYWNrKGNvb3JkaW5hdGVzW2xpbmVdLCBsaW5lLCBzdWJJbmRleCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuO1xuICAgIGNhc2UgJ011bHRpUG9seWdvbic6XG4gICAgICAgIGZvciAodmFyIG11bHRpID0gMDsgbXVsdGkgPCBjb29yZGluYXRlcy5sZW5ndGg7IG11bHRpKyspIHtcbiAgICAgICAgICAgIGZvciAodmFyIHJpbmcgPSAwOyByaW5nIDwgY29vcmRpbmF0ZXNbbXVsdGldLmxlbmd0aDsgcmluZysrKSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2soY29vcmRpbmF0ZXNbbXVsdGldW3JpbmddLCByaW5nLCBtdWx0aSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuO1xuICAgIGRlZmF1bHQ6XG4gICAgICAgIHRocm93IG5ldyBFcnJvcih0eXBlICsgJyBnZW9tZXRyeSBub3Qgc3VwcG9ydGVkJyk7XG4gICAgfVxufVxuXG4vKipcbiAqIENhbGxiYWNrIGZvciBsaW5lUmVkdWNlXG4gKlxuICogVGhlIGZpcnN0IHRpbWUgdGhlIGNhbGxiYWNrIGZ1bmN0aW9uIGlzIGNhbGxlZCwgdGhlIHZhbHVlcyBwcm92aWRlZCBhcyBhcmd1bWVudHMgZGVwZW5kXG4gKiBvbiB3aGV0aGVyIHRoZSByZWR1Y2UgbWV0aG9kIGhhcyBhbiBpbml0aWFsVmFsdWUgYXJndW1lbnQuXG4gKlxuICogSWYgYW4gaW5pdGlhbFZhbHVlIGlzIHByb3ZpZGVkIHRvIHRoZSByZWR1Y2UgbWV0aG9kOlxuICogIC0gVGhlIHByZXZpb3VzVmFsdWUgYXJndW1lbnQgaXMgaW5pdGlhbFZhbHVlLlxuICogIC0gVGhlIGN1cnJlbnRWYWx1ZSBhcmd1bWVudCBpcyB0aGUgdmFsdWUgb2YgdGhlIGZpcnN0IGVsZW1lbnQgcHJlc2VudCBpbiB0aGUgYXJyYXkuXG4gKlxuICogSWYgYW4gaW5pdGlhbFZhbHVlIGlzIG5vdCBwcm92aWRlZDpcbiAqICAtIFRoZSBwcmV2aW91c1ZhbHVlIGFyZ3VtZW50IGlzIHRoZSB2YWx1ZSBvZiB0aGUgZmlyc3QgZWxlbWVudCBwcmVzZW50IGluIHRoZSBhcnJheS5cbiAqICAtIFRoZSBjdXJyZW50VmFsdWUgYXJndW1lbnQgaXMgdGhlIHZhbHVlIG9mIHRoZSBzZWNvbmQgZWxlbWVudCBwcmVzZW50IGluIHRoZSBhcnJheS5cbiAqXG4gKiBAY2FsbGJhY2sgbGluZVJlZHVjZUNhbGxiYWNrXG4gKiBAcGFyYW0geyp9IHByZXZpb3VzVmFsdWUgVGhlIGFjY3VtdWxhdGVkIHZhbHVlIHByZXZpb3VzbHkgcmV0dXJuZWQgaW4gdGhlIGxhc3QgaW52b2NhdGlvblxuICogb2YgdGhlIGNhbGxiYWNrLCBvciBpbml0aWFsVmFsdWUsIGlmIHN1cHBsaWVkLlxuICogQHBhcmFtIHtGZWF0dXJlPExpbmVTdHJpbmc+fSBjdXJyZW50TGluZSBUaGUgY3VycmVudCBMaW5lU3RyaW5nfExpbmVhclJpbmcgYmVpbmcgcHJvY2Vzc2VkLlxuICogQHBhcmFtIHtudW1iZXJ9IGxpbmVJbmRleCBUaGUgaW5kZXggb2YgdGhlIGN1cnJlbnQgZWxlbWVudCBiZWluZyBwcm9jZXNzZWQgaW4gdGhlXG4gKiBhcnJheS4gU3RhcnRzIGF0IGluZGV4IDAsIGlmIGFuIGluaXRpYWxWYWx1ZSBpcyBwcm92aWRlZCwgYW5kIGF0IGluZGV4IDEgb3RoZXJ3aXNlLlxuICogQHBhcmFtIHtudW1iZXJ9IGxpbmVTdWJJbmRleCBUaGUgc3ViLWluZGV4IG9mIHRoZSBjdXJyZW50IGxpbmUgYmVpbmcgcHJvY2Vzc2VkIGF0IGluZGV4IDBcbiAqL1xuXG4vKipcbiAqIFJlZHVjZSBmZWF0dXJlcyBpbiBhbnkgR2VvSlNPTiBvYmplY3QsIHNpbWlsYXIgdG8gQXJyYXkucmVkdWNlKCkuXG4gKlxuICogQG5hbWUgbGluZVJlZHVjZVxuICogQHBhcmFtIHtHZW9tZXRyeXxGZWF0dXJlPExpbmVTdHJpbmd8UG9seWdvbnxNdWx0aUxpbmVTdHJpbmd8TXVsdGlQb2x5Z29uPn0gZ2VvanNvbiBvYmplY3RcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIGEgbWV0aG9kIHRoYXQgdGFrZXMgKHByZXZpb3VzVmFsdWUsIGN1cnJlbnRGZWF0dXJlLCBmZWF0dXJlSW5kZXgpXG4gKiBAcGFyYW0geyp9IFtpbml0aWFsVmFsdWVdIFZhbHVlIHRvIHVzZSBhcyB0aGUgZmlyc3QgYXJndW1lbnQgdG8gdGhlIGZpcnN0IGNhbGwgb2YgdGhlIGNhbGxiYWNrLlxuICogQHJldHVybnMgeyp9IFRoZSB2YWx1ZSB0aGF0IHJlc3VsdHMgZnJvbSB0aGUgcmVkdWN0aW9uLlxuICogQGV4YW1wbGVcbiAqIHZhciBtdHAgPSB0dXJmLm11bHRpUG9seWdvbihbXG4gKiAgIHR1cmYucG9seWdvbihbW1sxMiw0OF0sWzIsNDFdLFsyNCwzOF0sWzEyLDQ4XV0sIFtbOSw0NF0sWzEzLDQxXSxbMTMsNDVdLFs5LDQ0XV1dKSxcbiAqICAgdHVyZi5wb2x5Z29uKFtbWzUsIDVdLCBbMCwgMF0sIFsyLCAyXSwgWzQsIDRdLCBbNSwgNV1dXSlcbiAqIF0pO1xuICpcbiAqIHR1cmYubGluZVJlZHVjZShtdHAsIGZ1bmN0aW9uIChwcmV2aW91c1ZhbHVlLCBjdXJyZW50TGluZSwgbGluZUluZGV4LCBsaW5lU3ViSW5kZXgpIHtcbiAqICAgLy89cHJldmlvdXNWYWx1ZVxuICogICAvLz1jdXJyZW50TGluZVxuICogICAvLz1saW5lSW5kZXhcbiAqICAgLy89bGluZVN1YkluZGV4XG4gKiAgIHJldHVybiBjdXJyZW50TGluZVxuICogfSwgMik7XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBsaW5lUmVkdWNlKGdlb2pzb24sIGNhbGxiYWNrLCBpbml0aWFsVmFsdWUpIHtcbiAgICB2YXIgcHJldmlvdXNWYWx1ZSA9IGluaXRpYWxWYWx1ZTtcbiAgICBsaW5lRWFjaChnZW9qc29uLCBmdW5jdGlvbiAoY3VycmVudExpbmUsIGxpbmVJbmRleCwgbGluZVN1YkluZGV4KSB7XG4gICAgICAgIGlmIChsaW5lSW5kZXggPT09IDAgJiYgaW5pdGlhbFZhbHVlID09PSB1bmRlZmluZWQpIHByZXZpb3VzVmFsdWUgPSBjdXJyZW50TGluZTtcbiAgICAgICAgZWxzZSBwcmV2aW91c1ZhbHVlID0gY2FsbGJhY2socHJldmlvdXNWYWx1ZSwgY3VycmVudExpbmUsIGxpbmVJbmRleCwgbGluZVN1YkluZGV4KTtcbiAgICB9KTtcbiAgICByZXR1cm4gcHJldmlvdXNWYWx1ZTtcbn1cbiIsInZhciByYnVzaCA9IHJlcXVpcmUoJ3JidXNoJyk7XG52YXIgbWV0YSA9IHJlcXVpcmUoJ0B0dXJmL21ldGEnKTtcbnZhciBmZWF0dXJlRWFjaCA9IG1ldGEuZmVhdHVyZUVhY2g7XG52YXIgY29vcmRFYWNoID0gbWV0YS5jb29yZEVhY2g7XG5cbi8qKlxuICogR2VvSlNPTiBpbXBsZW1lbnRhdGlvbiBvZiBbUkJ1c2hdKGh0dHBzOi8vZ2l0aHViLmNvbS9tb3VybmVyL3JidXNoI3JidXNoKSBzcGF0aWFsIGluZGV4LlxuICpcbiAqIEBuYW1lIHJidXNoXG4gKiBAcGFyYW0ge251bWJlcn0gW21heEVudHJpZXM9OV0gZGVmaW5lcyB0aGUgbWF4aW11bSBudW1iZXIgb2YgZW50cmllcyBpbiBhIHRyZWUgbm9kZS4gOSAodXNlZCBieSBkZWZhdWx0KSBpcyBhXG4gKiByZWFzb25hYmxlIGNob2ljZSBmb3IgbW9zdCBhcHBsaWNhdGlvbnMuIEhpZ2hlciB2YWx1ZSBtZWFucyBmYXN0ZXIgaW5zZXJ0aW9uIGFuZCBzbG93ZXIgc2VhcmNoLCBhbmQgdmljZSB2ZXJzYS5cbiAqIEByZXR1cm5zIHtSQnVzaH0gR2VvSlNPTiBSQnVzaFxuICogQGV4YW1wbGVcbiAqIHZhciByYnVzaCA9IHJlcXVpcmUoJ2dlb2pzb24tcmJ1c2gnKVxuICogdmFyIHRyZWUgPSByYnVzaCgpXG4gKi9cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKG1heEVudHJpZXMpIHtcbiAgICB2YXIgdHJlZSA9IHJidXNoKG1heEVudHJpZXMpO1xuICAgIC8qKlxuICAgICAqIFtpbnNlcnRdKGh0dHBzOi8vZ2l0aHViLmNvbS9tb3VybmVyL3JidXNoI2RhdGEtZm9ybWF0KVxuICAgICAqXG4gICAgICogQHBhcmFtIHtGZWF0dXJlPGFueT59IGZlYXR1cmUgaW5zZXJ0IHNpbmdsZSBHZW9KU09OIEZlYXR1cmVcbiAgICAgKiBAcmV0dXJucyB7UkJ1c2h9IEdlb0pTT04gUkJ1c2hcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIHZhciBwb2x5Z29uID0ge1xuICAgICAqICAgXCJ0eXBlXCI6IFwiRmVhdHVyZVwiLFxuICAgICAqICAgXCJwcm9wZXJ0aWVzXCI6IHt9LFxuICAgICAqICAgXCJnZW9tZXRyeVwiOiB7XG4gICAgICogICAgIFwidHlwZVwiOiBcIlBvbHlnb25cIixcbiAgICAgKiAgICAgXCJjb29yZGluYXRlc1wiOiBbW1stNzgsIDQxXSwgWy02NywgNDFdLCBbLTY3LCA0OF0sIFstNzgsIDQ4XSwgWy03OCwgNDFdXV1cbiAgICAgKiAgIH1cbiAgICAgKiB9XG4gICAgICogdHJlZS5pbnNlcnQocG9seWdvbilcbiAgICAgKi9cbiAgICB0cmVlLmluc2VydCA9IGZ1bmN0aW9uIChmZWF0dXJlKSB7XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KGZlYXR1cmUpKSB7XG4gICAgICAgICAgICB2YXIgYmJveCA9IGZlYXR1cmU7XG4gICAgICAgICAgICBmZWF0dXJlID0gYmJveFBvbHlnb24oYmJveCk7XG4gICAgICAgICAgICBmZWF0dXJlLmJib3ggPSBiYm94O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZmVhdHVyZS5iYm94ID0gZmVhdHVyZS5iYm94ID8gZmVhdHVyZS5iYm94IDogdHVyZkJCb3goZmVhdHVyZSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJidXNoLnByb3RvdHlwZS5pbnNlcnQuY2FsbCh0aGlzLCBmZWF0dXJlKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogW2xvYWRdKGh0dHBzOi8vZ2l0aHViLmNvbS9tb3VybmVyL3JidXNoI2J1bGstaW5zZXJ0aW5nLWRhdGEpXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge0JCb3hbXXxGZWF0dXJlQ29sbGVjdGlvbjxhbnk+fSBmZWF0dXJlcyBsb2FkIGVudGlyZSBHZW9KU09OIEZlYXR1cmVDb2xsZWN0aW9uXG4gICAgICogQHJldHVybnMge1JCdXNofSBHZW9KU09OIFJCdXNoXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiB2YXIgcG9seWdvbnMgPSB7XG4gICAgICogICBcInR5cGVcIjogXCJGZWF0dXJlQ29sbGVjdGlvblwiLFxuICAgICAqICAgXCJmZWF0dXJlc1wiOiBbXG4gICAgICogICAgIHtcbiAgICAgKiAgICAgICBcInR5cGVcIjogXCJGZWF0dXJlXCIsXG4gICAgICogICAgICAgXCJwcm9wZXJ0aWVzXCI6IHt9LFxuICAgICAqICAgICAgIFwiZ2VvbWV0cnlcIjoge1xuICAgICAqICAgICAgICAgXCJ0eXBlXCI6IFwiUG9seWdvblwiLFxuICAgICAqICAgICAgICAgXCJjb29yZGluYXRlc1wiOiBbW1stNzgsIDQxXSwgWy02NywgNDFdLCBbLTY3LCA0OF0sIFstNzgsIDQ4XSwgWy03OCwgNDFdXV1cbiAgICAgKiAgICAgICB9XG4gICAgICogICAgIH0sXG4gICAgICogICAgIHtcbiAgICAgKiAgICAgICBcInR5cGVcIjogXCJGZWF0dXJlXCIsXG4gICAgICogICAgICAgXCJwcm9wZXJ0aWVzXCI6IHt9LFxuICAgICAqICAgICAgIFwiZ2VvbWV0cnlcIjoge1xuICAgICAqICAgICAgICAgXCJ0eXBlXCI6IFwiUG9seWdvblwiLFxuICAgICAqICAgICAgICAgXCJjb29yZGluYXRlc1wiOiBbW1stOTMsIDMyXSwgWy04MywgMzJdLCBbLTgzLCAzOV0sIFstOTMsIDM5XSwgWy05MywgMzJdXV1cbiAgICAgKiAgICAgICB9XG4gICAgICogICAgIH1cbiAgICAgKiAgIF1cbiAgICAgKiB9XG4gICAgICogdHJlZS5sb2FkKHBvbHlnb25zKVxuICAgICAqL1xuICAgIHRyZWUubG9hZCA9IGZ1bmN0aW9uIChmZWF0dXJlcykge1xuICAgICAgICB2YXIgbG9hZCA9IFtdO1xuICAgICAgICAvLyBMb2FkIGFuIEFycmF5IG9mIEJCb3hcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoZmVhdHVyZXMpKSB7XG4gICAgICAgICAgICBmZWF0dXJlcy5mb3JFYWNoKGZ1bmN0aW9uIChiYm94KSB7XG4gICAgICAgICAgICAgICAgdmFyIGZlYXR1cmUgPSBiYm94UG9seWdvbihiYm94KTtcbiAgICAgICAgICAgICAgICBmZWF0dXJlLmJib3ggPSBiYm94O1xuICAgICAgICAgICAgICAgIGxvYWQucHVzaChmZWF0dXJlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gTG9hZCBGZWF0dXJlQ29sbGVjdGlvblxuICAgICAgICAgICAgZmVhdHVyZUVhY2goZmVhdHVyZXMsIGZ1bmN0aW9uIChmZWF0dXJlKSB7XG4gICAgICAgICAgICAgICAgZmVhdHVyZS5iYm94ID0gZmVhdHVyZS5iYm94ID8gZmVhdHVyZS5iYm94IDogdHVyZkJCb3goZmVhdHVyZSk7XG4gICAgICAgICAgICAgICAgbG9hZC5wdXNoKGZlYXR1cmUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJidXNoLnByb3RvdHlwZS5sb2FkLmNhbGwodGhpcywgbG9hZCk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFtyZW1vdmVdKGh0dHBzOi8vZ2l0aHViLmNvbS9tb3VybmVyL3JidXNoI3JlbW92aW5nLWRhdGEpXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge0JCb3h8RmVhdHVyZTxhbnk+fSBmZWF0dXJlIHJlbW92ZSBzaW5nbGUgR2VvSlNPTiBGZWF0dXJlXG4gICAgICogQHJldHVybnMge1JCdXNofSBHZW9KU09OIFJCdXNoXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiB2YXIgcG9seWdvbiA9IHtcbiAgICAgKiAgIFwidHlwZVwiOiBcIkZlYXR1cmVcIixcbiAgICAgKiAgIFwicHJvcGVydGllc1wiOiB7fSxcbiAgICAgKiAgIFwiZ2VvbWV0cnlcIjoge1xuICAgICAqICAgICBcInR5cGVcIjogXCJQb2x5Z29uXCIsXG4gICAgICogICAgIFwiY29vcmRpbmF0ZXNcIjogW1tbLTc4LCA0MV0sIFstNjcsIDQxXSwgWy02NywgNDhdLCBbLTc4LCA0OF0sIFstNzgsIDQxXV1dXG4gICAgICogICB9XG4gICAgICogfVxuICAgICAqIHRyZWUucmVtb3ZlKHBvbHlnb24pXG4gICAgICovXG4gICAgdHJlZS5yZW1vdmUgPSBmdW5jdGlvbiAoZmVhdHVyZSkge1xuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShmZWF0dXJlKSkge1xuICAgICAgICAgICAgdmFyIGJib3ggPSBmZWF0dXJlO1xuICAgICAgICAgICAgZmVhdHVyZSA9IGJib3hQb2x5Z29uKGJib3gpO1xuICAgICAgICAgICAgZmVhdHVyZS5iYm94ID0gYmJveDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmJ1c2gucHJvdG90eXBlLnJlbW92ZS5jYWxsKHRoaXMsIGZlYXR1cmUpO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBbY2xlYXJdKGh0dHBzOi8vZ2l0aHViLmNvbS9tb3VybmVyL3JidXNoI3JlbW92aW5nLWRhdGEpXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyB7UkJ1c2h9IEdlb0pTT04gUmJ1c2hcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIHRyZWUuY2xlYXIoKVxuICAgICAqL1xuICAgIHRyZWUuY2xlYXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiByYnVzaC5wcm90b3R5cGUuY2xlYXIuY2FsbCh0aGlzKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogW3NlYXJjaF0oaHR0cHM6Ly9naXRodWIuY29tL21vdXJuZXIvcmJ1c2gjc2VhcmNoKVxuICAgICAqXG4gICAgICogQHBhcmFtIHtCQm94fEZlYXR1cmVDb2xsZWN0aW9ufEZlYXR1cmU8YW55Pn0gZ2VvanNvbiBzZWFyY2ggd2l0aCBHZW9KU09OXG4gICAgICogQHJldHVybnMge0ZlYXR1cmVDb2xsZWN0aW9uPGFueT59IGFsbCBmZWF0dXJlcyB0aGF0IGludGVyc2VjdHMgd2l0aCB0aGUgZ2l2ZW4gR2VvSlNPTi5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIHZhciBwb2x5Z29uID0ge1xuICAgICAqICAgXCJ0eXBlXCI6IFwiRmVhdHVyZVwiLFxuICAgICAqICAgXCJwcm9wZXJ0aWVzXCI6IHt9LFxuICAgICAqICAgXCJnZW9tZXRyeVwiOiB7XG4gICAgICogICAgIFwidHlwZVwiOiBcIlBvbHlnb25cIixcbiAgICAgKiAgICAgXCJjb29yZGluYXRlc1wiOiBbW1stNzgsIDQxXSwgWy02NywgNDFdLCBbLTY3LCA0OF0sIFstNzgsIDQ4XSwgWy03OCwgNDFdXV1cbiAgICAgKiAgIH1cbiAgICAgKiB9XG4gICAgICogdHJlZS5zZWFyY2gocG9seWdvbilcbiAgICAgKi9cbiAgICB0cmVlLnNlYXJjaCA9IGZ1bmN0aW9uIChnZW9qc29uKSB7XG4gICAgICAgIHZhciBmZWF0dXJlcyA9IHJidXNoLnByb3RvdHlwZS5zZWFyY2guY2FsbCh0aGlzLCB0aGlzLnRvQkJveChnZW9qc29uKSk7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB0eXBlOiAnRmVhdHVyZUNvbGxlY3Rpb24nLFxuICAgICAgICAgICAgZmVhdHVyZXM6IGZlYXR1cmVzXG4gICAgICAgIH07XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFtjb2xsaWRlc10oaHR0cHM6Ly9naXRodWIuY29tL21vdXJuZXIvcmJ1c2gjY29sbGlzaW9ucylcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7QkJveHxGZWF0dXJlQ29sbGVjdGlvbnxGZWF0dXJlPGFueT59IGdlb2pzb24gY29sbGlkZXMgd2l0aCBHZW9KU09OXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59IHRydWUgaWYgdGhlcmUgYXJlIGFueSBpdGVtcyBpbnRlcnNlY3RpbmcgdGhlIGdpdmVuIEdlb0pTT04sIG90aGVyd2lzZSBmYWxzZS5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIHZhciBwb2x5Z29uID0ge1xuICAgICAqICAgXCJ0eXBlXCI6IFwiRmVhdHVyZVwiLFxuICAgICAqICAgXCJwcm9wZXJ0aWVzXCI6IHt9LFxuICAgICAqICAgXCJnZW9tZXRyeVwiOiB7XG4gICAgICogICAgIFwidHlwZVwiOiBcIlBvbHlnb25cIixcbiAgICAgKiAgICAgXCJjb29yZGluYXRlc1wiOiBbW1stNzgsIDQxXSwgWy02NywgNDFdLCBbLTY3LCA0OF0sIFstNzgsIDQ4XSwgWy03OCwgNDFdXV1cbiAgICAgKiAgIH1cbiAgICAgKiB9XG4gICAgICogdHJlZS5jb2xsaWRlcyhwb2x5Z29uKVxuICAgICAqL1xuICAgIHRyZWUuY29sbGlkZXMgPSBmdW5jdGlvbiAoZ2VvanNvbikge1xuICAgICAgICByZXR1cm4gcmJ1c2gucHJvdG90eXBlLmNvbGxpZGVzLmNhbGwodGhpcywgdGhpcy50b0JCb3goZ2VvanNvbikpO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBbYWxsXShodHRwczovL2dpdGh1Yi5jb20vbW91cm5lci9yYnVzaCNzZWFyY2gpXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyB7RmVhdHVyZUNvbGxlY3Rpb248YW55Pn0gYWxsIHRoZSBmZWF0dXJlcyBpbiBSQnVzaFxuICAgICAqIEBleGFtcGxlXG4gICAgICogdHJlZS5hbGwoKVxuICAgICAqIC8vPUZlYXR1cmVDb2xsZWN0aW9uXG4gICAgICovXG4gICAgdHJlZS5hbGwgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBmZWF0dXJlcyA9IHJidXNoLnByb3RvdHlwZS5hbGwuY2FsbCh0aGlzKTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHR5cGU6ICdGZWF0dXJlQ29sbGVjdGlvbicsXG4gICAgICAgICAgICBmZWF0dXJlczogZmVhdHVyZXNcbiAgICAgICAgfTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogW3RvSlNPTl0oaHR0cHM6Ly9naXRodWIuY29tL21vdXJuZXIvcmJ1c2gjZXhwb3J0LWFuZC1pbXBvcnQpXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyB7YW55fSBleHBvcnQgZGF0YSBhcyBKU09OIG9iamVjdFxuICAgICAqIEBleGFtcGxlXG4gICAgICogdmFyIGV4cG9ydGVkID0gdHJlZS50b0pTT04oKVxuICAgICAqIC8vPUpTT04gb2JqZWN0XG4gICAgICovXG4gICAgdHJlZS50b0pTT04gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiByYnVzaC5wcm90b3R5cGUudG9KU09OLmNhbGwodGhpcyk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFtmcm9tSlNPTl0oaHR0cHM6Ly9naXRodWIuY29tL21vdXJuZXIvcmJ1c2gjZXhwb3J0LWFuZC1pbXBvcnQpXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge2FueX0ganNvbiBpbXBvcnQgcHJldmlvdXNseSBleHBvcnRlZCBkYXRhXG4gICAgICogQHJldHVybnMge1JCdXNofSBHZW9KU09OIFJCdXNoXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiB2YXIgZXhwb3J0ZWQgPSB7XG4gICAgICogICBcImNoaWxkcmVuXCI6IFtcbiAgICAgKiAgICAge1xuICAgICAqICAgICAgIFwidHlwZVwiOiBcIkZlYXR1cmVcIixcbiAgICAgKiAgICAgICBcImdlb21ldHJ5XCI6IHtcbiAgICAgKiAgICAgICAgIFwidHlwZVwiOiBcIlBvaW50XCIsXG4gICAgICogICAgICAgICBcImNvb3JkaW5hdGVzXCI6IFsxMTAsIDUwXVxuICAgICAqICAgICAgIH0sXG4gICAgICogICAgICAgXCJwcm9wZXJ0aWVzXCI6IHt9LFxuICAgICAqICAgICAgIFwiYmJveFwiOiBbMTEwLCA1MCwgMTEwLCA1MF1cbiAgICAgKiAgICAgfVxuICAgICAqICAgXSxcbiAgICAgKiAgIFwiaGVpZ2h0XCI6IDEsXG4gICAgICogICBcImxlYWZcIjogdHJ1ZSxcbiAgICAgKiAgIFwibWluWFwiOiAxMTAsXG4gICAgICogICBcIm1pbllcIjogNTAsXG4gICAgICogICBcIm1heFhcIjogMTEwLFxuICAgICAqICAgXCJtYXhZXCI6IDUwXG4gICAgICogfVxuICAgICAqIHRyZWUuZnJvbUpTT04oZXhwb3J0ZWQpXG4gICAgICovXG4gICAgdHJlZS5mcm9tSlNPTiA9IGZ1bmN0aW9uIChqc29uKSB7XG4gICAgICAgIHJldHVybiByYnVzaC5wcm90b3R5cGUuZnJvbUpTT04uY2FsbCh0aGlzLCBqc29uKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogQ29udmVydHMgR2VvSlNPTiB0byB7bWluWCwgbWluWSwgbWF4WCwgbWF4WX0gc2NoZW1hXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqIEBwYXJhbSB7QkJveHxGZWF0dXJlQ29sbGVjdGlvfEZlYXR1cmU8YW55Pn0gZ2VvanNvbiBmZWF0dXJlKHMpIHRvIHJldHJpZXZlIEJCb3ggZnJvbVxuICAgICAqIEByZXR1cm5zIHtPYmplY3R9IGNvbnZlcnRlZCB0byB7bWluWCwgbWluWSwgbWF4WCwgbWF4WX1cbiAgICAgKi9cbiAgICB0cmVlLnRvQkJveCA9IGZ1bmN0aW9uIChnZW9qc29uKSB7XG4gICAgICAgIHZhciBiYm94O1xuICAgICAgICBpZiAoZ2VvanNvbi5iYm94KSBiYm94ID0gZ2VvanNvbi5iYm94O1xuICAgICAgICBlbHNlIGlmIChBcnJheS5pc0FycmF5KGdlb2pzb24pICYmIGdlb2pzb24ubGVuZ3RoID09PSA0KSBiYm94ID0gZ2VvanNvbjtcbiAgICAgICAgZWxzZSBiYm94ID0gdHVyZkJCb3goZ2VvanNvbik7XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIG1pblg6IGJib3hbMF0sXG4gICAgICAgICAgICBtaW5ZOiBiYm94WzFdLFxuICAgICAgICAgICAgbWF4WDogYmJveFsyXSxcbiAgICAgICAgICAgIG1heFk6IGJib3hbM11cbiAgICAgICAgfTtcbiAgICB9O1xuICAgIHJldHVybiB0cmVlO1xufTtcblxuLyoqXG4gKiBUYWtlcyBhIGJib3ggYW5kIHJldHVybnMgYW4gZXF1aXZhbGVudCB7QGxpbmsgUG9seWdvbnxwb2x5Z29ufS5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQG5hbWUgYmJveFBvbHlnb25cbiAqIEBwYXJhbSB7QXJyYXk8bnVtYmVyPn0gYmJveCBleHRlbnQgaW4gW21pblgsIG1pblksIG1heFgsIG1heFldIG9yZGVyXG4gKiBAcmV0dXJucyB7RmVhdHVyZTxQb2x5Z29uPn0gYSBQb2x5Z29uIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBib3VuZGluZyBib3hcbiAqIEBleGFtcGxlXG4gKiB2YXIgYmJveCA9IFswLCAwLCAxMCwgMTBdO1xuICpcbiAqIHZhciBwb2x5ID0gdHVyZi5iYm94UG9seWdvbihiYm94KTtcbiAqXG4gKiAvL2FkZFRvTWFwXG4gKiB2YXIgYWRkVG9NYXAgPSBbcG9seV1cbiAqL1xuZnVuY3Rpb24gYmJveFBvbHlnb24oYmJveCkge1xuICAgIHZhciBsb3dMZWZ0ID0gW2Jib3hbMF0sIGJib3hbMV1dO1xuICAgIHZhciB0b3BMZWZ0ID0gW2Jib3hbMF0sIGJib3hbM11dO1xuICAgIHZhciB0b3BSaWdodCA9IFtiYm94WzJdLCBiYm94WzNdXTtcbiAgICB2YXIgbG93UmlnaHQgPSBbYmJveFsyXSwgYmJveFsxXV07XG4gICAgdmFyIGNvb3JkaW5hdGVzID0gW1tsb3dMZWZ0LCBsb3dSaWdodCwgdG9wUmlnaHQsIHRvcExlZnQsIGxvd0xlZnRdXTtcblxuICAgIHJldHVybiB7XG4gICAgICAgIHR5cGU6ICdGZWF0dXJlJyxcbiAgICAgICAgYmJveDogYmJveCxcbiAgICAgICAgcHJvcGVydGllczoge30sXG4gICAgICAgIGdlb21ldHJ5OiB7XG4gICAgICAgICAgICB0eXBlOiAnUG9seWdvbicsXG4gICAgICAgICAgICBjb29yZGluYXRlczogY29vcmRpbmF0ZXNcbiAgICAgICAgfVxuICAgIH07XG59XG5cbi8qKlxuICogVGFrZXMgYSBzZXQgb2YgZmVhdHVyZXMsIGNhbGN1bGF0ZXMgdGhlIGJib3ggb2YgYWxsIGlucHV0IGZlYXR1cmVzLCBhbmQgcmV0dXJucyBhIGJvdW5kaW5nIGJveC5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQG5hbWUgYmJveFxuICogQHBhcmFtIHtGZWF0dXJlQ29sbGVjdGlvbnxGZWF0dXJlPGFueT59IGdlb2pzb24gaW5wdXQgZmVhdHVyZXNcbiAqIEByZXR1cm5zIHtBcnJheTxudW1iZXI+fSBiYm94IGV4dGVudCBpbiBbbWluWCwgbWluWSwgbWF4WCwgbWF4WV0gb3JkZXJcbiAqIEBleGFtcGxlXG4gKiB2YXIgbGluZSA9IHR1cmYubGluZVN0cmluZyhbWy03NCwgNDBdLCBbLTc4LCA0Ml0sIFstODIsIDM1XV0pO1xuICogdmFyIGJib3ggPSB0dXJmLmJib3gobGluZSk7XG4gKiB2YXIgYmJveFBvbHlnb24gPSB0dXJmLmJib3hQb2x5Z29uKGJib3gpO1xuICpcbiAqIC8vYWRkVG9NYXBcbiAqIHZhciBhZGRUb01hcCA9IFtsaW5lLCBiYm94UG9seWdvbl1cbiAqL1xuZnVuY3Rpb24gdHVyZkJCb3goZ2VvanNvbikge1xuICAgIHZhciBiYm94ID0gW0luZmluaXR5LCBJbmZpbml0eSwgLUluZmluaXR5LCAtSW5maW5pdHldO1xuICAgIGNvb3JkRWFjaChnZW9qc29uLCBmdW5jdGlvbiAoY29vcmQpIHtcbiAgICAgICAgaWYgKGJib3hbMF0gPiBjb29yZFswXSkgYmJveFswXSA9IGNvb3JkWzBdO1xuICAgICAgICBpZiAoYmJveFsxXSA+IGNvb3JkWzFdKSBiYm94WzFdID0gY29vcmRbMV07XG4gICAgICAgIGlmIChiYm94WzJdIDwgY29vcmRbMF0pIGJib3hbMl0gPSBjb29yZFswXTtcbiAgICAgICAgaWYgKGJib3hbM10gPCBjb29yZFsxXSkgYmJveFszXSA9IGNvb3JkWzFdO1xuICAgIH0pO1xuICAgIHJldHVybiBiYm94O1xufVxuIiwiaW1wb3J0ICogYXMgbWFwdGFsa3MgZnJvbSAnbWFwdGFsa3MnO1xyXG5pbXBvcnQgcmJ1c2ggZnJvbSAnZ2VvanNvbi1yYnVzaCc7XHJcblxyXG5jb25zdCBvcHRpb25zID0ge1xyXG4gICAgJ21vZGUnOiAnbGluZScsXHJcbiAgICAndG9sZXJhbmNlJzoxMCxcclxuICAgICdzeW1ib2wnOntcclxuICAgICAgICAnbWFya2VyVHlwZSc6ICdlbGxpcHNlJyxcclxuICAgICAgICAnbWFya2VyRmlsbCc6ICcjMGY4OWY1JyxcclxuICAgICAgICAnbWFya2VyTGluZUNvbG9yJzogJyNmZmYnLFxyXG4gICAgICAgICdtYXJrZXJMaW5lV2lkdGgnOiAyLFxyXG4gICAgICAgICdtYXJrZXJMaW5lT3BhY2l0eSc6IDEsXHJcbiAgICAgICAgJ21hcmtlcldpZHRoJzogMTUsXHJcbiAgICAgICAgJ21hcmtlckhlaWdodCc6IDE1XHJcbiAgICB9XHJcbn07XHJcblxyXG4vKipcclxuICogQSBzbmFwIHRvb2wgdXNlZCBmb3IgbW91c2UgcG9pbnQgdG8gYWRzb3JiIGdlb21ldHJpZXMsIGl0IGV4dGVuZHMgbWFwdGFsa3MuQ2xhc3MuXHJcbiAqXHJcbiAqIFRoYW5rcyB0byByYnVzaCdzIGF1dGhvciwgdGhpcyBwbHVnaW5nIGhhcyB1c2VkIHRoZSByYnVzaCB0byBpbnNwZWN0IHN1cnJvdW5kaW5nIGdlb21ldHJpZXMgd2l0aGluIHRvbGVyYW5jZShodHRwczovL2dpdGh1Yi5jb20vbW91cm5lci9yYnVzaClcclxuICpcclxuICogQGF1dGhvciBsaXViZ2l0aHViKGh0dHBzOi8vZ2l0aHViLmNvbS9saXViZ2l0aHViKVxyXG4gKlxyXG4gKiBNSVQgTGljZW5zZVxyXG4gKi9cclxuZXhwb3J0IGNsYXNzIFNuYXBUb29sIGV4dGVuZHMgbWFwdGFsa3MuQ2xhc3Mge1xyXG4gICAgY29uc3RydWN0b3Iob3B0aW9ucykge1xyXG4gICAgICAgIHN1cGVyKG9wdGlvbnMpO1xyXG4gICAgICAgIHRoaXMudHJlZSA9IHJidXNoKCk7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0TW9kZSgpIHtcclxuICAgICAgICB0aGlzLl9tb2RlID0gIXRoaXMuX21vZGUgPyB0aGlzLm9wdGlvbnNbJ21vZGUnXSA6IHRoaXMuX21vZGU7XHJcbiAgICAgICAgaWYgKHRoaXMuX2NoZWNrTW9kZSh0aGlzLl9tb2RlKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fbW9kZTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ3NuYXAgbW9kZSBpcyBpbnZhbGlkJyk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHNldE1vZGUobW9kZSkge1xyXG4gICAgICAgIGlmICh0aGlzLl9jaGVja01vZGUodGhpcy5fbW9kZSkpIHtcclxuICAgICAgICAgICAgdGhpcy5fbW9kZSA9IG1vZGU7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLnNuYXBsYXllcikge1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuc25hcGxheWVyIGluc3RhbmNlb2YgQXJyYXkpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmFsbExheWVyc0dlb21ldHJpZXMgPSBbXTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnNuYXBsYXllci5mb3JFYWNoKGZ1bmN0aW9uICh0ZW1wTGF5ZXIsIGluZGV4KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHRlbXBHZW9tZXRyaWVzID0gdGVtcExheWVyLmdldEdlb21ldHJpZXMoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5hbGxMYXllcnNHZW9tZXRyaWVzW2luZGV4XSA9IHRoaXMuX2NvbXBvc2l0R2VvbWV0cmllcyh0ZW1wR2VvbWV0cmllcyk7XHJcbiAgICAgICAgICAgICAgICAgICAgfS5iaW5kKHRoaXMpKTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmFsbEdlb21ldHJpZXMgPSBbXS5jb25jYXQoLi4udGhpcy5hbGxMYXllcnNHZW9tZXRyaWVzKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZ2VvbWV0cmllcyA9IHRoaXMuc25hcGxheWVyLmdldEdlb21ldHJpZXMoKTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmFsbEdlb21ldHJpZXMgPSB0aGlzLl9jb21wb3NpdEdlb21ldHJpZXMoZ2VvbWV0cmllcyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ3NuYXAgbW9kZSBpcyBpbnZhbGlkJyk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQHBhcmFtIHtNYXB9IG1hcCBvYmplY3RcclxuICAgICAqIFdoZW4gdXNpbmcgdGhlIHNuYXAgdG9vbCwgeW91IHNob3VsZCBhZGQgaXQgdG8gYSBtYXAgZmlyc3RseS50aGUgZW5hYmxlIG1ldGhvZCBleGN1dGUgZGVmYXVsdFxyXG4gICAgICovXHJcbiAgICBhZGRUbyhtYXApIHtcclxuICAgICAgICBjb25zdCBpZCA9IGAke21hcHRhbGtzLklOVEVSTkFMX0xBWUVSX1BSRUZJWH1fc25hcHRvYDtcclxuICAgICAgICB0aGlzLl9tb3VzZW1vdmVMYXllciA9IG5ldyBtYXB0YWxrcy5WZWN0b3JMYXllcihpZCkuYWRkVG8obWFwKTtcclxuICAgICAgICB0aGlzLl9tYXAgPSBtYXA7XHJcbiAgICAgICAgdGhpcy5hbGxHZW9tZXRyaWVzID0gW107XHJcbiAgICAgICAgdGhpcy5lbmFibGUoKTtcclxuICAgIH1cclxuXHJcbiAgICByZW1vdmUoKSB7XHJcbiAgICAgICAgdGhpcy5kaXNhYmxlKCk7XHJcbiAgICAgICAgaWYgKHRoaXMuX21vdXNlbW92ZUxheWVyKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX21vdXNlbW92ZUxheWVyLnJlbW92ZSgpO1xyXG4gICAgICAgICAgICBkZWxldGUgdGhpcy5fbW91c2Vtb3ZlTGF5ZXI7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgZ2V0TWFwKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9tYXA7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gc25hcCBtb2RlXHJcbiAgICAgKiBtb2RlIHNob3VsZCBiZSBlaXRoZXIgJ3BvaW50JyBvciAnbGluZSdcclxuICAgICAqL1xyXG4gICAgX2NoZWNrTW9kZShtb2RlKSB7XHJcbiAgICAgICAgaWYgKG1vZGUgPT09ICdwb2ludCcgfHwgbW9kZSA9PT0gJ2xpbmUnKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBTdGFydCBzbmFwIGludGVyYWN0aW9uXHJcbiAgICAgKi9cclxuICAgIGVuYWJsZSgpIHtcclxuICAgICAgICBjb25zdCBtYXAgPSB0aGlzLmdldE1hcCgpO1xyXG4gICAgICAgIGlmICh0aGlzLnNuYXBsYXllcikge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5zbmFwbGF5ZXIgaW5zdGFuY2VvZiBBcnJheSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5hbGxMYXllcnNHZW9tZXRyaWVzID0gW107XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNuYXBsYXllci5mb3JFYWNoKGZ1bmN0aW9uICh0ZW1wTGF5ZXIsIGluZGV4KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdGVtcEdlb21ldHJpZXMgPSB0ZW1wTGF5ZXIuZ2V0R2VvbWV0cmllcygpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYWxsTGF5ZXJzR2VvbWV0cmllc1tpbmRleF0gPSB0aGlzLl9jb21wb3NpdEdlb21ldHJpZXModGVtcEdlb21ldHJpZXMpO1xyXG4gICAgICAgICAgICAgICAgfS5iaW5kKHRoaXMpKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuYWxsR2VvbWV0cmllcyA9IFtdLmNvbmNhdCguLi50aGlzLmFsbExheWVyc0dlb21ldHJpZXMpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgZ2VvbWV0cmllcyA9IHRoaXMuc25hcGxheWVyLmdldEdlb21ldHJpZXMoKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuYWxsR2VvbWV0cmllcyA9IHRoaXMuX2NvbXBvc2l0R2VvbWV0cmllcyhnZW9tZXRyaWVzKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHRoaXMuYWxsR2VvbWV0cmllcykge1xyXG4gICAgICAgICAgICBpZiAoIXRoaXMuX21vdXNlbW92ZSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fcmVnaXN0ZXJFdmVudHMobWFwKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAodGhpcy5fbW91c2Vtb3ZlTGF5ZXIpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuX21vdXNlbW92ZUxheWVyLnNob3coKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcigneW91IHNob3VsZCBzZXQgZ2VvbWV0cmllcyB3aGljaCBhcmUgc25hcHBlZCB0byBmaXJzdGx5IScpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEVuZCBzbmFwIGludGVyYWN0aW9uXHJcbiAgICAgKi9cclxuICAgIGRpc2FibGUoKSB7XHJcbiAgICAgICAgY29uc3QgbWFwID0gdGhpcy5nZXRNYXAoKTtcclxuICAgICAgICBtYXAub2ZmKCdtb3VzZW1vdmUgdG91Y2hzdGFydCcsIHRoaXMuX21vdXNlbW92ZSk7XHJcbiAgICAgICAgbWFwLm9mZignbW91c2Vkb3duJywgdGhpcy5fbW91c2Vkb3duLCB0aGlzKTtcclxuICAgICAgICBtYXAub2ZmKCdtb3VzZXVwJywgdGhpcy5fbW91c2V1cCwgdGhpcyk7XHJcbiAgICAgICAgaWYgKHRoaXMuX21vdXNlbW92ZUxheWVyKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX21vdXNlbW92ZUxheWVyLmhpZGUoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZGVsZXRlIHRoaXMuX21vdXNlbW92ZTtcclxuICAgICAgICB0aGlzLmFsbEdlb21ldHJpZXMgPSBbXTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEBwYXJhbSB7R2VvbWV0cnl8fEFycmF5PEdlb21ldHJ5Pn0gZ2VvbWV0cmllcyB0byBzbmFwIHRvXHJcbiAgICAgKiBTZXQgZ2VvbWVyaWVzIHRvIGFuIGFycmF5IGZvciBzbmFwcGluZyB0b1xyXG4gICAgICovXHJcbiAgICBzZXRHZW9tZXRyaWVzKGdlb21ldHJpZXMpIHtcclxuICAgICAgICBnZW9tZXRyaWVzID0gKGdlb21ldHJpZXMgaW5zdGFuY2VvZiBBcnJheSkgPyBnZW9tZXRyaWVzIDogW2dlb21ldHJpZXNdO1xyXG4gICAgICAgIHRoaXMuYWxsR2VvbWV0cmllcyA9IHRoaXMuX2NvbXBvc2l0R2VvbWV0cmllcyhnZW9tZXRyaWVzKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEBwYXJhbSB7TGF5ZXJ8fG1hcHRhbGsuVmVjdG9yTGF5ZXJ8fEFycmF5LjxMYXllcj58fEFycmF5LjxtYXB0YWxrLlZlY3RvckxheWVyPn0gbGF5ZXIgdG8gc25hcCB0b1xyXG4gICAgICogU2V0IGxheWVyIGZvciBzbmFwcGluZyB0b1xyXG4gICAgICovXHJcbiAgICBzZXRMYXllcihsYXllcikge1xyXG4gICAgICAgIGlmIChsYXllciBpbnN0YW5jZW9mIEFycmF5KSB7XHJcbiAgICAgICAgICAgIHRoaXMuc25hcGxheWVyID0gW107XHJcbiAgICAgICAgICAgIHRoaXMuYWxsTGF5ZXJzR2VvbWV0cmllcyA9IFtdO1xyXG4gICAgICAgICAgICBsYXllci5mb3JFYWNoKGZ1bmN0aW9uICh0ZW1wTGF5ZXIsIGluZGV4KSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodGVtcExheWVyIGluc3RhbmNlb2YgbWFwdGFsa3MuVmVjdG9yTGF5ZXIpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnNuYXBsYXllci5wdXNoKHRlbXBMYXllcik7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdGVtcEdlb21ldHJpZXMgPSB0ZW1wTGF5ZXIuZ2V0R2VvbWV0cmllcygpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYWxsTGF5ZXJzR2VvbWV0cmllc1tpbmRleF0gPSB0aGlzLl9jb21wb3NpdEdlb21ldHJpZXModGVtcEdlb21ldHJpZXMpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRlbXBMYXllci5vbignYWRkZ2VvJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB0ZW1wR2VvbWV0cmllcyA9IHRoaXMuc25hcGxheWVyW2luZGV4XS5nZXRHZW9tZXRyaWVzKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYWxsTGF5ZXJzR2VvbWV0cmllc1tpbmRleF0gPSB0aGlzLl9jb21wb3NpdEdlb21ldHJpZXModGVtcEdlb21ldHJpZXMpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmFsbEdlb21ldHJpZXMgPSBbXS5jb25jYXQoLi4udGhpcy5hbGxMYXllcnNHZW9tZXRyaWVzKTtcclxuICAgICAgICAgICAgICAgICAgICB9LCB0aGlzKTtcclxuICAgICAgICAgICAgICAgICAgICB0ZW1wTGF5ZXIub24oJ2NsZWFyJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmFsbExheWVyc0dlb21ldHJpZXMuc3BsaWNlKGluZGV4LCAxKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5hbGxHZW9tZXRyaWVzID0gW10uY29uY2F0KC4uLnRoaXMuYWxsTGF5ZXJzR2VvbWV0cmllcyk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSwgdGhpcyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0uYmluZCh0aGlzKSk7XHJcbiAgICAgICAgICAgIHRoaXMuYWxsR2VvbWV0cmllcyA9IFtdLmNvbmNhdCguLi50aGlzLmFsbExheWVyc0dlb21ldHJpZXMpO1xyXG4gICAgICAgICAgICB0aGlzLl9tb3VzZW1vdmVMYXllci5icmluZ1RvRnJvbnQoKTtcclxuICAgICAgICB9IGVsc2UgaWYgKGxheWVyIGluc3RhbmNlb2YgbWFwdGFsa3MuVmVjdG9yTGF5ZXIpIHtcclxuICAgICAgICAgICAgY29uc3QgZ2VvbWV0cmllcyA9IGxheWVyLmdldEdlb21ldHJpZXMoKTtcclxuICAgICAgICAgICAgdGhpcy5zbmFwbGF5ZXIgPSBsYXllcjtcclxuICAgICAgICAgICAgdGhpcy5hbGxHZW9tZXRyaWVzID0gdGhpcy5fY29tcG9zaXRHZW9tZXRyaWVzKGdlb21ldHJpZXMpO1xyXG4gICAgICAgICAgICBsYXllci5vbignYWRkZ2VvJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgZ2VvbWV0cmllcyA9IHRoaXMuc25hcGxheWVyLmdldEdlb21ldHJpZXMoKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuYWxsR2VvbWV0cmllcyA9IHRoaXMuX2NvbXBvc2l0R2VvbWV0cmllcyhnZW9tZXRyaWVzKTtcclxuICAgICAgICAgICAgfSwgdGhpcyk7XHJcbiAgICAgICAgICAgIHRoaXMuc25hcGxheWVyLm9uKCdjbGVhcicsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuX2NsZWFyR2VvbWV0cmllcygpO1xyXG4gICAgICAgICAgICB9LCB0aGlzKTtcclxuICAgICAgICAgICAgdGhpcy5fbW91c2Vtb3ZlTGF5ZXIuYnJpbmdUb0Zyb250KCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQHBhcmFtIHtkcmF3VG9vbHx8bWFwdGFsa3MuRHJhd1Rvb2x9IGRyYXdpbmcgdG9vbFxyXG4gICAgICogV2hlbiBpbnRlcmFjdGluZyB3aXRoIGEgZHJhd3Rvb2wsIHlvdSBzaG91bGQgYmluZCB0aGUgZHJhd3Rvb2wgb2JqZWN0IHRvIHRoaXMgc25hcHRvIHRvb2xcclxuICAgICAqL1xyXG4gICAgYmluZERyYXdUb29sKGRyYXdUb29sKSB7XHJcbiAgICAgICAgaWYgKGRyYXdUb29sIGluc3RhbmNlb2YgbWFwdGFsa3MuRHJhd1Rvb2wpIHtcclxuICAgICAgICAgICAgZHJhd1Rvb2wub24oJ2RyYXdzdGFydCcsIChlKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5zbmFwUG9pbnQpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9yZXNldENvb3JkaW5hdGVzKGUudGFyZ2V0Ll9nZW9tZXRyeSwgdGhpcy5zbmFwUG9pbnQpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3Jlc2V0Q2xpY2tQb2ludChlLnRhcmdldC5fY2xpY2tDb29yZHMsIHRoaXMuc25hcFBvaW50KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSwgdGhpcyk7XHJcbiAgICAgICAgICAgIGRyYXdUb29sLm9uKCdtb3VzZW1vdmUnLCAoZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuc25hcFBvaW50KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbW9kZSA9IGUudGFyZ2V0LmdldE1vZGUoKTtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBtYXAgPSBlLnRhcmdldC5nZXRNYXAoKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAobW9kZSA9PT0gJ2NpcmNsZScgfHwgbW9kZSA9PT0gJ2ZyZWVIYW5kQ2lyY2xlJykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCByYWRpdXMgPSBtYXAuY29tcHV0ZUxlbmd0aChlLnRhcmdldC5fZ2VvbWV0cnkuZ2V0Q2VudGVyKCksIHRoaXMuc25hcFBvaW50KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZS50YXJnZXQuX2dlb21ldHJ5LnNldFJhZGl1cyhyYWRpdXMpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAobW9kZSA9PT0gJ2VsbGlwc2UnIHx8IG1vZGUgPT09ICdmcmVlSGFuZEVsbGlwc2UnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGNlbnRlciA9IGUudGFyZ2V0Ll9nZW9tZXRyeS5nZXRDZW50ZXIoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcnggPSBtYXAuY29tcHV0ZUxlbmd0aChjZW50ZXIsIG5ldyBtYXB0YWxrcy5Db29yZGluYXRlKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHg6IHRoaXMuc25hcFBvaW50LngsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB5OiBjZW50ZXIueVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHJ5ID0gbWFwLmNvbXB1dGVMZW5ndGgoY2VudGVyLCBuZXcgbWFwdGFsa3MuQ29vcmRpbmF0ZSh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB4OiBjZW50ZXIueCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHk6IHRoaXMuc25hcFBvaW50LnlcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBlLnRhcmdldC5fZ2VvbWV0cnkuc2V0V2lkdGgocnggKiAyKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZS50YXJnZXQuX2dlb21ldHJ5LnNldEhlaWdodChyeSAqIDIpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAobW9kZSA9PT0gJ3JlY3RhbmdsZScgfHwgbW9kZSA9PT0gJ2ZyZWVIYW5kUmVjdGFuZ2xlJykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBjb250YWluZXJQb2ludCA9IG1hcC5jb29yZFRvQ29udGFpbmVyUG9pbnQobmV3IG1hcHRhbGtzLkNvb3JkaW5hdGUoe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeDogdGhpcy5zbmFwUG9pbnQueCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHk6IHRoaXMuc25hcFBvaW50LnlcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBmaXJzdENsaWNrID0gbWFwLmNvb3JkVG9Db250YWluZXJQb2ludChlLnRhcmdldC5fZ2VvbWV0cnkuZ2V0Rmlyc3RDb29yZGluYXRlKCkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCByaW5nID0gW1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgW2ZpcnN0Q2xpY2sueCwgZmlyc3RDbGljay55XSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFtjb250YWluZXJQb2ludC54LCBmaXJzdENsaWNrLnldLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgW2NvbnRhaW5lclBvaW50LngsIGNvbnRhaW5lclBvaW50LnldLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgW2ZpcnN0Q2xpY2sueCwgY29udGFpbmVyUG9pbnQueV1cclxuICAgICAgICAgICAgICAgICAgICAgICAgXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZS50YXJnZXQuX2dlb21ldHJ5LnNldENvb3JkaW5hdGVzKHJpbmcubWFwKGMgPT4gbWFwLmNvbnRhaW5lclBvaW50VG9Db29yZChuZXcgbWFwdGFsa3MuUG9pbnQoYykpKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fcmVzZXRDb29yZGluYXRlcyhlLnRhcmdldC5fZ2VvbWV0cnksIHRoaXMuc25hcFBvaW50KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sIHRoaXMpO1xyXG4gICAgICAgICAgICBkcmF3VG9vbC5vbignZHJhd3ZlcnRleCcsIChlKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5zbmFwUG9pbnQpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9yZXNldENvb3JkaW5hdGVzKGUudGFyZ2V0Ll9nZW9tZXRyeSwgdGhpcy5zbmFwUG9pbnQpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3Jlc2V0Q2xpY2tQb2ludChlLnRhcmdldC5fY2xpY2tDb29yZHMsIHRoaXMuc25hcFBvaW50KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSwgdGhpcyk7XHJcbiAgICAgICAgICAgIGRyYXdUb29sLm9uKCdkcmF3ZW5kJywgKGUpID0+IHtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLnNuYXBQb2ludCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG1vZGUgPSBlLnRhcmdldC5nZXRNb2RlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbWFwID0gZS50YXJnZXQuZ2V0TWFwKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZ2VvbWV0cnkgPSBlLmdlb21ldHJ5O1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChtb2RlID09PSAnY2lyY2xlJyB8fCBtb2RlID09PSAnZnJlZUhhbmRDaXJjbGUnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHJhZGl1cyA9IG1hcC5jb21wdXRlTGVuZ3RoKGUudGFyZ2V0Ll9nZW9tZXRyeS5nZXRDZW50ZXIoKSwgdGhpcy5zbmFwUG9pbnQpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBnZW9tZXRyeS5zZXRSYWRpdXMocmFkaXVzKTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKG1vZGUgPT09ICdlbGxpcHNlJyB8fCBtb2RlID09PSAnZnJlZUhhbmRFbGxpcHNlJykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBjZW50ZXIgPSBnZW9tZXRyeS5nZXRDZW50ZXIoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcnggPSBtYXAuY29tcHV0ZUxlbmd0aChjZW50ZXIsIG5ldyBtYXB0YWxrcy5Db29yZGluYXRlKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHg6IHRoaXMuc25hcFBvaW50LngsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB5OiBjZW50ZXIueVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHJ5ID0gbWFwLmNvbXB1dGVMZW5ndGgoY2VudGVyLCBuZXcgbWFwdGFsa3MuQ29vcmRpbmF0ZSh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB4OiBjZW50ZXIueCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHk6IHRoaXMuc25hcFBvaW50LnlcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBnZW9tZXRyeS5zZXRXaWR0aChyeCAqIDIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBnZW9tZXRyeS5zZXRIZWlnaHQocnkgKiAyKTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKG1vZGUgPT09ICdyZWN0YW5nbGUnIHx8IG1vZGUgPT09ICdmcmVlSGFuZFJlY3RhbmdsZScpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgY29udGFpbmVyUG9pbnQgPSBtYXAuY29vcmRUb0NvbnRhaW5lclBvaW50KG5ldyBtYXB0YWxrcy5Db29yZGluYXRlKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHg6IHRoaXMuc25hcFBvaW50LngsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB5OiB0aGlzLnNuYXBQb2ludC55XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZmlyc3RDbGljayA9IG1hcC5jb29yZFRvQ29udGFpbmVyUG9pbnQoZ2VvbWV0cnkuZ2V0Rmlyc3RDb29yZGluYXRlKCkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCByaW5nID0gW1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgW2ZpcnN0Q2xpY2sueCwgZmlyc3RDbGljay55XSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFtjb250YWluZXJQb2ludC54LCBmaXJzdENsaWNrLnldLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgW2NvbnRhaW5lclBvaW50LngsIGNvbnRhaW5lclBvaW50LnldLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgW2ZpcnN0Q2xpY2sueCwgY29udGFpbmVyUG9pbnQueV1cclxuICAgICAgICAgICAgICAgICAgICAgICAgXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZ2VvbWV0cnkuc2V0Q29vcmRpbmF0ZXMocmluZy5tYXAoYyA9PiBtYXAuY29udGFpbmVyUG9pbnRUb0Nvb3JkKG5ldyBtYXB0YWxrcy5Qb2ludChjKSkpKTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9yZXNldENvb3JkaW5hdGVzKGdlb21ldHJ5LCB0aGlzLnNuYXBQb2ludCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LCB0aGlzKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgX3Jlc2V0Q29vcmRpbmF0ZXMoZ2VvbWV0cnksIHNuYXBQb2ludCkge1xyXG4gICAgICAgIGlmICghZ2VvbWV0cnkpIHJldHVybiBnZW9tZXRyeTtcclxuICAgICAgICBjb25zdCBjb29yZHMgPSBnZW9tZXRyeS5nZXRDb29yZGluYXRlcygpO1xyXG4gICAgICAgIGlmIChnZW9tZXRyeSBpbnN0YW5jZW9mIG1hcHRhbGtzLlBvbHlnb24pIHtcclxuICAgICAgICAgICAgaWYgKGdlb21ldHJ5IGluc3RhbmNlb2YgbWFwdGFsa3MuQ2lyY2xlKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZ2VvbWV0cnk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdmFyIGNvb3JkaW5hdGVzID0gY29vcmRzWzBdO1xyXG4gICAgICAgICAgICBpZiAoY29vcmRpbmF0ZXMgaW5zdGFuY2VvZiBBcnJheSAmJiBjb29yZGluYXRlcy5sZW5ndGggPiAyKSB7XHJcbiAgICAgICAgICAgICAgICBjb29yZGluYXRlc1tjb29yZGluYXRlcy5sZW5ndGggLSAyXS54ID0gc25hcFBvaW50Lng7XHJcbiAgICAgICAgICAgICAgICBjb29yZGluYXRlc1tjb29yZGluYXRlcy5sZW5ndGggLSAyXS55ID0gc25hcFBvaW50Lnk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9IGVsc2UgaWYgKGNvb3JkcyBpbnN0YW5jZW9mIEFycmF5KSB7XHJcbiAgICAgICAgICAgIGNvb3Jkc1tjb29yZHMubGVuZ3RoIC0gMV0ueCA9IHNuYXBQb2ludC54O1xyXG4gICAgICAgICAgICBjb29yZHNbY29vcmRzLmxlbmd0aCAtIDFdLnkgPSBzbmFwUG9pbnQueTtcclxuICAgICAgICB9IGVsc2UgaWYgKGNvb3JkcyBpbnN0YW5jZW9mIG1hcHRhbGtzLkNvb3JkaW5hdGUpIHtcclxuICAgICAgICAgICAgY29vcmRzLnggPSBzbmFwUG9pbnQueDtcclxuICAgICAgICAgICAgY29vcmRzLnkgPSBzbmFwUG9pbnQueTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZ2VvbWV0cnkuc2V0Q29vcmRpbmF0ZXMoY29vcmRzKTtcclxuICAgICAgICByZXR1cm4gZ2VvbWV0cnk7XHJcbiAgICB9XHJcblxyXG4gICAgX3Jlc2V0Q2xpY2tQb2ludChjbGlja0Nvb3Jkcywgc25hcFBvaW50KSB7XHJcbiAgICAgICAgaWYgKCFjbGlja0Nvb3JkcykgcmV0dXJuO1xyXG4gICAgICAgIGNvbnN0IG1hcCA9IHRoaXMuZ2V0TWFwKCk7XHJcbiAgICAgICAgY29uc3QgY2xpY2tQb2ludCA9IG1hcC5fcG9pbnRUb1ByaihtYXAuY29vcmRpbmF0ZVRvUG9pbnQoc25hcFBvaW50KSk7XHJcbiAgICAgICAgY2xpY2tDb29yZHNbY2xpY2tDb29yZHMubGVuZ3RoIC0gMV0ueCA9IGNsaWNrUG9pbnQueDtcclxuICAgICAgICBjbGlja0Nvb3Jkc1tjbGlja0Nvb3Jkcy5sZW5ndGggLSAxXS55ID0gY2xpY2tQb2ludC55O1xyXG4gICAgfVxyXG5cclxuICAgIF9hZGRHZW9tZXRyaWVzKGdlb21ldHJpZXMpIHtcclxuICAgICAgICBnZW9tZXRyaWVzID0gKGdlb21ldHJpZXMgaW5zdGFuY2VvZiBBcnJheSkgPyBnZW9tZXRyaWVzIDogW2dlb21ldHJpZXNdO1xyXG4gICAgICAgIGNvbnN0IGFkZEdlb21ldHJpZXMgPSB0aGlzLl9jb21wb3NpdEdlb21ldHJpZXMoZ2VvbWV0cmllcyk7XHJcbiAgICAgICAgdGhpcy5hbGxHZW9tZXRyaWVzID0gdGhpcy5hbGxHZW9tZXRyaWVzLmNvbmNhdChhZGRHZW9tZXRyaWVzKTtcclxuICAgIH1cclxuXHJcbiAgICBfY2xlYXJHZW9tZXRyaWVzKCkge1xyXG4gICAgICAgIHRoaXMuYWRkR2VvbWV0cmllcyA9IFtdO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQHBhcmFtIHtDb29yZGluYXRlfSBtb3VzZSdzIGNvb3JkaW5hdGUgb24gbWFwXHJcbiAgICAgKiBVc2luZyBhIHBvaW50IHRvIGluc3BlY3QgdGhlIHN1cnJvdW5kaW5nIGdlb21ldHJpZXNcclxuICAgICAqL1xyXG4gICAgX3ByZXBhcmVHZW9tZXRyaWVzKGNvb3JkaW5hdGUpIHtcclxuICAgICAgICBpZiAodGhpcy5hbGxHZW9tZXRyaWVzKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGFsbEdlb0luR2VvanNvbiA9IHRoaXMuYWxsR2VvbWV0cmllcztcclxuICAgICAgICAgICAgdGhpcy50cmVlLmNsZWFyKCk7XHJcbiAgICAgICAgICAgIHRoaXMudHJlZS5sb2FkKHtcclxuICAgICAgICAgICAgICAgICd0eXBlJzogJ0ZlYXR1cmVDb2xsZWN0aW9uJyxcclxuICAgICAgICAgICAgICAgICdmZWF0dXJlcyc6YWxsR2VvSW5HZW9qc29uXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB0aGlzLmluc3BlY3RFeHRlbnQgPSB0aGlzLl9jcmVhdGVJbnNwZWN0RXh0ZW50KGNvb3JkaW5hdGUpO1xyXG4gICAgICAgICAgICBjb25zdCBhdmFpbEdlb21ldHJpZXMgPSB0aGlzLnRyZWUuc2VhcmNoKHRoaXMuaW5zcGVjdEV4dGVudCk7XHJcbiAgICAgICAgICAgIHJldHVybiBhdmFpbEdlb21ldHJpZXM7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIF9jb21wb3NpdEdlb21ldHJpZXMoZ2VvbWV0cmllcykge1xyXG4gICAgICAgIGxldCBnZW9zID0gW107XHJcbiAgICAgICAgY29uc3QgbW9kZSA9IHRoaXMuZ2V0TW9kZSgpO1xyXG4gICAgICAgIGlmIChtb2RlID09PSAncG9pbnQnKSB7XHJcbiAgICAgICAgICAgIGdlb3MgPSB0aGlzLl9jb21wb3NpdFRvUG9pbnRzKGdlb21ldHJpZXMpO1xyXG4gICAgICAgIH0gZWxzZSBpZiAobW9kZSA9PT0gJ2xpbmUnKSB7XHJcbiAgICAgICAgICAgIGdlb3MgPSB0aGlzLl9jb21wb3NpdFRvTGluZXMoZ2VvbWV0cmllcyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBnZW9zO1xyXG4gICAgfVxyXG5cclxuICAgIF9jb21wb3NpdFRvUG9pbnRzKGdlb21ldHJpZXMpIHtcclxuICAgICAgICBsZXQgZ2VvcyA9IFtdO1xyXG4gICAgICAgIGdlb21ldHJpZXMuZm9yRWFjaChmdW5jdGlvbiAoZ2VvKSB7XHJcbiAgICAgICAgICAgIGdlb3MgPSBnZW9zLmNvbmNhdCh0aGlzLl9wYXJzZXJUb1BvaW50cyhnZW8pKTtcclxuICAgICAgICB9LmJpbmQodGhpcykpO1xyXG4gICAgICAgIHJldHVybiBnZW9zO1xyXG4gICAgfVxyXG5cclxuICAgIF9jcmVhdGVNYXJrZXJzKGNvb3Jkcykge1xyXG4gICAgICAgIGNvbnN0IG1hcmtlcnMgPSBbXTtcclxuICAgICAgICBjb29yZHMuZm9yRWFjaChmdW5jdGlvbiAoY29vcmQpIHtcclxuICAgICAgICAgICAgaWYgKGNvb3JkIGluc3RhbmNlb2YgQXJyYXkpIHtcclxuICAgICAgICAgICAgICAgIGNvb3JkLmZvckVhY2goZnVuY3Rpb24gKF9jb29yZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCBfZ2VvID0gbmV3IG1hcHRhbGtzLk1hcmtlcihfY29vcmQsIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge31cclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICBfZ2VvID0gX2dlby50b0dlb0pTT04oKTtcclxuICAgICAgICAgICAgICAgICAgICBtYXJrZXJzLnB1c2goX2dlbyk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGxldCBfZ2VvID0gbmV3IG1hcHRhbGtzLk1hcmtlcihjb29yZCwge1xyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6e31cclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgX2dlbyA9IF9nZW8udG9HZW9KU09OKCk7XHJcbiAgICAgICAgICAgICAgICBtYXJrZXJzLnB1c2goX2dlbyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgICByZXR1cm4gbWFya2VycztcclxuICAgIH1cclxuXHJcbiAgICBfcGFyc2VyVG9Qb2ludHMoZ2VvKSB7XHJcbiAgICAgICAgY29uc3QgdHlwZSA9IGdlby5nZXRUeXBlKCk7XHJcbiAgICAgICAgbGV0IGNvb3JkaW5hdGVzID0gbnVsbDtcclxuICAgICAgICBpZiAodHlwZSA9PT0gJ0NpcmNsZScgfHwgdHlwZSA9PT0gJ0VsbGlwc2UnKSB7XHJcbiAgICAgICAgICAgIGNvb3JkaW5hdGVzID0gZ2VvLmdldFNoZWxsKCk7XHJcbiAgICAgICAgfSBlbHNlXHJcbiAgICAgICAgICAgIGNvb3JkaW5hdGVzID0gZ2VvLmdldENvb3JkaW5hdGVzKCk7XHJcbiAgICAgICAgbGV0IGdlb3MgPSBbXTtcclxuICAgICAgICAvL3R3byBjYXNlcyxvbmUgaXMgc2luZ2xlIGdlb21ldHJ5LGFuZCBhbm90aGVyIGlzIG11bHRpIGdlb21ldHJpZXNcclxuICAgICAgICBpZiAoY29vcmRpbmF0ZXNbMF0gaW5zdGFuY2VvZiBBcnJheSkge1xyXG4gICAgICAgICAgICBjb29yZGluYXRlcy5mb3JFYWNoKGZ1bmN0aW9uIChjb29yZHMpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IF9tYXJrZXJzID0gdGhpcy5fY3JlYXRlTWFya2Vycyhjb29yZHMpO1xyXG4gICAgICAgICAgICAgICAgZ2VvcyA9IGdlb3MuY29uY2F0KF9tYXJrZXJzKTtcclxuICAgICAgICAgICAgfS5iaW5kKHRoaXMpKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBpZiAoIShjb29yZGluYXRlcyBpbnN0YW5jZW9mIEFycmF5KSkge1xyXG4gICAgICAgICAgICAgICAgY29vcmRpbmF0ZXMgPSBbY29vcmRpbmF0ZXNdO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNvbnN0IF9tYXJrZXJzID0gdGhpcy5fY3JlYXRlTWFya2Vycyhjb29yZGluYXRlcyk7XHJcbiAgICAgICAgICAgIGdlb3MgPSBnZW9zLmNvbmNhdChfbWFya2Vycyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBnZW9zO1xyXG4gICAgfVxyXG5cclxuICAgIF9jb21wb3NpdFRvTGluZXMoZ2VvbWV0cmllcykge1xyXG4gICAgICAgIGxldCBnZW9zID0gW107XHJcbiAgICAgICAgZ2VvbWV0cmllcy5mb3JFYWNoKGZ1bmN0aW9uIChnZW8pIHtcclxuICAgICAgICAgICAgc3dpdGNoIChnZW8uZ2V0VHlwZSgpKSB7XHJcbiAgICAgICAgICAgIGNhc2UgJ1BvaW50Jzoge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgX2dlbyA9IGdlby50b0dlb0pTT04oKTtcclxuICAgICAgICAgICAgICAgIF9nZW8ucHJvcGVydGllcyA9IHt9O1xyXG4gICAgICAgICAgICAgICAgZ2Vvcy5wdXNoKF9nZW8pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSAnTGluZVN0cmluZyc6XHJcbiAgICAgICAgICAgIGNhc2UgJ1BvbHlnb24nOlxyXG4gICAgICAgICAgICAgICAgZ2VvcyA9IGdlb3MuY29uY2F0KHRoaXMuX3BhcnNlckdlb21ldHJpZXMoZ2VvLCAxKSk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH0uYmluZCh0aGlzKSk7XHJcbiAgICAgICAgcmV0dXJuIGdlb3M7XHJcbiAgICB9XHJcblxyXG4gICAgX3BhcnNlckdlb21ldHJpZXMoZ2VvLCBfbGVuKSB7XHJcbiAgICAgICAgY29uc3QgY29vcmRpbmF0ZXMgPSBnZW8uZ2V0Q29vcmRpbmF0ZXMoKTtcclxuICAgICAgICBsZXQgZ2VvcyA9IFtdO1xyXG4gICAgICAgIC8vdHdvIGNhc2VzLG9uZSBpcyBzaW5nbGUgZ2VvbWV0cnksYW5kIGFub3RoZXIgaXMgbXVsdGkgZ2VvbWV0cmllc1xyXG4gICAgICAgIGlmIChjb29yZGluYXRlc1swXSBpbnN0YW5jZW9mIEFycmF5KSB7XHJcbiAgICAgICAgICAgIGNvb3JkaW5hdGVzLmZvckVhY2goZnVuY3Rpb24gKGNvb3Jkcykge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgX2xpbmVzID0gdGhpcy5fY3JlYXRlTGluZShjb29yZHMsIF9sZW4sIGdlbyk7XHJcbiAgICAgICAgICAgICAgICBnZW9zID0gZ2Vvcy5jb25jYXQoX2xpbmVzKTtcclxuICAgICAgICAgICAgfS5iaW5kKHRoaXMpKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBjb25zdCBfbGluZXMgPSB0aGlzLl9jcmVhdGVMaW5lKGNvb3JkaW5hdGVzLCBfbGVuLCBnZW8pO1xyXG4gICAgICAgICAgICBnZW9zID0gZ2Vvcy5jb25jYXQoX2xpbmVzKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGdlb3M7XHJcbiAgICB9XHJcblxyXG4gICAgX2NyZWF0ZUxpbmUoY29vcmRpbmF0ZXMsIF9sZW5ndGgsIGdlbykge1xyXG4gICAgICAgIGNvbnN0IGxpbmVzID0gW107XHJcbiAgICAgICAgY29uc3QgbGVuID0gY29vcmRpbmF0ZXMubGVuZ3RoIC0gX2xlbmd0aDtcclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbjsgaSsrKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGxpbmUgPSBuZXcgbWFwdGFsa3MuTGluZVN0cmluZyhbY29vcmRpbmF0ZXNbaV0sIGNvb3JkaW5hdGVzW2kgKyAxXV0sIHtcclxuICAgICAgICAgICAgICAgIHByb3BlcnRpZXMgOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgb2JqIDogZ2VvXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICBsaW5lcy5wdXNoKGxpbmUudG9HZW9KU09OKCkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gbGluZXM7XHJcbiAgICB9XHJcblxyXG4gICAgX2NyZWF0ZUluc3BlY3RFeHRlbnQoY29vcmRpbmF0ZSkge1xyXG4gICAgICAgIGNvbnN0IHRvbGVyYW5jZSA9ICghdGhpcy5vcHRpb25zWyd0b2xlcmFuY2UnXSkgPyAxMCA6IHRoaXMub3B0aW9uc1sndG9sZXJhbmNlJ107XHJcbiAgICAgICAgY29uc3QgbWFwID0gdGhpcy5nZXRNYXAoKTtcclxuICAgICAgICBjb25zdCB6b29tID0gbWFwLmdldFpvb20oKTtcclxuICAgICAgICBjb25zdCBzY3JlZW5Qb2ludCA9IG1hcC5jb29yZGluYXRlVG9Qb2ludChjb29yZGluYXRlLCB6b29tKTtcclxuICAgICAgICBjb25zdCBsZWZ0dG9wID0gbWFwLnBvaW50VG9Db29yZGluYXRlKG5ldyBtYXB0YWxrcy5Qb2ludChbc2NyZWVuUG9pbnQueCAtIHRvbGVyYW5jZSwgc2NyZWVuUG9pbnQueSAtIHRvbGVyYW5jZV0pLCB6b29tKTtcclxuICAgICAgICBjb25zdCByaWdodHRvcCA9IG1hcC5wb2ludFRvQ29vcmRpbmF0ZShuZXcgbWFwdGFsa3MuUG9pbnQoW3NjcmVlblBvaW50LnggKyB0b2xlcmFuY2UsIHNjcmVlblBvaW50LnkgLSB0b2xlcmFuY2VdKSwgem9vbSk7XHJcbiAgICAgICAgY29uc3QgbGVmdGJvdHRvbSA9IG1hcC5wb2ludFRvQ29vcmRpbmF0ZShuZXcgbWFwdGFsa3MuUG9pbnQoW3NjcmVlblBvaW50LnggLSB0b2xlcmFuY2UsIHNjcmVlblBvaW50LnkgKyB0b2xlcmFuY2VdKSwgem9vbSk7XHJcbiAgICAgICAgY29uc3QgcmlnaHRib3R0b20gPSBtYXAucG9pbnRUb0Nvb3JkaW5hdGUobmV3IG1hcHRhbGtzLlBvaW50KFtzY3JlZW5Qb2ludC54ICsgdG9sZXJhbmNlLCBzY3JlZW5Qb2ludC55ICsgdG9sZXJhbmNlXSksIHpvb20pO1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgICd0eXBlJzogJ0ZlYXR1cmUnLFxyXG4gICAgICAgICAgICAncHJvcGVydGllcyc6IHt9LFxyXG4gICAgICAgICAgICAnZ2VvbWV0cnknOiB7XHJcbiAgICAgICAgICAgICAgICAndHlwZSc6ICdQb2x5Z29uJyxcclxuICAgICAgICAgICAgICAgICdjb29yZGluYXRlcyc6IFtbW2xlZnR0b3AueCwgbGVmdHRvcC55XSwgW3JpZ2h0dG9wLngsIHJpZ2h0dG9wLnldLCBbcmlnaHRib3R0b20ueCwgcmlnaHRib3R0b20ueV0sIFtsZWZ0Ym90dG9tLngsIGxlZnRib3R0b20ueV1dXVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEBwYXJhbSB7TWFwfVxyXG4gICAgICogUmVnaXN0ZXIgbW91c2Vtb3ZlIGV2ZW50XHJcbiAgICAgKi9cclxuICAgIF9yZWdpc3RlckV2ZW50cyhtYXApIHtcclxuICAgICAgICB0aGlzLl9uZWVkRmluZEdlb21ldHJ5ID0gdHJ1ZTtcclxuICAgICAgICB0aGlzLl9tb3VzZW1vdmUgPSBmdW5jdGlvbiAoZSkge1xyXG4gICAgICAgICAgICB0aGlzLm1vdXNlUG9pbnQgPSBlLmNvb3JkaW5hdGU7XHJcbiAgICAgICAgICAgIGlmICghdGhpcy5fbWFya2VyKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9tYXJrZXIgPSBuZXcgbWFwdGFsa3MuTWFya2VyKGUuY29vcmRpbmF0ZSwge1xyXG4gICAgICAgICAgICAgICAgICAgICdzeW1ib2wnIDogdGhpcy5vcHRpb25zWydzeW1ib2wnXVxyXG4gICAgICAgICAgICAgICAgfSkuYWRkVG8odGhpcy5fbW91c2Vtb3ZlTGF5ZXIpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fbWFya2VyLnNldENvb3JkaW5hdGVzKGUuY29vcmRpbmF0ZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy9pbmRpY2F0ZSBmaW5kIGdlb21ldHJ5XHJcbiAgICAgICAgICAgIGlmICghdGhpcy5fbmVlZEZpbmRHZW9tZXRyeSkgcmV0dXJuO1xyXG4gICAgICAgICAgICBjb25zdCBhdmFpbEdlb21ldHJpZXMgPSB0aGlzLl9maW5kR2VvbWV0cnkoZS5jb29yZGluYXRlKTtcclxuICAgICAgICAgICAgaWYgKGF2YWlsR2VvbWV0cmllcy5mZWF0dXJlcy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNuYXBQb2ludCA9IHRoaXMuX2dldFNuYXBQb2ludChhdmFpbEdlb21ldHJpZXMpO1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuc25hcFBvaW50KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fbWFya2VyLnNldENvb3JkaW5hdGVzKFt0aGlzLnNuYXBQb2ludC54LCB0aGlzLnNuYXBQb2ludC55XSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNuYXBQb2ludCA9IG51bGw7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgICAgIHRoaXMuX21vdXNlZG93biA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgdGhpcy5fbmVlZEZpbmRHZW9tZXRyeSA9IGZhbHNlO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgdGhpcy5fbW91c2V1cCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgdGhpcy5fbmVlZEZpbmRHZW9tZXRyeSA9IHRydWU7XHJcbiAgICAgICAgfTtcclxuICAgICAgICBtYXAub24oJ21vdXNlbW92ZSB0b3VjaHN0YXJ0JywgdGhpcy5fbW91c2Vtb3ZlLCB0aGlzKTtcclxuICAgICAgICBtYXAub24oJ21vdXNlZG93bicsIHRoaXMuX21vdXNlZG93biwgdGhpcyk7XHJcbiAgICAgICAgbWFwLm9uKCdtb3VzZXVwJywgdGhpcy5fbW91c2V1cCwgdGhpcyk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBAcGFyYW0ge0FycmF5PGdlb21ldHJ5Pn0gYXZhaWxhYmxlIGdlb21ldHJpZXMgd2hpY2ggYXJlIHN1cnJvdW5kZWRcclxuICAgICAqIENhbGN1bGF0ZSB0aGUgZGlzdGFuY2UgZnJvbSBtb3VzZSBwb2ludCB0byBldmVyeSBnZW9tZXRyeVxyXG4gICAgICovXHJcbiAgICBfc2V0RGlzdGFuY2UoZ2Vvcykge1xyXG4gICAgICAgIGNvbnN0IGdlb09iamVjdHMgPSBbXTtcclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGdlb3MubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgY29uc3QgZ2VvID0gZ2Vvc1tpXTtcclxuICAgICAgICAgICAgaWYgKGdlby5nZW9tZXRyeS50eXBlID09PSAnTGluZVN0cmluZycpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGRpc3RhbmNlID0gdGhpcy5fZGlzdFRvUG9seWxpbmUodGhpcy5tb3VzZVBvaW50LCBnZW8pO1xyXG4gICAgICAgICAgICAgICAgLy9nZW8ucHJvcGVydGllcy5kaXN0YW5jZSA9IGRpc3RhbmNlO1xyXG4gICAgICAgICAgICAgICAgZ2VvT2JqZWN0cy5wdXNoKHtcclxuICAgICAgICAgICAgICAgICAgICBnZW9PYmplY3QgOiBnZW8sXHJcbiAgICAgICAgICAgICAgICAgICAgZGlzdGFuY2UgOiBkaXN0YW5jZVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZ2VvLmdlb21ldHJ5LnR5cGUgPT09ICdQb2ludCcpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGRpc3RhbmNlID0gdGhpcy5fZGlzdFRvUG9pbnQodGhpcy5tb3VzZVBvaW50LCBnZW8pO1xyXG4gICAgICAgICAgICAgICAgLy9Db21wb3NpdGUgYW4gb2JqZWN0IGluY2x1ZGluZyBnZW9tZXRyeSBhbmQgZGlzdGFuY2VcclxuICAgICAgICAgICAgICAgIGdlb09iamVjdHMucHVzaCh7XHJcbiAgICAgICAgICAgICAgICAgICAgZ2VvT2JqZWN0IDogZ2VvLFxyXG4gICAgICAgICAgICAgICAgICAgIGRpc3RhbmNlIDogZGlzdGFuY2VcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBnZW9PYmplY3RzO1xyXG4gICAgfVxyXG5cclxuICAgIF9maW5kTmVhcmVzdEdlb21ldHJpZXMoZ2Vvcykge1xyXG4gICAgICAgIGxldCBnZW9PYmplY3RzID0gdGhpcy5fc2V0RGlzdGFuY2UoZ2Vvcyk7XHJcbiAgICAgICAgZ2VvT2JqZWN0cyA9IGdlb09iamVjdHMuc29ydCh0aGlzLl9jb21wYXJlKGdlb09iamVjdHMsICdkaXN0YW5jZScpKTtcclxuICAgICAgICByZXR1cm4gZ2VvT2JqZWN0c1swXTtcclxuICAgIH1cclxuXHJcbiAgICBfZmluZEdlb21ldHJ5KGNvb3JkaW5hdGUpIHtcclxuICAgICAgICBjb25zdCBhdmFpbEdlaW1ldHJpZXMgPSB0aGlzLl9wcmVwYXJlR2VvbWV0cmllcyhjb29yZGluYXRlKTtcclxuICAgICAgICByZXR1cm4gYXZhaWxHZWltZXRyaWVzO1xyXG4gICAgfVxyXG5cclxuICAgIF9nZXRTbmFwUG9pbnQoYXZhaWxHZW9tZXRyaWVzKSB7XHJcbiAgICAgICAgY29uc3QgX25lYXJlc3RHZW9tZXRyeSA9IHRoaXMuX2ZpbmROZWFyZXN0R2VvbWV0cmllcyhhdmFpbEdlb21ldHJpZXMuZmVhdHVyZXMpO1xyXG4gICAgICAgIGxldCBzbmFwUG9pbnQgPSBudWxsO1xyXG4gICAgICAgIGlmICghdGhpcy5fdmFsaWREaXN0YW5jZShfbmVhcmVzdEdlb21ldHJ5LmRpc3RhbmNlKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy93aGVuIGl0J3MgcG9pbnQsIHJldHVybiBpdHNlbGZcclxuICAgICAgICBpZiAoX25lYXJlc3RHZW9tZXRyeS5nZW9PYmplY3QuZ2VvbWV0cnkudHlwZSA9PT0gJ1BvaW50Jykge1xyXG4gICAgICAgICAgICBzbmFwUG9pbnQgPSB7XHJcbiAgICAgICAgICAgICAgICB4IDogX25lYXJlc3RHZW9tZXRyeS5nZW9PYmplY3QuZ2VvbWV0cnkuY29vcmRpbmF0ZXNbMF0sXHJcbiAgICAgICAgICAgICAgICB5IDogX25lYXJlc3RHZW9tZXRyeS5nZW9PYmplY3QuZ2VvbWV0cnkuY29vcmRpbmF0ZXNbMV1cclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9IGVsc2UgaWYgKF9uZWFyZXN0R2VvbWV0cnkuZ2VvT2JqZWN0Lmdlb21ldHJ5LnR5cGUgPT09ICdMaW5lU3RyaW5nJykge1xyXG4gICAgICAgICAgICAvL3doZW4gaXQncyBsaW5lLHJldHVybiB0aGUgdmVydGljYWwgaW5zZWN0IHBvaW50XHJcbiAgICAgICAgICAgIGNvbnN0IG5lYXJlc3RMaW5lID0gdGhpcy5fc2V0RXF1YXRpb24oX25lYXJlc3RHZW9tZXRyeS5nZW9PYmplY3QpO1xyXG4gICAgICAgICAgICAvL3doZXRoZXIgayBleGlzdHNcclxuICAgICAgICAgICAgaWYgKG5lYXJlc3RMaW5lLkEgPT09IDApIHtcclxuICAgICAgICAgICAgICAgIHNuYXBQb2ludCA9IHtcclxuICAgICAgICAgICAgICAgICAgICB4OiB0aGlzLm1vdXNlUG9pbnQueCxcclxuICAgICAgICAgICAgICAgICAgICB5OiBfbmVhcmVzdEdlb21ldHJ5Lmdlb09iamVjdC5nZW9tZXRyeS5jb29yZGluYXRlc1swXVsxXVxyXG4gICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChuZWFyZXN0TGluZS5BID09PSBJbmZpbml0eSkge1xyXG4gICAgICAgICAgICAgICAgc25hcFBvaW50ID0ge1xyXG4gICAgICAgICAgICAgICAgICAgIHg6IF9uZWFyZXN0R2VvbWV0cnkuZ2VvT2JqZWN0Lmdlb21ldHJ5LmNvb3JkaW5hdGVzWzBdWzBdLFxyXG4gICAgICAgICAgICAgICAgICAgIHk6IHRoaXMubW91c2VQb2ludC55XHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgayA9IG5lYXJlc3RMaW5lLkIgLyBuZWFyZXN0TGluZS5BO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgdmVydGljYWxMaW5lID0gdGhpcy5fc2V0VmVydGlFcXVhdGlvbihrLCB0aGlzLm1vdXNlUG9pbnQpO1xyXG4gICAgICAgICAgICAgICAgc25hcFBvaW50ID0gdGhpcy5fc29sdmVFcXVhdGlvbihuZWFyZXN0TGluZSwgdmVydGljYWxMaW5lKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gc25hcFBvaW50O1xyXG4gICAgfVxyXG5cclxuICAgIC8vQ2FsY3VsYXRlIHRoZSBkaXN0YW5jZSBmcm9tIGEgcG9pbnQgdG8gYSBsaW5lXHJcbiAgICBfZGlzdFRvUG9seWxpbmUocG9pbnQsIGxpbmUpIHtcclxuICAgICAgICBjb25zdCBlcXVhdGlvbiA9IHRoaXMuX3NldEVxdWF0aW9uKGxpbmUpO1xyXG4gICAgICAgIGNvbnN0IEEgPSBlcXVhdGlvbi5BO1xyXG4gICAgICAgIGNvbnN0IEIgPSBlcXVhdGlvbi5CO1xyXG4gICAgICAgIGNvbnN0IEMgPSBlcXVhdGlvbi5DO1xyXG4gICAgICAgIGNvbnN0IGRpc3RhbmNlID0gTWF0aC5hYnMoKEEgKiBwb2ludC54ICsgQiAqIHBvaW50LnkgKyBDKSAvIE1hdGguc3FydChNYXRoLnBvdyhBLCAyKSArIE1hdGgucG93KEIsIDIpKSk7XHJcbiAgICAgICAgcmV0dXJuIGRpc3RhbmNlO1xyXG4gICAgfVxyXG5cclxuICAgIF92YWxpZERpc3RhbmNlKGRpc3RhbmNlKSB7XHJcbiAgICAgICAgY29uc3QgbWFwID0gdGhpcy5nZXRNYXAoKTtcclxuICAgICAgICBjb25zdCByZXNvbHV0aW9uID0gbWFwLmdldFJlc29sdXRpb24oKTtcclxuICAgICAgICBjb25zdCB0b2xlcmFuY2UgPSB0aGlzLm9wdGlvbnNbJ3RvbGVyYW5jZSddO1xyXG4gICAgICAgIGlmIChkaXN0YW5jZSAvIHJlc29sdXRpb24gPiB0b2xlcmFuY2UpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBfZGlzdFRvUG9pbnQobW91c2VQb2ludCwgdG9Qb2ludCkge1xyXG4gICAgICAgIGNvbnN0IGZyb20gPSBbbW91c2VQb2ludC54LCBtb3VzZVBvaW50LnldO1xyXG4gICAgICAgIGNvbnN0IHRvID0gdG9Qb2ludC5nZW9tZXRyeS5jb29yZGluYXRlcztcclxuICAgICAgICByZXR1cm4gTWF0aC5zcXJ0KE1hdGgucG93KGZyb21bMF0gLSB0b1swXSwgMikgKyBNYXRoLnBvdyhmcm9tWzFdIC0gdG9bMV0sIDIpKTtcclxuICAgIH1cclxuICAgIC8vY3JlYXRlIGEgbGluZSdzIGVxdWF0aW9uXHJcbiAgICBfc2V0RXF1YXRpb24obGluZSkge1xyXG4gICAgICAgIGNvbnN0IGNvb3JkcyA9IGxpbmUuZ2VvbWV0cnkuY29vcmRpbmF0ZXM7XHJcbiAgICAgICAgY29uc3QgZnJvbSA9IGNvb3Jkc1swXTtcclxuICAgICAgICBjb25zdCB0byA9IGNvb3Jkc1sxXTtcclxuICAgICAgICBjb25zdCBrID0gTnVtYmVyKChmcm9tWzFdIC0gdG9bMV0pIC8gKGZyb21bMF0gLSB0b1swXSkudG9TdHJpbmcoKSk7XHJcbiAgICAgICAgY29uc3QgQSA9IGs7XHJcbiAgICAgICAgY29uc3QgQiA9IC0xO1xyXG4gICAgICAgIGNvbnN0IEMgPSBmcm9tWzFdIC0gayAqIGZyb21bMF07XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgQSA6IEEsXHJcbiAgICAgICAgICAgIEIgOiBCLFxyXG4gICAgICAgICAgICBDIDogQ1xyXG4gICAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgX3NldFZlcnRpRXF1YXRpb24oaywgcG9pbnQpIHtcclxuICAgICAgICBjb25zdCBiID0gcG9pbnQueSAtIGsgKiBwb2ludC54O1xyXG4gICAgICAgIGNvbnN0IEEgPSBrO1xyXG4gICAgICAgIGNvbnN0IEIgPSAtMTtcclxuICAgICAgICBjb25zdCBDID0gYjtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICBBIDogQSxcclxuICAgICAgICAgICAgQiA6IEIsXHJcbiAgICAgICAgICAgIEMgOiBDXHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuXHJcbiAgICBfc29sdmVFcXVhdGlvbihlcXVhdGlvblcsIGVxdWF0aW9uVSkge1xyXG4gICAgICAgIGNvbnN0IEExID0gZXF1YXRpb25XLkEsIEIxID0gZXF1YXRpb25XLkIsIEMxID0gZXF1YXRpb25XLkM7XHJcbiAgICAgICAgY29uc3QgQTIgPSBlcXVhdGlvblUuQSwgQjIgPSBlcXVhdGlvblUuQiwgQzIgPSBlcXVhdGlvblUuQztcclxuICAgICAgICBjb25zdCB4ID0gKEIxICogQzIgLSBDMSAqIEIyKSAvIChBMSAqIEIyIC0gQTIgKiBCMSk7XHJcbiAgICAgICAgY29uc3QgeSA9IChBMSAqIEMyIC0gQTIgKiBDMSkgLyAoQjEgKiBBMiAtIEIyICogQTEpO1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIHg6eCxcclxuICAgICAgICAgICAgeTp5XHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuXHJcbiAgICBfY29tcGFyZShkYXRhLCBwcm9wZXJ0eU5hbWUpIHtcclxuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKG9iamVjdDEsIG9iamVjdDIpIHtcclxuICAgICAgICAgICAgY29uc3QgdmFsdWUxID0gb2JqZWN0MVtwcm9wZXJ0eU5hbWVdO1xyXG4gICAgICAgICAgICBjb25zdCB2YWx1ZTIgPSBvYmplY3QyW3Byb3BlcnR5TmFtZV07XHJcbiAgICAgICAgICAgIGlmICh2YWx1ZTIgPCB2YWx1ZTEpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiAxO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKHZhbHVlMiA+IHZhbHVlMSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIC0xO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIDA7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgfVxyXG59XHJcblxyXG5TbmFwVG9vbC5tZXJnZU9wdGlvbnMob3B0aW9ucyk7XHJcbiJdLCJuYW1lcyI6WyJnbG9iYWwiLCJmYWN0b3J5IiwibW9kdWxlIiwidGhpcyIsInF1aWNrc2VsZWN0IiwiYXJyIiwiayIsImxlZnQiLCJyaWdodCIsImNvbXBhcmUiLCJxdWlja3NlbGVjdFN0ZXAiLCJsZW5ndGgiLCJkZWZhdWx0Q29tcGFyZSIsIm4iLCJtIiwieiIsIk1hdGgiLCJsb2ciLCJzIiwiZXhwIiwic2QiLCJzcXJ0IiwibmV3TGVmdCIsIm1heCIsImZsb29yIiwibmV3UmlnaHQiLCJtaW4iLCJ0IiwiaSIsImoiLCJzd2FwIiwidG1wIiwiYSIsImIiLCJyYnVzaCIsIm1heEVudHJpZXMiLCJmb3JtYXQiLCJfbWF4RW50cmllcyIsIl9taW5FbnRyaWVzIiwiY2VpbCIsIl9pbml0Rm9ybWF0IiwiY2xlYXIiLCJwcm90b3R5cGUiLCJhbGwiLCJfYWxsIiwiZGF0YSIsInNlYXJjaCIsImJib3giLCJub2RlIiwicmVzdWx0IiwidG9CQm94IiwiaW50ZXJzZWN0cyIsIm5vZGVzVG9TZWFyY2giLCJsZW4iLCJjaGlsZCIsImNoaWxkQkJveCIsImNoaWxkcmVuIiwibGVhZiIsInB1c2giLCJjb250YWlucyIsInBvcCIsImNvbGxpZGVzIiwibG9hZCIsImluc2VydCIsIl9idWlsZCIsInNsaWNlIiwiaGVpZ2h0IiwiX3NwbGl0Um9vdCIsInRtcE5vZGUiLCJfaW5zZXJ0IiwiaXRlbSIsImNyZWF0ZU5vZGUiLCJyZW1vdmUiLCJlcXVhbHNGbiIsInBhdGgiLCJpbmRleGVzIiwicGFyZW50IiwiaW5kZXgiLCJnb2luZ1VwIiwiZmluZEl0ZW0iLCJzcGxpY2UiLCJfY29uZGVuc2UiLCJjb21wYXJlTWluWCIsImNvbXBhcmVOb2RlTWluWCIsImNvbXBhcmVNaW5ZIiwiY29tcGFyZU5vZGVNaW5ZIiwidG9KU09OIiwiZnJvbUpTT04iLCJhcHBseSIsIml0ZW1zIiwiTiIsIk0iLCJjYWxjQkJveCIsInBvdyIsIk4yIiwiTjEiLCJyaWdodDIiLCJyaWdodDMiLCJtdWx0aVNlbGVjdCIsIl9jaG9vc2VTdWJ0cmVlIiwibGV2ZWwiLCJ0YXJnZXROb2RlIiwiYXJlYSIsImVubGFyZ2VtZW50IiwibWluQXJlYSIsIm1pbkVubGFyZ2VtZW50IiwiSW5maW5pdHkiLCJiYm94QXJlYSIsImVubGFyZ2VkQXJlYSIsImlzTm9kZSIsImluc2VydFBhdGgiLCJleHRlbmQiLCJfc3BsaXQiLCJfYWRqdXN0UGFyZW50QkJveGVzIiwiX2Nob29zZVNwbGl0QXhpcyIsInNwbGl0SW5kZXgiLCJfY2hvb3NlU3BsaXRJbmRleCIsIm5ld05vZGUiLCJiYm94MSIsImJib3gyIiwib3ZlcmxhcCIsIm1pbk92ZXJsYXAiLCJkaXN0QkJveCIsImludGVyc2VjdGlvbkFyZWEiLCJ4TWFyZ2luIiwiX2FsbERpc3RNYXJnaW4iLCJ5TWFyZ2luIiwic29ydCIsImxlZnRCQm94IiwicmlnaHRCQm94IiwibWFyZ2luIiwiYmJveE1hcmdpbiIsInNpYmxpbmdzIiwiaW5kZXhPZiIsImNvbXBhcmVBcnIiLCJGdW5jdGlvbiIsImpvaW4iLCJwIiwiZGVzdE5vZGUiLCJtaW5YIiwibWluWSIsIm1heFgiLCJtYXhZIiwic3RhY2siLCJtaWQiLCJjb29yZEVhY2giLCJnZW9qc29uIiwiY2FsbGJhY2siLCJleGNsdWRlV3JhcENvb3JkIiwiZmVhdHVyZUluZGV4IiwiZ2VvbWV0cnlJbmRleCIsImwiLCJnZW9tZXRyeSIsInN0b3BHIiwiY29vcmRzIiwiZ2VvbWV0cnlNYXliZUNvbGxlY3Rpb24iLCJ3cmFwU2hyaW5rIiwiY29vcmRJbmRleCIsImlzR2VvbWV0cnlDb2xsZWN0aW9uIiwidHlwZSIsImlzRmVhdHVyZUNvbGxlY3Rpb24iLCJpc0ZlYXR1cmUiLCJzdG9wIiwiZmVhdHVyZXMiLCJnZW9tZXRyaWVzIiwiZmVhdHVyZVN1YkluZGV4IiwiY29vcmRpbmF0ZXMiLCJnZW9tVHlwZSIsIkVycm9yIiwiY29vcmRSZWR1Y2UiLCJpbml0aWFsVmFsdWUiLCJwcmV2aW91c1ZhbHVlIiwiY3VycmVudENvb3JkIiwidW5kZWZpbmVkIiwicHJvcEVhY2giLCJwcm9wZXJ0aWVzIiwicHJvcFJlZHVjZSIsImN1cnJlbnRQcm9wZXJ0aWVzIiwiZmVhdHVyZUVhY2giLCJmZWF0dXJlUmVkdWNlIiwiY3VycmVudEZlYXR1cmUiLCJjb29yZEFsbCIsImNvb3JkIiwiZ2VvbUVhY2giLCJnIiwiZ2VvbWV0cnlQcm9wZXJ0aWVzIiwiZ2VvbVJlZHVjZSIsImN1cnJlbnRHZW9tZXRyeSIsImN1cnJlbnRJbmRleCIsImZsYXR0ZW5FYWNoIiwiZmVhdHVyZSIsImZvckVhY2giLCJjb29yZGluYXRlIiwiZ2VvbSIsImZsYXR0ZW5SZWR1Y2UiLCJzZWdtZW50RWFjaCIsInNlZ21lbnRJbmRleCIsInByZXZpb3VzQ29vcmRzIiwiY3VycmVudFNlZ21lbnQiLCJsaW5lU3RyaW5nIiwic2VnbWVudFJlZHVjZSIsInN0YXJ0ZWQiLCJsaW5lRWFjaCIsInN1YkluZGV4IiwibGluZSIsIm11bHRpIiwicmluZyIsImxpbmVSZWR1Y2UiLCJjdXJyZW50TGluZSIsImxpbmVJbmRleCIsImxpbmVTdWJJbmRleCIsIm1ldGEiLCJ0cmVlIiwiQXJyYXkiLCJpc0FycmF5IiwiYmJveFBvbHlnb24iLCJ0dXJmQkJveCIsImNhbGwiLCJqc29uIiwibG93TGVmdCIsInRvcExlZnQiLCJ0b3BSaWdodCIsImxvd1JpZ2h0Iiwib3B0aW9ucyIsIlNuYXBUb29sIiwiZ2V0TW9kZSIsIl9tb2RlIiwiX2NoZWNrTW9kZSIsInNldE1vZGUiLCJtb2RlIiwic25hcGxheWVyIiwiYWxsTGF5ZXJzR2VvbWV0cmllcyIsInRlbXBMYXllciIsInRlbXBHZW9tZXRyaWVzIiwiZ2V0R2VvbWV0cmllcyIsIl9jb21wb3NpdEdlb21ldHJpZXMiLCJiaW5kIiwiYWxsR2VvbWV0cmllcyIsImNvbmNhdCIsImFkZFRvIiwibWFwIiwiaWQiLCJtYXB0YWxrcyIsIl9tb3VzZW1vdmVMYXllciIsIl9tYXAiLCJlbmFibGUiLCJkaXNhYmxlIiwiZ2V0TWFwIiwiX21vdXNlbW92ZSIsIl9yZWdpc3RlckV2ZW50cyIsInNob3ciLCJvZmYiLCJfbW91c2Vkb3duIiwiX21vdXNldXAiLCJoaWRlIiwic2V0R2VvbWV0cmllcyIsInNldExheWVyIiwibGF5ZXIiLCJvbiIsImJyaW5nVG9Gcm9udCIsIl9jbGVhckdlb21ldHJpZXMiLCJiaW5kRHJhd1Rvb2wiLCJkcmF3VG9vbCIsImUiLCJzbmFwUG9pbnQiLCJfcmVzZXRDb29yZGluYXRlcyIsInRhcmdldCIsIl9nZW9tZXRyeSIsIl9yZXNldENsaWNrUG9pbnQiLCJfY2xpY2tDb29yZHMiLCJyYWRpdXMiLCJjb21wdXRlTGVuZ3RoIiwiZ2V0Q2VudGVyIiwic2V0UmFkaXVzIiwiY2VudGVyIiwicngiLCJ4IiwieSIsInJ5Iiwic2V0V2lkdGgiLCJzZXRIZWlnaHQiLCJjb250YWluZXJQb2ludCIsImNvb3JkVG9Db250YWluZXJQb2ludCIsImZpcnN0Q2xpY2siLCJnZXRGaXJzdENvb3JkaW5hdGUiLCJzZXRDb29yZGluYXRlcyIsImMiLCJjb250YWluZXJQb2ludFRvQ29vcmQiLCJnZXRDb29yZGluYXRlcyIsImNsaWNrQ29vcmRzIiwiY2xpY2tQb2ludCIsIl9wb2ludFRvUHJqIiwiY29vcmRpbmF0ZVRvUG9pbnQiLCJfYWRkR2VvbWV0cmllcyIsImFkZEdlb21ldHJpZXMiLCJfcHJlcGFyZUdlb21ldHJpZXMiLCJhbGxHZW9Jbkdlb2pzb24iLCJpbnNwZWN0RXh0ZW50IiwiX2NyZWF0ZUluc3BlY3RFeHRlbnQiLCJhdmFpbEdlb21ldHJpZXMiLCJnZW9zIiwiX2NvbXBvc2l0VG9Qb2ludHMiLCJfY29tcG9zaXRUb0xpbmVzIiwiZ2VvIiwiX3BhcnNlclRvUG9pbnRzIiwiX2NyZWF0ZU1hcmtlcnMiLCJtYXJrZXJzIiwiX2Nvb3JkIiwiX2dlbyIsInRvR2VvSlNPTiIsImdldFR5cGUiLCJnZXRTaGVsbCIsIl9tYXJrZXJzIiwiX3BhcnNlckdlb21ldHJpZXMiLCJfbGVuIiwiX2xpbmVzIiwiX2NyZWF0ZUxpbmUiLCJfbGVuZ3RoIiwibGluZXMiLCJvYmoiLCJ0b2xlcmFuY2UiLCJ6b29tIiwiZ2V0Wm9vbSIsInNjcmVlblBvaW50IiwibGVmdHRvcCIsInBvaW50VG9Db29yZGluYXRlIiwicmlnaHR0b3AiLCJsZWZ0Ym90dG9tIiwicmlnaHRib3R0b20iLCJfbmVlZEZpbmRHZW9tZXRyeSIsIm1vdXNlUG9pbnQiLCJfbWFya2VyIiwiX2ZpbmRHZW9tZXRyeSIsIl9nZXRTbmFwUG9pbnQiLCJfc2V0RGlzdGFuY2UiLCJnZW9PYmplY3RzIiwiZGlzdGFuY2UiLCJfZGlzdFRvUG9seWxpbmUiLCJnZW9PYmplY3QiLCJfZGlzdFRvUG9pbnQiLCJfZmluZE5lYXJlc3RHZW9tZXRyaWVzIiwiX2NvbXBhcmUiLCJhdmFpbEdlaW1ldHJpZXMiLCJfbmVhcmVzdEdlb21ldHJ5IiwiX3ZhbGlkRGlzdGFuY2UiLCJuZWFyZXN0TGluZSIsIl9zZXRFcXVhdGlvbiIsIkEiLCJCIiwidmVydGljYWxMaW5lIiwiX3NldFZlcnRpRXF1YXRpb24iLCJfc29sdmVFcXVhdGlvbiIsInBvaW50IiwiZXF1YXRpb24iLCJDIiwiYWJzIiwicmVzb2x1dGlvbiIsImdldFJlc29sdXRpb24iLCJ0b1BvaW50IiwiZnJvbSIsInRvIiwiTnVtYmVyIiwidG9TdHJpbmciLCJlcXVhdGlvblciLCJlcXVhdGlvblUiLCJBMSIsIkIxIiwiQzEiLCJBMiIsIkIyIiwiQzIiLCJwcm9wZXJ0eU5hbWUiLCJvYmplY3QxIiwib2JqZWN0MiIsInZhbHVlMSIsInZhbHVlMiIsIm1lcmdlT3B0aW9ucyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztFQUFDLGFBQVVBLE1BQVYsRUFBa0JDLE9BQWxCLEVBQTJCO0VBQzNCLElBQStEQyxjQUFBLEdBQWlCRCxPQUFPLEVBQXZGLEFBQUE7RUFHQSxHQUpBLEVBSUNFLGNBSkQsRUFJUSxZQUFZO0FBQUU7RUFFdkIsYUFBU0MsV0FBVCxDQUFxQkMsR0FBckIsRUFBMEJDLENBQTFCLEVBQTZCQyxJQUE3QixFQUFtQ0MsS0FBbkMsRUFBMENDLE9BQTFDLEVBQW1EO0VBQy9DQyxNQUFBQSxlQUFlLENBQUNMLEdBQUQsRUFBTUMsQ0FBTixFQUFTQyxJQUFJLElBQUksQ0FBakIsRUFBb0JDLEtBQUssSUFBS0gsR0FBRyxDQUFDTSxNQUFKLEdBQWEsQ0FBM0MsRUFBK0NGLE9BQU8sSUFBSUcsY0FBMUQsQ0FBZjtFQUNIOztFQUVELGFBQVNGLGVBQVQsQ0FBeUJMLEdBQXpCLEVBQThCQyxDQUE5QixFQUFpQ0MsSUFBakMsRUFBdUNDLEtBQXZDLEVBQThDQyxPQUE5QyxFQUF1RDtFQUVuRCxhQUFPRCxLQUFLLEdBQUdELElBQWYsRUFBcUI7RUFDakIsWUFBSUMsS0FBSyxHQUFHRCxJQUFSLEdBQWUsR0FBbkIsRUFBd0I7RUFDcEIsY0FBSU0sQ0FBQyxHQUFHTCxLQUFLLEdBQUdE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
