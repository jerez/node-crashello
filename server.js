
var appConfig = {
    port : process.env.PORT || 5000,
    consumerKey : process.env.TRELLO_API_KEY || 'TRELLO_API_KEY',
    consumerSecret : process.env.TRELLO_OAUTH_SECRET || 'TRELLO_OAUTH_SECRET',
    oauthToken : process.env.TRELLO_OAUTH_TOKEN || 'TRELLO_OAUTH_TOKEN',
    boardName : process.env.TRELLO_BOARD_NAME || 'TRELLO_BOARD_NAME',
    listName : process.env.TRELLO_LIST_NAME || 'TRELLO_LIST_NAME'
};

var express = require('express');
var app = express();
var trello = require('node-trello');
var trelloObject = new trello(appConfig.consumerKey, appConfig.oauthToken);

app.use(express.logger());

app.configure(function(){
    app.use(express.bodyParser());
});

app.post('/', function(req, res){

    var object = req.body;

    if (object.hasOwnProperty('event')
        && object.event == 'issue_impact_change'
        && object.hasOwnProperty('payload'))
    {
        //Search for BoardId
        trelloObject.get('/1/members/me/boards', { fields: 'name, id, lists' }, function(err,data) {
            if (err){
                res.send(err,500);
            }else{
                var boardId;
                for (var index in data) {
                    var board = data[index];
                    if(board.name.trim().toLocaleLowerCase() === appConfig.boardName.trim().toLowerCase()){
                        boardId = board.id;
                        break;
                    }
                }
                if(boardId){
                    //Search for ListId
                    trelloObject.get('/1/boards/'+ boardId +'/lists', {lists:'open' , list_fields:'name', fields: 'name' }, function(err,data) {
                        if (err){
                            res.send(err,500);
                        }else{
                            var listId;
                            for (var index in data) {
                                var list = data[index];
                                if(list.name.trim().toLocaleLowerCase() === appConfig.listName.trim().toLowerCase()){
                                    listId = list.id;
                                    break;
                                }
                            }
                            //If found ListId, try to create card
                            if(listId){
                                //Card Data
                                var card ={
                                    name : object.payload.title,
                                    desc : object.payload.url,
                                    due : null,
                                    idList : listId
                                };
                                //Post card data
                                trelloObject.post('/1/cards/', card, function(err, data) {
                                    if (err){
                                        res.send(err,500);
                                    }else{
                                        //Posted Ok
                                        res.send('ok',200);
                                        console.log(data);
                                    }
                                });
                            }else{
                                res.send('List not found',404);
                            }
                        }
                    });
                }else{
                    res.send('Board not found',404);
                }
            }
        });
    }else{
        res.send('Bad Request',400);
    }

});

app.listen(appConfig.port, function() {
    console.log('Listening on ' + appConfig.port);
});

function isEmptyObject(obj) {
    return !Object.keys(obj).length;
}
