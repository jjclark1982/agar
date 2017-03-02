let express = require('express');

let data = {
    '0.0.0.0': {name: 'nobody', x: 100, y: 100, size: 100}
};

function otherPlayers(self_id) {
    let others = [];
    Object.keys(data).forEach(function(id){
        let other = data[id];
        if (id !== self_id) {
            others.push(other);
        }
    });
    return(others);
}

function serialize(player) {
    if (Array.isArray(player)) {
        let players = player;
        return(players.map(serialize).join("\n"));
    }
    else {
        let fields = [player.x,player.y,player.size,player.name];
        return(fields.join(','));
    }
}

let players = express.Router();

players.use(function(req, res, next){
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Headers', 'x,y,size,name,color');
    next();
});

players.get('/', function(req, res, next){
    res.json(data);
});

players.get('/:id', function(req, res, next){
    if (req.params.id in data) {
        let item = Object.assign({}, data[req.params.id]);
        item.name = req.params.id;
        return res.json(item);
    }
    else {
        return next(404);
    }
});

players.post('/', function(req, res, next) {
    let ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    // TODO: use session id
    if (!('x' in req.headers && 'y' in req.headers)) {
        res.status(400);
        res.send('Error: you must include "x" and "y" headers.');
        return;
    }
    if (!data[ip]) {
        res.status(201);
    }
    data[ip] = {
        name: req.headers.name,
        x: parseFloat(req.headers.x),
        y: parseFloat(req.headers.y),
        size: req.headers.size,
        color: req.headers.color,
        last_seen: new Date()
    };
    res.location(ip);
    // res.set('Refresh', '1; url='+ip);
    // res.send('Created. Redirecting you to '+ip+"\n");
    let others = otherPlayers(ip);
    res.format({
        'text/plain': function(){
            res.send(serialize(others));
        },
        'application/json': function(){
            res.json(others);
        },
        'default': function(){
            res.status(406);
            res.send('Not Acceptable');
        }
    })
});

module.exports = players;
