
var appConfig = {
    port : process.env.PORT || 5000,
    consumerKey : process.env.TRELLO_API_KEY || 'TRELLO_API_KEY',
    consumerSecret : process.env.TRELLO_OAUTH_SECRET || 'TRELLO_OAUTH_SECRET',
    oauthToken : process.env.TRELLO_OAUTH_TOKEN || 'TRELLO_OAUTH_TOKEN',
    boardName : process.env.TRELLO_BOARD_NAME || 'TRELLO_BOARD_NAME',
    listName : process.env.TRELLO_LIST_NAME || 'TRELLO_LIST_NAME',
    username : process.env.BA_USERNAME || 'testUser',
    password : process.env.BA_PASSWORD || 'testPass',
};

var express = require('express');
var app = express();
var trello = require('node-trello');
var trelloObject = new trello(appConfig.consumerKey, appConfig.oauthToken);

app.use(express.logger());

app.configure(function(){
    app.use(express.bodyParser());
});

// Basic Autentication
app.use(express.basicAuth(appConfig.username,appConfig.password));

app.post('/', function(request, response){

    var object = request.body;

    if (object.hasOwnProperty('event')
        && object.event == 'issue_impact_change'
        && object.hasOwnProperty('payload'))
    {
        //Search for BoardId
        trelloObject.get('/1/members/me/boards', { fields: 'name, id, lists' }, function(error, data) {
            if (error){
                response.send(error,500);
            }else{
                var boardId = searchIdByName(data,appConfig.boardName);

                if(boardId){
                    //Search for ListId
                    trelloObject.get('/1/boards/'+ boardId +'/lists', {lists:'open' , list_fields:'name', fields: 'name' }, function(err,data) {
                        if (error){
                            response.send(error,500);
                        }else{
                            var listId = searchIdByName(data,appConfig.listName);
                            //If found ListId, try to create card
                            if(listId){
                                createCard(object.payload, listId, response)
                            }else{
                                response.send('List not found',404);
                            }
                        }
                    });
                }else{
                    response.send('Board not found',404);
                }
            }
        });
    }else{
        response.send('Bad Request',400);
    }

});



app.listen(appConfig.port, function() {
    console.log('Listening on ' + appConfig.port);
    console.log(appConfig);
});


function createCard(payload, listId, response){
    //Card Data
    var card ={
        name : payload.title,
        desc : payload.url,
        due : null,
        idList : listId
    };
    //Post card data
    trelloObject.post('/1/cards/', card, function(err, data) {
        if (err){
            response.send(err,500);
        }else{
            //Posted Ok
            response.send('ok',200);
            console.log(data);
        }
    });
}

function searchIdByName(collection, name) {
    var id = null;
    for (var index in collection) {
        var element = collection[index];
        if(element.name.trim().toLocaleLowerCase() === name.trim().toLowerCase()){
            id = element.id;
            break;
        }
    }
    return id;
}


function isEmptyObject(obj) {
    return !Object.keys(obj).length;
}
