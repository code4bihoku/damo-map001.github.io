import 'semantic-ui-css/semantic.min.css';
import 'ol/ol.css';
import './App.css';
import { Component, CSSProperties } from 'react';
import Map from 'ol/Map';
//import OSM from 'ol/source/OSM';
//import TileLayer from 'ol/layer/Tile';
import View from 'ol/View';
import Feature from 'ol/Feature';
import GeoJSON from "ol/format/GeoJSON";
import { Vector as VectorSource } from "ol/source";
import { Vector as VectorLayer } from 'ol/layer';
import { bbox } from "ol/loadingstrategy";
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
    Icon,
    Stroke,
    Style,
    Text
} from 'ol/style';
import { getVectorContext } from 'ol/render';
//import { getVectorContext } from 'ol/render';
//import { textHeights } from 'ol/render/canvas';
import {
    Segment,
    Popup,
    //Button,
    Table,
    //Grid,
} from 'semantic-ui-react'
import {
    DragAndDrop,
} from 'ol/interaction';
import {
    GPX,
    //GeoJson,
    IGC,
    KML,
    TopoJSON,
    Polyline
} from 'ol/format';
import osmtogeojson from 'osmtogeojson';
import olms from 'ol-mapbox-style';

//const PathFinder = require('../geojson-path-finder');
import PathFinder from 'geojson-path-finder';

