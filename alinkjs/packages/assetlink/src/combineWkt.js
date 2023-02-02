import wkt from 'wellknown';

// Roughly based on https://github.com/farmOS/farmOS/blob/637843aabf86a4ccfe108d31a8435f80dd64fcf3/modules/core/geo/src/Traits/WktTrait.php#L37
export default function combineWkt(geoms) {
    // If no geometries were found, return an empty string.
    if (!geoms.length) {
        return '';
    }

    // Build an array of WKT strings.
    const wktStrings = [];

    const appendWktStrings = (geometry) => {
        if (!geometry || !geometry.type) {
            return;
        }

        if (geometry.type === 'GeometryCollection') {
            geometry.geometries.forEach(appendWktStrings);
        }
        else if (geometry.type === 'MultiPoint') {
            geometry.coordinates.forEach(coords => {
                wktStrings.push(wkt.stringify({
                    type: 'Point',
                    coordinates: coords,
                }));
            });
        }
        else if (geometry.type === 'MultiLineString') {
            geometry.coordinates.forEach(coords => {
                wktStrings.push(wkt.stringify({
                    type: 'LineString',
                    coordinates: coords,
                }));
            });
        }
        else if (geometry.type === 'MultiPolygon') {
            geometry.coordinates.forEach(coords => {
                wktStrings.push(wkt.stringify({
                    type: 'Polygon',
                    coordinates: coords,
                }));
            });
        } else {
            wktStrings.push(wkt.stringify(geometry));
        }
    };

    geoms.forEach(g => appendWktStrings(wkt.parse(g)));

    // Combine all the WKT strings together into one.
    let wktResult = wktStrings.join(',')

    // If the WKT is empty, return it.
    if (!wktResult) {
        return '';
    }

    // If there is more than one geometry, we will wrap it all in a
    // GEOMETRYCOLLECTION() at the end.
    const isGeometryCollection = wktStrings.length > 1;

    // If there is more than one geometry, wrap them all in a geometry
    // collection.
    if (isGeometryCollection) {
        wktResult = 'GEOMETRYCOLLECTION (' + wktResult + ')';
    }

    // Return the combined WKT.
    return wktResult;
}
