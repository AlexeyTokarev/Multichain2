var dal = require('./DAL');
var encoderFile = require('./EncoderFile');
var collectionsService = require('./collectionsService');
var multichain = require("multichain-node")({
    port: 7722,
    host: '127.0.0.1',
    user: 'multichainrpc',
    pass: '54u5udGVVS5VQyxQXVnSB8P179GtqnUYXx2Ad2EdDXzT'
});
var express = require("express"),
    app = express(),
    http = require("http").Server(app).listen(3000);
console.log("Сервер начал прослушивание запросов на порту 3000");

// Старт приложения
app.get("/", function (req, res) {
    res.send("Сервер начал прослушивание запросов на порту 3000");
});
// URL => /api/v1/collections/{collection}/document

function documentToByteArray(requestDocument, callback) {
    requestDocument = JSON.stringify(requestDocument);
        var ch, st, re = [];
        for (var i = 0; i < requestDocument.length; i++ ) {
            ch = requestDocument.charCodeAt(i);
            st = [];
            do {
                st.push( ch & 0xFF );
                ch = ch >> 8;
            }
            while ( ch );
            re = re.concat( st.reverse() );
        }
    callback (re);
}
function prepareToSave(streamName, collection, callback) {
    dal.getListStreamKey(streamName, collection, null, null, null, function (err, body, allData) {
        var metaData = JSON.parse(body.JsonData);
        var schema = JSON.parse(body.JsonData).Schema;
        callback(body);
    })}

// Создание документа в коллекцию
app.get("/createDocument", function (req, res) {
    var streamName = 'sys_collection';
    var collection = 'aleksey';
    var verboseValue = false;
    var countValue = 1;
    var startValue = -1;

    var requestDocument = {
        data: {
            UserKey: "4",
            // Nilpferd: "Yo"
            CertificateThumbprint: "2"
        },
        acls: []
    };
//---------------------------
    var oldDocHash = null;
    var newDocHash = null;

    // var documentRequestModel = documentToByteArray(requestDocument, function (data) {
    //     var a = data;
    // });
    // var prepare = prepareToSave(streamName, collection, function (data) {
    //     var b = data;
    // });
    var documentRequestModel = {
        data: {
            UserKey: "4",
            // Nilpferd: "Yo"
            CertificateThumbprint: "2"
        },
        acls: []
    };

    var dataInHex = encoderFile.stringToHex(JSON.stringify(documentRequestModel));
    var responseCollectionModel = collectionsService.collectServGet(collection);

    dal.getListStreamKey(streamName, collection, verboseValue, countValue, startValue, function (err, body, allData) {
        var metaData = JSON.parse(body.JsonData);
        var schema = JSON.parse(body.JsonData).Schema;
        var newKey = null;
        // console.log(schema);
        dal.validateJson(documentRequestModel.data, schema, function (ifValid) {
            // console.log('Is json valid: ' + ifValid);
            if (ifValid) {
                generateDocumentKey(metaData, documentRequestModel, function (generatedKey) {
                    newKey = generatedKey;
                });
                dal.getAccessModifier(streamName, collection, function (err, data) {
                    if (!err) {
                        if (data == 'Public') {
                            // compareVersions(documentRequestModel, collection, function (isEqual) {
                            //     if(!isEqual) {
                            //         console.log('Предыдущая версия документа не эквивалентна загружаемой');
                                    dal.publishDocument(collection, documentRequestModel, dataInHex);
                            //     }
                            //     else {
                            //         console.log('Предыдущая версия документа эквивалентна загружаемой');
                            //         return;
                            //     }
                            // });
                        }
                        else {
                            console.log("There is not public access!");
                            return;
                        }
                    }
                    else {
                        console.log(err);
                    }
                });
            }
            else {
                console.log("Your JSON is not valid!");
                return;
            }
        })
    });
    // var generatedKey = documentRequestModel.data.UserKey;
    res.send("Документ создан");
});

// Получение информации о мультичейне
app.get("/getInfo", function (req, res) {
    dal.getInform();
    res.send('Информация о мультичейне выведена в логи');
});

function generateDocumentKey(metaData, documentRequestModel, callback) {
    var separator = metaData.Key.Separator;
    var generatedKey = null;
    for (var field in metaData.Key.Fields) {
        if (generatedKey == null) {
            generatedKey = documentRequestModel.data[metaData.Key.Fields[+field]];
        }
        else {
            generatedKey = generatedKey + separator + documentRequestModel.data[metaData.Key.Fields[+field]];
        }
    }
    callback(generatedKey);
}

/* function compareVersions(documentRequestModel, collection, callback){
    documentRequestModel
    dal.getListStreamKey(collection, key, verboseValue, countValue, startValue, function (err, body, allData) {
        var a = allData[0].data;
        var oldDocument = JSON.parse(encoderFile.hexToString(a));
        var dataInHex = encoderFile.stringToHex(JSON.stringify(documentRequestModel.data));
        if (oldDocument != dataInHex) {
            callback(false);
            return;
        }
        else {
            callback(true);
            return;
        }
    });
}*/