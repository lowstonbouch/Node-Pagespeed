
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
const axios = require('axios');
let fs = require('fs'),
    filename = process.argv[2],
    resultsFile = process.argv[3];

const delay = (time) => {
    return new Promise((resolve, reject) => {
        setTimeout(resolve, time);
    });
}

async function getJSONAsync(url) {
    let json;
    try {
        let json = await axios.get(`https://www.googleapis.com/pagespeedonline/v4/runPagespeed?url=${url}`);
        return json;
    }
    catch(error) {
        console.log(url, error.response.status);
    }  
}    

const readContent = (callback) => {
    fs.readFile(filename, 'utf8', (err, data) => {
        if (err) return callback(err)
        callback(null, data)
    });
}


readContent((err, data) => {
    if (err) throw err;
    let massUrl = data.split('\n');
    massUrl.forEach((item, i) => {
        if(i < 100){
                delay(Math.floor(i/10)*10000)
                .then(()=>{
                    getJSONAsync(item)
                    .then((result) => {
                        console.log(i + 1, result.data.id, result.data.ruleGroups.SPEED.score);
                    })
                    .catch(console.log)
                })
            }    
    });
})
