// tests from 2d-polygon-self-intersections
// MIT License
// https://github.com/tmpvar/2d-polygon-self-intersections

describe('isects', function () {
    it('no intersections (square)', function () {

        var poly = new maptalks.Polygon([
            [0, 0],
            [10, 0],
            [10, 10],
            [0, 10],
            [0, 0]
        ]);

        var r = poly.isects();
        expect(r.length).to.be.eql(0);
    });

    it('interesections (hourglass)', function () {

        var poly = new maptalks.Polygon([
            [0, 0],
            [10, 0],
            [0, 10],
            [10, 10]
        ]);

        var r = poly.isects();

        expect(r.length).to.be.eql(1);
        expect(r[0][0]).to.be.eql(0);
        expect(r[0][1]).to.be.eql([[5, 5]]);
    });

    it('work with vec2', function () {

        var poly = new maptalks.Polygon([
            { x: 0,  y: 0 },
            { x: 10, y: 0 },
            { x: 0,  y: 10 },
            { x: 10, y: 10 }
        ]);

        var r = poly.isects();
        expect(r.length).to.be.eql(1);
        expect(r[0]).to.be.eql([0, [[5, 5]]]);
    });

    it('better deduping', function () {

        var poly = new maptalks.Polygon([
            [0, 0],
            [20, 0],
            [20, 5],
            [20, 10]
        ]);

        var r = poly.isects();
        expect(r.length).to.be.eql(0);
    });

    it('separated intersections', function () {

      /*
               o-----o
               |     |
        o------x-----x------o
        |      |     |      |
        |      |     |      |
        |      |     |      |
        o------o     o------o
      */

        var poly = new maptalks.Polygon([
            [-10, 0],
            [10, 0],
            [10, 10],
            [1, 10],
            [1, -1],
            [-1, -1],
            [-1, 10],
            [-10, 1]
        ]);

        var r = poly.isects();
        expect(r[0][1].length).to.be.eql(2);
    });

    it('MultiPolygon', function () {
        var multiPoly = new maptalks.MultiPolygon([
            [
                [0, 0],
                [10, 0],
                [10, 10],
                [0, 10],
                [0, 0]
            ],
            [
                [0, 0],
                [10, 0],
                [0, 10],
                [10, 10]
            ]
        ]);
        var r = multiPoly.isects();
        expect(r.length).to.be.eql(1);
        expect(r[0]).to.be.eql([1, [[0, [[5, 5]]]]]);
    });
});
