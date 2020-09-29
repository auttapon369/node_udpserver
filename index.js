var mysql      = require('mysql');

var connection = mysql.createPool({
  connectionLimit : 10,
  host            : '192.168.111.207',
  user            : 'root',
  password        : '159357',
  database        : 'mwa_waterlevel'
});

var dataValue = 0;
var linePackage = "";
var PORT = 9999; // Change to your port number

// x's should be replaced with your EC2 private ip
var HOST = '0.0.0.0';

// Load datagram module
var dgram = require('dgram');
//const { connect } = require('http2');

// Create a new instance of dgram socket
var server = dgram.createSocket('udp4');

/**
Once the server is created and binded, some events are automatically created.
We just bind our custom functions to those events so we can do whatever we want.
*/

// Listening event. This event will tell the server to listen on the given address.
server.on('listening', function () {
    var address = server.address();
    console.log('UDP Server listening on ' + address.address + ":" + address.port);
});

// Message event. This event is automatically executed when this server receives a new message
// That means, when we use FUDPPing::UDPEcho in Unreal Engine 4 this event will trigger.
server.on('message', function (message, remote) {
    //console.log('Message received from ' + remote.address + ':' + remote.port +' - ' + message.toString());
    console.log(message.toString());
    receiveSplitData(message);
    server.send(message, 0, message.length, remote.port, remote.address, function(err, bytes) {
	  if (err) throw err;
	  console.log('UDP message sent to ' + remote.address +':'+ remote.port + '\n');
	});
});

// Error event. Something bad happened. Prints out error stack and closes the server.
server.on('error', (err) => {
  console.log(`server error:\n${err.stack}`);
  server.close();
});

// Finally bind our server to the given port and host so that listening event starts happening.
server.bind(PORT, HOST);


function receiveSplitData(data)
{
  data.forEach(ch => {
    //console.log(ch);
    if (ch != 10) {
      linePackage += String.fromCharCode(ch);
    } else 
    {

      SplitData(linePackage);
     
      linePackage = "";
    }
  });
}
function SplitData(data)
{
  var str = data.split(/[' '/,A]/);
  //console.log(str);
  var deviceID=str[0];
  var value = str[6];
  var dt = str[1]+'-'+str[2]+'-'+str[3]+' '+str[4];
  var dUpdate =  calcTime(+7);

     connection.query("SELECT levelUp,levelDown FROM TMlevelconfig WHERE deviceID = ?",[deviceID], function (error, results) {
               
      if (error) 
        {
          callback(error,null);

        }else
        {
          if(results.length > 0)
          {
         
          min =results[0].levelDown;
          max =results[0].levelUp;
          cal = (value - 4)/16 *(max-min) + min;

          //console.log(results);


         var insertData="INSERT INTO TTdata(deviceID,dataValue,dataDatetime,dataUpdate,dataStatus)VALUES ?";
         var values = [[deviceID, cal,dt,dUpdate,1]];
         
        

        connection.query(insertData,[values], function (error, results, fields) {
          if (error) throw error;
          console.log('The solution is: OK ');
        });
      }

    

    }


});


 
}

function calcTime(offset) {

  
  d = new Date();
 
  
  utc = d.getTime() + (d.getTimezoneOffset() * 60000);

  nd = new Date(utc + (3600000*offset));
 
  // return time as a string
    month = '' + (nd.getMonth() + 1),
    day = '' + nd.getDate(),
    year = nd.getFullYear();
    h = '' + nd.getHours();
    mi = ''+nd.getMinutes();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;
    if (h.length < 2) h = '0' + h;
    if (mi.length < 2) mi = '0' + mi;

    var dd = [year, month, day].join('-');
    var tt = [h, mi].join(':');
  return dd+' '+tt;

}

