// import library
const requests = require('request').defaults({
    jar: true
});
const fs = require('fs');

module.exports = class Requester {
    constructor(filepath, modelID, samplingRate) {
        this.oauthUrl = 'https://api.ce-cotoha.com/v1/oauth/accesstokens'; // should be the same for all environments
        this.hostname = 'https://api.ce-cotoha.com/api'; // should be the same for all environments
        // check if file is supplied
        if (filepath != null || filepath !== '') {
            let credentials = JSON.parse(fs.readFileSync(filepath));
            this.domainID = credentials.domain_id;
            this.client_id = credentials.client_id;
            this.client_secret = credentials.client_secret;
        } else {
            throw new Error('Missing credentials file');
        }
        // set the model
        this.modelID = modelID;
        // url for speech recognition
        this.speechrec_url = this.hostname + '/asr/v1/speech_recognition/' + this.modelID;

        this.param_json = {
            'param': {
                'baseParam.samplingRate': samplingRate,
                'recognizeParameter.domainId': this.domainID,
                'recognizeParameter.enableContinuous': 'true'
            }
        };
    }

    // async method to get token
    getToken() {
        let options = {
            method: 'POST',
            url: this.oauthUrl,
            headers: {
                'Content-Type': 'application/json;charset=UTF-8'
            },
            body: {
                'grantType': 'client_credentials',
                'clientId': this.client_id,
                'clientSecret': this.client_secret
            },
            json: true
        };

        return new Promise(function(resolve, reject) {
            requests(options, function(error, response, body) {
                if (error) {
                    console.log(error);
                    reject(error);
                } else {
                    let userData = {
                        accessToken: body.access_token
                    };
                    resolve(userData);
                }
            });
        });
    }
    start(userData) {
        let obj = this.param_json;
        obj.msg = {
            'msgname': 'start'
        };
        let options = {
            method: 'POST',
            url: this.speechrec_url,
            headers: {
                'Content-Type': 'application/json;charset=UTF-8',
                'Authorization': 'Bearer ' + userData.accessToken
            },
            body: obj,
            json: true
        };
        return new Promise(function(resolve, reject) {
            requests(options, function(error, response, body) {
                if (error) {
                    console.log(error);
                    reject(error);
                } else {
                    resolve(body[0]['msg']['uniqueId']);
                };
            });
        });
    }
    // just a post command
    post(userData, buffer) {
        let self = this;
        let options = {
            method: 'POST',
            headers: {
                'Connection': 'keep-alive',
                'Content-Type': 'application/octet-stream',
                'Unique-ID': userData.uniqueId,
                'Authorization': 'Bearer ' + userData.accessToken
            },
            url: this.speechrec_url
        };
        options.body = buffer;
        return new Promise(function(resolve, reject) {
            requests(options, function(error, response, body) {
                if (error) {
                    console.log(error);
                    reject(error);
                } else {
                    let sentence = self.parseResult(response, body);
                    resolve(sentence);
                }
            });
        });
    }

    parseResult(response, body) {
        let detectedSentence = '';
        if (response.statusCode === 200 || response.statusCode === 204) {
            try {
                if (typeof body === 'string') {
                    body = JSON.parse(body);
                }
                for (let res in body) {
                    if (body[res]['msg']['msgname'] === 'recognized' && body[res]['result']['sentence'][0] !== undefined && body[res]['result']['sentence'] !== []) {
                        detectedSentence += body[res]['result']['sentence'][0]['surface'];
                    }
                }
            } catch (e) {
                // we want to ignore the JSON parse error
                if (e.name !== 'SyntaxError') {
                    throw new Error(e);
                }
            }
            if (detectedSentence !== '') {
                detectedSentence = detectedSentence.replace(/ /g, '');
                return detectedSentence;
            }
        }
        return detectedSentence;
    }

    // send stop signal
    stop(userData) {
        let self = this;
        let options = {
            headers: {
                'Unique-ID': userData.uniqueId,
                'Content-Type': 'application/json;charset=UTF-8',
                'Authorization': 'Bearer ' + userData.accessToken
            },
            body: {
                'msg': {
                    'msgname': 'stop'
                }
            },
            json: true,
            method: 'POST',
            url: this.speechrec_url
        };
        return new Promise(function(resolve, reject) {
            requests(options, function(error, response, body) {
                if (error) {
                    console.log(error);
                    reject(error);
                } else {
                    let sentence = self.parseResult(response, body);
                    resolve(sentence);
                }
            });
        }).catch(error => {
            console.log(error);
        });
    }
};
