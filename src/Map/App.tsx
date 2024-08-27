import 'semantic-ui-css/semantic.min.css';
import 'ol/ol.css';
import './App.css';
import { Component, CSSProperties } from 'react';
import Map from 'ol/Map';
import OSM from 'ol/source/OSM';
import TileLayer from 'ol/layer/Tile';
import View from 'ol/View';
import Feature from 'ol/Feature';
import GeoJSON from "ol/format/GeoJSON";
import { Vector as VectorSource } from "ol/source";
import { Vector as VectorLayer } from 'ol/layer';
//import { bbox } from "ol/loadingstrategy";
import {
    LineString,
    Point,
} from 'ol/geom';
import {
    Zoom,
    ScaleLine,
    FullScreen,
    Rotate,
    Attribution
} from 'ol/control';

import {
    //transform,
    fromLonLat,
    transformExtent
} from 'ol/proj';
import {
    Circle as CircleStyle,
    Fill,
    //Icon,
    Stroke,
    Style,
    //Text
} from 'ol/style';
//import Feature from 'ol/Feature';
import { getVectorContext } from 'ol/render';
//import osmtogeojson from 'osmtogeojson';
//import { textHeights } from 'ol/render/canvas';
import {
    //Segment,
    //Grid,
} from 'semantic-ui-react'
//import osmtogeojson from 'osmtogeojson';
//var PathFinder = require('../geojson-path-finder');
//@@ import PathFinder from 'geojson-path-finder';

