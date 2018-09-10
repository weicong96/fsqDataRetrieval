const fs = require('fs');
const AWS = require("aws-sdk");
const _ = require("lodash");
const moment = require('moment');
let config = {
  region: process.env['aws_region'],
  accessKeyId: process.env['aws_access_key'],
  secretAccessKey: process.env['aws_secret_key']
}
var client =  new AWS.DynamoDB.DocumentClient({
  service : new AWS.DynamoDB(config)
})
module.exports.handler = (event, context, callback) =>{
  fs.readFile("../tiles.json", (err, data)=>{
    data = data.toString();
    var tiles = JSON.parse(data);
    var minute = moment().minute()
    tiles = tiles.slice(minute * 50, (minute+1) * 50)
    _.forEach(tiles, (tile)=>{
      var x = tile.x;
      var y = tile.y;
      var zoom = tile.zoom;
      _.forEach(tile.coord, (coord)=>{
        client.put({
          TableName: "tiles",
          Item : {
            lat : coord.lat+'',
            lng : coord.lng+'',
            tile_x: x+'',
            tile_y: y+'',
            tile_zoom: zoom
          }
        }, (err, data)=>{
            return callback(err, data)
        })
      });
    })
  })
}
