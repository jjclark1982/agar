const express = require('express');
const session = require('express-session');

let data = {
    // '0000000000': {name: 'nobody', x: 100, y: 100, size: 100}
};

function otherPlayers(self, self_id) {
    const others = [];
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
        const players = player;
        return(players.map(serialize).join("\n"));
    }
    else {
        const fields = [player.x,player.y,player.size,player.name];
        return(fields.join(','));
    }
}

const players = express.Router();

players.use(session({
    secret: 'this is not a good secret',
    resave: false,
    saveUninitialized: true
}));

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
//    const id = req.session.id;
    let id = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    if (!('x' in req.headers && 'y' in req.headers)) {
        res.status(400);
        res.send('Error: you must include "x" and "y" headers.');
        return;
    }
    if (!data[id]) {
        res.status(201);
    }
    data[id] = {
        name: req.headers.name,
        x: parseFloat(req.headers.x),
        y: parseFloat(req.headers.y),
        size: Math.min(req.headers.size || 50, 250),
        color: req.headers.color,
        last_seen: new Date()
    };
    res.location(id);
    // res.set('Refresh', '1; url='+ip);
    // res.send('Created. Redirecting you to '+ip+"\n");
    const others = otherPlayers(data[id], id);
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

players.delete('/:id', function(req,res,next){
    console.log("deleting", req.params.id);
    data[req.params.id].dead = true;
});

module.exports = players;
