const express = require('express');
// const cors = require('cors');
const bodyParser = require('body-parser');
const server = express();
const router = require('./Routes/router');
const port = 8000;
server.set('trust proxy',1);
// server.use(cors())
server.use(bodyParser.urlencoded({ extended: true }));
server.use(bodyParser.json());
// server.use(express.json());

server.use('/',router());

server.listen(port,()=>{
    console.log('server has started');
})