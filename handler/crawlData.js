var moment = require("moment");
var axios = require("axios");
var fs = require('fs');
var _ = require("lodash");
var AWS = require("aws-sdk");
const Promise = require("bluebird");
let config = {
  region: process.env['aws_region'],
  accessKeyId: process.env['aws_access_key'],
  secretAccessKey: process.env['aws_secret_key']
}

var client =  new AWS.DynamoDB.DocumentClient({
  service : new AWS.DynamoDB(config)
})

var client_id = process.env['fsq_client_id']
var client_secret = process.env['fsq_client_secret']
function long2tile(lon,zoom) {
  return (Math.floor((lon+180)/360*Math.pow(2,zoom)));
}
function lat2tile(lat,zoom)  {
  return (Math.floor((1-Math.log(Math.tan(lat*Math.PI/180) + 1/Math.cos(lat*Math.PI/180))/Math.PI)/2 *Math.pow(2,zoom)));
}


module.exports.handler = (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false
  var index = moment().minute()
  var batchSize = 28 * 5;
  fs.readFile("./coordinates.csv", (err, data)=>{
    var lines = data.toString().split("\n")
    lines = lines.slice(index * batchSize, (index+1) * batchSize)
    Promise.all(_.map(lines, (line)=>{
      return new Promise((resolve, reject)=>{
        axios.get("https://api.foursquare.com/v2/venues/search?intent=browse&client_id="+client_id+"&client_secret="+client_secret+"&v=20180323&radius=500&ll="+line)
        .then((data)=>{
            console.log('result came back from fsq browse', data.data.length)
            return resolve({
              data : data.data,
              latLng : line
            })
        }).catch((err)=>{
          return reject({
            headers : err.response['headers'],
            statusCode : err.response['status'],
            data : err.response['data']
          });
        });
      });
    })).then((responses)=>{
      return Promise.all(_.map(responses, (responseData)=>{
        var location = responseData.latLng
        var body = responseData.data
        return Promise.all(_.map(body.response.venues, (item)=>{
          return axios.get("https://api.foursquare.com/v2/venues/"+item['id']+"/photos?client_id="+client_id+"&client_secret="+client_secret+"&v=20180323")
            .then((data)=>{
              var response = data.data.response
              var photos = _.map(response.photos.items, (photo)=>{
                return photo['prefix']+'width'+photo['width']+photo['suffix']
              })
              item = {
                place : location,
                id : item['id'],
                name : item['name'],
                location : item['location'],
                categories : item['categories'],
                photos : photos
              }
              return new Promise((resolve, reject)=>{
                client.put({
                  TableName : 'fsq',
                  Item : item
                }, (err, data)=>{
                  if(err){
                    return reject(err)
                  }
                  return resolve(item)
                })
              })
            })
        }))
      }))
    }).then((places)=>{
      var allPlaces = _.flatMap(places, (place) => place)
      console.log("All places populated : ", allPlaces.length)
      return callback(null, {msg : "Places populated : "+ allPlaces.length +" "})
    }).catch((err)=>{
      //console.log(err)
      return callback(JSON.stringify(err));
    })

  })
};
