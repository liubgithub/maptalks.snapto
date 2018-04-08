# maptalks.snapto

[![CircleCI](https://circleci.com/gh/liubgithub/maptalks.snapto.svg?style=svg)](https://circleci.com/gh/liubgithub/maptalks.snapto)
[![NPM Version](https://img.shields.io/npm/v/maptalks.snapto.svg)](https://github.com/maptalks/maptalks.snapto)

A plugin used for mouse point to adsorb geometries, inspired by [snap interaction](http://openlayers.org/en/latest/examples/snap.html).

## Examples
* [See the demo](https://liubgithub.github.io/archives/demo/).

## Install
  
* Install with npm: ```npm install maptalks.snapto```. 
* Download from [dist directory](https://github.com/liubgithub/maptalks.snapto/tree/master/dist).
* Use unpkg CDN: ```https://unpkg.com/maptalks.snapto/dist/maptalks.snapto.min.js```

## Usage

As a plugin, ```maptalks.snapto``` must be loaded after ```maptalks.js``` in browsers. You can also use ```'import { SnapTool } from "maptalks.snapto"``` when develope with webpack.
```html
<script type="text/javascript" src="https://unpkg.com/maptalks/dist/maptalks.min.js"></script>
<script type="text/javascript" src="https://unpkg.com/maptalks.snapto/dist/maptalks.snapto.min.js"></script>
<script>
   const snap = new maptalks.SnapTool({
                tolerance: 20,
                mode : 'point'
            });
   snap.addTo(map);//when addto map, it will call enable method default.
   //recommend set options 'geometryEvents' to false if vectorlayer contains a large amount of geometries
   const layer = new maptalks.VectorLayer('vectorlayer',geometries,{ geometryEvents:false });
   snap.setLayer(layer);
   //If you draw geometries on map with a drawing tool, you should bind the maptalks.DrawTool object to the snapto tool.
   const drawtool = new maptalks.DrawTool();
   snap.bindDrawTool(drawtool);
</script>
```
## Supported Browsers

IE 9-11, Chrome, Firefox, other modern and mobile browsers.

## API Reference

### `Constructor`

```javascript
new maptalks.SnapTool(options)
```
* options **Object** options
    * mode **String**   there are two modes, line and point, line by default. 
    * tolerance **Number**    the distance in pixel from mouse to the snap point, 10 by default.
    * symbol **Object**    symbol of the mouse point.

`setLayer(layer||maptalks.VectorLayer)` specify a vectorlayer which has geometries to snap to.

`setGeometries(geometries||Array<maptalks.Geometry>)` specify a geometry collection to snap to.

`bindDrawTool(drawtool||maptalks.DrawTool)` When interacting with a drawtool, you should bind the drawtool object to this snapto tool

`enable()` start snap to.

`disable()` end snap to.

`setMode(mode||String)` set the snapping strategy, when mode is 'point', it will snap to geometries's end points. When it set to 'line',it will snap a point which is nearest to mouse on a LineString or Polygon.


## Contributing

We welcome any kind of contributions including issue reportings, pull requests, documentation corrections, feature requests and any other helps.

## Develop

The only source file is ```index.js```.

It is written in ES6, transpiled by [babel](https://babeljs.io/) and tested with [mocha](https://mochajs.org) and [expect.js](https://github.com/Automattic/expect.js).

### Scripts

* Install dependencies
```shell
$ npm install
```

* Watch source changes and generate runnable bundle repeatedly
```shell
$ gulp watch
```

* Tests
```shell
$ npm test
```

* Watch source changes and run tests repeatedly
```shell
$ gulp tdd
```

* Package and generate minified bundles to dist directory
```shell
$ gulp minify
```

* Lint
```shell
$ npm run lint
```
