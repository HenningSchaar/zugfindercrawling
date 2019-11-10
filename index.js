const request = require('request');

let trainsWithLength = [];

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

    let origins = [];
    let destinations = [];
    for (let i = 0; i < trains.length; i++) {
        origins[i] = trains[i].lauf[0]
        destinations[i] = trains[i].lauf[1]
    }

    //console.log(origins.toString());
    //console.log(destinations.toString());


    let apiUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?units=imperial&origins=${
        origins.join("|").replace(/ /g, "+")
        }&destinations=${
        destinations.join("|").replace(/ /g, "+")
        }&key=AIzaSyBnzzUkE5XQdRW_vJ41S1RL9khjFrJWWh4`;

    console.log(apiUrl);

    
    request(apiUrl, (err, resp, body) => {

        distanceData = JSON.parse(body);

        if (distanceData.status == "OK") {
            console.log(distanceData);
        }
        else{console.log(distanceData.status);}
    });

    
    /*
    trains.forEach(train => {
        request(apiUrl, (err, resp, body) => {

            distanceData = JSON.parse(body);

            if (distanceData.status == "OK") {
                train.entfernung = distanceData.rows[0].elements[0].distance.value;
            }

            trainsWithLength.push(train);

            if (trainsWithLength.length == trains.length)
                next();
        });
    });
    */

});

function next() {
    trainsWithLength = trainsWithLength.filter(train => train.entfernung);
    //console.log(trainsWithLength);
}