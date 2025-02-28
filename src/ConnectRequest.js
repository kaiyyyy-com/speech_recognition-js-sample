// import library
const Wavefile = require('wavefile');
const fs = require('fs');
const chunk = require('buffer-chunks');
const CotohaApi = require('./Streaming');

// in ms
const Interval = 240;

//this sample code reads a file called sample.wav
let buffer = fs.readFileSync('../resources/sample.wav');
let wavfile = new Wavefile(buffer); // convert to wavefile object
let rate = wavfile.fmt.sampleRate;
let samples = wavfile.data.samples;

let chunkSize = Math.round(rate * Interval / 1000) * 2; // interval is set in ms
let byteChunks = chunk(samples, chunkSize);
let userData = ''; // could be better if not used as a global

let Requester = new CotohaApi(filepath = './sample.json',
    modelID = 'ja-gen_tf-16',
    samplingRate = rate); // or your audio sampling rate. This sample uses the file sampling rate to decide

Requester.getToken().then(res => {
    userData = res;
    Requester.start(userData).then(async (id) => {
        userData.uniqueId = id;
        return new Promise(async (resolve, reject) => {
            // change this part to allow audio stream from a source, i.e microphone etc
            for (let audioPartNumber in byteChunks) {
                let sentence = await Requester.post(userData, byteChunks[audioPartNumber]);
                if (sentence !== '') {
                    console.log(sentence);
                }
            }
            // resolve here so we can send the stop message
            resolve();
        }).then(async () => {
            // do what you need to do with the sentence here
            let sentence = await Requester.stop(userData);
            console.log('end of recognition');
            console.log('last detected text : ' + sentence);
        }).catch(error => {
            console.log(error);
        });
    });
}).catch(error => {
    console.log(error);
}).catch(error => {
    console.log(error);
});
