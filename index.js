process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
const axios = require('axios');
let fs = require('fs'),
    filename = process.argv[2],
    resultsFile = process.argv[3];

function readContent(callback) {
    fs.readFile(filename, 'utf8', function (err, data) {
        if (err) return callback(err)
        callback(null, data)
    });
}

readContent(function (err, data) {
    if (err) throw err;
    let massUrl = data.split('\n');
    let i = 0;
    if (massUrl.length) {
        console.log('start');
        setTimeout(function go() {
            axios.get(`https://www.googleapis.com/pagespeedonline/v4/runPagespeed?url=${massUrl[i]}`)
                .then(response => {
                    console.log(massUrl[i]);
                    console.log(i + 1, 'speed:', response.data.ruleGroups.SPEED);
                    if (i === 0) {
                        fs.writeFile(resultsFile, `${massUrl[i]} score: ${response.data.ruleGroups.SPEED.score}`, function (error) {
                            if (error) throw error;
                            console.log('upload file');
                        });
                    }
                    else {
                        fs.appendFile(resultsFile, `${massUrl[i]} score: ${response.data.ruleGroups.SPEED.score}`, function (error) {
                            if (error) throw error;
                            console.log('upload file');
                        });
                    }
                    if (i < 2) setTimeout(go, 0);
                    i++;
                })
                .catch(error => {
                    console.log(error);
                });

        }, 0);
    }
})

// axios.get('https://www.googleapis.com/pagespeedonline/v4/runPagespeed?url=http://www.jfairchildlaw.com')
//   .then(response => {
//     console.log(response.data.ruleGroups.SPEED);
//   })
//   .catch(error => {
//     console.log(error);
//   });