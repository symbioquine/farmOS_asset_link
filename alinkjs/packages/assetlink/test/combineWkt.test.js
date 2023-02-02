import combineWkt from "../src/combineWkt";

// Copied from https://github.com/benrei/wkt/blob/270c5cdc2b43cd247d0da7762e621380020f8d06/test.js#L3-L13
const exampleWktData = {};
exampleWktData.LineString = 'LINESTRING (30 10, 10 30, 40 40)';
exampleWktData.Polygon = 'POLYGON ((30 10, 40 40, 20 40, 10 20, 30 10))';
exampleWktData.Polygon2 = 'POLYGON ((35 10, 45 45, 15 40, 10 20, 35 10),(20 30, 35 35, 30 20, 20 30))';
exampleWktData.MultiPoint = 'MULTIPOINT ((10 40), (40 30), (20 20), (30 10))';
exampleWktData.MultiPoint2 = 'MULTIPOINT (10 40, 40 30, 20 20, 30 10)';
exampleWktData.MultiLineString = 'MULTILINESTRING ((10 10, 20 20, 10 40),(40 40, 30 30, 40 20, 30 10))';
exampleWktData.MultiPolygon = 'MULTIPOLYGON (((30 20, 45 40, 10 40, 30 20)),((15 5, 40 10, 10 20, 5 10, 15 5)))';
exampleWktData.MultiPolygon2 = 'MULTIPOLYGON (((40 40, 20 45, 45 30, 40 40)),((20 35, 10 30, 10 10, 30 5, 45 20, 20 35),(30 20, 20 15, 20 25, 30 20)))';
exampleWktData.GeometryCollection = 'GEOMETRYCOLLECTION (POINT (40 10),LINESTRING (10 10, 20 20, 10 40),POLYGON ((40 40, 20 45, 45 30, 40 40)))';

test('Empty List of Geometries', () => {
    const combinedWtk = combineWkt([]);

    expect(combinedWtk).toBe('');
});

test('Single Geometry in is Same Out', () => {
    const combinedWtk = combineWkt(['POLYGON((0 0,-10 0,-10 10,0 10,0 0))']);

    expect(combinedWtk).toBe('POLYGON ((0 0, -10 0, -10 10, 0 10, 0 0))');
});

test('Flattens Nested Geometry Collection', () => {
    const combinedWtk = combineWkt(['GEOMETRYCOLLECTION(POLYGON((0 0,-10 0,-10 10,0 10,0 0)), GEOMETRYCOLLECTION(POLYGON((0 0,10 0,10 10,0 10,0 0))))']);

    expect(combinedWtk).toBe('GEOMETRYCOLLECTION (POLYGON ((0 0, -10 0, -10 10, 0 10, 0 0)),POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0)))');
});

test('Flattens Complex multi Geometries', () => {
    const complexMultiGeometry = `GEOMETRYCOLLECTION(` +
                                        // https://github.com/mapbox/wellknown/issues/43
                                        // `${exampleWktData.MultiPoint},` +
                                        `${exampleWktData.MultiLineString},` +
                                        `${exampleWktData.MultiPolygon},` +
                                        `${exampleWktData.GeometryCollection}` +
                                `)`;

    const combinedWtk = combineWkt([complexMultiGeometry]);

    expect(combinedWtk).toBe('GEOMETRYCOLLECTION (' +
        // 'POINT(0 0,-10 0),POINT(10 40),POINT(40 30),POINT(20 20),POINT(30 10),' +
        'LINESTRING (10 10, 20 20, 10 40),LINESTRING (40 40, 30 30, 40 20, 30 10),' +
        'POLYGON ((30 20, 45 40, 10 40, 30 20)),POLYGON ((15 5, 40 10, 10 20, 5 10, 15 5)),' +
        'POINT (40 10),LINESTRING (10 10, 20 20, 10 40),POLYGON ((40 40, 20 45, 45 30, 40 40))' +
    ')');
});
