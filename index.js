const axios = require('axios');
let fs = require('fs'),
    filename = process.argv[2],
    resultsFile = process.argv[3];

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
let numberOfRequests = 20;
let time = 1;
let counter = 0;
let length = 0;
let counterError = 0;
let massResult = [];
let massErrors = [];
let massUrl = [];
const http = 'http://';


const delay = (time) => {
    return new Promise((resolve, reject) => {
        setTimeout(resolve, time);
    });
}

const timer = () => {
    setTimeout(go = () => {
      console.log(time);
      if (length) setTimeout(go, 1000);
      if (!length) {
        console.log(`All time: ${time} seconds.\n`);
          if(massErrors.length){
            addInFile(`The following requests failed, maybe there is no such url :)\n`);
            for(let i = 0; i < massErrors.length; i++) {
                addInFile(`${massErrors[i]}\n`)
            }
          }
    }
      time++;
    }, 1000);
}


async function getJSONAsync(url) {
    let json;
    try {
        let json = await axios({
            method:'get',
            url:`https://www.googleapis.com/pagespeedonline/v4/runPagespeed?url=${url}/&key=AIzaSyD6SAwbEsyVwfga3tTyrEVoYUeIjyh0zCo`,
            timeout: 60000,
          });
        return {
            url: json.data.id,
            request: json.data.responseCode === 200 
                ? `score: ${json.data.ruleGroups.SPEED.score}`
                : `error: ${json.data.responseCode}`
        }
    }
    catch(error) {
        console.log(error.response.data.error);
        return {
            error: true,
            url: error.response.data.error.message,
            request: error.response.data.error.code,
        }
    }  
}    

const getTheResult = (result, i, error, url) => {
    counter++;
    length--;
    massResult.push(result.url);
    if (massResult.length === numberOfRequests) {
        main();
    }  
    if (error) {
        massErrors.push(url);
    } else {
        addInFile(`${result.url} ${result.request}\n`);
    } 
}

function addInFile(message) {
    fs.appendFile(resultsFile, message, (error) => {
        if (error) throw error;
    });
}

const request = (url, numberRequest, i) => {
    delay(i * 100)
    .then(() => {
        getJSONAsync(url)
        .then((result) => {
            if(result.error) {
                if(numberRequest === 2) {
                    console.log(url);
                    getTheResult(result, i, result.error, url);
                } else {  
                    delay(1000)
                    .then(() => {
                        request(url, ++numberRequest, i);
                    }) 
                }
            } else {
                getTheResult(result, i);
            } 
        })
        .catch((error) => {
            console.log('REQUEST',error);
            console.log(url);
            massUrl.unshift(url);
            counterError++;
            checkRequest(counterError);
        }); 
    }) 
}

const checkRequest = (counterError) => {
    delay(20000)
    .then(() => {
        if (counterError === numberOfRequests - massResult.length) {
                console.log('Perhaps the connection to the Internet was lost, try again');
                main();
        } 
    })
}

const main = () => {
    massResult = [];
    counterError = 0;
    if(massUrl.length < numberOfRequests){
        numberOfRequests = massUrl.length
    }
    if(Math.floor(time / 100) <  Math.floor(counter / 100)) {
        delay((counter - timer) * 1000)
        .then(main);
    } else {
        for(let i = 0; i <numberOfRequests; i++) {
            if(massUrl[0].length){
                massUrl[0].indexOf('http://') !== 0 ? request(http + massUrl.shift(), 1, i) : request(massUrl.shift(), 1, i);  
            }     
        } 
    } 
}

const readContent = (callback) => {
    fs.readFile(filename, 'utf8', (err, data) => {
        if (err) return callback(err)
        callback(null, data)
    });
    fs.writeFile(resultsFile,'', (error) =>  {
        if (error) throw error;
    });
}

readContent((err, data) => {
    if (err) throw err;
    massUrl = data.split('\r\n');
    if(!massUrl[massUrl.length - 1].length){
        massUrl.pop();
    }
    length = massUrl.length;
    main();
    timer();
})