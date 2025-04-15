import { debounce, filter, groupBy, some, invoke, find } from 'lodash-es';

module.exports = {
  getAllMaps,
  isMatchingAMap,
  getLatLonZoom,
};

function getAllMaps() {
  return maps;
}

function isMatchingAMap(url) {
  return some(maps, (map) => invoke(map, "getLatLonZoom", url));
}

function getLatLonZoom(url) {
  const map = find(maps, (map) => invoke(map, "getLatLonZoom", url));
  if (map) {
    return map.getLatLonZoom(url);
  }
}

// add full content of maps.js from openswitchmaps repo here below this line 

// EPSG 3857 (Web Mercator) to EPSG 4326 (WGS 84)
function webMercatorToWGS84(lat, lon) {
    
  const e_value = 2.7182818284;
  const X = 20037508.34;
  const lat3857 = lat
  const long3857 = lon;
  
  //converting the longitute from epsg 3857 to 4326
  const long4326 = (long3857*180)/X;
  
  //converting the latitude from epsg 3857 to 4326 split in multiple lines for readability        
  let lat4326 = lat3857/(X / 180);
  const exponent = (Math.PI / 180) * lat4326;
  
  lat4326 = Math.atan(Math.pow(e_value, exponent));
  lat4326 = lat4326 / (Math.PI / 360); // Here is the fixed line
  lat4326 = lat4326 - 90;

  return [lat4326, long4326];
  
}

// EPSG 4326 (WGS 84) to EPSG 3857 (Web Mercator)
function wgs84ToWebMercator(lat, lon) {
  const X = 20037508.34;
  let long3857 = (lon * X) / 180;
  let lat3857 = parseFloat(lat) + 90;
  lat3857 = lat3857 * (Math.PI/360);
  lat3857 = Math.tan(lat3857);
  lat3857 = Math.log(lat3857);
  lat3857 = lat3857 / (Math.PI / 180);
  lat3857 = (lat3857 * X) / 180;
  return [lat3857, long3857];
}


function getZoomLevel(radius) {
  let zoomLevel;
  if (radius > 0) {
    let radiusElevated = radius;
    let scale = radiusElevated / 500.0;
    zoomLevel = 18 - Math.log(scale) / Math.log(2);
  }
  zoomLevel = parseFloat(zoomLevel.toFixed(2));
  return zoomLevel;
}

function getRadiusForZoomLevel(zoomLevel) {
  let scale = Math.pow(2, 18 - zoomLevel);
  let radiusElevated = scale * 500;
  let radius = radiusElevated - radiusElevated / 2;
  return radius;
}


function bboxToLatLonZoom(minlon, minlat, maxlon, maxlat) {
  const lon = (Number(minlon) + Number(maxlon)) / 2.0;
  const lat = (Number(minlat) + Number(maxlat)) / 2.0;
  const part = (Number(maxlat) - Number(minlat)) / 360.0;
  const height = screen.availHeight;
  const tile_part = (part * 256) / height;
  const zoom = Math.log(tile_part) / Math.log(0.5); //0.5^zoom=part
  return [lat, lon, zoom];
}
// -180 < lon < 180
function normalizeLon(lon) {
  return ((((Number(lon) + 180) % 360) + 360) % 360) - 180;
}

function latLonZoomToBbox(lat, lon, zoom) {
  const tile_part = Math.pow(0.5, zoom);
  const part = (tile_part * screen.availHeight) / 256;
  const minlon = Number(lon) - (360 * part) / 2;
  const maxlon = Number(lon) + (360 * part) / 2;
  const minlat = Number(lat) - (180 * part) / 2;
  const maxlat = Number(lat) + (180 * part) / 2;
  return [minlon, minlat, maxlon, maxlat];
}

const CAMPER_CATEGORY = "Camper";
const CYCLING_CATEGORY = "Cycling";
const MISC_CATEGORY = "Misc";
const OSM_CATEGORY = "OpenStreetMap";
const OUTDOOR_CATEGORY = "Outdoor";
const POI_CATEGORY = "POI";
const ROUTER_CATEGORY = "Router";
const SATELLITE_CATEGORY = "Satellite";
const TOOLS_CATEGORY = "Tools";
const WEATHER_CATEGORY = "Weather, Science";
const WINTER_CATEGORY = "Winter";
const WATER_CATEGORY = "Water";

function sortByKey(array, key) {
  return array.sort(function (a, b) {
    var x = a[key];
    var y = b[key];
    if (typeof x == "string") {
      x = ("" + x).toLowerCase();
    }
    if (typeof y == "string") {
      y = ("" + y).toLowerCase();
    }
    return x < y ? -1 : x > y ? 1 : 0;
  });
}

