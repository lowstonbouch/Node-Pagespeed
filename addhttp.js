
let fs = require('fs'),
    filename = process.argv[2],
    resultsFile = process.argv[3];

const main = (massUrl) => {
    const http = 'http://';
    for(let i = 0; i < massUrl.length; i++){
        fs.appendFile(resultsFile, `${http + massUrl[i]}\n`, function (error) {
            if (error) throw error;
        }); 
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
    let massUrl = data.split('\n');
    length = massUrl.length;
    main(massUrl);
})
