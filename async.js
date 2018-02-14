const axios = require('axios');
let fs = require('fs'),
    filename = process.argv[2],
    resultsFile = process.argv[3];

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
let cR = 20; // 20 request async
let time = 1;
let counter = 0;
let length = 0;
let counterError = 0;
let massResult = [];
let massErrors = [];
let massUrl = [];


const delay = (time) => {
    return new Promise((resolve, reject) => {
        setTimeout(resolve, time);
    });
}

const timer = () => {
    setTimeout(go = () => {
      console.log(time);
      if (length) setTimeout(go, 1000);
      if (!length && massErrors.length) {
        zapis(`This url not request:\n`);
        for(let i = 0; i < massErrors.length; i++) {
             zapis(`${massErrors[i]}\n`)
        }
    }
      time++;
    }, 1000);
}

async function getJSONAsync(url) {
    let json;
    try {
        // let json = await axios.get(`https://www.googleapis.com/pagespeedonline/v4/runPagespeed?url=${url}/&key=AIzaSyD6SAwbEsyVwfga3tTyrEVoYUeIjyh0zCo`);
        let json = await axios({
            method:'get',
            url:`https://www.googleapis.com/pagespeedonline/v4/runPagespeed?url=${url}/&key=AIzaSyD6SAwbEsyVwfga3tTyrEVoYUeIjyh0zCo`,
            timeout: 20000,
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

const addInFile = (result, i, error, url) => {
    counter++;
    length--;
    massResult.push(result.url); 
    if (massResult.length === cR) {
        // massUrl.splice(0,cR);
        main();
    }  
    if (error) {
        massErrors.push(url);
    } else {
        zapis(`${result.url} ${result.request}\n`);
    } 
}

function zapis(message) {
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
                    addInFile(result, i, result.error, url);
                } else {  
                    delay(3000)
                    .then(() => {
                        request(url, ++numberRequest, i);
                    }) 
                }
            } else {        //good request 
                addInFile(result, i);
            } 
        })
        .catch((error) => {
            console.log('REQUEST',error); //no complete
            counterError++;
            massUrl.unshift(url);
            console.log('INFO:',counterError,cR - massResult.length)
            if (counterError === cR - massResult.length) {
                delay(10000)
                .then(() => {
                    console.log('restart');
                    main();
                })  
            } 
        }); 
    }) 
}

const main = () => {
    massResult = [];
    counterError = 0;
    if(massUrl.length < cR){
        cR = massUrl.length
    }
    if(Math.floor(time / 100) <  Math.floor(counter / 100)) {
        delay((counter - timer) * 1000)
        .then(main);
    } else {
        for(let i = 0; i <cR; i++) {
            if(massUrl[0]) request(massUrl.shift(), 1, i);    
            // if(massUrl[i]) request(massUrl[i], 1, i);    
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
    length = massUrl.length;
    main();
    timer();
})