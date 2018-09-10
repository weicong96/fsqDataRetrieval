
var AWS = require("aws-sdk");
var fs = require('fs');
module.exports.getTile = (event, context, callback)=>{
  var x = event.pathParameters.x;
  var y = event.pathParameters.y;

  let config = {
    region: process.env['aws_region'],
    accessKeyId: process.env['aws_access_key'],
    secretAccessKey: process.env['aws_secret_key']
  }

  var client =  new AWS.DynamoDB.DocumentClient({
    service : new AWS.DynamoDB(config)
  })
  client.get({
    TableName : "tiles",
    Key : {
      'tile_x' : y,
      'tile_y' : x
    }
  }, (err, data)=>{
    if(err){
      return callback(err);
    }
    console.log(data)
  })
  const response = {
    statusCode: 200,
    body: JSON.stringify({
      message: 'This function has been deployed!',
      input: {},
    }),
  };

  callback(null, response);
}


function tile2long(x,z) {
  return (x/Math.pow(2,z)*360-180);
}
function tile2lat(y,z) {
 var n=Math.PI-2*Math.PI*y/Math.pow(2,z);
 return (180/Math.PI*Math.atan(0.5*(Math.exp(n)-Math.exp(-n))));
}
