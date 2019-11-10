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

    trains.forEach(train => {

        let apiUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?units=imperial&origins=${
            train.lauf[0].replace(" ", "+")
            }&destinations=${
            train.lauf[1].replace(" ", "+")
            }&key=AIzaSyBnzzUkE5XQdRW_vJ41S1RL9khjFrJWWh4`;



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

});

function next() {
    trainsWithLength = trainsWithLength.filter(train => train.entfernung);
    console.log(trainsWithLength);
}