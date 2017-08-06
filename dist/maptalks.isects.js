/*!
 * maptalks.isects v0.2.0
 * LICENSE : MIT
 * (c) 2016-2017 maptalks.org
 */
/*!
 * requires maptalks@^0.16.0 
 */
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(require('maptalks')) :
	typeof define === 'function' && define.amd ? define(['maptalks'], factory) :
	(factory(global.maptalks));
}(this, (function (maptalks) { 'use strict';

maptalks.Map.include({
    startSnapTo: function startSnapTo() {},
    endSnapTo: function endSnapTo() {}
});

typeof console !== 'undefined' && console.log('maptalks.isects v0.2.0, requires maptalks@^0.16.0.');

})));
