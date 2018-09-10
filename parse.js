var fs = require("fs");
var axios = require("axios");
var _ = require("lodash");
var centroid = require("@turf/centroid")
var helpers = require("@turf/helpers")
var tiles = [];

function long2tile(lon,zoom) {
  return (Math.floor((lon+180)/360*Math.pow(2,zoom)));
}
function lat2tile(lat,zoom)  {
  return (Math.floor((1-Math.log(Math.tan(lat*Math.PI/180) + 1/Math.cos(lat*Math.PI/180))/Math.PI)/2 *Math.pow(2,zoom)));
}
fs.readFile("./singapore.json", (err, data)=>{
  data = data.toString();
  data = JSON.parse(data);
  var coordinates = [];
  var newFeatures = _.map(data['features'], (f)=>{
    var featureParsed = centroid.default(f)
    return featureParsed;
  })

  _.forEach(newFeatures, (nf)=>{
    coordinates.push(nf.geometry.coordinates);
  })
  for(var zoom = 13; zoom <= 18; zoom++){
    _.forEach(coordinates, (feature)=>{
      var lat = feature[1]
      var lng = feature[0]

      var tileLat = lat2tile(lat, zoom)
      var tileLng = long2tile(lng, zoom)

      var currentIndex = _.findIndex(tiles, (tile)=> tile['x'] == tileLat && tile['y'] == tileLng && tile['zoom'] == zoom)
      if(currentIndex == -1){
        tiles.push({
          x: tileLat,
          y: tileLng,
          zoom : zoom,
          coord: [{
            lat : lat,
            lng : lng
          }]});
      }else{
        tiles[currentIndex]['coord'].push({
          lat : lat,
          lng : lng
        })
      }
    })
  }
  fs.writeFileSync("./tiles.json", JSON.stringify(tiles));
  var coordinatesText = _.map(coordinates, (coordinate)=>{
    return _.join(_.reverse(coordinate), ",")
  })
  coordinatesText = _.join(coordinatesText, "\n")
  fs.writeFile("./coordinates.csv",coordinatesText, (err)=>{
    if(!err){
      console.log("DONE")
    }
  })
})
