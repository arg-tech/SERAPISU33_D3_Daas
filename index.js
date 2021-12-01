const express = require('express');
const path = require('path');
const amulet = require('./amulet');
const daas = require('./daas');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
    daas.clear_history();
    daas.clear_responses();
    res.sendFile('api-test.html', { root: path.join(__dirname, './pages') });
});

app.post('/move', (req, res) => {
    l = amulet.parse_move(req.body);
    
    if(Object.keys(l).length === 0){
        res.status(400).send('Invalid input move format');
        return;
    }
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:8888');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);
    r = daas.get_response(l);
    
    res.send(r);
});

app.listen(port, () => console.log(`Listening on port ${port}...`));
