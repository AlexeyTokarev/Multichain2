var encoderFile = require('./EncoderFile');
var collectionsService = require('./collectionsService');

var multichain = require("multichain-node")({
    port: 7722,
    host: '127.0.0.1',
    user: 'multichainrpc',
    pass: '54u5udGVVS5VQyxQXVnSB8P179GtqnUYXx2Ad2EdDXzT'
});

function getInform() {
    multichain.getInfo((err, info) => {
        if (err) {
            throw err;
        }
        console.log(info);
    });
}

function publishDocument(collection, documentRequestModel, dataInHex) {
    multichain.publish({stream: collection, key: documentRequestModel.data.UserKey, data: dataInHex},
        (err, data) => {
            if (err) {
                console.log(err);
                return;
            }
            console.log('ID транзакции: ' + data);
        });
}

function getListStreamKey(streamName, key, verboseValue, countValue, startValue, callback) {
    verboseValue = typeof verboseValue !== 'undefined' ? verboseValue : false;
    countValue = typeof countValue !== 'undefined' ? countValue : 1;
    startValue = typeof startValue !== 'undefined' ? startValue : -1;

    multichain.listStreamKeyItems({
            stream: streamName,
            key: key,
            verbose: verboseValue,
            count: countValue,
            start: startValue
        },
        (err, data) => {
            if (err) {
                callback(err);
                return;
            }
            var allData = data;
            var body = JSON.parse(encoderFile.hexToString(data[0].data));
            callback(null, body, allData);
        });
}

function validateJson(object, schema, callback) {
    var JaySchema = require('jayschema');
    var js = new JaySchema();

    js.validate(object, schema, function (errs) {
        if (errs) {
            callback(false);
        }
        else {
            callback(true);
        }
    });
}
function getAccessModifier(streamName, collection, callback) {
    multichain.listStreamKeyItems({stream: streamName, key: collection},
        (err, data) => {
            if (err) {
                callback(err);
                return;
            }
            // console.log(null, data);
            var access_modifier = JSON.parse(JSON.parse(encoderFile.hexToString(data[0].data)).JsonData).Protection;
            callback(null, access_modifier);
        });
}

module.exports = {
    publishDocument: publishDocument,
    getInform: getInform,
    getListStreamKey: getListStreamKey,
    validateJson: validateJson,
    getAccessModifier: getAccessModifier
};