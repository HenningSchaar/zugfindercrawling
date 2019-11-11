const request = require('request');
const escape = require('remove-accents');

let originDistances = [];
let destinationDistances = [];
const stationLocation = "Riedstadt-Goddelau";

request('https://www.zugfinder.de/js/json_kbs.php?kbs=650', function (error, response, body) {
    trainData = JSON.parse(body); //Parse incoming JSON
    time = trainData.zeit;
    trains = trainData.array;
    trains.shift();

    // Replace string which describes "lauf" with the two train stations in question.
    trains = trains.map(train => {
        train.lauf = train.lauf.split(" - ");
        return train;
    })

    // Add distance between start and destination points using Googles Distance Matrix API wrapped with the np google-distance.

    let origins = [stationLocation];
    let destinations = [stationLocation];
    for (let i = 0; i < trains.length; i++) {
        origins[i + 1] = trains[i].lauf[0]
        destinations[i + 1] = trains[i].lauf[1]
    }

    let apiUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?units=metric&origins=${
        escape(origins.join("|").replace(/ /g, "+"))
        }&destinations=${
        escape(destinations.join("|").replace(/ /g, "+"))
        }&key=AIzaSyBnzzUkE5XQdRW_vJ41S1RL9khjFrJWWh4`;

    request(apiUrl, (err, resp, body) => {

        distanceData = JSON.parse(body);

        if (distanceData.status == "OK") {
            parseDistanceData(distanceData);
        }
        else { console.log(distanceData.stat); }
    });

});

function parseDistanceData(distanceData) {
    //console.log(distanceData.rows[0].elements)
    distanceData.rows[0].elements.forEach(originDistanceEntry => {
        originDistances.push(originDistanceEntry.distance.value);
    });
    distanceData.rows.forEach(destinationDistanceEntry => {
        destinationDistances.push(destinationDistanceEntry.elements[0].distance.value);
    });
    console.log(originDistances);
    console.log(destinationDistances);
}