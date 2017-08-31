# maptalks.snapto

[![CircleCI](https://circleci.com/gh/maptalks/maptalks.snapto.svg?style=shield)](https://circleci.com/gh/maptalks/maptalks.snapto)
[![NPM Version](https://img.shields.io/npm/v/maptalks.snapto.svg)](https://github.com/maptalks/maptalks.snapto)

A plugin used for mouse point to adsorb geometries, based on [snap interaction](http://openlayers.org/en/latest/examples/snap.html).

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
   var snap = new maptalks.SnapTool({
                tolerance: 20,
                mode : 'point'
            });
   snap.addTo(map);//when addto map, it will call enable method default.
   snap.setLayer(layer);
   //also you can use snap.setGeometries(geometries) to specify geometries which are snapped to.
   //snap.enable();
</script>
```
## Supported Browsers

IE 9-11, Chrome, Firefox, other modern and mobile browsers.

## Examples

* [See the demo](https://maptalks.github.io/maptalks.snapto/demo/index.html).

## API Reference

`setLayer(layer||maptalks.VectorLayer)` specify a layer which has geometries to snap to.

`setGeometries(geometries||Array<maptalks.Geometry>)` specify a geometry collection to snap to.

`enable()` start snap to.

`disable()` end snap to.

`setMode(mode||String)` set the snap strategy, when mode is 'point', it will snap to geometries's end points.When it set to 'line',it will snap a point which is mearest to mouse on a LineString.

### `...`
```

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
