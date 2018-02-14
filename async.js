process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
const axios = require('axios');
const os = require(`os`);
let fs = require('fs'),
    filename = process.argv[2],
    resultsFile = process.argv[3];

let cR = 20; // 20 request async
let time = 1;
let counter = 0;
let length = 0;
let massResult = [];
let massErrors = [];

const delay = (time) => {
    return new Promise((resolve, reject) => {
        setTimeout(resolve, time);
    });
}

const timer = () => {
    let timerId = setTimeout(go = () => {
      console.log(time);
      if(length != 0)setTimeout(go, 1000);
      time++;
    }, 1000);
  }

async function getJSONAsync(url) {
    let json;
    try {
        let json = await axios.get(`https://www.googleapis.com/pagespeedonline/v4/runPagespeed?url=${url}/&key=AIzaSyD6SAwbEsyVwfga3tTyrEVoYUeIjyh0zCo`);
        if(json.data.responseCode === 200){
            return {
                url: json.data.id,
                request: `score: ${json.data.ruleGroups.SPEED.score}`,
            };
        }
        else{
            return {
                url: json.data.id,
                request: `error: ${json.data.responseCode}`,
            };
        }
    }
    catch(error) {
        console.log(error.response.data.error);
        return{
            error: true,
            url: error.response.data.error.message,
            request: error.response.data.error.code,
        }
    }  
}    

const addInFile = (result,massUrl,error,url) => {
    counter++;
    length--;
    massResult.push(result.url); 
    if(massResult.length === cR){
        massUrl.splice(0,cR);
        main(massUrl);
    }  
    if(error){
        massErrors.push(url);
    }
    else{
        fs.appendFile(resultsFile, `${result.url} ${result.request}\n`, function (error) {
            if (error) throw error;
        }); 
    } 
    if(length === 0 && massErrors.length){
        fs.appendFile(resultsFile, `This url not request:\n`, function (error) {
            if (error) throw error;
        }); 
        for(let i = 0; i < massErrors.length; i++){
            fs.appendFile(resultsFile, `${massErrors[i]}\n`, function (error) {
                if (error) throw error;
            }); 
        }
    }
}

const request = (url,massUrl,number,i) =>{
    delay(i*100)
    .then(()=>{
        getJSONAsync(url)
        .then((result) => {
            if(result.error){
                if(number === 2){
                    console.log(url);
                    addInFile(result,massUrl,result.error,url);
                }
                else{  
                    delay(3000)
                    .then(() =>{
                        request(url,massUrl,++number,i);
                    }) 
                }      
            }
            else{        //good request 
                addInFile(result,massUrl);
            } 
        })
        .catch((error) => {
            console.log('REQUEST',error); //no complete
            if(i === 9){
                delay(10000)
                .then(()=>{
                    console.log('restart');
                    main(massUrl);
                })
            }    
        }); 
    }) 
}

const main = (massUrl) => {
    massResult = [];
    if(Math.floor(time/100) <  Math.floor(counter/100)){
        delay((counter-timer)*1000)
        .then(() => {
            main(massUrl);
        })
    }
    else{
        for(let i = 0; i < cR; i++){
                if(massUrl[i]) request(massUrl[i],massUrl,1,i);     
        }  
    } 
}

const readContent = (callback) => {
    fs.readFile(filename, 'utf8', (err, data) => {
        if (err) return callback(err)
        callback(null, data)
    });
    fs.writeFile(resultsFile,'', function (error) {
        if (error) throw error;
    });
}

readContent((err, data) => {
    if (err) throw err;
    let massUrl = data.split('\r\n');
    length = massUrl.length;
    main(massUrl);
    timer();
})