export default class App extends Component {
    props: any;
    state: any;
    map: any;
    constructor(props: any) {
        super(props);
        this.props = props;
        this.state = {};
        let tile: any = new TileLayer(
            {
                source: new OSM(),
                opacity: 0.5
            }
        );
        tile.set('name', 'OSM');
        this.map = new Map(
            {
                target: null as any,
                layers: [
                    tile
                ],
                view: new View(
                    {
                        center: fromLonLat([132.4516, 34.3939]),
                        zoom: 16,
                        maxZoom: 20,
                        minZoom: 10,
                        extent: transformExtent([110, 10, 160, 60], 'EPSG:4326', 'EPSG:3857')
                    }
                ),
                controls: []
            },
        );
    }
    componentDidMount() {
        this.map.setTarget('map');
        this.map.addControl(new Zoom({}));
        this.map.addControl(new ScaleLine({}));
        this.map.addControl(new FullScreen({ source: 'fullscreen' }));
        this.map.addControl(new Rotate({ autoHide: false }));
        this.map.addControl(new Attribution({ collapsible: true }));
        this.px();
    }
    px() {
        const colors: any = {
            'Clement Latour': 'rgba(0, 0, 255, 0.7)',
        };
        const styleCache: any = {};
        const styleFunction: any = (feature: any) => {
            const color: any = colors[feature.get('PLT')];
            let style: any = styleCache[color];
            if (!style) {
                style = new Style({
                    stroke: new Stroke({
                        color: color,
                        width: 3,
                    }),
                });
                styleCache[color] = style;
            }
            return style;
        };
        const vectorSource: any = new VectorSource();
        const geojsonUrls: any = [
            'e.json'
        ];
        function get(url: any, callback: any) {
            const client: any = new XMLHttpRequest();
            client.open('GET', url);
            client.onload = function () {
                callback(client.responseText);
            };
            client.send();
        }
        const geojsonFormat: any = new GeoJSON();
        geojsonUrls.forEach(
            (element: any) => {
                get(
                    element,
                    function (data: any) {
                        const features = geojsonFormat.readFeatures(
                            data,
                        );
                        console.log(features[0].values_.geometry.flatCoordinates);
                        let writer: any = new GeoJSON();
                        let geojsonStr: any = writer.writeFeatures(features);
                        console.log(geojsonStr);
                        vectorSource.addFeatures(features);
                        vectorSource.forEachFeature(
                            function (_feature: any) {
                                console.log("-------------------------------------------------------");
                            }
                        );
                    }
                );
            }
        );
        const time = {
            start: Infinity,
            stop: -Infinity,
            duration: 0,
        };
        vectorSource.on('addfeature', (event: any) => {
            if (event.feature.geometry.type !== "LineString") return;
            const geometry: any = event.feature.getGeometry();
            time.start = Math.min(time.start, geometry.getFirstCoordinate()[2]);
            time.stop = Math.max(time.stop, geometry.getLastCoordinate()[2]);
            time.duration = time.stop - time.start;
        });
        const vectorLayer: any = new VectorLayer(
            {
                source: vectorSource,
                style: styleFunction,
                //title: 'test' as any
            }
        );
        vectorLayer.set({ title: 'test' });
        this.map.addLayer(vectorLayer);

        let point: any = null;
        let line: any = null;
        const displaySnap = (coordinate: any) => {
            const closestFeature: any = vectorSource.getClosestFeatureToCoordinate(coordinate);
            const info: any = document.getElementById('info');
            if (closestFeature === null) {
                point = null;
                line = null;
                info.innerHTML = '&nbsp;';
            } else {
                const geometry: any = closestFeature.getGeometry();
                const closestPoint: any = geometry.getClosestPoint(coordinate);
                if (point === null) {
                    point = new Point(closestPoint);
                } else {
                    point.setCoordinates(closestPoint);
                }
                const date: any = new Date(closestPoint[2] * 1000);
                info.innerHTML =
                    closestFeature.get('name') + ' (' + date.toUTCString() + ')';
                const coordinates: any = [coordinate, [closestPoint[0], closestPoint[1]]];
                if (line === null) {
                    line = new LineString(coordinates);
                } else {
                    line.setCoordinates(coordinates);
                }
            }
            this.map.render();
        };

        this.map.on('pointermove', (evt: any) => {
            if (evt.dragging) {
                return;
            }
            const coordinate: any = this.map.getEventCoordinate(evt.originalEvent);
            displaySnap(coordinate);
        });

        this.map.on('click', (evt: any) => {
            displaySnap(evt.coordinate);
        });

        const stroke: any = new Stroke({
            color: 'rgba(255,0,0,0.9)',
            width: 1,
        });
        const style: any = new Style({
            stroke: stroke,
            image: new CircleStyle({
                radius: 5,
                fill: null as any,
                stroke: stroke,
            }),
        });
        vectorLayer.on('postrender', (evt: any) => {
            const vectorContext: any = getVectorContext(evt);
            vectorContext.setStyle(style);
            if (point !== null) {
                vectorContext.drawGeometry(point);
            }
            if (line !== null) {
                vectorContext.drawGeometry(line);
            }
        });

        const featureOverlay: any = new VectorLayer({
            source: new VectorSource(),
            map: this.map,
            style: new Style({
                image: new CircleStyle({
                    radius: 5,
                    fill: new Fill({
                        color: 'rgba(255,0,0,0.9)',
                    }),
                }),
            }),
        });

        const tm: any = document.getElementById('time');
        tm.addEventListener('input', (_evt: any) => {
            const value = parseInt(tm.value, 10) / 100;
            const m = time.start + time.duration * value;
            vectorSource.forEachFeature(function (feature: any) {
                const geometry = (feature.getGeometry());
                const coordinate = geometry.getCoordinateAtM(m, true);
                let highlight = feature.get('highlight');
                if (highlight === undefined) {
                    //console.log("------------------", m, coordinate);//, geometry.flatCoordinates);
                    highlight = new Feature(new Point(coordinate));
                    feature.set('highlight', highlight);
                    featureOverlay.getSource().addFeature(highlight);
                } else {
                    //console.log(":::::::::::::::::", m, coordinate);//, geometry.flatCoordinates);
                    highlight.getGeometry().setCoordinates(coordinate);
                }
            });
            this.map.render();
        });
    }
    componentWillUnmount() { }
    render() {
        return (
            <div id='fullscreen' className='fullscreen' >
                <div className='map' id='map' style={styles.map} tabIndex={0} />
                <div className='ol-if ol-unselectable ol-control' id='pss' >
                    <input id="time" type="range" step="1" />
                    <div id="info">&nbsp;</div>
                </div>
            </div>
        )
    }
}
const styles: { [key: string]: CSSProperties } = {
    map: {
        width: '100vw',
        height: '100vh',
    },
    list: {
        overflow: 'auto',
        maxHeight: '20em'
    }
};