let solarInfoNode = document.querySelector('#solarData');
let daylightLayer = L.esri.basemapLayer('Imagery');


spacetime.extend(spacetimeGeo);

let terminator = L.terminator();
let nighttimeLayer = generateNighttimeLayer(terminator);

let map = L.map('map', {
    center: [27.5, 90.5],
    zoom: 2,
    minZoom: 1,
    maxZoom: 10,
    worldCopyJump: true,
    layers: [
        daylightLayer,
        nighttimeLayer
    ]
}).on('layeradd', updateSolarInfo).on('move', updateSolarInfo);




map.zoomControl.setPosition('bottomleft');

map.attributionControl.setPrefix(
    '<span class="author-credit"><a href="http://yettsyjknapp.com" target="_blank">@yettsyjk</a></span>| ' + map.attributionControl.options.prefix
);

map.createPane('labels');
map.getPane('labels').style.pointerEvents = 'none';
L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_only_labels/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/attribution">CARTO</a>',
    subdomains: ['a', 'b', 'c', 'd'],
    pane: 'labels'
}).addTo(map);

setInterval(function () {
    terminator = updateTerminator(terminator);
    nighttimeLayer = updateNighttimeLayer(terminator, nighttimeLayer);
}, 10000);

function updateTerminator(terminator) {
    let newTerminator = L.terminator();
    terminator.setLatLngs(newTerminator.getLatLngs());
    terminator.redraw();
    return terminator;
}


function updateNighttimeLayer(terminator, previousNighttimeLayer) {
    let nextNighttimeLayer = generateNighttimeLayer(terminator).addTo(map);
    setTimeout(function () {
        previousNighttimeLayer.remove();
    }, 5000);
    return nextNighttimeLayer;
}

function generateNighttimeLayer(terminator) {
    return L.TileLayer.boundaryCanvas('https://gibs-{s}.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_Black_Marble/default/2016-01-01/GoogleMapsCompatible_Level8/{z}/{y}/{x}.png', {
        attribution: 'Imagery provided by services from the Global Imagery Browse Services (GIBS), operated by the NASA/GSFC/Earth Science Data and Information System (<a href="https://earthdata.nasa.gov">ESDIS</a>) with funding provided by NASA/HQ.',
        boundary: terminator.toGeoJSON(),
        minNativeZoom: 1,
        maxNativeZoom: 8
    });
}

function updateSolarInfo() {
    let latLngCoordinates = map.getCenter().wrap();
    let date = Date.now();
    let sunTime = SunCalc.getTimes(date, latLngCoordinates.lat, latLngCoordinates.lng);

    let dateSpace = spacetime(date).in({
        lat: latLngCoordinates.lat,
        lng: latLngCoordinates.lng
    });

    let currentLocalTime = [
        dateSpace.time(),
        'in',
        dateSpace.timezone().name,
    ].join(' ');

    let isNight = turf.booleanContains(
        L.terminator().toGeoJSON(),
        turf.point([latLngCoordinates.lng, latLngCoordinates.lat])
    );

    if (isNight) {
        solarInfoNode.innerHTML = [
            '<h1>Night and Day</h1><div>', currentLocalTime, '</div><div>Night is darkest at ', 
            spacetime(sunTime.nadir).goto(dateSpace.timezone().name).time(), '</div>'].join(' ');
    } else {
        solarInfoNode.innerHTML = [
            '<h1>Day and Night</h1><div>', currentLocalTime, '</div><div>Sun is highest at ', 
            spacetime(sunTime.solarNoon).goto(dateSpace.timezone().name).time(), '</div>'].join(' ');

    }


}
