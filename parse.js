var fs = require("fs");
var axios = require("axios");
var _ = require("lodash");
var centroid = require("@turf/centroid")
var helpers = require("@turf/helpers")

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

  var coordinatesText = _.map(coordinates, (coordinate)=>{
    return _.join(_.reverse(coordinate), ",")
  })
  coordinatesText = _.join(coordinatesText, "\n")
  fs.writeFile("./coordinates.csv",coordinatesText, (err)=>{
    if(err){
      console.log("DONE")
    }
  })
})
//https://api.foursquare.com/v2/venues/explore?client_id=OOH412CZYA5EO2NAOPALBV30QIA2YKNZC1BOD4KDP1FI51U0&client_secret=ATI0Y4IZLOGBHJQCK5PYCWI1LOEK1HMYPZG11GPLD2IZDV2B&v=20180323&ll=1.2833754,103.8585377
