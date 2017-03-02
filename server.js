#!/usr/bin/env node
let express = require('express');
let players = require('./players');

let app = express();

app.use('/players', players);

app.get('/', express.static(__dirname+'/public'));

app.start = function(){
    let server = app.listen(process.env.PORT || 8080, (err)=>{
        if (err) {
            throw err;
        }
        console.log("HTTP server started on port "+server.address().port);
    });
    return server;
}

module.exports = app;
if (module === require.main) {
    app.start();
}