const maps_raw = [
  {
    name: "Google Maps",
    category: MISC_CATEGORY,
    default_check: true,
    domain: "google.com",
    getUrl(lat, lon, zoom) {
      return (
        "https://www.google.com/maps/@" + lat + "," + lon + "," + zoom + "z"
      );
    },
    getLatLonZoom(url) {
      let match;
      if (
        (match = url.match(
          /google.*maps.*@(-?\d[0-9.]*),(-?\d[0-9.]*),(\d{1,2})[.z]/
        ))
      ) {
        const [, lat, lon, zoom] = match;
        return [lat, lon, zoom];
      } else if (
        (match = url.match(
          /google.*maps.*@(-?\d[0-9.]*),(-?\d[0-9.]*),(\d[0-9.]*)[m]/
        ))
      ) {
        let [, lat, lon, zoom] = match;
        zoom = Math.round(-1.4436 * Math.log(zoom) + 26.871);
        return [lat, lon, zoom];
      } else if (
        (match = url.match(
          /google.*maps.*@(-?\d[0-9.]*),(-?\d[0-9.]*),([0-9]*)[a],[0-9.]*y/
        ))
      ) {
        let [, lat, lon, zoom] = match;
        zoom = Math.round(-1.44 * Math.log(zoom) + 27.5);
        return [lat, lon, zoom];
      }
    },
  },
  {
		// https://www.strava.com/maps/global-heatmap?style=light&terrain=false&sport=StandUpPaddling&gColor=hot&gOpacity=100&labels=true&poi=true#11.05/46.9717/15.0214
		name: "STRAVA Heatmap SUP",
		category: WATER_CATEGORY,
		default_check: true,
		domain: "strava.com",
		description: "Heatmap of all athletes",
		getUrl(lat, lon, zoom) {
			return "https://www.strava.com/maps/global-heatmap?style=light&terrain=false&sport=StandUpPaddling&gColor=hot&gOpacity=100&labels=true&poi=true#" + zoom + "/" + lat + "/" + lon ;
		},
		getLatLonZoom(url) {
			const match = url.match(/www\.strava\.com\/maps\/global-heatmap\?.*#(\d[0-9.]*)\/(-?\d[0-9.]*)\/(-?\d[0-9.]*)/);
			if (match) {
				const [, zoom, lat, lon] = match;
				return [lat, lon, Math.round(Number(zoom))];
			}
		},
	},
  {
    name: "Bing",
    category: MISC_CATEGORY,
    default_check: true,
    domain: "www.bing.com",
    getUrl(lat, lon, zoom) {
      // https://learn.microsoft.com/en-us/bingmaps/articles/create-a-custom-map-url#collections-categories
      return "https://www.bing.com/maps?cp=" + lat + "~" + lon + "&lvl=" + zoom;
    },
    getLatLonZoom(url) {
      // https://www.bing.com/maps?q=Grindav%C3%ADk&FORM=HDRSC6&cp=63.825761%7E-22.17778&lvl=10.7
      const match = url.match(
        /www\.bing\.com\/maps.*cp=(-?\d[0-9.]*)%7E(-?\d[0-9.]*)&lvl=(-?\d[0-9.]*)/
      );
      if (match) {
        let [, lat, lon, zoom] = match;
        zoom = Math.round(zoom);
        return [lat, lon, zoom];
      }
    },
  },
  {
    name: "OpenStreetMap",
    category: OSM_CATEGORY,
    default_check: true,
    domain: "openstreetmap.org",
    getUrl(lat, lon, zoom) {
      return (
        "https://www.openstreetmap.org/#map=" + zoom + "/" + lat + "/" + lon
      );
    },
    getLatLonZoom(url) {
      const match = url.match(
        /www\.openstreetmap\.org.*map=(\d{1,2})\/(-?\d[0-9.]*)\/(-?\d[0-9.]*)/
      );
      if (match) {
        const [, zoom, lat, lon] = match;
        return [lat, lon, zoom];
      }
    },
  },
  {
    name: "Mapillary",
    category: POI_CATEGORY,
    default_check: true,
    domain: "mapillary.com",
    description: "Crowdsourced street-level imagery available as CC BY-SA",
    getUrl(lat, lon, zoom) {
      return (
        "https://www.mapillary.com/app/?lat=" +
        lat +
        "&lng=" +
        lon +
        "&z=" +
        zoom
      );
    },
    getLatLonZoom(url) {
      const match = url.match(
        /www\.mapillary\.com.*lat=(-?\d[0-9.]*)&lng=(-?\d[0-9.]*)&z=(\d{1,2})/
      );
      if (match) {
        const [, lat, lon, zoom] = match;
        return [lat, lon, zoom];
      }
    },
  },
  {
    
    // pastvu.com?g=48.630047,19.333774&z=12&s=osm&t=kosmosnimki&type=1
    name: "PastVu",
    category: POI_CATEGORY,
    default_check: true,
    domain: "pastvu.com",
    description: "Retro View",
    getUrl(lat, lon, zoom) {
      return (
        "https://pastvu.com?g=" +
        lat +
        "," +
        lon +
        "&z=" +
        zoom +
        "&s=osm&t=kosmosnimki&type=1"
      );
    },
    getLatLonZoom(url) {
      // https://pastvu.com/?g=50.1542,20.0450&z=11&s=osm&t=kosmosnimki&type=1
      const match = url.match(
        /pastvu\.com\/\?g=(-?\d[0-9.]*),(-?\d[0-9.]*)(?:&z=(\d{1,2}))?/
      );
      if (match) {
        let [, lat, lon, zoom] = match;
        zoom = Math.round(zoom);
        return [lat, lon, zoom];
      }
    },
  },
  {
    // https://wikishootme.toolforge.org/#lat=54.55513064540956&lng=13.396533653140068&zoom=13&layers=commons,flickr,geo_json,wikidata_image
    name: "WikiShootMe",
    category: POI_CATEGORY,
    default_check: true,
    domain: "wikishootme.toolforge.org",
    description: "Wikimedia, Flickr",
    getUrl(lat, lon, zoom) {
      return (
        "https://wikishootme.toolforge.org/#lat=" +
        lat +
        "&lng=" +
        lon +
        "&zoom=" +
        zoom +
        "&layers=commons,flickr,geo_json,wikidata_image"
      );
    },
    getLatLonZoom(url) {
      const match = url.match(
        /wikishootme\.toolforge\.org\/#lat=(-?\d[0-9.]*)&lng=(-?\d[0-9.]*)&zoom=(\d{1,2})/
      );
      if (match) {
        let [, lat, lon, zoom] = match;
        zoom = Math.round(zoom);
        return [lat, lon, zoom];
      }
    },
  },
  {
    // https://wandrer.earth/dashboard/map#11.01/45.6868/8.1221
    name: "Wandrer",
    category: CYCLING_CATEGORY,
    default_check: true,
    domain: "wandrer.earth",
    description: "Hike Ride done",
    getUrl(lat, lon, zoom) {
      return (
        "https://wandrer.earth/dashboard/map#" +
        zoom +
        "/" +
        lat +
        "/" +
        lon
      );
    },
    getLatLonZoom(url) {
      const match = url.match(
        /wandrer\.earth\/dashboard\/map#(\d[0-9.]*)\/(-?\d[0-9.]*)\/(-?\d[0-9.]*)/
      );
      if (match) {
        let [, zoom, lat, lon] = match;
        zoom = Math.round(zoom);
        return [lat, lon, zoom];
      }
    },
  },
  {
    // https://map.osm.wikidata.link/map/16/48.2343/16.293?radius=5
    name: "OWL Map",
    category: OSM_CATEGORY,
    default_check: true,
    domain: "map.osm.wikidata.link",
    description: "Wikidata items",
    getUrl(lat, lon, zoom) {
      return (
        "https://map.osm.wikidata.link/map/" +
        zoom +
        "/" +
        lat +
        "/" +
        lon +
        "?radius=5"
      );
    },
    getLatLonZoom(url) {
      const match = url.match(
        /map\.osm\.wikidata\.link\/map\/(\d[0-9.]*)\/(-?\d[0-9.]*)\/(-?\d[0-9.]*)/
      );
      if (match) {
        let [, zoom, lat, lon] = match;
        zoom = Math.round(zoom);
        return [lat, lon, zoom];
      }
    },
  },
  {
    // https://opentripmap.com/en/#14.25/53.2868/12.9567
    name: "Open Trip",
    category: POI_CATEGORY,
    default_check: true,
    domain: "opentripmap.com",
    description: "Sightseeing, POI",
    getUrl(lat, lon, zoom) {
      return (
        "https://opentripmap.com/en/#" +
        zoom +
        "/" +
        lat +
        "/" +
        lon
      );
    },
    getLatLonZoom(url) {
      const match = url.match(
        /opentripmap\.com\/en\/#(\d[0-9.]*)\/(-?\d[0-9.]*)\/(-?\d[0-9.]*)/
      );
      if (match) {
        let [, zoom, lat, lon] = match;
        zoom = Math.round(zoom);
        return [lat, lon, zoom];
      }
    },
  },
  {
    // https://waterwaymap.org/#map=9.04/46.7192/17.3936&tiles=planet-waterway-name-group-name&len=5..inf
    name: "WaterWayMap",
    category: WATER_CATEGORY,
    default_check: true,
    domain: "waterwaymap.org",
    description: "by lenght, navigatable",
    getUrl(lat, lon, zoom) {
      return (
        "https://waterwaymap.org/#map=" +
        zoom +
        "/" +
        lat +
        "/" +
        lon +
        "&tiles=planet-waterway-name-group-name&len=5..inf"
      );
    },
    getLatLonZoom(url) {
      const match = url.match(
        /waterwaymap\.org\/#map=(-?\d[0-9.]*)\/(-?\d[0-9.]*)\/(-?\d[0-9.]*)/
      );
      if (match) {
        let [, zoom, lat, lon] = match;
        zoom = Math.round(zoom);
        return [lat, lon, zoom];
      }
    },
  },
  {
    // https://www.flosm.org/de/Wassersport.html?lat=4.88779867&lon=7.08481579&r=238418.58&st=0&sw=anchorage,beacon,boathoist,boatyard,canoe,canoeing,crane,dock,ferryroute,ferrystop,ferryterminal,harbour,harbourmaster,marina,marinaberth,mooring,mooringbuoy,mooringitem,mooringprivate,pier,portfacilityberth,portfacilityoffice,rowing,seamarkbeacon,seamarkbuoy,seamarknotice,separationzone,shipwreck,slipway,watermotorboat,waternoboat,waterpoint,waterrowboat,watership,waterwayfuel,waterwayguide,waterwaylockgate,waterwayweir

    name: "flosm",
    category: WATER_CATEGORY,
    default_check: true,
    domain: "flosm.org",
    description: "Watersport",
    getUrl(lat, lon, zoom) {
      return (
        "https://www.flosm.org/de/Wassersport.html?lat=" +
        lat +
        "&lon=" +
        lon +
        "&r=" +
        getRadiusForZoomLevel(zoom) +
        "&st=0&sw=anchorage,beacon,boathoist,boatyard,canoe,canoeing,crane,dock,ferryroute,ferrystop,ferryterminal,harbour,harbourmaster,marina,marinaberth,mooring,mooringbuoy,mooringitem,mooringprivate,pier,portfacilityberth,portfacilityoffice,rowing,seamarkbeacon,seamarkbuoy,seamarknotice,separationzone,shipwreck,slipway,watermotorboat,waternoboat,waterpoint,waterrowboat,watership,waterwayfuel,waterwayguide,waterwaylockgate,waterwayweir"
      );
    },
    getLatLonZoom(url) {
      const match = url.match(
        /flosm\.org\/de\/Wassersport\.html\?lat=(-?\d[0-9.]*)&lon=(-?\d[0-9.]*)&r=(-?\d[0-9.]*)/
      );
      if (match) {
        let [, lat, lon, radius] = match;
        zoom = getZoomLevel(radius);
        zoom = Math.round(zoom);
        return [lat, lon, zoom];
      }
    },
  },
  {
    // https://www.elwis.de/DE/Karte/?zoom=8&center=10.630644%2C52.41405&vl=route%2Csluice%2Cftm_group%2Cftm_nolimit%2Cftm_limit%2Cftm_obstru%2Cftm_warning%2Ckarte_farbig&date_start=2024-04-19&date_end=2024-05-19&route_option=bsf
    name: "ELWIS",
    category: WATER_CATEGORY,
    default_check: true,
    domain: "elwis.de",
    description: "Wasserstraßen DE",
    getUrl(lat, lon, zoom) {
      return (
        "https://www.elwis.de/DE/Karte/?zoom=" +
        zoom +
        "&center=" +
        lon +
        "%2C" +
        lat +
        "&vl=route%2Csluice%2Cftm_group%2Cftm_nolimit%2Cftm_limit%2Cftm_obstru%2Cftm_warning%2Ckarte_farbig&route_option=bsf"
      );
    },
    getLatLonZoom(url) {
      const match = url.match(
        /elwis\.de\/.*\/\?zoom=(-?\d[0-9.]*)&center=(-?\d[0-9.]*)%2C(-?\d[0-9.]*)/
      );
      if (match) {
        let [, zoom, lon, lat] = match;
        zoom = Math.round(zoom);
        return [lat, lon, zoom];
      }
    },
  },
  {
    // https://maps.grade.de/cemt.html#10/47.487550/16.964598
    name: "Grade.de",
    category: WATER_CATEGORY,
    default_check: true,
    domain: "grade.de",
    description: "by lenght, navigatable",
    getUrl(lat, lon, zoom) {
      return "https://maps.grade.de/cemt.html#" + zoom + "/" + lat + "/" + lon;
    },
    getLatLonZoom(url) {
      const match = url.match(
        /maps\.grade\.de\/cemt\.html#(\d[0-9.]*)\/(-?\d[0-9.]*)\/(-?\d[0-9.]*)/
      );
      if (match) {
        let [, zoom, lat, lon] = match;
        // zoom = Math.round(zoom);
        return [lat, lon, zoom];
      }
    },
  },
  {
    name: "OpenStreetCam",
    category: POI_CATEGORY,
    default_check: true,
    domain: "openstreetcam.org",
    description: "Crowdsourced street-level imagery available as CC BY-SA",
    getUrl(lat, lon, zoom) {
      return (
        "https://openstreetcam.org/map/@" + lat + "," + lon + "," + zoom + "z"
      );
    },
    getLatLonZoom(url) {
      const match = url.match(
        /openstreetcam\.org.*@(-?\d[0-9.]*),(-?\d[0-9.]*),(\d{1,2})/
      );
      if (match) {
        const [, lat, lon, zoom] = match;
        return [lat, lon, zoom];
      }
    },
  },
  {
    name: "AlpenvereinActiv",
    category: OUTDOOR_CATEGORY,
    default_check: true,
    domain: "alpenvereinaktiv.com",
    description: "more than OA",
    // https://www.alpenvereinaktiv.com/de/touren/#caml=668,2lh8fe,7ld5ae,0,0&cat=*&filter=b-onlyTopTours-1,r-fullyTranslatedLangus-,r-openState-,sb-sortedBy-0&fu=1&ov=alerts,images,webcams&zc=9,14.75052,46.08657
    getUrl(lat, lon, zoom) {
      return (
        "https://www.alpenvereinaktiv.com/de/touren/#caml=668,2lh8fe,7ld5ae,0,0&cat=*&filter=b-onlyTopTours-1,r-fullyTranslatedLangus-,r-openState-,sb-sortedBy-0&fu=1&ov=alerts,images,webcams&zc=" +
        zoom +
        "," +
        lon +
        "," +
        lat
      );
    },
    getLatLonZoom(url) {
      const match = url.match(
        /alpenvereinaktiv\.com\/.*?zc=(\d{1,2}),(-?\d[0-9.]*),(-?\d[0-9.]*)/
      );
      if (match) {
        let [, zoom, lon, lat] = match;
        return [lat, lon, zoom];
      }
    },
  },
  {
    name: "XC-Ski OA",
    category: WINTER_CATEGORY,
    default_check: true,
    domain: "outdooractive.com",
    description: "XC Routes",
    // https://www.outdooractive.com/en/routes/#cat=Cross-Country%20Skiing&filter=r-fullyTranslatedLangus-,r-onlyOpened-,sb-sortedBy-0&fu=1&zc=12,12.36923,46.70884
    getUrl(lat, lon, zoom) {
      return (
        "https://www.outdooractive.com/en/routes/#cat=Cross-Country%20Skiing&filter=r-fullyTranslatedLangus-,r-onlyOpened-,sb-sortedBy-0&fu=1&zc=" +
        zoom +
        "," +
        lon +
        "," +
        lat
      );
    },
    getLatLonZoom(url) {
      const match = url.match(
        /outdooractive\.com\/.*?zc=(\d{1,2}),(-?\d[0-9.]*),(-?\d[0-9.]*)/
      );
      if (match) {
        let [, zoom, lon, lat] = match;
        return [lat, lon, zoom];
      }
    },
  },
  {
    name: "OutdoorActive",
    category: OUTDOOR_CATEGORY,
    default_check: true,
    domain: "outdooractive.com",
    description: "Tours for multiple Sports",
    getUrl(lat, lon, zoom) {
      return (
        "https://www.outdooractive.com/en/map/#bm=osm%3Asummer&fu=1&zc=" +
        zoom +
        "," +
        lon +
        "," +
        lat
      );
    },
    getLatLonZoom(url) {
      const match = url.match(
        /outdooractive\.com\/.*?zc=(\d{1,2}),(-?\d[0-9.]*),(-?\d[0-9.]*)/
      );
      if (match) {
        let [, zoom, lon, lat] = match;
        return [lat, lon, zoom];
      }
    },
  },
  {
    name: "Freemap.sk",
    category: OUTDOOR_CATEGORY,
    default_check: true,
    domain: "freemap.sk",
    description: "Map and Features for Sk",
    getUrl(lat, lon, zoom) {
      return (
        "https://www.freemap.sk/?map=" +
        zoom +
        "/" +
        lat +
        "/" +
        lon +
        "&layers=X"
      );
    },
    getLatLonZoom(url) {
      const match = url.match(
        /freemap\.sk\/.*?map=(\d{1,2})\/(-?\d[0-9.]*)\/(-?\d[0-9.]*)/
      );
      if (match) {
        let [, zoom, lat, lon] = match;
        return [lat, lon, zoom];
      }
    },
  },
  {
    name: "Wikiloc",
    category: OUTDOOR_CATEGORY,
    default_check: true,
    domain: "wikiloc.com",
    description: "Trail & Waypoint Community",
    getUrl(lat, lon, zoom) {
      const [minlon, minlat, maxlon, maxlat] = latLonZoomToBbox(lat, lon, zoom);
      return (
        "https://www.wikiloc.com/wikiloc/map.do?sw=" +
        minlat +
        "%2C" +
        minlon +
        "&ne=" +
        maxlat +
        "%2C" +
        maxlon +
        "&page=1"
      );
    },
    getLatLonZoom(url) {
      const match = url.match(
        /wikiloc\.com\/.*?sw=(-?\d[0-9.]+)%2C(-?\d[0-9.]+)&ne=(-?\d[0-9.]+)%2C(-?\d[0-9.]+)/
      );
      if (match) {
        let [, minlat, minlon, maxlat, maxlon] = match;
        let [lat, lon, zoom] = bboxToLatLonZoom(minlon, minlat, maxlon, maxlat);
        return [lat, lon, zoom];
      }
    },
  },
  {
    name: "Waymarked Trails",
    category: OUTDOOR_CATEGORY,
    default_check: true,
    domain: "hiking.waymarkedtrails.org",
    description: "Show hiking, cycling, ski routes",
    getUrl(lat, lon, zoom) {
      return (
        "https://hiking.waymarkedtrails.org/#?map=" +
        zoom +
        "!" +
        lat +
        "!" +
        lon
      );
    },
    getLatLonZoom(url) {
      const match = url.match(
        /waymarkedtrails\.org\/#.*\?map=(-?\d[0-9.]*)\/(-?\d[0-9.]*)\/(-?\d[0-9.]*)/
      );
      if (match) {
        let [, zoom, lat, lon] = match;
        zoom = Math.round(zoom);
        return [lat, lon, zoom];
      }
    },
  },
  {
    name: "Stellplatz.Info",
    category: CAMPER_CATEGORY,
    default_check: true,
    domain: "stellplatz.info",
    description: "like Camping.info App",
    getUrl(lat, lon, zoom) {
      const [minlon, minlat, maxlon, maxlat] = latLonZoomToBbox(lat, lon, zoom);
      return (
        "https://stellplatz.info/reisemobilstellplatz?map=" +
        minlat +
        "," +
        minlon +
        "," +
        maxlat +
        "," +
        maxlon
      );
    },
    getLatLonZoom(url) {
      const match = url.match(
        /stellplatz\.info\/.*?map=(-?\d[0-9.]*),(-?\d[0-9.]*),(-?\d[0-9.]*),(-?\d[0-9.]*)/
      );
      if (match) {
        let [, minlat, minlon, maxlat, maxlon] = match;
        let [lat, lon, zoom] = bboxToLatLonZoom(minlon, minlat, maxlon, maxlat);
        return [lat, lon, zoom];
      }
    },
  },
  {
    name: "DualMaps",
    category: TOOLS_CATEGORY,
    default_check: true,
    domain: "mapchannels.com",
    description: "synchronized Maps, Aerial & Street View",
    getUrl(lat, lon, zoom) {
      return (
        "https://www.mapchannels.com/dualmaps7/map.htm?lat=" +
        lat +
        "&lng=" +
        lon +
        "&z=" +
        zoom +
        "&slat=" +
        lat +
        "&slng=" +
        lon
      );
    },
    getLatLonZoom(url) {
      const match = url.match(
        /mapchannels\.com\/.*?lat=(-?\d[0-9.]*)&lng=(-?\d[0-9.]*)&z=(\d{1,2})&slat=(-?\d[0-9.]*)&slng=(-?\d[0-9.]*)/
      );
      if (match) {
        let [, lat, lon, zoom] = match;
        return [lat, lon, zoom];
      }
    },
  },
  {
    name: "Camping.Info",
    category: CAMPER_CATEGORY,
    default_check: true,
    domain: "camping.info",
    description: "like Stellplatz.info",
    getUrl(lat, lon, zoom) {
      const [minlon, minlat, maxlon, maxlat] = latLonZoomToBbox(lat, lon, zoom);
      return (
        "https://www.camping.info/en/search-on-map?area=" +
        minlon +
        "," +
        minlat +
        "," +
        maxlon +
        "," +
        maxlat
      );
    },
    getLatLonZoom(url) {
      const match = url.match(
        /camping\.info\/.*?area=(-?\d[0-9.]*),(-?\d[0-9.]*),(-?\d[0-9.]*),(-?\d[0-9.]*)&zl=(\d{1,2})/
      );
      if (match) {
        let [, minlon, minlat, maxlon, maxlat, zoom] = match;
        let [lat, lon, dummy] = bboxToLatLonZoom(
          minlon,
          minlat,
          maxlon,
          maxlat
        );
        return [lat, lon, zoom];
      }
    },
  },
  {
    name: "BRouter Web",
    category: CYCLING_CATEGORY,
    default_check: true,
    domain: "brouter.de",
    description: "Misc Maps, Custom Layer Overpass & XYZ",
    getUrl(lat, lon, zoom) {
      return (
        "https://brouter.de/brouter-web/#map=" +
        zoom +
        "/" +
        lat +
        "/" +
        lon +
        "/MtbMap"
      );
    },
    getLatLonZoom(url) {
      const match = url.match(
        /brouter\.de\/.*#map=(\d{1,2})\/(-?\d[0-9.]*)\/(-?\d[0-9.]*)/
      );
      if (match) {
        const [, zoom, lat, lon] = match;
        return [lat, lon, zoom];
      }
    },
  },
  {
    name: "BRouter Grade.de",
    category: WATER_CATEGORY,
    default_check: true,
    domain: "grade.de",
    description: "Waterway Routing",
    getUrl(lat, lon, zoom) {
      return (
        "https://brouter.grade.de/#map=" +
        zoom +
        "/" +
        lat +
        "/" +
        lon +
        "/CARTO,Seamarks,Wasserstrassenklassen,Bevaarbaarheid,Vaarweginformatie,route-quality&profile=river_canoe"
      );
    },
    getLatLonZoom(url) {
      const match = url.match(
        /brouter\.grade\.de\/.*#map=(\d{1,2})\/(-?\d[0-9.]*)\/(-?\d[0-9.]*)/
      );
      if (match) {
        const [, zoom, lat, lon] = match;
        return [lat, lon, zoom];
      }
    },
  },
  {
		// https://www.norgeskart.no/#!?project=norgeskart&layers=1002&zoom=13&lat=6649044.14&lon=262775.36
		name: "Norgeskart",
		category: OUTDOOR_CATEGORY,
		default_check: true,
		domain: "www.norgeskart.no",
		description: "Outdoor, POI",
		getUrl(lat, lon, zoom) {
			return "https://www.norgeskart.no/#!?project=norgeskart&layers=1002,1013,1014,1015,1016,1017,1018,1019,1020,1021,1022,1023&zoom=" + zoom + "&lat=" + lat + "&lon=" + lon;
		},
		getLatLonZoom(url) {
			const match = url.match(/www\.norgeskart\.no.*#.*layers=1002.*([0-9.]*)\/(-?\d[0-9.]*)\/(-?\d[0-9.]*)/);

			if (match) {
				const [, zoom, lat, lon] = match;
				return [lat, normalizeLon(lon), Math.round(Number(zoom))];
			}
		},
	},
  {
    name: "Flussinfo",
    category: WATER_CATEGORY,
    default_check: true,
    domain: "flussinfo.net",
    description: "North Germany only",
    getUrl(lat, lon, zoom) {
      return (
        "https://www.flussinfo.net/map/#" + zoom + "/" + lat + "/" + lon + ""
      );
    },
    getLatLonZoom(url) {
      const match = url.match(
        /flussinfo\.net\/map\/#(\d{1,2})\/(-?\d[0-9.]*)\/(-?\d[0-9.]*)/
      );
      if (match) {
        const [, zoom, lat, lon] = match;
        return [lat, lon, zoom];
      }
    },
  },
  {
    name: "Bikerouter",
    category: CYCLING_CATEGORY,
    default_check: true,
    domain: "bikerouter.de",
    description: "Best bicycle routing on this planet",
    // https://bikerouter.de/#map=14/47.0777/15.4904/bikerouter-outdoors,gravel-overlay&profile=m11n-gravel-pre
    getUrl(lat, lon, zoom) {
      return (
        "https://bikerouter.de/#map=" +
        zoom +
        "/" +
        lat +
        "/" +
        lon +
        "/bikerouter-outdoors,gravel-overlay&profile=m11n-gravel-pre"
      );
    },
    getLatLonZoom(url) {
      const match = url.match(
        /bikerouter\.de\/.*#map=(\d{1,2})\/(-?\d[0-9.]*)\/(-?\d[0-9.]*)/
      );
      if (match) {
        const [, zoom, lat, lon] = match;
        return [lat, lon, zoom];
      }
    },
  },
  {
    // https://umap.openstreetmap.fr/en/map/campermap_514529#15/47.4796122/15.7503233
    name: "CamperMap",
    category: CAMPER_CATEGORY,
    default_check: true,
    domain: "umap.openstreetmap.fr",
    description: "Camper POIs",
    getUrl(lat, lon, zoom) {
      return (
        "https://umap.openstreetmap.fr/en/map/campermap_514529#" +
        zoom +
        "/" +
        lat +
        "/" +
        lon
      );
    },
    getLatLonZoom(url) {
      const match = url.match(
        /umap\.openstreetmap\.fr\/en\/map\/campermap_514529#(\d{1,2})\/(-?\d[0-9.]*)\/(-?\d[0-9.]*)/
      );
      if (match) {
        const [, zoom, lat, lon] = match;
        return [lat, lon, zoom];
      }
    },
  },
  {
    // https://opencampingmap.org/#15/47.4777/15.7536/0/0
    name: "OpenCamping",
    category: CAMPER_CATEGORY,
    default_check: true,
    domain: "opencampingmap.org",
    description: "Camping Sites",
    getUrl(lat, lon, zoom) {
      return "https://opencampingmap.org/#" + zoom + "/" + lat + "/" + lon;
    },
    getLatLonZoom(url) {
      const match = url.match(
        /opencampingmap\.org\/#(\d{1,2})\/(-?\d[0-9.]*)\/(-?\d[0-9.]*)/
      );
      if (match) {
        const [, zoom, lat, lon] = match;
        return [lat, lon, zoom];
      }
    },
  },
  {
    // https://openskimap.org/#15.01/47.47717/15.75636
    name: "OpenSkiMap",
    category: WINTER_CATEGORY,
    default_check: true,
    domain: "openskimap.org",
    description: "Ski Slopes, Nordic Ski Trails",
    getUrl(lat, lon, zoom) {
      return "https://openskimap.org/#" + zoom + "/" + lat + "/" + lon;
    },
    getLatLonZoom(url) {
      const match = url.match(
        /openskimap\.org\/.*#(-?\d[0-9.]*)\/(-?\d[0-9.]*)\/(-?\d[0-9.]*)/
      );
      if (match) {
        let [, zoom, lat, lon] = match;
        zoom = Math.round(zoom);
        return [lat, lon, zoom];
      }
    },
  },
  {
    // https://www.komoot.com/plan/@47.9126603,16.4678192,10z
    name: "Komoot Plan",
    category: OUTDOOR_CATEGORY,
    default_check: true,
    domain: "komoot.com",
    description: "Plan for multiple Sports",
    getUrl(lat, lon, zoom) {
      zoom = Math.round(zoom);
      return (
        "https://www.komoot.com/plan/@" + lat + "," + lon + "," + zoom + "z"
      );
    },
    getLatLonZoom(url) {
      const match = url.match(
        /komoot\.com\/plan\/@(-?\d[0-9.]*),(-?\d[0-9.]*),(\d{1,2})/
      );
      if (match) {
        const [, lat, lon, zoom] = match;
        return [lat, lon, zoom];
      }
    },
  },
  {
    // https://www.komoot.com/discover/Location/@46.8331821%2C15.9810184/tours?sport=racebike&distance=30
    name: "Komoot Discover",
    category: OUTDOOR_CATEGORY,
    default_check: true,
    domain: "komoot.com",
    description: "Discover for multiple Sports",
    getUrl(lat, lon, zoom) {
      zoom = Math.round(zoom);
      return "https://www.komoot.com/discover/Location/@" + lat + "," + lon;
    },
    getLatLonZoom(url) {
      const match = url.match(
        /komoot\.com\/discover\/Location\/@(-?\d[0-9.]*)%2C(-?\d[0-9.]*)/
      );
      if (match) {
        const [, lat, lon] = match;
        return [lat, lon, 12];
      }
    },
  },
  {
    // https://www.refuges.info/nav#lat=47.08286082279579&lon=15.447260141372682&zoom=17
    name: "Refuges Info",
    category: OUTDOOR_CATEGORY,
    default_check: true,
    domain: "refuges.info",
    description: "Refuges, Parking, Busstation, Water",
    getUrl(lat, lon, zoom) {
      zoom = Math.round(zoom);
      return (
        "https://www.refuges.info/nav#lat=" +
        lat +
        "&" +
        lon +
        "&lon=" +
        lon +
        "&zoom=" +
        zoom
      );
    },
    // https://www.refuges.info/nav?map=16/15.9197/46.876
    getLatLonZoom(url) {
      const match = url.match(
        /refuges\.info\/.*?map=(\d{1,2})\/(-?\d[0-9.]*)\/(-?\d[0-9.]*)/
      );
      if (match) {
        const [, zoom, lon, lat] = match;
        return [lat, lon, zoom];
      }
    },
  },
  {
    name: "Park4night",
    category: CAMPER_CATEGORY,
    default_check: true,
    domain: "park4night.com",
    description: "Discover Overnight Parking",
    getUrl(lat, lon, zoom) {
      zoom = Math.round(zoom);
      return (
        "https://park4night.com/de/search?lat=" +
        lat +
        "&lng=" +
        lon +
        "&z=" +
        zoom
      );
    },
    getLatLonZoom(url) {
      const match = url.match(
        /park4night\.com\/.*?lat=(-?\d[0-9.]*)&lng=(-?\d[0-9.]*)&z=(\d{1,2})/
      );
      if (match) {
        const [, lat, lon, zoom] = match;
        return [lat, lon, zoom];
      }
    },
  },

  {
    // https://en.mapy.cz/turisticka?l=0&x=12.9337801&y=53.1855514&z=14&ovl=2%2C4
    name: "Mapy.cz",
    category: OUTDOOR_CATEGORY,
    default_check: true,
    domain: "mapy.cz",
    description: "Outdoor with geotagged Pics",
    getUrl(lat, lon, zoom) {
      return (
        "https://en.mapy.cz/turisticka?l=0&x=" +
        lon +
        "&y=" +
        lat +
        "&z=" +
        zoom +
        "&ovl=2%2C4"
      );
    },
    getLatLonZoom(url) {
      const match = url.match(
        /en\.mapy\.cz\/.*x=(-?\d[0-9.]*)&y=(-?\d[0-9.]*)&z=(\d{1,2})/
      );
      if (match) {
        const [, lon, lat, zoom] = match;
        return [lat, lon, zoom];
      }
    },
  },
  {
    // https://zoom.earth/#view=47.479649,15.750171,15z
    name: "Zoom Earth",
    category: SATELLITE_CATEGORY,
    default_check: true,
    domain: "zoom.earth",
    description: "Daily Sat Images",
    getUrl(lat, lon, zoom) {
      return "https://zoom.earth/#view=" + lat + "," + lon + "," + zoom + "z";
    },
    getLatLonZoom(url) {
      const match = url.match(
        /zoom\.earth\/#view=(-?\d[0-9.]*),(-?\d[0-9.]*),(\d{1,2})z/
      );
      if (match) {
        let [, lat, lon, zoom] = match;
        return [lat, lon, zoom];
      }
    },
  },
  {
    name: "mtbmap.cz",
    category: CYCLING_CATEGORY,
    default_check: true,
    domain: "mtbmap.cz",
    description: "Mountain Bike Map",
    getUrl(lat, lon, zoom) {
      return "https://mtbmap.cz/#zoom=" + zoom + "&lat=" + lat + "&lon=" + lon;
    },
    getLatLonZoom(url) {
      const match = url.match(
        /mtbmap\.cz.*#zoom=(\d{1,2})&lat=(-?\d[0-9.]*)&lon=(-?\d[0-9.]*)/
      );
      if (match) {
        let [, zoom, lat, lon] = match;
        return [lat, lon, zoom];
      }
    },
  },
  {
    name: "XS Trails (XC)",
    category: WINTER_CATEGORY,
    default_check: true,
    domain: "xctrails.org",
    description: "Cross Country Skiing",
    getUrl(lat, lon, zoom) {
      return (
        "https://www.xctrails.org/map/map.html?lat=" +
        lat +
        "&lon=" +
        lon +
        "&zoom=" +
        zoom +
        "&type=xc"
      );
    },
    getLatLonZoom(url) {
      const match = url.match(
        /www\.xctrails\.org.*lat=(-?\d[0-9.]*)&lon=(-?\d[0-9.]*)&zoom=(\d{1,2})/
      );
      if (match) {
        let [, lat, lon, zoom] = match;
        return [lat, lon, zoom];
      }
    },
  },
  {
    name: "XS Trails (Climb)",
    category: OUTDOOR_CATEGORY,
    default_check: true,
    domain: "xctrails.org",
    description: "Rock Climbing",
    getUrl(lat, lon, zoom) {
      return (
        "https://www.xctrails.org/map/map.html?lat=" +
        lat +
        "&lon=" +
        lon +
        "&zoom=" +
        zoom +
        "&type=allferrata"
      );
    },
    getLatLonZoom(url) {
      const match = url.match(
        /www\.xctrails\.org.*lat=(-?\d[0-9.]*)&lon=(-?\d[0-9.]*)&zoom=(\d{1,2})/
      );
      if (match) {
        let [, lat, lon, zoom] = match;
        return [lat, lon, zoom];
      }
    },
  },
  {
    name: "XS Trails (Ski)",
    category: WINTER_CATEGORY,
    default_check: true,
    domain: "xctrails.org",
    description: "Backcountry Ski Mountaineering",
    getUrl(lat, lon, zoom) {
      return (
        "https://www.xctrails.org/map/map.html?lat=" +
        lat +
        "&lon=" +
        lon +
        "&zoom=" +
        zoom +
        "&type=skitour"
      );
    },
    getLatLonZoom(url) {
      const match = url.match(
        /www\.xctrails\.org.*lat=(-?\d[0-9.]*)&lon=(-?\d[0-9.]*)&zoom=(\d{1,2})/
      );
      if (match) {
        let [, lat, lon, zoom] = match;
        return [lat, lon, zoom];
      }
    },
  },
  {
    name: "Overpass-turbo",
    category: OSM_CATEGORY,
    default_check: true,
    domain: "overpass-turbo.eu",
    description: "Power search tool for OpenStreetMap data",
    getUrl(lat, lon, zoom) {
      return "https://overpass-turbo.eu/?Q=&C=" + lat + ";" + lon + ";" + zoom;
    },
  },
  {
    name: "Osmose",
    category: OSM_CATEGORY,
    default_check: false,
    domain: "osmose.openstreetmap.fr",
    description: "OSM QA tool",
    getUrl(lat, lon, zoom) {
      return (
        "https://osmose.openstreetmap.fr/map/#zoom=" +
        zoom +
        "&lat=" +
        lat +
        "&lon=" +
        lon
      );
    },
    getLatLonZoom(url) {
      const match = url.match(
        /osmose\.openstreetmap\.fr.*#zoom=(\d{1,2})&lat=(-?\d[0-9.]*)&lon=(-?\d[0-9.]*)/
      );
      if (match) {
        const [, zoom, lat, lon] = match;
        return [lat, lon, zoom];
      }
    },
  },
  {
    name: "KeepRight",
    category: OSM_CATEGORY,
    default_check: false,
    domain: "keepright.at",
    description: "OpenStreetMap QA tool",
    getUrl(lat, lon, zoom) {
      if (Number(zoom) > 18) zoom = 18;
      return (
        "https://www.keepright.at/report_map.php?zoom=" +
        zoom +
        "&lat=" +
        lat +
        "&lon=" +
        lon
      );
    },
    getLatLonZoom(url) {
      const match = url.match(
        /keepright\.at.*?zoom=(\d{1,2})&lat=(-?\d[0-9.]*)&lon=(-?\d[0-9.]*)/
      );
      if (match) {
        let [, zoom, lat, lon] = match;
        return [lat, lon, zoom];
      }
    },
  },
  {
    name: "OSM Inspector",
    category: OSM_CATEGORY,
    default_check: false,
    domain: "tools.geofabrik.de",
    description: "OpenStreetMap QA tool",
    getUrl(lat, lon, zoom) {
      if (Number(zoom) > 18) zoom = 18;
      return (
        "https://tools.geofabrik.de/osmi/?view=geometry&lon=" +
        lon +
        "&lat=" +
        lat +
        "&zoom=" +
        zoom
      );
    },
    getLatLonZoom(url) {
      const match = url.match(
        /tools\.geofabrik\.de.*lon=(-?\d[0-9.]*)&lat=(-?\d[0-9.]*)&zoom=(\d{1,2})/
      );
      if (match) {
        let [, lon, lat, zoom] = match;
        return [lat, lon, zoom];
      }
    },
  },
  {
    name: "Who did it?",
    category: OSM_CATEGORY,
    default_check: true,
    domain: "simon04.dev.openstreetmap.org",
    description: "OpenStreetMap QA tool",
    getUrl(lat, lon, zoom) {
      if (Number(zoom) > 18) zoom = 18;
      if (Number(zoom) < 12) zoom = 12;
      return (
        "https://simon04.dev.openstreetmap.org/whodidit/?zoom=" +
        zoom +
        "&lat=" +
        lat +
        "&lon=" +
        lon
      );
    },
    getLatLonZoom(url) {
      const match = url.match(
        /simon04\.dev\.openstreetmap\.or.*?zoom=(\d{1,2})&lat=(-?\d[0-9.]*)&lon=(-?\d[0-9.]*)/
      );
      if (match) {
        let [, zoom, lat, lon] = match;
        return [lat, lon, zoom];
      }
    },
  },
  {
    name: "Map compare",
    category: TOOLS_CATEGORY,
    default_check: true,
    domain: "tools.geofabrik.de",
    description: "Compare maps side-by-side",
    getUrl(lat, lon, zoom) {
      return "https://tools.geofabrik.de/mc/#" + zoom + "/" + lat + "/" + lon;
    },
    getLatLonZoom(url) {
      const match = url.match(
        /tools\.geofabrik\.de\/mc\/#(\d{1,2})\/(-?\d[0-9.]*)\/(-?\d[0-9.]*)/
      );
      if (match) {
        const [, zoom, lat, lon] = match;
        return [lat, lon, zoom];
      }
    },
  },
  {
    name: "Multimapas",
    category: TOOLS_CATEGORY,
    default_check: false,
    domain: "javier.jimenezshaw.com",
    description: "Compare maps by overlay",
    getUrl(lat, lon, zoom) {
      return (
        "https://javier.jimenezshaw.com/mapas/mapas.html?z=" +
        zoom +
        "&c=" +
        lat +
        "," +
        lon
      );
    },
    getLatLonZoom(url) {
      const match = url.match(
        /javier\.jimenezshaw\.com\/mapas\/mapas\.html\?z=(\d{1,2})&c=(-?\d[0-9.]*),(-?\d[0-9.]*)/
      );
      if (match) {
        let [, zoom, lat, lon] = match;
        return [lat, lon, zoom];
      }
    },
  },
  {
    name: "map.orhyginal",
    category: MISC_CATEGORY,
    default_check: true,
    domain: "orhyginal.fr",
    description: "Portal of many map services",
    getUrl(lat, lon, zoom) {
      return "https://map.orhyginal.fr/#" + zoom + "/" + lat + "/" + lon;
    },
    getLatLonZoom(url) {
      const match = url.match(
        /map\.orhyginal\.fr.*#(\d[0-9]*)\/(-?\d[0-9.]*)\/(-?\d[0-9.]*)/
      );
      if (match) {
        const [, zoom, lat, lon] = match;
        return [lat, lon, zoom];
      }
    },
  },
  {
    name: "NaKarte",
    category: OUTDOOR_CATEGORY,
    default_check: true,
    domain: "nakarte.me",
    description: "Heatmaps, Panorama, Streetview, ...",
    getUrl(lat, lon, zoom) {
      return (
        "https://nakarte.me/#m=" +
        zoom +
        "/" +
        lat +
        "/" +
        lon +
        "&l=Czt/Sr&n2=_gwmc"
      );
    },
    getLatLonZoom(url) {
      const match = url.match(
        /nakarte\.me\/#m=(\d{1,2})\/(-?\d[0-9.]*)\/(-?\d[0-9.]*)/
      );
      if (match) {
        let [, zoom, lat, lon] = match;
        return [lat, lon, zoom];
      }
    },
  },
  {
    name: "Trailforks",
    category: OUTDOOR_CATEGORY,
    default_check: true,
    domain: "trailforks.com",
    description: "Outdoor Sport Trails",
    getUrl(lat, lon, zoom) {
      return (
        "https://www.trailforks.com/map/?z=" +
        zoom +
        "&lat=" +
        lat +
        "&lon=" +
        lon
      );
    },
    getLatLonZoom(url) {
      const match = url.match(
        /trailforks\.com\/map\/\?z=(-?\d[0-9.]*)&lat=(-?\d[0-9.]*)&lon=(-?\d[0-9.]*)/
      );
      if (match) {
        let [, zoom, lat, lon] = match;
        return [lat, lon, zoom];
      }
    },
  },
  {
    // https://www.ventusky.com/?p=47.477;15.749;15&l=temperature-2m&t=20210110/12
    name: "Ventusky",
    category: WEATHER_CATEGORY,
    default_check: true,
    domain: "ventusky.com",
    description: "Weather, Wind, Snow, Waves, Rain, ...",
    getUrl(lat, lon, zoom) {
      // return 'https://www.ventusky.com/?p=' + lat + ';' + lon + ';' + zoom;
      return "https://www.ventusky.com/?p=" + lat + ";" + lon + ";10";
    },
    getLatLonZoom(url) {
      const match = url.match(
        /ventusky\.com\/\?p=(-?\d[0-9.]*);(-?\d[0-9.]*);(\d{1,2})/
      );
      if (match) {
        let [, lat, lon, zoom] = match;
        return [lat, lon, zoom];
      }
    },
  },
  {
    // https://www.meteoblue.com/en/weather/webmap/?mapcenter=-49.7529N-4.6143&zoom=4
    // https://www.meteoblue.com/en/weather/webmap/46.915N15.024E1464_Europe%2FVienna?variable=precipitation3h_cloudcover_pressure&level=surface&lines=none&mapcenter=43.6619N16.5502&zoom=10
    name: "Meteoblue",
    category: WEATHER_CATEGORY,
    description: "7d Forecast, Maps Wind, Snow, Waves, Rain, ...",
    default_check: true,
    domain: "meteoblue.com",
    getUrl(lat, lon, zoom) {
      return (
        "https://www.meteoblue.com/en/weather/webmap/?mapcenter=" +
        lat +
        "N" +
        lon +
        "&zoom=" +
        zoom
      );
    },
    getLatLonZoom(url) {
      const match = url.match(
        /meteoblue\.com\/.*?mapcenter=(-?\d[0-9.]*)N(-?\d[0-9.]*)&zoom=(\d{1,2})/
      );
      if (match) {
        let [, lat, lon, zoom] = match;
        return [lat, lon, zoom];
      }
    },
  },
  {
    name: "Meteoblue Multi",
    category: WEATHER_CATEGORY,
    description: "Multi Model 7d Forecast",
    default_check: true,
    domain: "meteoblue.com",
    getUrl(lat, lon, zoom) {
      return (
        "https://www.meteoblue.com/en/weather/forecast/multimodel/" +
        lat +
        "N" +
        lon +
        "E"
      );
    },
    getLatLonZoom(url) {
      const match = url.match(
        /meteoblue\.com\/.*multimodel\/(-?\d[0-9.]*)[NS](-?\d[0-9.]*)[EW]/
      );
      if (match) {
        let [, lat, lon] = match;
        return [lat, lon, 12];
      }
    },
  },
  {
    name: "Windy",
    category: WEATHER_CATEGORY,
    description: "WebCams on WeatherMap",
    default_check: true,
    domain: "windy.com",
    getUrl(lat, lon, zoom) {
      return (
        "https://www.windy.com/webcams/map?" + lat + "," + lon + "," + zoom
      );
    },
    getLatLonZoom(url) {
      const match = url.match(
        /windy\.com.*\/webcams\/.*\?(-?\d[0-9.]*),(-?\d[0-9.]*),(\d{1,2}),/
      );
      if (match) {
        let [, lat, lon, zoom] = match;
        return [lat, lon, zoom];
      }
    },
  },
  {
    // https://www.bergfex.at/?mapstate=47.091212,15.260954,11,o,430,47.420654,13.1286
    name: "Bergfex",
    category: OUTDOOR_CATEGORY,
    description: "Topo, Tracks, Tourism",
    default_check: true,
    domain: "bergfex.at",
    getUrl(lat, lon, zoom) {
      const [minlon, minlat, maxlon, maxlat] = latLonZoomToBbox(lat, lon, zoom);
      return (
        "https://www.bergfex.at?mapstate=" +
        minlat +
        "," +
        minlon +
        "," +
        zoom +
        ",o,430," +
        maxlat +
        "," +
        maxlon
      );
    },
    getLatLonZoom(url) {
      const match = url.match(
        /bergfex\.at\/.*\?mapstate=?(-?\d[0-9.]*),(-?\d[0-9.]*),(\d{1,2}),/
      );
      if (match) {
        let [, lat, lon, zoom] = match;
        return [lat, lon, zoom];
      }
    },
  },
  {
    // https://www.4umaps.com/map.htm?zoom=14&lat=46.72587&lon=14.46407&layers=B00
    name: "4umaps",
    category: OUTDOOR_CATEGORY,
    description: "Topo, Trail difficulty",
    default_check: false,
    domain: "4umaps.com",
    getUrl(lat, lon, zoom) {
      return (
        "https://www.4umaps.com/map.htm?zoom=" +
        zoom +
        "&lat=" +
        lat +
        "&lon=" +
        lon +
        "&layers=B00"
      );
    },
    getLatLonZoom(url) {
      const match = url.match(
        /4umaps\.com\/map.htm\?zoom=(\d{1,2})&lat=(-?\d[0-9.]*)&lon=(-?\d[0-9.]*)&layers=B00/
      );
      if (match) {
        let [, zoom, lat, lon] = match;
        return [lat, lon, zoom];
      }
    },
  },
  {
    name: "BigMap 2 (Print)",
    category: TOOLS_CATEGORY,
    default_check: false,
    domain: "osmz.ru",
    description: "Obtain a composed big map image",
    getUrl(lat, lon, zoom) {
      return (
        "https://bigmap.osmz.ru/index.html#map=" + zoom + "/" + lat + "/" + lon
      );
    },
    getLatLonZoom(url) {
      const match = url.match(
        /bigmap\.osmz\.ru.*#map=(\d{1,2})\/(-?\d[0-9.]*)\/(-?\d[0-9.]*)/
      );
      if (match) {
        let [, zoom, lat, lon] = match;
        return [lat, lon, zoom];
      }
    },
  },
  {
    name: "Satellite Tracker 3D",
    category: POI_CATEGORY,
    default_check: false,
    domain: "stdkmd.net",
    description: "Satellite tracker",
    getUrl(lat, lon, zoom) {
      const d = Math.round(Math.exp((Number(zoom) - 17.7) / -1.4));
      return (
        "https://stdkmd.net/sat/?cr=" + d + "&lang=en&ll=" + lat + "%2C" + lon
      );
    },
    getLatLonZoom(url) {
      const match = url.match(
        /stdkmd\.net\/sat\/\?cr=(\d{1,2}).*&ll=(-?\d[0-9.]*)%2C(-?\d[0-9.]*)/
      );
      if (match) {
        let [, zoom, lat, lon] = match;
        return [lat, lon, 15];
      }
    },
  },
  {
    name: "earth",
    category: WEATHER_CATEGORY,
    default_check: true,
    domain: "earth.nullschool.net",
    description: "Wind, Ocean, Chem, Particulates",
    getUrl(lat, lon, zoom) {
      return (
        "https://earth.nullschool.net/#current/wind/surface/level/orthographic=" +
        lon +
        "," +
        lat +
        "," +
        11.1 * zoom ** 3.12
      );
    },
    getLatLonZoom(url) {
      const match = url.match(
        /earth\.nullschool\.net.*orthographic=(-?\d[0-9.]*),(-?\d[0-9.]*),(\d[0-9]*)/
      );
      if (match) {
        let [, lon, lat, zoom] = match;
        zoom = Math.round((zoom / 11.1) ** (1 / 3.12));
        return [lat, lon, zoom];
      }
    },
  },
  {
    name: "Windy.com",
    category: WEATHER_CATEGORY,
    default_check: true,
    domain: "windy.com",
    description: "Wind, Ocean, Chem, Particulates",
    getUrl(lat, lon, zoom) {
      return (
        "https://www.windy.com/?" +
        Number(lat).toFixed(3) +
        "," +
        Number(lon).toFixed(3) +
        "," +
        Math.round(zoom) +
        ",i:pressure"
      );
    },
    getLatLonZoom(url) {
      const match = url.match(
        /www\.windy\.com.*[,\?](-?\d[0-9.]+),(-?\d[0-9.]+),(\d{1,2})/
      );
      if (match) {
        const [, lat, lon, zoom] = match;
        return [lat, lon, zoom];
      }
    },
  },
  {
    name: "flightradar24",
    category: POI_CATEGORY,
    default_check: false,
    domain: "flightradar24.com",
    description: "Airplane tracker",
    getUrl(lat, lon, zoom) {
      return (
        "https://www.flightradar24.com/" +
        Math.round(lat * 100) / 100 +
        "," +
        Math.round(lon * 100) / 100 +
        "/" +
        Math.round(zoom)
      );
    },
    getLatLonZoom(url) {
      const match = url.match(
        /flightradar24\.com.*\/(-?\d[0-9.]*),(-?\d[0-9.]*)\/(\d{1,2})/
      );
      if (match) {
        const [, lat, lon, zoom] = match;
        return [lat, lon, zoom];
      }
    },
  },
  {
    name: "Traze",
    category: POI_CATEGORY,
    default_check: false,
    domain: "traze.app",
    description: "Train tracker",
    getUrl(lat, lon, zoom) {
      return "https://traze.app/#/@" + lat + "," + lon + "," + zoom;
    },
    getLatLonZoom(url) {
      const match = url.match(
        /traze\.app\/#\/@(-?\d[0-9.]*),(-?\d[0-9.]*),(\d{1,2})/
      );
      if (match) {
        let [, lat, lon, zoom] = match;
        return [lat, lon, Math.round(zoom)];
      }
    },
  },
  {
    name: "MarineTraffic",
    category: POI_CATEGORY,
    default_check: false,
    domain: "marinetraffic.com",
    description: "Ship tracker",
    getUrl(lat, lon, zoom) {
      return (
        "https://www.marinetraffic.com/en/ais/home/centerx:" +
        lon +
        "/centery:" +
        lat +
        "/zoom:" +
        zoom
      );
    },
    getLatLonZoom(url) {
      const match = url.match(
        /www\.marinetraffic\.com.*centerx:(-?\d[0-9.]*)\/centery:(-?\d[0-9.]*)\/zoom:(\d{1,2})/
      );
      if (match) {
        const [, lon, lat, zoom] = match;
        return [lat, lon, zoom];
      }
    },
  },
  {
    name: "CyclOSM",
    category: CYCLING_CATEGORY,
    default_check: true,
    description: "for Cyclists",
    domain: "cyclosm.org",
    getUrl(lat, lon, zoom) {
      return (
        "https://www.cyclosm.org/#map=" +
        zoom +
        "/" +
        lat +
        "/" +
        lon +
        "/cyclosm"
      );
    },
    getLatLonZoom(url) {
      const match = url.match(
        /www\.cyclosm\.org\/#map=(\d{1,2})\/(-?\d[0-9.]*)\/(-?\d[0-9.]*)\/cyclosm/
      );
      if (match) {
        let [, zoom, lat, lon] = match;
        return [lat, lon, zoom];
      }
    },
  },

  {
    // https://opentopomap.org/#map=15/47.47960/15.75030
    name: "OpenTopoMap",
    category: OUTDOOR_CATEGORY,
    default_check: true,
    domain: "opentopomap.org",
    getUrl(lat, lon, zoom) {
      return "https://opentopomap.org/#map=" + zoom + "/" + lat + "/" + lon;
    },
    getLatLonZoom(url) {
      const match = url.match(
        /opentopomap\.org\/#map=(\d{1,2})\/(-?\d[0-9.]*)\/(-?\d[0-9.]*)/
      );
      if (match) {
        let [, zoom, lat, lon] = match;
        return [lat, lon, zoom];
      }
    },
  },
  {
    name: "EO Browser",
    category: SATELLITE_CATEGORY,
    default_check: true,
    domain: "sentinel-hub.com",
    description: "Satellite sensing image viewer",
    getUrl(lat, lon, zoom) {
      return (
        "https://apps.sentinel-hub.com/eo-browser/?lat=" +
        lat +
        "&lng=" +
        lon +
        "&zoom=" +
        zoom
      );
    },
    getLatLonZoom(url) {
      const match = url.match(
        /apps\.sentinel-hub\.com\/eo-browser\/\?zoom=(\d{1,2})&lat=(-?\d[0-9.]*)&lng=(-?\d[0-9.]*)/
      );
      if (match) {
        let [, zoom, lat, lon] = match;
        return [lat, lon, zoom];
      }
    },
  },
  {
    // https://macrostrat.org/map/layers#x=13.5264&y=46.9266&z=7.9&show=fossils,geology
    name: "Macrostrat",
    category: WEATHER_CATEGORY,
    default_check: true,
    domain: "macrostrat.org",
    description: "Geological map",
    getUrl(lat, lon, zoom) {
      return (
        "https://macrostrat.org/map/#x=" +
        lon +
        "&y=" +
        lat +
        "&z=" +
        zoom +
        "&show=fossils,geology"
      );
    },
    getLatLonZoom(url) {
      const match = url.match(
        /macrostrat\.org\/map\/.*#x=([0-9.]+)&y=(-?\d[0-9.]+)&z=(-?\d[0-9.]+)/
      );
      if (match) {
        let [, lon, lat, zoom] = match;
        return [lat, lon, Math.round(zoom)];
      }
    },
  },
  {
    name: "Old maps online",
    category: MISC_CATEGORY,
    default_check: false,
    domain: "oldmapsonline.org",
    getUrl(lat, lon, zoom) {
      const [minlon, minlat, maxlon, maxlat] = latLonZoomToBbox(lat, lon, zoom);
      return (
        "https://www.oldmapsonline.org/#bbox=" +
        minlon +
        "," +
        minlat +
        "," +
        maxlon +
        "," +
        maxlat +
        "&q=&date_from=0&date_to=9999&scale_from=&scale_to="
      );
    },
    getLatLonZoom(url) {
      const match = url.match(
        /www\.oldmapsonline\.org\/.*#bbox=(-?\d[0-9.]+),(-?\d[0-9.]+),(-?\d[0-9.]+),(-?\d[0-9.]+)/
      );
      if (match) {
        let [, minlon, minlat, maxlon, maxlat] = match;
        let [lat, lon, zoom] = bboxToLatLonZoom(minlon, minlat, maxlon, maxlat);
        return [lat, lon, zoom];
      }
    },
  },
  {
    name: "Wikimedia maps",
    category: POI_CATEGORY,
    default_check: true,
    domain: "wikimedia.org",
    getUrl(lat, lon, zoom) {
      return "https://maps.wikimedia.org/#" + zoom + "/" + lat + "/" + lon;
    },
    getLatLonZoom(url) {
      const match = url.match(
        /maps\.wikimedia\.org\/#(\d[0-9]*)\/(-?\d[0-9.]*)\/(-?\d[0-9.]*)/
      );
      if (match) {
        let [, zoom, lat, lon] = match;
        let lonnumber = Number(lon);
        if (lonnumber < -180) lonnumber += 360;
        return [lat, lonnumber, zoom];
      }
    },
  },
  {
    name: "Open Infrastructure",
    category: MISC_CATEGORY,
    default_check: false,
    domain: "openinframap.org",
    description: "World's hidden infrastructure (Train, Power, Mobile, ...)",
    getUrl(lat, lon, zoom) {
      return "https://openinframap.org/#" + zoom + "/" + lat + "/" + lon;
    },
    getLatLonZoom(url) {
      const match = url.match(
        /openinframap\.org\/#(\d[0-9.]*)\/(-?\d[0-9.]*)\/(-?\d[0-9.]*)/
      );
      if (match) {
        let [, zoom, lat, lon] = match;
        zoom = Math.round(Number(zoom));
        return [lat, lon, zoom];
      }
    },
  },
  {
    name: "OSM Buildings",
    category: MISC_CATEGORY,
    default_check: false,
    domain: "osmbuildings.org",
    getUrl(lat, lon, zoom) {
      return (
        "https://osmbuildings.org/?lat=" +
        lat +
        "&lon=" +
        lon +
        "&zoom=" +
        zoom +
        "&tilt=30"
      );
    },
    getLatLonZoom(url) {
      const match = url.match(
        /osmbuildings\.org\/\?lat=(-?\d[0-9.]*)&lon=(-?\d[0-9.]*)&zoom=(\d[0-9.]*)/
      );
      if (match) {
        let [, zoom, lat, lon] = match;
        zoom = Math.round(Number(zoom));
        return [lat, lon, zoom];
      }
    },
  },

  {
    name: "openrouteservice",
    category: ROUTER_CATEGORY,
    default_check: true,
    domain: "openrouteservice.org",
    getUrl(lat, lon, zoom) {
      return (
        "https://maps.openrouteservice.org/directions?n1=" +
        lat +
        "&n2=" +
        lon +
        "&n3=" +
        zoom
      );
    },
    getLatLonZoom(url) {
      const match = url.match(
        /maps\.openrouteservice\.org\/directions\?n1=(-?\d[0-9.]*)&n2=(-?\d[0-9.]*)&n3=(\d{1,2})/
      );
      if (match) {
        let [, lat, lon, zoom] = match;
        return [lat, lon, zoom];
      }
    },
  },
  {
    name: "OpenRailwayMap",
    category: MISC_CATEGORY,
    default_check: false,
    domain: "openrailwaymap.org",
    getUrl(lat, lon, zoom) {
      return (
        "https://www.openrailwaymap.org/?lat=" +
        lat +
        "&lon=" +
        lon +
        "&zoom=" +
        zoom
      );
    },
  },
  {
    name: "OpenAerialMap",
    category: SATELLITE_CATEGORY,
    default_check: false,
    domain: "openaerialmap.org",
    getUrl(lat, lon, zoom) {
      return "https://map.openaerialmap.org/#/" + lon + "," + lat + "," + zoom;
    },
    getLatLonZoom(url) {
      const match = url.match(
        /map\.openaerialmap\.org\/#\/(-?\d[0-9.]*),(-?\d[0-9.]*),(\d{1,2})/
      );
      if (match) {
        let [, lon, lat, zoom] = match;
        return [lat, lon, zoom];
      }
    },
  },
  {
    //https://mapwith.ai/rapid#background=fb-mapwithai-maxar&disable_features=boundaries&map=17.60/38.00488/140.85905
    name: "Launch RapiD editor",
    category: OSM_CATEGORY,
    default_check: false,
    domain: "mapwith.ai",
    description: "Facebook AI assisted OSM editor",
    getUrl(lat, lon, zoom) {
      return (
        "https://mapwith.ai/rapid#background=fb-mapwithai-maxar&disable_features=boundaries&map=" +
        zoom +
        "/" +
        lat +
        "/" +
        lon
      );
    },
    getLatLonZoom(url) {
      const match = url.match(
        /mapwith\.ai\/rapid.*&map=(\d[0-9.]*)\/(-?\d[0-9.]*)\/(-?\d[0-9.]*)/
      );
      if (match) {
        const [, zoom, lat, lon] = match;
        return [lat, lon, Math.round(Number(zoom))];
      }
    },
  },
  {
    name: "waze",
    category: ROUTER_CATEGORY,
    default_check: false,
    domain: "waze.com",
    description: "Crowdsourced route navigation map",
    getUrl(lat, lon, zoom) {
      return (
        "https://www.waze.com/ul?ll=" +
        lat +
        "%2C" +
        lon +
        "&navigate=yes&zoom=" +
        zoom
      );
    },
    getLatLonZoom(url) {
      const match = url.match(
        /waze\.com\/.*?latlng=(-?\d[0-9.]*)%2C(-?\d[0-9.]*).*&zoom=(\d{1,2})/
      );
      if (match) {
        let [, lon, lat, zoom] = match;
        return [lat, lon, zoom];
      }
    },
  },
  {
    name: "here maps",
    category: ROUTER_CATEGORY,
    default_check: false,
    domain: "here.com",
    getUrl(lat, lon, zoom) {
      return (
        "https://wego.here.com/?map=" + lat + "," + lon + "," + zoom + ",normal"
      );
    },
    getLatLonZoom(url) {
      const match = url.match(
        /wego\.here\.com\/\?map=(-?\d[0-9.]*),(-?\d[0-9.]*),(\d{1,2})/
      );
      if (match) {
        const [, lat, lon, zoom] = match;
        return [lat, lon, zoom];
      }
    },
  },
  {
    // https://wikimap.wiki/?base=map&lat=1427437.5129&lon=7044822.2419&showAll=true&wiki=dewiki&zoom=11
    name: "wikimap",
    category: POI_CATEGORY,
    default_check: true,
    domain: "wikimap.wiki",
    description: "Wikipedia POI",
    getUrl(lat, lon, zoom) {
      const [mlon, mlat] = wgs84ToWebMercator(lat,lon);
      return "https://wikimap.wiki/?base=map&lat=" + mlat + "&lon=" + mlon + "&zoom=" + zoom + "&showAll=true&wiki=dewiki";
    },
    getLatLonZoom(url) {
      const match = url.match(
        /wikimap\.wiki\/.*&lat=(-?\d[0-9.]*)&lon=(-?\d[0-9.]*).*&zoom=(\d{1,2})/
      );
      if (match) {
        const [, mlat, mlon, zoom] = match;
        const [lat, lon] = webMercatorToWGS84(mlon, mlat);
        return [lat, lon, zoom];
      }
    },
  },
  {
    name: "wikimapia",
    category: POI_CATEGORY,
    default_check: false,
    domain: "wikimapia.org",
    description: "multilingual open-content collaborative map",
    getUrl(lat, lon, zoom) {
      return "https://wikimapia.org/#lat=" + lat + "&lon=" + lon + "&z=" + zoom;
    },
    getLatLonZoom(url) {
      const match = url.match(
        /wikimapia\.org\/#.*&lat=(-?\d[0-9.]*)&lon=(-?\d[0-9.]*)&z=(\d{1,2})/
      );
      if (match) {
        const [, lat, lon, zoom] = match;
        return [lat, lon, zoom];
      }
    },
  },
  {
    name: "Copernix (POI)",
    category: POI_CATEGORY,
    default_check: false,
    domain: "copernix.io",
    description: "Show POIs from Wikipedia",
    getUrl(lat, lon, zoom) {
      return (
        "https://copernix.io/#?where=" +
        lon +
        "," +
        lat +
        "," +
        zoom +
        "&?query=&?map_type=roadmap"
      );
    },
    getLatLonZoom(url) {
      const match = url.match(
        /copernix\.io\/#\?where=(-?\d[0-9.]*),(-?\d[0-9.]*),(\d{1,2})/
      );
      if (match) {
        const [, lon, lat, zoom] = match;
        return [lat, lon, zoom];
      }
    },
  },
  {
    name: "GeoHack",
    category: POI_CATEGORY,
    default_check: true,
    domain: "wmflabs.org",
    description: "Map links for Wikipedia articles",
    getUrl(lat, lon, zoom) {
      //https://www.mediawiki.org/wiki/GeoHack
      return (
        "https://tools.wmflabs.org/geohack/geohack.php?params=" +
        lat +
        "_N_" +
        lon +
        "_E_scale:" +
        Math.round(100000 * Math.pow(2, 12 - Number(zoom)))
      );
    },
    getLatLonZoom(url) {
      const match = url.match(
        /geohack.toolforge\.org\/geohack\.php\?params=(-?\d[0-9.]*)_N_(-?\d[0-9.]*)/
      );
      if (match) {
        let [, lat, lon] = match;
        return [lat, lon, 15];
      }
    },
  },
  {
    name: "Google Earth",
    category: SATELLITE_CATEGORY,
    default_check: true,
    domain: "earth.google.com",
    getUrl(lat, lon, zoom) {
      let d = Math.exp((zoom - 27) / -1.44);
      return "https://earth.google.com/web/@" + lat + "," + lon + "," + d + "d";
    },
    getLatLonZoom(url) {
      let match;
      match = url.match(
        /earth\.google\.com\/web\/@(-?\d[0-9.]*),(-?\d[0-9.]*),(-?\d[0-9.]*)a,(-?\d[0-9.]*)d/
      );
      if (match) {
        let [, lat, lon, , zoom] = match;
        zoom = Math.round(-1.44 * Math.log(zoom) + 27);
        return [lat, lon, zoom];
      }
    },
  },
  {
    // https://livingatlas.arcgis.com/wayback/#active=6543&mapCenter=-115.29850%2C36.06400%2C14
    name: "ArcGIS Wayback",
    category: SATELLITE_CATEGORY,
    default_check: true,
    domain: "arcgis.com",
    description: "Historic satellite images since 2014",
    getUrl(lat, lon, zoom) {
      return ("https://livingatlas.arcgis.com/wayback/#active=6543&mapCenter=" +
        lon +
        "%2C" +
        lat +
        "%2C" + 
        zoom
      );
    },
    getLatLonZoom(url) {
      const match = url.match(
        /livingatlas\.arcgis\.com\/wayback.*mapCenter=(-?\d[0-9.]*)%2C(-?\d[0-9.]*)%2C(\d{1,2})/
      );
      if (match) {
        const [, lon, lat, zoom] = match;
        return [lat, lon, zoom];
      }
    },
  },
  {
    name: "OpenGeofiction",
    category: MISC_CATEGORY,
    default_check: false,
    domain: "opengeofiction.net",
    description: "Crowdsoured fictional map",
    getUrl(lat, lon, zoom) {
      return "https://opengeofiction.net/#map=" + zoom + "/" + lat + "/" + lon;
    },
    getLatLonZoom(url) {
      const match = url.match(
        /opengeofiction\.net.*map=(\d{1,2})\/(-?\d[0-9.]*)\/(-?\d[0-9.]*)/
      );
      if (match) {
        const [, zoom, lat, lon] = match;
        return [lat, lon, zoom];
      }
    },
  },
  {
    name: "Twitter",
    category: MISC_CATEGORY,
    default_check: false,
    domain: "twitter.com",
    description: "Twitter location based search",
    getUrl(lat, lon, zoom) {
      return (
        "https://twitter.com/search?q=geocode%3A" + lat + "%2C" + lon + "%2C5km"
      );
      //5km should be modified based on zoom level
    },
  },
  {
    name: "flickr",
    category: MISC_CATEGORY,
    default_check: true,
    domain: "flickr.com",
    description: "Geotagged image search",
    getUrl(lat, lon, zoom) {
      return (
        "https://www.flickr.com/map?&fLat=" +
        lat +
        "&fLon=" +
        lon +
        "&zl=" +
        zoom
      );
    },
    getLatLonZoom(url) {
      const match = url.match(
        /flickr\.com\/map\?&fLat=(-?\d[0-9.]*)&fLon=(-?\d[0-9.]*)&zl=(\d{1,2})/
      );
      if (match) {
        let [, lon, lat, zoom] = match;
        return [lat, lon, zoom];
      }
    },
  },
  {
    // https://osm-analytics.org/#/show/bbox:136.68676,34.81081,137.11142,34.93364/buildings/recency
    name: "OpenStreetMap Analytics",
    category: OSM_CATEGORY,
    default_check: false,
    domain: "osm-analytics.org",
    description: "Analyse when/who edited the OSM data in a specific region",
    getUrl(lat, lon, zoom) {
      [minlon, minlat, maxlon, maxlat] = latLonZoomToBbox(lat, lon, zoom);
      return (
        "https://osm-analytics.org/#/show/bbox:" +
        minlon +
        "," +
        minlat +
        "," +
        maxlon +
        "," +
        maxlat +
        "/buildings/recency"
      );
    },
    getLatLonZoom(url) {
      const match = url.match(
        /osm-analytics\.org\/#\/show\/bbox:(-?\d[0-9.]*),(-?\d[0-9.]*),(-?\d[0-9.]*),(-?\d[0-9.]*)/
      );
      if (match) {
        let [, minlon, minlat, maxlon, maxlat] = match;
        [lat, lon, zoom] = bboxToLatLonZoom(minlon, minlat, maxlon, maxlat);
        return [lat, lon, zoom];
      }
    },
  },
  {
    //https://firms.modaps.eosdis.nasa.gov/map/#z:9;c:139.9,35.7;d:2020-01-06..2020-01-07
    name: "FIRMS (Fire)",
    category: WEATHER_CATEGORY,
    default_check: false,
    domain: "nasa.gov",
    description: "Realtime fire information of satellite observation",
    getUrl(lat, lon, zoom) {
      let z = Number(zoom);
      if (z > 14) z = 14;
      return (
        "https://firms.modaps.eosdis.nasa.gov/map/#z:" +
        z +
        ";c:" +
        normalizeLon(lon) +
        "," +
        lat
      );
    },
    getLatLonZoom(url) {
      const match = url.match(
        /firms\.modaps\.eosdis\.nasa\.gov\/map\/#z:(\d{1,2});c:(-?\d[0-9.]*),(-?\d[0-9.]*)/
      );
      if (match) {
        const [, zoom, lon, lat] = match;
        return [lat, lon, zoom];
      }
    },
  },
  {
    //https://www.openstreetbrowser.org/#map=16/35.3512/139.5310
    name: "OpenStreetBrowser",
    category: POI_CATEGORY,
    default_check: true,
    domain: "openstreetbrowser.org",
    description: "OSM POI viewer",
    getUrl(lat, lon, zoom) {
      return (
        "https://www.openstreetbrowser.org/#map=" + zoom + "/" + lat + "/" + lon
      );
    },
    getLatLonZoom(url) {
      const match = url.match(
        /www\.openstreetbrowser\.org\/#map=(\d{1,2})\/(-?\d[0-9.]*)\/(-?\d[0-9.]*)/
      );
      if (match) {
        const [, zoom, lat, lon] = match;
        return [lat, lon, zoom];
      }
    },
  },
  {
    name: "Kontur",
    category: OSM_CATEGORY,
    default_check: false,
    domain: "disaster.ninja",
    description: "See most active OSM contributor",
    getUrl(lat, lon, zoom) {
      return (
        "https://disaster.ninja/live/#overlays=bivariate-custom_kontur_openstreetmap_quantity,osm-users;id=GDACS_TC_1000654_2;position=" +
        lon +
        "," +
        lat +
        ";zoom=" +
        zoom
      );
    },
    getLatLonZoom(url) {
      const match = url.match(
        /disaster\.ninja\/live\/#.*position=(-?\d[0-9.]*),(-?\d[0-9.]*);zoom=(\d{1,2})/
      );

      if (match) {
        const [, lon, lat, zoom] = match;
        return [lat, lon, zoom];
      }
    },
  },
  {
    //https://www.peakfinder.org/?lat=46.6052&lng=8.3217&azi=0&zoom=4&ele=1648
    name: "PeakFinder",
    category: OUTDOOR_CATEGORY,
    default_check: true,
    domain: "peakfinder.org",
    description: "Mountain landscape view map",
    getUrl(lat, lon, zoom) {
      return (
        "https://www.peakfinder.org/?lat=" +
        lat +
        "&lng=" +
        lon +
        "&azi=0&zoom=" +
        zoom
      );
    },
    getLatLonZoom(url) {
      const match = url.match(
        /www\.peakfinder\.org\/.*\?lat=(-?\d[0-9.]*)&lng=(-?\d[0-9.]*)&azi=[0-9]*&zoom=(\d[0-9.]*)/
      );
      if (match) {
        const [, lat, lon, zoom] = match;
        return [lat, lon, Math.round(Number(zoom))];
      }
    },
  },
  {
    //https://resultmaps.neis-one.org/osm-change-tiles#14/35.6726/139.7576
    name: "Latest OSM Edits per Tile",
    category: OSM_CATEGORY,
    default_check: false,
    domain: "neis-one.org",
    description: "Latest OpenStreetMap Edits per Tile",
    getUrl(lat, lon, zoom) {
      return (
        "https://resultmaps.neis-one.org/osm-change-tiles#" +
        zoom +
        "/" +
        lat +
        "/" +
        lon
      );
    },
    getLatLonZoom(url) {
      const match = url.match(
        /resultmaps\.neis-one\.org\/osm-change-tiles#(\d[0-9.]*)\/(-?\d[0-9.]*)\/(-?\d[0-9.]*)/
      );
      if (match) {
        const [, zoom, lat, lon] = match;
        return [lat, lon, Math.round(Number(zoom))];
      }
    },
  },
  {
    //https://www.viamichelin.com/web/maps?position=35;135.8353;12
    name: "ViaMichelin",
    category: ROUTER_CATEGORY,
    default_check: false,
    domain: "viamichelin.com",
    description: "Michelin Travel map",
    getUrl(lat, lon, zoom) {
      return (
        "https://www.viamichelin.com/web/maps?position=" +
        lat +
        ";" +
        lon +
        ";" +
        zoom
      );
    },
    getLatLonZoom(url) {
      const match = url.match(
        /viamichelin\.com\/.*\?position=(-?\d[0-9.]*);(-?\d[0-9.]*);(\d{1,2})/
      );
      if (match) {
        let [, lat, lon, zoom] = match;
        return [lat, lon, zoom];
      }
    },
  },
  {
    // https://www.opensnowmap.org/?zoom=15&lat=47.03757&lon=15.4687334#map=15/15.353/47.055&b=snowmap&m=false&h=false
    name: "OpenSnowMap",
    category: WINTER_CATEGORY,
    default_check: true,
    domain: "opensnowmap.org",
    description: "Winter sports map",
    getUrl(lat, lon, zoom) {
      return (
        "https://www.opensnowmap.org/?zoom=" +
        zoom +
        "&lat=" +
        lat +
        "&lon=" +
        lon +
        "#map=" +
        zoom +
        "/" +
        lon +
        "/" +
        lat +
        "&b=snowmap&m=false&h=false"
      );
    },
    getLatLonZoom(url) {
      const match = url.match(
        /opensnowmap\.org\/.*#map=(\d{1,2})\/(-?\d[0-9.]*)\/(-?\d[0-9.]*)/
      );
      if (match) {
        let [, zoom, lon, lat] = match;
        return [lat, lon, zoom];
      }
    },
  },
  {
    //https://www.opencyclemap.org/?zoom=17&lat=43.08561&lon=141.33047
    name: "OpenCycleMap",
    category: CYCLING_CATEGORY,
    default_check: true,
    domain: "opencyclemap.org",
    description: "Cycling map",
    getUrl(lat, lon, zoom) {
      return (
        "https://www.opencyclemap.org/?zoom=" +
        zoom +
        "&lat=" +
        lat +
        "&lon=" +
        lon
      );
    },
    getLatLonZoom(url) {
      const match = url.match(
        /opencyclemap\.org.*\?zoom=(\d{1,2})&lat=(-?\d[0-9.]*)&lon=(-?\d[0-9.]*)/
      );
      if (match) {
        let [, zoom, lat, lon] = match;
        return [lat, lon, zoom];
      }
    },
  },
  {
    //https://gk.historic.place/historische_objekte/translate/en/index-en.html?zoom=5&lat=50.37522&lon=11.5
    name: "Historic Place",
    category: POI_CATEGORY,
    default_check: true,
    domain: "historic.place",
    description: "Historic objects",
    getUrl(lat, lon, zoom) {
      return (
        "https://gk.historic.place/historische_objekte/translate/en/index-en.html?zoom=" +
        zoom +
        "&lat=" +
        lat +
        "&lon=" +
        lon
      );
    },
    getLatLonZoom(url) {
      const match = url.match(
        /gk.historic.place\/historische_objekte\/translate\/en\/index-en.html\?zoom=(\d{1,2})&lat=(-?\d[0-9.]*)&lon=(-?\d[0-9.]*)/
      );
      if (match) {
        let [, zoom, lat, lon] = match;
        return [lat, lon, zoom];
      }
    },
  },
  {
    //https://www.yelp.com/search?l=g%3A139.74862972962964%2C35.60176325581224%2C139.64666287171949%2C35.483875357833384
    name: "yelp",
    category: POI_CATEGORY,
    default_check: false,
    domain: "yelp.com",
    description: "Local reviews",
    getUrl(lat, lon, zoom) {
      const [minlon, minlat, maxlon, maxlat] = latLonZoomToBbox(lat, lon, zoom);
      return (
        "https://www.yelp.com/search?l=g%3A" +
        maxlon +
        "%2C" +
        maxlat +
        "%2C" +
        minlon +
        "%2C" +
        minlat
      );
    },
  },
  {
    //https://map.openseamap.org/?zoom=6&lat=53.32140&lon=2.86829
    name: "OpenSeaMap",
    category: WATER_CATEGORY,
    default_check: true,
    domain: "openseamap.org",
    description: "focus on nautical info",
    getUrl(lat, lon, zoom) {
      return (
        "https://map.openseamap.org/?zoom=" +
        Math.min(Number(zoom), 18) +
        "&lat=" +
        lat +
        "&lon=" +
        lon
      );
    },
    getLatLonZoom(url) {
      const match = url.match(
        /map\.openseamap\.org\/\?zoom=(\d{1,2})&lat=(-?\d[0-9.]*)&lon=(-?\d[0-9.]*)/
      );
      if (match) {
        let [, zoom, lat, lon] = match;
        return [lat, lon, zoom];
      }
    },
  },
  {
    // https://fishing-app.gpsnauticalcharts.com/i-boating-fishing-web-app/fishing-marine-charts-navigation.html#15.87/45.7047/13.7082
    name: "i-boating",
    category: WATER_CATEGORY,
    default_check: true,
    domain: "gpsnauticalcharts.com",
    description: "Marine charts",
    getUrl(lat, lon, zoom) {
      return (
        "https://fishing-app.gpsnauticalcharts.com/i-boating-fishing-web-app/fishing-marine-charts-navigation.html#" +
        zoom +
        "/" +
        lat +
        "/" +
        lon
      );
    },
    getLatLonZoom(url) {
      const match = url.match(
        /fishing-app\.gpsnauticalcharts\.com\/i-boating-fishing-web-app\/fishing-marine-charts-navigation.html#(\d[0-9.]*)\/(-?\d[0-9.]*)\/(-?\d[0-9.]*)/
      );
      if (match) {
        let [, zoom, lat, lon] = match;
        return [lat, lon, zoom];
      }
    },
  },
  {
    //https://earthquake.usgs.gov/earthquakes/map/#{"autoUpdate":["autoUpdate"],"basemap":"grayscale","feed":"1day_m25","listFormat":"default","mapposition":[[32.2313896627376,126.71630859375],[40.421860362045194,143.27270507812497]],"overlays":["plates"],"restrictListToMap":["restrictListToMap"],"search":null,"sort":"newest","timezone":"utc","viewModes":["settings","map"],"event":null}
    name: "USGS earthquakes",
    category: WEATHER_CATEGORY,
    default_check: false,
    domain: "usgs.gov",
    description: "Latest earthquakes",
    getUrl(lat, lon, zoom) {
      const [minlon, minlat, maxlon, maxlat] = latLonZoomToBbox(lat, lon, zoom);
      const url =
        'https://earthquake.usgs.gov/earthquakes/map/#{"autoUpdate":["autoUpdate"],"basemap":"grayscale","feed":"1day_m25","listFormat":"default","mapposition":[[' +
        minlat +
        "," +
        minlon +
        "],[" +
        maxlat +
        "," +
        maxlon +
        ']],"overlays":["plates"],"restrictListToMap":["restrictListToMap"],"search":null,"sort":"newest","timezone":"utc","viewModes":["settings","map"],"event":null}';
      return encodeURI(url);
    },
    getLatLonZoom(url) {
      const decoded = decodeURI(url);
      const match1 = decoded.match(
        /\"mapposition\"%3A\[\[(-?\d[0-9.]*)%2C(-?\d[0-9.]*)\]%2C\[(-?\d[0-9.]*)%2C(-?\d[0-9.]*)\]\]/
      );
      const match2 = decoded.match(
        /\"mapposition\":\[\[(-?\d[0-9.]*),(-?\d[0-9.]*)\],\[(-?\d[0-9.]*),(-?\d[0-9.]*)\]\]/
      );
      let match = false;
      if (match1) match = match1;
      if (match2) match = match2;
      if (match) {
        const [, minlat, minlon, maxlat, maxlon] = match;
        const [lat, lon, zoom] = bboxToLatLonZoom(
          minlon,
          minlat,
          maxlon,
          maxlat
        );
        return [lat, lon, Math.round(Number(zoom))];
      }
    },
  },
  {
    //https://www.openhistoricalmap.org/#map=10/35.6149/139.2593&layers=O
    name: "OpenHistoricalMap",
    category: MISC_CATEGORY,
    default_check: false,
    domain: "openhistoricalmap.org",
    description: "Crowedsourced Historical map",
    getUrl(lat, lon, zoom) {
      return `https://www.openhistoricalmap.org/#map=${zoom}/${lat}/${lon}&layers=O`;
    },
    getLatLonZoom(url) {
      const match = url.match(
        /www\.openhistoricalmap\.org\/#map=(-?\d[0-9.]*)\/(-?\d[0-9.]*)\/(-?\d[0-9.]*)/
      );
      if (match) {
        const [, zoom, lat, lon] = match;
        return [lat, normalizeLon(lon), Math.round(Number(zoom))];
      }
    },
  },
  {
    //https://www.xn--pnvkarte-m4a.de/?#139.781;35.4722;10
    name: "ÖPNVKarte",
    category: MISC_CATEGORY,
    default_check: false,
    domain: "xn--pnvkarte-m4a.de",
    description: "Public transport map",
    getUrl(lat, lon, zoom) {
      return `https://www.xn--pnvkarte-m4a.de/?#${lon};${lat};${zoom}`;
    },
    getLatLonZoom(url) {
      const match = url.match(
        /www\.xn--pnvkarte-m4a\.de\/\?#(-?\d[0-9.]*);(-?\d[0-9.]*);(-?\d[0-9.]*)/
      );
      if (match) {
        const [, lon, lat, zoom] = match;
        return [lat, normalizeLon(lon), Math.round(Number(zoom))];
      }
    },
  },
  {
    //https://www.lightningmaps.org/#m=oss;t=3;s=0;o=0;b=;ts=0;y=35.5065;x=139.8395;z=10;d=2;dl=2;dc=0;
    name: "LightningMaps",
    category: WEATHER_CATEGORY,
    default_check: false,
    domain: "lightningmaps.org",
    description: "Realtime lightning map",
    getUrl(lat, lon, zoom) {
      return `https://www.lightningmaps.org/#m=oss;t=3;s=0;o=0;b=;ts=0;y=${lat};x=${lon};z=${Math.min(
        zoom,
        15
      )};d=2;dl=2;dc=0`;
    },
    getLatLonZoom(url) {
      const match = url.match(
        /lightningmaps\.org\/.*;y=(-?\d[0-9.]*);x=(-?\d[0-9.]*);z=(\d[0-9.]*)/
      );
      if (match) {
        const [, lat, lon, zoom] = match;
        return [lat, normalizeLon(lon), Math.round(Number(zoom))];
      }
    },
  },
  {
    name: "Trail Router",
    category: ROUTER_CATEGORY,
    default_check: true,
    domain: "trailrouter.com",
    description: "Quick Outdoor Roundtrips",
    getUrl(lat, lon, zoom) {
      return `https://trailrouter.com/#wps=${lat},${lon}&ss=&rt=true&td=5000&aus=false&aus2=false&ah=0&ar=true&pga=0.8&im=false`;
    },
    getLatLonZoom(url) {
      const match = url.match(
        /trailrouter\.com\/#wps=(-?\d[0-9.]*),(-?\d[0-9.]*)/
      );
      if (match) {
        let [, lat, lon] = match;
        return [lat, lon, 16];
      }
    },
  },
  {
    //https://cmap.dev/#9/36.0757/139.8477
    name: "cmap.dev Hazard",
    category: WEATHER_CATEGORY,
    default_check: false,
    domain: "cmap.dev",
    description: "Realtime disaster damage estimation",
    getUrl(lat, lon, zoom) {
      return `https://cmap.dev/#${zoom}/${lat}/${lon}`;
    },
    getLatLonZoom(url) {
      const match = url.match(
        /cmap\.dev\/#(\d[0-9.]*)\/(-?\d[0-9.]*)\/(-?\d[0-9.]*)/
      );
      if (match) {
        const [, zoom, lat, lon] = match;
        return [lat, normalizeLon(lon), Math.round(Number(zoom))];
      }
    },
  },
  {
    //https://beacons.schmirler.de/en/world.html#map=11/35.315176983316775/139.7419591178308&layers=OS5&details=18
    name: "Sea Beacons",
    category: WATER_CATEGORY,
    default_check: true,
    domain: "schmirler.de",
    description: "Lighthouse map",
    getUrl(lat, lon, zoom) {
      return `https://beacons.schmirler.de/en/world.html#map=${zoom}/${lat}/${lon}&layers=OS5&details=18`;
    },
    getLatLonZoom(url) {
      const match = url.match(
        /beacons\.schmirler\.de\/([a-z]*)\/world\.html#map=(\d[0-9.]*)\/(-?\d[0-9.]*)\/(-?\d[0-9.]*)/
      );
      if (match) {
        const [, dummy, zoom, lat, lon] = match;
        return [lat, normalizeLon(lon), Math.round(Number(zoom))];
      }
    },
  },
  {
    //https://level0.osmz.ru/?url=map=18.74/47.040549/15.463744
    name: "Level0 Editor",
    category: OSM_CATEGORY,
    default_check: false,
    domain: "level0.osmz.ru",
    description: "low-level OSM Editor",
    getUrl(lat, lon, zoom) {
      return `https://level0.osmz.ru/?url=map=${lon}/${lat}/${zoom}`;
    },
    getLatLonZoom(url) {
      const match = url.match(
        /level0\.osmz\.ru\/\?url=map=(-?\d[0-9.]*)\/(-?\d[0-9.]*)\/(-?\d[0-9.]*)/
      );
      if (match) {
        let [, lon, lat, zoom] = match;
        zoom = Math.round(zoom);
        return [lat, normalizeLon(lon), Math.round(Number(zoom))];
      }
    },
  },
  {
    //https://osmand.net/map#11/35.6492/139.8395
    name: "OsmAnd",
    category: OUTDOOR_CATEGORY,
    default_check: false,
    domain: "osmand.net",
    description: "",
    getUrl(lat, lon, zoom) {
      return `https://osmand.net/map/#${zoom}/${lat}/${lon}`;
    },
    getLatLonZoom(url) {
      const match = url.match(
        /osmand\.net\/map\/#(\d[0-9.]*)\/(-?\d[0-9.]*)\/(-?\d[0-9.]*)/
      );
      if (match) {
        const [, zoom, lat, lon] = match;
        return [lat, normalizeLon(lon), Math.round(Number(zoom))];
      }
    },
  },
  {
    name: "Waze Editor",
    category: OSM_CATEGORY,
    default_check: false,
    domain: "waze.com",
    description: "Maintain the waze maps",
    getUrl(lat, lon, zoom) {
      return (
        "https://www.waze.com/editor?lon=" + lon + "&lat=" + lat + "&zoom=7"
      );
    },
    getLatLonZoom(url) {
      const match = url.match(
        /waze\.com\/.*?lon=(-?\d[0-9.]*)&lat=(-?\d[0-9.]*)&zoom=(\d{1,2})/
      );
      if (match) {
        let [, lon, lat, zoom] = match;
        return [lat, lon, zoom];
      }
    },
  },
  {
    name: "Peakvisor",
    category: OUTDOOR_CATEGORY,
    default_check: true,
    domain: "peakvisor.com",
    description: "3D View Panorama",
    getUrl(lat, lon, zoom) {
      return (
        "https://peakvisor.com/panorama.html?lat=" +
        lat +
        "&lng=" +
        lon +
        "&alt=4598&yaw=-4.94&pitch=-7.67&hfov=60.00"
      );
    },
    getLatLonZoom(url) {
      const match = url.match(
        /peakvisor\.com\/.*?lat=(-?\d[0-9.]*)&lng=(-?\d[0-9.]*)/
      );
      if (match) {
        let [, lat, lng] = match;
        return [lat, lon, 16];
      }
    },
  },
];

const maps = sortByKey(maps_raw, "name");

chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  // ...existing code...
});