// eslint-disable-next-line
//@@function degrees_to_radians(degrees: any) {
//@@    return degrees * (Math.PI / 180);
//@@}
// eslint-disable-next-line
//@@function radians_to_degrees(radians: any) {
//@@    return radians * (180 / Math.PI);
//@@}
function getAzimuth(points1: any, points2: any) {
    let y1: any = points2[0];
    let x1: any = points2[1];
    let y2: any = points1[0];
    let x2: any = points1[1];
    let radians = getAtan2((y1 - y2), (x1 - x2));
    function getAtan2(y: any, x: any) {
        return Math.atan2(y, x);
    };
    let compassReading: any = radians * (180 / Math.PI);
    return compassReading;
};
// eslint-disable-next-line
function getDirection(compassReading: any) {
    let coordNames = ["北", "北東", "東", "南東", "南", "南西", "西", "北西", "北"];
    //let coordNames = ["↑", "↗", "→", "↘", "↓", "↙", "←", "↖", "↑"];
    let coordIndex = Math.round(compassReading / 45);
    if (coordIndex < 0) {
        coordIndex = coordIndex + 8;
    };
    return coordNames[coordIndex]; //
}
export default class App extends Component {
    props: any;
    state: any;
    map: any;
    route: any = undefined;
    _result: any = undefined;
    result: any = undefined;
    _result_r: any = undefined;
    result_r: any = undefined;
    path: any = undefined;
    InfoLabel: any;
    RoutList: any;
    styleJson:any = "https://tile2.openstreetmap.jp/styles/osm-bright/style.json"
    constructor(props: any) {
        super(props);
        this.props = props;
        this.state = {};
        /*
        let tile: any = new TileLayer(
            {
                source: new OSM(),
                opacity: 0.5
            }
        );
        tile.set('name', 'OSM');
        */
        this.map = new Map(
            {
                target: null as any,
                //layers: [
                //    tile
                //],
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
        window.addEventListener('touchmove', function (event) {
            event.preventDefault();
        });
        this.map.setTarget('map');
        olms(this.map, this.styleJson);
        this.map.addControl(new Zoom({}));
        this.map.addControl(new ScaleLine({}));
        this.map.addControl(new FullScreen({ source: 'fullscreen' }));
        this.map.addControl(new Rotate({ autoHide: false }));
        this.map.addControl(new Attribution({ collapsible: true }));
        this.InfoLabel = document.getElementById('info');
        this.RoutList = document.getElementById('list');
        let idx: any = {
            Zoom: 5,
            FullScreen: 6,
            Rotate: 7,
            ScaleLine: 8,
            Attribution: 9
        }
        //let id:any =this.map.controls.array_.length;
        this.map.controls.array_.forEach(
            (e: any) => {
                //e.element.tabIndex = id--;
                if (idx[e.__proto__.constructor.name]) {
                    e.element.tabIndex = idx[
                        e.__proto__.constructor.name
                    ];
                }
                console.log(e.__proto__.constructor.name, e.element.tabIndex);
            }
        )
        //const Start: any = document.getElementById('start-animation');
        //Start.addEventListener(
        //    'click',
        //    (e: any) => {
        //        //console.log(e, Start, this.map);
        //    }
        //);
        document.getElementById('top')!.focus();
        this.DragDrop();
    }
    load() {
        //let geojsonUrls: any = ['e.json'];
        let geojsonUrls: any = ['map.json'];
        let _route: any = [];
        let _result: any = [];
        geojsonUrls.forEach(
            (element: any) => {
                let geojsonFormat: any = new GeoJSON();
                this.get(
                    element,
                    (data: any) => {
                        let features: any = geojsonFormat.readFeatures(data);
                        //console.log(data);
                        features.forEach(
                            (feature: any) => {
                                let typ: any = feature.getGeometry().getType();
                                console.log(typ);
                                if (typ === 'LineString') {
                                    let _l: any = 0;
                                    let _p: any = 1;
                                    let _n: any = feature.values_.geometry.getCoordinates().length;
                                    //console.log("*", _n);
                                    feature.values_.geometry.forEachSegment(
                                        (_o: any, _e: any) => {
                                            //let _o:any = fromLonLat([o[0],o[1]]);
                                            //let _e:any = fromLonLat([e[0],e[1]]);
                                            if (_route.length === 0) {
                                                _route.push([_o[0], _o[1], null, 0]);
                                                //console.log([_o[0], _o[1], null, 0]);
                                            }
                                            _l += new LineString([[_o[0], _o[1]], [_e[0], _e[1]]]).getLength();
                                            _route.push([_e[0], _e[1], null, _l]);
                                            //console.log([_e[0], _e[1], null, _l]);
                                            if ((_n - 1) > _p) {
                                                let _t1: any = feature.values_.geometry.getCoordinates()[_p].slice(0, 2);
                                                let _t2: any = feature.values_.geometry.getCoordinates()[++_p].slice(0, 2);
                                                _result.push([[_o[0], _o[1]], [_t1[0], _t1[1]], [_t2[0], _t2[1]]]);
                                                //console.log([[_o[0], _o[1]], [_t1[0], _t1[1]], [_t2[0], _t2[1]]]);
                                            } else if ((_n - 1) === _p) {
                                                let _t2: any = feature.values_.geometry.getCoordinates()[_n - 1].slice(0, 2);
                                                _result.push([[_o[0], _o[1]], [_t2[0], _t2[1]], [null, null]]);
                                                _result.push([[_t2[0], _t2[1]], [null, null], [null, null]]);
                                                //console.log([[_o[0], _o[1]], [_t2[0], _t2[1]], [null, null]]);
                                                //console.log([[_t2[0], _t2[1]], [null, null], [null, null]]);
                                                _p++;
                                            };
                                        }
                                    );
                                } else if (typ === 'MultiLineString') {
                                    let _l: any = 0;
                                    let _p: any = 1;
                                    let _n: any = feature.values_.geometry.getLineStrings().length;
                                    //console.log("*", _n);
                                    feature.values_.geometry.getLineStrings().forEach(
                                        (geom: any) => {
                                            geom.forEachSegment(
                                                (o: any, e: any) => {
                                                    let _o: any = fromLonLat([o[0], o[1]]);
                                                    let _e: any = fromLonLat([e[0], e[1]]);
                                                    if (_route.length === 0) {
                                                        _route.push([_o[0], _o[1], null, 0]);
                                                        //console.log([_o[0], _o[1], null, 0]);
                                                    }
                                                    _l += new LineString([[_o[0], _o[1]], [_e[0], _e[1]]]).getLength();
                                                    _route.push([_e[0], _e[1], null, _l]);
                                                    //console.log([_e[0], _e[1], null, _l]);
                                                    if (_n > _p) {
                                                        let _t2 = fromLonLat(feature.values_.geometry.getCoordinates()[_p++][1]);
                                                        _result.push([[_o[0], _o[1]], [_e[0], _e[1]], [_t2[0], _t2[1]]]);
                                                        //console.log([[_o[0], _o[1]], [_e[0], _e[1]], [_t2[0], _t2[1]]]);
                                                    } else if (_n === _p) {
                                                        let _t1: any = fromLonLat(feature.values_.geometry.getCoordinates()[_n - 1][0]);
                                                        let _t2: any = fromLonLat(feature.values_.geometry.getCoordinates()[_n - 1][1]);
                                                        _result.push([[_t1[0], _t1[1]], [_t2[0], _t2[1]], null]);
                                                        _result.push([[_t2[0], _t2[1]], null, null]);
                                                        //console.log([[_t1[0], _t1[1]], [_t2[0], _t2[1]], null ]);
                                                        //console.log([[_t2[0], _t2[1]], null, null]);
                                                        _p++;
                                                    }
                                                }
                                            )
                                        }
                                    );
                                } else {
                                    return;
                                }
                            }
                        );
                        if (_route.length === 0) return;
                        if (typeof this.route !== 'undefined') return;
                        //_route.forEach((e: any) => { console.log("@", e) })
                        //console.log(_route.length);
                        //_result.forEach((e: any) => { console.log("@", e) })
                        //console.log(_result.length);
                        this.route = new LineString(_route);
                        this.result = _result;
                        this.anime();
                    }
                )
            }
        )
    }
    get(url: any, callback: any) {
        let client: any = new XMLHttpRequest();
        client.open('GET', url);
        client.onload = () => {
            callback(client.responseText);
        };
        client.send();
    }
    //<Table.Header><Table.Row><Table.HeaderCell>Route</Table.HeaderCell></Table.Row></Table.Header>
    ///////////////////////////////////////
    ///////////////////////////////////////
    ///////////////////////////////////////
    progress() {
        let result: any = [];
        this.result.forEach(
            (ex: any) => {
                let e: any = ex[0];
                let f: any = ex[1];
                let g: any = ex[2];
                if (e && f && g) {
                    result.push(
                        [
                            getDirection(getAzimuth(e, f)),   //+ " , " +
                            new LineString([e, f]).getLength(), // + " , " +
                            (e && f && g) ? Math.round((((getAzimuth(f, g) % 360) - (getAzimuth(e, f) % 360) + 360) % 360) / 30) % 12 : null
                        ]
                    );
                } else if (e && f) {
                    result.push(
                        [
                            getDirection(getAzimuth(e, f)),   //+ " , " +
                            new LineString([e, f]).getLength(), // + " , " +
                            null
                        ]
                    )
                } else {
                    result.push(
                        [
                            null,
                            null,
                            null
                        ]
                    )
                }
            }
        );
        //result.forEach(
        //    (ex:any)=>{
        //        console.log(ex);
        //    }
        //)
        //console.log("*",result.length);
        ///////////////////////////////////////////////////////////////
        //
        ///////////////////////////////////////////////////////////////
        let _message: any = '';
        let message: any = '';
        let nx: any = 0;
        let nl: any = this.route.getLength();
        result.forEach(
            (e: any) => {
                nl = nl - e[1];
                if (e[0]) {
                    nx++;
                    if (nx < this.result.length) {
                        message = nx + '/' + (this.result.length - 1) + ':' + e[0] + 'の方向に' + Math.round(e[1]) + 'メートル' + ((e[2] && Math.round(nl)) ? '進み' + e[2] + '時の方向に曲がる。' : '直進。') + (Math.round(nl) ? '残り' + Math.round(nl) + 'メートル。' : '到着。');
                        //this.message.push(<tr><td key={nx} >{message}</td></tr>);
                        _message += '<tr><td key=' + nx + '>' + message + '</td></tr>';
                        //console.log(message,this.result.length,this.route.getCoordinates().length,result.length);
                    };
                }
                /*
                else {
                    nx++;
                    message = nx + '/' + this.result.length + ':到着';
                    //this.message.push(<tr><td key={nx}>{message}</td></tr>);
                    _message += '<tr><td key=' + nx + '>' + message + '</td></tr>';
                };
                */
                //console.log("@",nx,message);
            }
        )
        this.RoutList.innerHTML = (
            _message
        );
        this._result = result;
        const position: any = document.getElementById('position');
        position.max = Math.round(this.route.getLength()).toString();
        this.map.render();
        //this.InfoLabel.focus();
    }
    ///////////////////////////////////////
    ///////////////////////////////////////
    ///////////////////////////////////////


    ///////////////////////////////////////
    ///////////////////////////////////////
    ///////////////////////////////////////
    progress_r() {
        let result_r: any = [];
        let _p1: any = 1;
        let _p2: any = 2;
        this.result_r = [];
        const tmp: any = this.result.slice();
        tmp.reverse();
        tmp.forEach(
            (ex: any) => {
                let _n1: any = null;
                let _n2: any = null;
                if (_p1 < tmp.length) _n1 = tmp[_p1][0];
                if (_p2 < tmp.length) _n2 = tmp[_p2][0];
                //console.log("!",[ex[0],_n1,_n2]);
                this.result_r.push([ex[0], _n1, _n2]);
                _p1++;
                _p2++;
            }
        );
        /*
        this.result_r.forEach(
            (ex:any)=>{
                console.log(ex);
            }
        )
        */
        this.result_r.forEach(
            (ex: any) => {
                let e: any = ex[0];
                let f: any = ex[1];
                let g: any = ex[2];
                if (e && f && g) {
                    result_r.push(
                        [
                            getDirection(getAzimuth(e, f)),   //+ " , " +
                            new LineString([e, f]).getLength(), // + " , " +
                            (e && f && g) ? Math.round((((getAzimuth(f, g) % 360) - (getAzimuth(e, f) % 360) + 360) % 360) / 30) % 12 : null
                        ]
                    );
                } else if (e && f) {
                    result_r.push(
                        [
                            getDirection(getAzimuth(e, f)),   //+ " , " +
                            new LineString([e, f]).getLength(), // + " , " +
                            null
                        ]
                    )
                } else {
                    result_r.push(
                        [
                            null,
                            null,
                            null
                        ]
                    )
                }
            }
        );
        //result.forEach(
        //    (ex:any)=>{
        //        console.log(ex);
        //    }
        //)
        //console.log("*",result.length);
        ///////////////////////////////////////////////////////////////
        //
        ///////////////////////////////////////////////////////////////
        //let _message: any = '';
        /*
        let message: any = '';
        let nx: any = 0;
        let nl: any = this.route.getLength();
        result_r.forEach(
            (e: any) => {
                nl = nl - e[1];
                if (e[0]) {
                    nx++;
                    if(nx<(this.result.length-1)){
                        message = nx + '/' + (this.result.length-1) + ':' + e[0] + 'の方向に' + Math.round(e[1]) + 'メートル' + (e[2] ? '進み' + e[2] + '時の方向に曲がる。' : '直進。') + (Math.round(nl) ? '残り' + Math.round(nl) + 'メートル。' : '到着。');
                        //this.message.push(<tr><td key={nx} >{message}</td></tr>);
                        //_message += '<tr><td key=' + nx + '>' + message + '</td></tr>';
                    }
                }
                //else {
                //    nx++;
                //    message = nx + '/' + this.result.length + ':到着';
                //    //this.message.push(<tr><td key={nx}>{message}</td></tr>);
                //    //_message += '<tr><td key=' + nx + '>' + message + '</td></tr>';
                //};
                console.log("@", nx, message);
            }
        )
        */
        //this.RoutList.innerHTML = (
        //    _message
        //);
        this._result_r = result_r.slice();
        /*
        const position: any = document.getElementById('position');
        position.max = Math.round(this.route.getLength()).toString();
        this.map.render();
        */
        //this.InfoLabel.focus();

    }
    ///////////////////////////////////////
    ///////////////////////////////////////
    ///////////////////////////////////////





    anime() {
        //if (this.route===null) return;
        this.progress();
        this.progress_r();

        let Pfeatures:any = [];
        this.result.forEach(
            (e:any) => {
                Pfeatures.push(new Feature(
                        {
                            geometry: new Point(e[0])
                        }
                    )
                );
            }
        );
        let PfSource:any = new VectorSource();
        PfSource.addFeatures(Pfeatures);
        let PfLayer = new VectorLayer(
            {
                source: PfSource,
                style: new Style(
                    {
                        image: new CircleStyle(
                            {
                                radius: 2,
                                fill: new Fill(
                                    {
                                        color: 'red'
                                    }
                                )
                            }
                        )
                    }
                )
            }
        );


       
        const routeFeature = new Feature(
            {
                type: 'route',
                geometry: this.route,
            }
        );
        const geoMarker: any = new Feature(
            {
                type: 'geoMarker',
                geometry: new Point(this.route.getCoordinateAt(0)),
            }
        );
        const startMarker: any = new Feature(
            {
                type: 'icon',
                geometry: new Point(this.route.getCoordinateAt(0)),
            }
        );
        //console.log(this.route.getCoordinateAt(0));
        const endMarker: any = new Feature(
            {
                type: 'icon',
                geometry: new Point(this.route.getCoordinateAt(1)),
            }
        );
        const TxtLabel: any = new Text(
            {
                text: "",
                textBaseline: "hanging",
                textAlign: "left",
                offsetX: 15,
            }
        );
        const styles: any = {
            'route': new Style(
                {
                    stroke: new Stroke(
                        {
                            width: 6,
                            color: [237, 212, 0, 0.8],
                        }
                    ),
                }
            ),
            'icon': new Style(
                {
                    image: new Icon(
                        {
                            anchor: [0.5, 1],
                            src: 'icon.png',
                        }
                    ),
                }
            ),
            'geoMarker': new Style(
                {
                    image: new CircleStyle(
                        {
                            radius: 4,//7,
                            fill: new Fill(
                                {
                                    color: 'black'
                                }
                            ),
                            stroke: new Stroke(
                                {
                                    color: 'white',
                                    width: 2,
                                }
                            ),
                        }
                    ),
                    /*
                    image: new Icon(
                        {
                            src: 'geolocation_marker_heading.png'
                        }
                    ),
                    */
                    text: TxtLabel,
                }
            ),
        };
        let animating: any = false;
        let vectorSource: any = new VectorSource(
            {
                features: [
                    //routeFeature,
                    geoMarker,
                    startMarker,
                    endMarker,
                ],
            }
        );
        const time = {
            start: Infinity,
            stop: -Infinity,
            duration: 0,
        };
        vectorSource.on(
            'addfeature',
            (event: any) => {
                const geometry: any = event.feature.getGeometry();
                //console.log("@", geometry);
                time.start = Math.min(time.start, geometry.getFirstCoordinate()[3]);
                time.stop = Math.max(time.stop, geometry.getLastCoordinate()[3]);
                time.duration = time.stop - time.start;
            }
        );
        vectorSource.addFeature(routeFeature);
        let vectorLayer: any = new VectorLayer(
            {
                source: vectorSource,
                style: function (feature: any) {
                    // hide geoMarker if animation is active
                    if (animating && feature.get('type') === 'geoMarker') {
                        return null;
                    }
                    return styles[feature.get('type')];
                },
            }
        );
        this.map.addLayer(vectorLayer);
        this.map.addLayer(PfLayer);
        this.map.getView().fit(
            vectorSource.getExtent(),
            {
                padding: [100, 100, 100, 100],
                maxZoom: 18
            }
        );
        ////////////////////////////////
        //
        ////////////////////////////////
        let _pos: any = null;
        const center = [14744702.293451898, 4082116.972254019];
        let speed: any, startTime: any;
        //const speedInput: any = document.getElementById('speed');
        const startButton: any = document.getElementById('animation');
        const startIcon: any = document.getElementById('icon');
        let _xx: any = 0;
        let ff: any = 0;
        let _ff: any = this.route.getLength();

        const moveFeature: any = (event: any) => {
            const vectorContext: any = getVectorContext(event);
            const frameState: any = event.frameState;
            if (animating) {
                const elapsedTime: any = frameState.time - startTime;
                const distance: any = (speed * elapsedTime) / 1e6;
                if (distance >= 1) {
                    stopAnimation(true);
                    return;
                }
                let pos: any = this.route.getCoordinateAt(distance);
                const currentPoint: any = new Point(pos);
                const feature: any = new Feature(currentPoint);
                vectorContext.drawFeature(feature, styles.geoMarker);
                //var writer: any = new GeoJSON();
                //var geojsonStr: any = writer.writeFeatures(currentPoint);
                this.map.getView().setCenter(pos); //@@
                //this.InfoLabel.innerHTML = pos.toString();
                //TxtLabel.setText(pos.toString());
                if (_pos) {
                    this.map.getView().setRotation((360 - getAzimuth(_pos, pos)) * (Math.PI / 180));
                    //this.map.getView().setRotation((360 - coordinate[2]) * (Math.PI / 180));
                }
                _pos = pos;
                //console.log("@",this.route.getCoordinateAt(distance).slice(0,2));
                /////////////////////
                if (this.route.getCoordinates().length > _xx) {
                    if ((this.route.getCoordinates().length - 2) < _xx) {
                        //console.log(this.route.getCoordinates()[_xx], this.route.getCoordinates().length, _xx);
                    }
                    if (this.route.getCoordinates()[_xx].slice(3, 4) <= this.route.getLength() * distance) {
                        let e: any = this._result[_xx];
                        if (e[0]) {
                            //let _ex: any = e[2] ? '進み' + String(e[2]) + '時の方向に曲がる。' : '直進。';
                            _ff -= e[1];
                            let xx: any =
                                //'(' +
                                ++ff +
                                '/' +
                                (this._result.length - 1) +
                                //')'+ 
                                ':' +
                                e[0] +
                                'の方向に' +
                                Math.round(e[1]) + 'メートル' +
                                //_ex +
                                (e[2] ? '進み' + String(e[2]) + '時の方向に曲がる。' : '直進。') +
                                (Math.round(_ff) ? '残り' + Math.round(_ff) + 'メートル。' : '到着。');
                            //'残り' + Math.round(ff - ff * distance) + 'メートル';
                            //console.log("@",xx);
                            TxtLabel.setText(xx);
                            this.InfoLabel.innerHTML = xx;
                            //this.setState({msg:xx});
                            //console.log("@",xx,route.getCoordinateAtM(rs),pos,posx);
                        } else {
                            let xx: any = '到着。';
                            //console.log("@", xx);
                            TxtLabel.setText(xx);
                            //this.setState({msg:xx});
                            this.InfoLabel.innerHTML = xx;
                            //console.log(ff,result.length)
                            //}else{
                            //console.log(ff,result.length)
                        }
                        ScrollSelectChldren(_xx); //@@
                        _xx++;
                        //const value: any = parseInt(evt.target.value, 10) / parseInt(evt.target.max);
                        //const m: any = time.start + time.duration * value;
                        const poshition: any = document.getElementById('position');
                        poshition.value = Math.round(parseInt(poshition.max) * distance);
                        //console.log("@", _xx, Math.round(parseInt(poshition.max) * distance), poshition.value);
                    }
                }

                ////////////////////
                vectorSource.forEachFeature(
                    (feature: any) => {
                        let position: any = document.getElementById('position');
                        let m: any = parseInt(position.max) * distance;
                        if (feature.values_.type === "route") {
                            const geometry: any = (feature.getGeometry());
                            const coordinate: any = geometry.getCoordinateAtM(m, true);
                            //const coordinate:any = geometry.getCoordinateAt(value);
                            let highlight: any = feature.get('highlight');
                            if (highlight === undefined) {
                                //console.log("------------------", m, coordinate);//, geometry.flatCoordinates);
                                highlight = new Feature(new Point(coordinate));
                                feature.set('highlight', highlight);
                                featureOverlay.getSource().addFeature(highlight);
                            } else {
                                //console.log(":::::::::::::::::", m, coordinate);//, geometry.flatCoordinates);
                                highlight.getGeometry().setCoordinates(coordinate);
                            }
                            this.map.getView().setCenter(coordinate); //@@
                            TxtLabel2.setText(Math.round(m).toString() + "m/" + Math.round(this.route.getLength()).toString() + "m");
                            position.value = m.toString();
                            //console.log(Math.round(m).toString());
                        };
                    }
                );
                ////////////////////
            }
            // tell OpenLayers to continue the postrender animation
            //this.map.render();
        }
        const TxtLabel2: any = new Text(
            {
                text: "",
                textBaseline: "hanging",
                textAlign: "right",
                offsetX: -15,
            }
        );
        const featureOverlay: any = new VectorLayer(
            {
                source: new VectorSource(),
                map: this.map,
                style: new Style(
                    {
                        /*
                        image: new CircleStyle(
                            {
                                radius: 5,
                                fill: new Fill(
                                    {
                                        color: 'rgba(255,0,0,0.9)',
                                    }
                                ),
                            }
                        ),
                        */
                        image: new Icon(
                            {
                                src: 'geolocation_marker_heading.png'
                            }
                        ),
                        text: TxtLabel2,
                    }
                ),
            }
        );
        let _pos2: any = null;
        let _m: any = null; //@@
        let _mp: any = 0; //@@
        //let _mpp: any = null; //@@
        //const position: any = document.getElementById('position');
        //position.addEventListener(
        document.getElementById('position')!.addEventListener(
            'input',
            (evt: any) => {
                const value: any = parseInt(evt.target.value, 10) / parseInt(evt.target.max);
                const m: any = time.start + time.duration * value;
                vectorSource.forEachFeature(
                    (feature: any) => {
                        if (feature.values_.type === "route") {
                            const geometry: any = (feature.getGeometry());
                            const coordinate: any = geometry.getCoordinateAtM(m, true);
                            let highlight: any = feature.get('highlight');
                            if (highlight === undefined) {
                                //console.log("------------------", m, coordinate);//, geometry.flatCoordinates);
                                highlight = new Feature(new Point(coordinate));
                                feature.set('highlight', highlight);
                                featureOverlay.getSource().addFeature(highlight);
                            } else {
                                //console.log(":::::::::::::::::", m, coordinate);//, geometry.flatCoordinates);
                                highlight.getGeometry().setCoordinates(coordinate);
                            }
                            if (!animating) {
                                this.map.getView().setCenter(coordinate); //@@
                                if (_pos2) {
                                    this.map.getView().setRotation((- getAzimuth(_pos2, coordinate)) * (Math.PI / 180));
                                }
                                if (_m) {
                                    if ((m - _m) > 0) {
                                        //console.log("@+",_mp);
                                        for (let i: any = _mp; i < (this.route.getCoordinates().length); i++) {
                                            if (this.route.getCoordinates()[i].slice(3, 4)[0] > m) {
                                                _mp = i;
                                                break;
                                            }
                                        }
                                        let e: any = this._result[_mp - 1];
                                        let dd: any = Math.abs(Math.trunc(this.route.getCoordinates()[_mp].slice(3, 4)[0] - m)) + 1;
                                        //_mpp = _mp;
                                        //console.log("+",e.length);
                                        if (e[0]) {
                                            //let aaaa:any = Math.round(this.route.getLength()- (this.route.getLength() - m) );
                                            //console.log("@+",dd);
                                            //let message: any = _mp + '/' + this.result.length + ':' + e[0] + 'の方向に' + Math.round(e[1] - dd) + 'メートル' + (e[2] ? '進み' + e[2] + '時の方向に曲がる。' : '直進。') + (Math.round(this.route.getLength() - m) ? '残り' + Math.round(this.route.getLength() - m) + 'メートル。' : '到着。');
                                            let message: any = _mp + '/' + (this.result.length - 1) + ':' + e[0] + 'の方向に' + Math.round(dd) + 'メートル' + ((e[2] && (_mp !== (this.route.getCoordinates().length - 1))) ? '進み' + e[2] + '時の方向に曲がる。' : '直進。') + (Math.round(Math.round(this.route.getLength() - m)) ? '残り' + Math.round(Math.round(this.route.getLength() - m)) + 'メートル。' : '到着。');
                                            //this.message.push(<tr><td key={_mp} >{message}</td></tr>);
                                            //_message+='<tr><td key='+_mp+'>'+message+'</td></tr>';
                                            //console.log("+",message,coordinate.slice(0,2));
                                            geoMarker.getGeometry().setCoordinates(coordinate.slice(0, 2));
                                            ScrollSelectChldren(_mp); //@@
                                            TxtLabel.setText(message);
                                            this.InfoLabel.innerHTML = message;
                                        }
                                        /*
                                        else {
                                            let message: any = _mp + '/' + this.result.length + ':到着';
                                            //this.message.push(<tr><td key={_mp}>{message}</td></tr>);
                                            //_message+='<tr><td key='+_mp+'>'+message+'</td></tr>';
                                            //console.log("+",message,coordinate.slice(0,2));
                                            geoMarker.getGeometry().setCoordinates(coordinate.slice(0, 2));
                                            ScrollSelectChldren(_mp); //@@
                                            TxtLabel.setText(message);
                                            this.InfoLabel.innerHTML = message;
                                        };
                                        */
                                    } else {
                                        //console.log("@-",_mp);
                                        //for (let i: any = (this.route.getCoordinates().length-1); i > 0; i--) {
                                        //for (let i: any = _mp; i > 0; i--) {
                                        for (let i: any = 1; i < (this.route.getCoordinates().length - 1); i++) {
                                            //console.log("*",i,_mp,this.route.getCoordinates()[i].slice(3, 4)[0],m);
                                            if (this.route.getCoordinates()[i].slice(3, 4)[0] > m) {
                                                _mp = i;
                                                break;
                                            }
                                        }
                                        let e: any = this._result_r[(this._result_r.length - 1) - _mp];
                                        //console.log("@",((this._result_r.length - 1) - _mp));
                                        let dd: any = Math.trunc(this.route.getCoordinates()[_mp].slice(3, 4)[0] - m);
                                        //let dr: any = Math.round(this.route.getCoordinates()[_mp].slice(3, 4)[0] - m);
                                        //let db: any = Math.ceil(this.route.getCoordinates()[_mp].slice(3, 4)[0] - m);
                                        //_mpp = _mp;
                                        if (e[0]) {
                                            //console.log("@-", Math.trunc(e[1] - dd), Math.trunc(e[1] - dr), Math.trunc(e[1] - db), Math.round(e[1] - dd), Math.round(e[1] - dr), Math.round(e[1] - db), Math.ceil(e[1] - dd), Math.ceil(e[1] - dr), Math.ceil(e[1] - db));
                                            //console.log("@-", Math.round(e[1]-dd) , Math.round(e[1]-dr),Math.round(e[1]-db) );// ,e[1],dd ,Math.ceil(this.route.getCoordinates()[_mp].slice(3, 4)[0] - m));
                                            //console.log("@-", Math.ceil(e[1]-dd) , Math.ceil(e[1]-dr),Math.ceil(e[1]-db) );// ,e[1],dd ,Math.ceil(this.route.getCoordinates()[_mp].slice(3, 4)[0] - m));
                                            //let message: any = (_mp) + '/' + (this.result_r.length-1) + ':' + e[0] + 'の方向に' + Math.round(e[1] - dd) + 'メートル' + (e[2] ? '進み' + e[2] + '時の方向に曲がる。' : '直進。') + (Math.round(m) ? '残り' + Math.round(m) + 'メートル。' : '到着。');
                                            let message: any = (_mp) + '/:' + (this.result_r.length - 1) + ':' + e[0] + 'の方向に' + Math.round(e[1] - dd) + 'メートル' + (e[2] ? '進み' + e[2] + '時の方向に曲がる。' : '直進。') + (Math.round(m) ? '残り' + Math.round(m) + 'メートル。' : '到着。');
                                            //this.message.push(<tr><td key={_mp} >{message}</td></tr>);
                                            //_message+='<tr><td key='+_mp+'>'+message+'</td></tr>';
                                            //console.log("-",message,coordinate.slice(0,2));
                                            geoMarker.getGeometry().setCoordinates(coordinate.slice(0, 2));
                                            ScrollSelectChldren(_mp); //@@
                                            TxtLabel.setText(message);
                                            this.InfoLabel.innerHTML = message;
                                        }
                                        /*
                                        else {
                                            let message: any = _mp + '/' + this.result.length + ':到着';
                                            //this.message.push(<tr><td key={_mp}>{message}</td></tr>);
                                            //_message+='<tr><td key='+_mp+'>'+message+'</td></tr>';
                                            //console.log("-",message,coordinate.slice(0,2));
                                            geoMarker.getGeometry().setCoordinates(coordinate.slice(0, 2));
                                            ScrollSelectChldren(_mp); //@@
                                            TxtLabel.setText(message);
                                            this.InfoLabel.innerHTML = message;
                                        };
                                        */
                                    }
                                } else {
                                    let e: any = this._result[0];
                                    let message: any = (1) + '/' + (this.result.length - 1) + ':' + e[0] + 'の方向に' + Math.round(e[1]) + 'メートル' + (e[2] ? '進み' + e[2] + '時の方向に曲がる。' : '直進。') + (Math.round(Math.round(this.route.getLength() - m)) ? '残り' + Math.round(Math.round(this.route.getLength() - m)) + 'メートル。' : '到着。');
                                    //console.log("@@@@",message);
                                    geoMarker.getGeometry().setCoordinates(coordinate.slice(0, 2));
                                    ScrollSelectChldren(_mp); //@@
                                    TxtLabel.setText(message);
                                    this.InfoLabel.innerHTML = message;
                                }
                                _pos2 = coordinate;
                                _m = m; //@@
                                TxtLabel2.setText(Math.round(m).toString() + "m/" + Math.round(this.route.getLength()).toString() + "m");
                                const position: any = document.getElementById('position');
                                position.value = Math.round(m).toString();
                            }
                        };
                    }
                );
                //this.map.render();
            }
        );
        const ScrollSelectChldren: any = (id: any) => {
            let element: any = document.getElementById('list');
            let children: any = element.childNodes;
            if (children.length > id)
                children[Math.floor(id)].scrollIntoView({ behavior: 'smooth' });
            //children[Math.round(id)].focus();
            //console.log("!",children.length);
        }
        const startAnimation = () => {
            if (animating) {
                stopAnimation(false);
            } else {
                _xx = 0;
                ff = 0;
                _ff = this.route.getLength();
                _pos = null;
                _pos2 = null;
                animating = true;
                startTime = new Date().getTime();
                speed = 1;//speedInput.value;
                TxtLabel.setText("");
                TxtLabel2.setText("");
                //startButton.textContent = 'Cancel Animation';
                startIcon.className = 'stop icon';
                // hide geoMarker
                geoMarker.changed();
                // just in case you pan somewhere else
                this.map.getView().setZoom(20);
                this.map.getView().setCenter(center);
                vectorLayer.on('postrender', moveFeature);
                this.map.render();
            }
        }
        const stopAnimation = (ended: any) => {
            animating = false;
            //startButton.textContent = 'Start Animation';
            startIcon.className = 'play icon';
            if (typeof this.route === 'undefined') {
                vectorLayer.un('postrender', moveFeature);
                return;
            }
            // if animation cancelled set the marker at the beginning
            const coord = this.route.getCoordinateAt(ended ? 1 : 0);
            geoMarker.getGeometry().setCoordinates(coord);
            // remove listener
            vectorLayer.un('postrender', moveFeature);
        }
        startButton.addEventListener('click', startAnimation, false);
    }
    DragDrop() {
        //console.log( "@",typeof this.route === 'undefined');
        //if (this.route === 'undefined')return;
        const dragAndDropInteraction: any = new DragAndDrop(
            {
                formatConstructors: [
                    GPX as any,
                    GeoJSON as any,
                    IGC as any,
                    KML as any,
                    TopoJSON as any,
                    Polyline as any
                ],
            }
        );
        this.map.addInteraction(dragAndDropInteraction);
        dragAndDropInteraction.once(
            'addfeatures',
            (event: any) => {
                let _route: any = [];
                let _result: any = [];
                event.features.forEach(
                    (feature: any) => {
                        let typ: any = feature.getGeometry().getType();
                        console.log(typ);
                        if (typ === 'LineString') {
                            let _l: any = 0;
                            let _p: any = 1;
                            let _n: any = feature.values_.geometry.getCoordinates().length;
                            //console.log("*", _n);
                            feature.values_.geometry.forEachSegment(
                                (_o: any, _e: any) => {
                                    //let _o:any = fromLonLat([o[0],o[1]]);
                                    //let _e:any = fromLonLat([e[0],e[1]]);
                                    if (_route.length === 0) {
                                        _route.push([_o[0], _o[1], null, 0]);
                                        //console.log([_o[0], _o[1], null, 0]);
                                    }
                                    _l += new LineString([[_o[0], _o[1]], [_e[0], _e[1]]]).getLength();
                                    _route.push([_e[0], _e[1], null, _l]);
                                    //console.log([_e[0], _e[1], null, _l]);
                                    if ((_n - 1) > _p) {
                                        let _t1: any = feature.values_.geometry.getCoordinates()[_p].slice(0, 2);
                                        let _t2: any = feature.values_.geometry.getCoordinates()[++_p].slice(0, 2);
                                        _result.push([[_o[0], _o[1]], [_t1[0], _t1[1]], [_t2[0], _t2[1]]]);
                                        //console.log([[_o[0], _o[1]], [_t1[0], _t1[1]], [_t2[0], _t2[1]]]);
                                    } else if ((_n - 1) === _p) {
                                        let _t2: any = feature.values_.geometry.getCoordinates()[_n - 1].slice(0, 2);
                                        _result.push([[_o[0], _o[1]], [_t2[0], _t2[1]], [null, null]]);
                                        _result.push([[_t2[0], _t2[1]], [null, null], [null, null]]);
                                        //console.log([[_o[0], _o[1]], [_t2[0], _t2[1]], [null, null]]);
                                        //console.log([[_t2[0], _t2[1]], [null, null], [null, null]]);
                                        _p++;
                                    };
                                }
                            );
                        } else if (typ === 'MultiLineString') {
                            let _l: any = 0;
                            let _p: any = 1;
                            let _n: any = feature.values_.geometry.getLineStrings().length;
                            //console.log("*", _n);
                            feature.values_.geometry.getLineStrings().forEach(
                                (geom: any) => {
                                    geom.forEachSegment(
                                        (_o: any, _e: any) => {
                                            //let _o: any = fromLonLat([o[0], o[1]]);
                                            //let _e: any = fromLonLat([e[0], e[1]]);
                                            if (_route.length === 0) {
                                                _route.push([_o[0], _o[1], null, 0]);
                                                //console.log([_o[0], _o[1], null, 0]);
                                            }
                                            _l += new LineString([[_o[0], _o[1]], [_e[0], _e[1]]]).getLength();
                                            _route.push([_e[0], _e[1], null, _l]);
                                            //console.log([_e[0], _e[1], null, _l]);
                                            if (_n > _p) {
                                                let _t2 = feature.values_.geometry.getCoordinates()[_p++][1];
                                                _result.push([[_o[0], _o[1]], [_e[0], _e[1]], [_t2[0], _t2[1]]]);
                                                //console.log([[_o[0], _o[1]], [_e[0], _e[1]], [_t2[0], _t2[1]]]);
                                            } else if (_n === _p) {
                                                let _t1: any = feature.values_.geometry.getCoordinates()[_n - 1][0];
                                                let _t2: any = feature.values_.geometry.getCoordinates()[_n - 1][1];
                                                _result.push([[_t1[0], _t1[1]], [_t2[0], _t2[1]], [null, null]]);
                                                _result.push([[_t2[0], _t2[1]], [null, null], [null, null]]);
                                                //console.log([[_t1[0], _t1[1]], [_t2[0], _t2[1]], [null, null]]);
                                                //console.log([[_t2[0], _t2[1]], [null, null], [null, null]]);
                                                _p++;
                                            }
                                        }
                                    )
                                }
                            );
                        } else {
                            return;
                        }
                    }
                );
                if (_route.length === 0) return;
                if (typeof this.route !== 'undefined') return;
                //_route.forEach((e: any) => { console.log("@", e) })
                //console.log(_route.length);
                //_result.forEach((e: any) => { console.log("@", e) })
                //console.log(_result.length);
                this.route = new LineString(_route);
                this.result = _result;
                this.anime();
            }
        )
    }
    RemoveRayers() {
        //vectorLayer.un('postrender', moveFeature);
        //this.anime.stopAnimation();
        this.map.getLayers().forEach(
            (layer: any) => {
                if (layer instanceof VectorLayer) {
                    //if (layerGroup.get('name')!=='tactile_paving'){
                    this.map.removeLayer(layer);
                    //}
                }
            }
        );
        this.route = new LineString([]);
        this.route = undefined;
        this.result = undefined;
        this._result = undefined;
        this.result_r = undefined;
        this._result_r = undefined;
        this.RoutList.innerHTML = ("");
        //this.RoutList2.innerHTML = ("");
    }
    /////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    /////////////////////////////////////////////////////////////////////////////////////////////////////
    async fetch_retry(url: any, options: any, n: any): Promise<any> {
        try {
            return await fetch(url, options);
        } catch (err) {
            if (n === 1) throw err;
            console.error(n);
            return await this.fetch_retry(url, options, n - 1);
        }
    };
    async tactile_paving_yes(vectorSource: any, extent: any, _resolution: any, projection: any) {
        const epsg4326Extent = transformExtent(
            extent,
            projection,
            'EPSG:4326'
        );
        const loc = [
            epsg4326Extent[1],
            epsg4326Extent[0],
            epsg4326Extent[3],
            epsg4326Extent[2]
        ].toString()
        const prop = [
            `"tactile_paving"="yes"`,
            `"tactile_paving"="primitive"`,
            `"traffic_signals:sound"="yes"`
        ]
        var way: any = "";
        var node: any = "";
        var relation: any = "";
        prop.forEach(
            element => {
                way === null ? way = null : way = way + `way[${element}](${loc});`;
                node === null ? node = null : node = node + `node[${element}](${loc});`;
                relation === null ? relation = null : relation = relation + `relation[${element}](${loc});`;
            }
        );
        if (way === null) way = "";
        if (node === null) node = "";
        if (relation === null) relation = "";
        const body = `[out:json][timeout:25];(${way}${node}${relation});out;>;out skel qt;`;
        const options = {
            method: 'POST',
            body: body,
        }
        try {
            //const response = await fetch('https://overpass-api.de/api/interpreter', options);
            const response = await this.fetch_retry('https://overpass-api.de/api/interpreter', options, 20);
            if (response.ok) {
                const json = await response.json()
                this.setState(
                    { elements: json.elements }
                );
                var geojson = osmtogeojson(
                    json
                );
                var features = new GeoJSON().readFeatures(
                    geojson,
                    {
                        featureProjection: this.map.getView().getProjection()
                    }
                );
                vectorSource.addFeatures(features);
            } else {
                console.error('fail')
            }
        } catch (e) {
            console.error(e)
        }
    }
    async www() {
        if (this.chech_layer('tactile_paving_yes')) return;
        let vectorSource: any = new VectorSource(
            {
                format: new GeoJSON(),
                //loader: this.tactile_paving.bind(this,vectorSource),
                strategy: bbox // ol.loadingstrategy.all
            }
        );
        vectorSource.setLoader(
            this.tactile_paving_yes.bind(
                this,
                vectorSource
            )
        );
        vectorSource.set("name", "tactile_paving_yes");
        let vectorLayer: any = new VectorLayer(
            {
                source: vectorSource,
                style: new Style(
                    {
                        fill: new Fill(
                            {
                                color: '#FFF100',
                            }
                        ),
                        stroke: new Stroke(
                            {
                                color: 'yellow',  //  '#FFF100',
                                width: 3,
                            }
                        ),
                        image: new CircleStyle(
                            {
                                radius: 2 * 2,
                                fill: new Fill(
                                    {
                                        color: 'white',
                                    }
                                ),
                                stroke: new Stroke(
                                    {
                                        color: 'yellow',
                                        width: 4 / 2
                                    }
                                )
                            }
                        )
                    }
                )
            }
        )
        vectorLayer.set('name', 'tactile_paving_yes');
        this.map.addLayer(vectorLayer);
    }
    chech_layer(layer_name: any) {
        let ret: any = false;
        this.map.getLayers().forEach(
            function (layerGroup: any) {
                getLayer(layerGroup);
            }
        );
        function getLayer(layer: any) {
            if (layer instanceof VectorLayer) {
                if (layer_name === layer.get('name'))
                    ret = true;
                //console.log(layer,layer.get('name'));
            }
            if (typeof layer.getLayers == 'function') {
                layer.getLayers().forEach(
                    function (l: any) {
                        getLayer(l);
                    }
                );
            }
        };
        return (ret);
    }
    /////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    /////////////////////////////////////////////////////////////////////////////////////////////////////
    vvv() {
        if (!this.chech_layer('tactile_paving_yes')) return;
        let vsource: any = new VectorSource({});
        this.map.getLayers().forEach(
            function (layerGroup: any) {
                getLayer(layerGroup);
            }
        );
        function getLayer(layer: any) {
            if (layer instanceof VectorLayer) {
                //console.log(layer,layer.get('name'));
                //console.log(layer.getSource().getFeatures());
                vsource.addFeatures(layer.getSource().getFeatures());
                vsource.set('name', 'tactile_paving');
            }
        };
        let writer = new GeoJSON();
        let geojsonStr = writer.writeFeatures(vsource.getFeatures());
        let geojson = JSON.parse(geojsonStr);
        if (geojson.features.length === 0) return;
        //console.log(geojson);
        let start:any = {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": fromLonLat([132.4539143, 34.3961265])
                // [132.453854,34.3960494] [132.4506674,34.3851137]
            },
            "properties": {
                "name": "start"
            }
        }
        let finish:any = {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": fromLonLat([132.4529588, 34.3913481])
                // [132.4529503,34.3913256] [132.4529658,34.3871493]
            },
            "properties": {
                "name": "finish"
            }
        }
        /////////////////////////////////////////////////////////////////////
        // eslint-disable-next-line
        //@@function getMinDistance(co1: any, ls: any) {
        //@@   let co2 = ls.getClosestPoint(co1);
        //@@    let ls_tmp = new LineString([co1, co2]);
        //@@    return [ls_tmp.getLength(), co2];
        //@@}
        let filteredGeoJSON = {
            "type": "FeatureCollection",
            "features": geojson.features.filter(
                function (feature: any) {
                    /*
                    if (feature.geometry.type === "LineString") {
                        let ls = new LineString(feature.geometry.coordinates);
                        let ret: any = getMinDistance(
                            fromLonLat([132.45349, 34.39611]), ls);
                        if (ret[0] < 10) {
                            console.log(
                                "--------", 
                                ret[0], 
                                ret[1], 
                                fromLonLat([132.45349, 34.39611]), 
                                ls
                            );
                        }
                    }
                    */
                    return (
                        feature.geometry.type === 'LineString' &&
                        (
                            feature.properties.tactile_paving === "yes" ||
                            feature.properties.tactile_paving === "primitive" ||
                            feature.properties["traffic_signals:sound"] === "yes"
                        )
                    );
                }
            )
        };
        if (filteredGeoJSON.features.length === 0) return;
        let edgeReduce = (a: any, p: any) => {
            let a_arr: any = (a && a.id) ? a.id : [];
            if (typeof p.id === 'number') {
                a_arr.push(p.id);
            }
            else if (typeof p.id === 'string') {
                a_arr.push(p.id);
            } else {
                p.id.forEach(
                    (id: any) => {
                        a_arr.push(id);
                    }
                );
            };
            let p_arr: any = {}
            Object.keys(p).forEach(
                function (key: any) {
                    if (key !== 'id')
                        p_arr[key] = p[key];
                }
            );
            return Object.assign({ id: Array.from(new Set(a_arr)) }, p_arr);
        };
        let pathFinder = new PathFinder(
            geojson,
            {
                weight: function (a: any, b: any, _props: any) {
                    let dx = a[0] - b[0];
                    let dy = a[1] - b[1];
                    return Math.sqrt(dx * dx + dy * dy);
                },
                tolerance: 1e-6,
                edgeDataReducer : edgeReduce ,
                edgeDataSeed: () => -1
            }
        );
        let _path: any;
        try {
            _path = pathFinder.findPath(start, finish);
        } catch (error) {
            return;
        }
        let _route: any = [];
        let _result: any = [];
        let _l: any = 0;
        let _p: any = 1;
        const _n: any = _path.path.length;
        console.log("*", _n);
        for (let i = 1; i < _n; i++) {
            let _o = _path.path[i - 1];
            let _e = _path.path[i];
            if (_route.length === 0) {
                _route.push([_o[0], _o[1], null, 0]);
                //console.log("@", [_o[0], _o[1], null, 0]);
            }
            _l += new LineString([[_o[0], _o[1]], [_e[0], _e[1]]]).getLength();
            _route.push([_e[0], _e[1], null, _l]);
            //console.log("@", [_o[0], _o[1], null, _l]);
            //ptx.push([o.concat(dr, dr), e.concat(null, dr += 10)]);
            if ((_n - 1) > _p) {
                let _t1: any = _path.path[_p];
                let _t2: any = _path.path[++_p];
                _result.push([[_o[0], _o[1]], [_t1[0], _t1[1]], [_t2[0], _t2[1]]]);
                //console.log([[_o[0], _o[1]], [_t1[0], _t1[1]], [_t2[0], _t2[1]]]);
            }
            else if ((_n - 1) === _p) {
                let _t2: any = _path.path[_n - 1];
                _result.push([[_o[0], _o[1]], [_t2[0], _t2[1]], [null, null]]);
                _result.push([[_t2[0], _t2[1]], [null, null], [null, null]]);
                //console.log( [[_o[0], _o[1]], [_t2[0], _t2[1]], [null, null]]);
                //console.log( [[_t2[0], _t2[1]], [null, null], [null, null]]);
                _p++;
            }
        };
        if (_path.length === 0) return;
        if (typeof this.route !== 'undefined') return;
        //_route.forEach((e: any) => { console.log("@", e) })
        //console.log(_route.length);
        //_result.forEach((e: any) => { console.log("@", e) })
        //console.log(_result.length);
        this.RemoveRayers();
        this.path = _path;
        this.route = new LineString(_route);
        this.result = _result;
        this.anime();
    }
    /////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    /////////////////////////////////////////////////////////////////////////////////////////////////////
    render() {
        const PopupExampleStyle0 = () => (
            <Popup
                //trigger={<Button icon='blind' aria-label='Down Load' onClick={this.load.bind(this)} />}
                trigger={<button className='ui icon button' id='top' aria-label='Down Load' onClick={this.load.bind(this)} tabIndex={1}><i aria-hidden='true' id='icon2' className='blind icon' /></button>}
                content='sample data load'
                style={styles.style}
                inverted
                mouseEnterDelay={500}
                mouseLeaveDelay={500}
                on='hover'
            />
        )
        const PopupExampleStyle1 = () => (
            <Popup
                //trigger={<Button icon='play' id='animation' aria-label='animation start/stop' />}
                trigger={<button className='ui icon button' id='animation' aria-label='animation start/stop' tabIndex={1}><i aria-hidden='true' id='icon' className='play icon' /></button>}
                content='animation'
                style={styles.style}
                inverted
                mouseEnterDelay={500}
                mouseLeaveDelay={500}
                on='hover'
            />
        )
        /*
        // eslint-disable-next-line
        const PopupExampleStyle2 = () => (
            <Popup
                //trigger={<Button icon='trash' aria-label='trash' onClick={this.RemoveRayers.bind(this)} />}
                trigger={<button className='ui icon button' onClick={this.RemoveRayers.bind(this)}><i aria-hidden='true' id='icon' className='trash icon' /></button>}
                content='trash'
                style={styles.style}
                inverted
                mouseEnterDelay={500}
                mouseLeaveDelay={500}
                on='hover'
            />
        )
        // eslint-disable-next-line
        const PopupExampleStyle3 = () => (
            <Popup
                //trigger={<Button icon='blind' aria-label='blind' onClick={this.www.bind(this)} />}
                trigger={<button className='ui icon button' onClick={this.www.bind(this)}><i aria-hidden='true' id='icon' className='blind icon' /></button>}
                content='blind'
                style={styles.style}
                inverted
                mouseEnterDelay={500}
                mouseLeaveDelay={500}
                on='hover'
            />
        )
        // eslint-disable-next-line
        const PopupExampleStyle4 = () => (
            <Popup
                trigger={<Button icon='blind' aria-label='blind' onClick={this.vvv.bind(this)} />}
                content='blind'
                style={styles.style}
                inverted
                mouseEnterDelay={500}
                mouseLeaveDelay={500}
                on='hover'
            />
        )
        */
        /*
        let t001:any=[
            "1",
            "2",
            "3",
            "4",
            "5"
        ];
        let nx=0;
        this.message2=[];
        t001.forEach(
            (element:any)=>{
                this.message2.push(<Table.Row><Table.Cell key={nx}>{element}</Table.Cell></Table.Row>);
            }
        );*/
        return (
            <div id='fullscreen' className='fullscreen' >
                <div className='map' id='map' style={styles.map} tabIndex={0} />
                <div className='ol-if ol-unselectable ol-control' id='pss' >
                    {false &&
                        <input id="time" type="range" step="1" />
                    }
                </div>
                <div className='ol-if ol-unselectable ol-control' id='pss' >
                    <PopupExampleStyle0 />
                    <PopupExampleStyle1 />
                    <label htmlFor="position">
                        position:&nbsp;
                        <input id="position" type="range" min="0" max="9999" defaultValue="0" step="1" tabIndex={3} />
                    </label>
                </div>
                <div className='ol-list ol-unselectable ol-control'>
                    <div className="ui basic label" role="region" aria-atomic="true" aria-live="polite" ><span id='info' /></div>
                    <Segment.Group raised style={styles.list} >
                        <Table basic='very'>
                            <caption>Route</caption>
                            <Table.Body id='list' />
                        </Table>
                    </Segment.Group>
                </div>
            </div>
        )
    }
}
/*
                    {false &&
                        <label htmlFor="speed" >
                            speed:&nbsp;
                            <input id="speed" type="range" min="1" max="999" defaultValue="1" step="1" />
                        </label>
                    }

*/
//cloud download
const styles: { [key: string]: CSSProperties } = {
    map: {
        width: '100vw',
        height: '100vh',
    },
    list: {
        overflow: 'auto',
        maxHeight: '12em'
    },
    style: {
        borderRadius: 0,
        opacity: 0.7,
        padding: '2em',
    }
};