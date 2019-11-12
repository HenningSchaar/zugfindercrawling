const request = require('request');
const escape = require('remove-accents');

const limit = [0, 1000];

const PORT = 9091;
const HOST = '127.0.0.1';
const dgram = require('dgram');
const client = dgram.createSocket('udp4');


const stationLocation = "Hähnlein-Alsbach";

function perform() {

    request('https://www.zugfinder.de/js/json_kbs.php?kbs=650', function (error, response, body) {
        if (error != null) {
            handleError(error);
            return;
        }
        trainData = JSON.parse(body); //Parse incoming JSON
        trains = trainData.array; //convert train data to an array of trains
        trains.shift(); //remove first entry which for some reason is always empty
        trains = trains.slice(0, 10);

        // Replace string which describes "lauf" with an array of the two train stations in question.
        trains = trains.map(train => {
            train.lauf = train.lauf.split(" - ");
            return train;
        })

        addDistanceData();
    });
}

function addDistanceData() {
    // Add distance between start and destination points using Googles Distance Matrix API wrapped with the np google-distance.

    //create arrays for destinations and origins
    let origins = [stationLocation];
    let destinations = [stationLocation];
    for (let i = 0; i < trains.length; i++) {
        origins[i + 1] = trains[i].lauf[0]
        destinations[i + 1] = trains[i].lauf[1]
    }

    //create the API request URL with all origins and destinations
    let apiUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?units=metric&origins=${
        escape(origins.join("|").replace(/ /g, "+"))
        }&destinations=${
        escape(destinations.join("|").replace(/ /g, "+"))
        }&key=AIzaSyBnzzUkE5XQdRW_vJ41S1RL9khjFrJWWh4`;

    // request data from DistanceMatrixAPI
    request(apiUrl, (error, resp, body) => {
        if (error != null) {
            handleError(error);
            return;
        }

        distanceData = JSON.parse(body);
        if (distanceData.status == "OK") {
            parseDistanceData(distanceData);
        }
        else { handleError("API Request failed." + "\n" + distanceData.status); }

        setTimeout(perform, 5000);
    });
}

function parseDistanceData(distanceData) {
    //console.log(distanceData.rows[0].elements)
    let originDistances = [];
    let destinationDistances = [];
    distanceData.rows[0].elements.forEach(originDistanceEntry => {
        if(originDistanceEntry.status == "OK"){
            originDistances.push(originDistanceEntry.distance.value);
        }
        else{console.log("Failed to read origin distance entry: " + console.log(originDistanceEntry))};
    });
    distanceData.rows.forEach(destinationDistanceEntry => {
        if(destinationDistanceEntry.status == "OK"){
            destinationDistances.push(destinationDistanceEntry.distance.value);
        }
        else{console.log("Failed to read destination distance entry: " + console.log(destinationDistanceEntry))};
    });
    trains.forEach((train, i) => {
        distanceToStation = originDistances[i + 1];
        train.strecke = originDistances[i + 1] + destinationDistances[i + 1];
        train.zurueckGelegt = distanceToStation / train.strecke;
        train.zurueckGelegt = train.zurueckGelegt.toFixed(3);
    });
    //console.log(trains);
    sendDataToMax(trains);
}

function sendDataToMax(trains) {
    let trainmessages = 0;
    trains.forEach((train, i) => {
        message = train.zugnr.replace(" ", "") + " " + train.strecke + " " + train.zurueckGelegt;
        if(limit[0] < train.ypos < limit[1]){
            trainmessages++;
            client.send(message, 0, message.length, PORT, HOST, function (err, bytes) {
                if (err) throw err;
            });
        }
    });
    if (trainmessages > 0){
        console.log("Sent " + trainmessages + " trains to max.")
    }else{
        console.log("\nNo trains nearby \n");
        trains.forEach(train => {
            console.log(train.zugnr + " " + train.ypos);
        });
    };
}

function handleError(error) {
    console.log(error);
    setTimeout(perform, 1000);
}

perform();