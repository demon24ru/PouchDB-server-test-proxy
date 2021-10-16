const { generateJwtTokens, auth, refreshToken } = require('./auth');
const jwt = require('jsonwebtoken');
const qs = require('qs');
const httpProxy = require('http-proxy');
const apiProxy = httpProxy.createProxyServer();


const express = require('express');
const app = express();


apiProxy.on('proxyReq', function(proxyReq, req, res, options) {
    proxyReq.setHeader('X-Special-Proxy-Header', 'foobar');
});

app.use('/db', auth, function(req, res) {
    const filter = {
        filter: 'myfilter/myfilter',
        cardid: '2001013'
    };
    console.log(req.url, /_changes\?/.test(req.url), req.query, qs.stringify(filter));
    if (/_changes\?/.test(req.url)) {
        req.url = `${req.url}&${qs.stringify(filter)}`;
        Object.assign(req.query, filter);
    }
    apiProxy.web(req, res, { target: 'http://127.0.0.1:3002' });
});

app.use(express.json());

app.post('/login', (req, res, next)=> {
    res.status(200).json(generateJwtTokens('dfgdfgdfg-dfgdfgdfg-dfg-gfgfgf-fdgd'));
});

app.post('/refresh', (req, res, next)=> {
    return refreshToken(req, res);
});

app.post('/decode', (req, res, next)=> {
    const { token } = req.body;
    res.status(200).json(
        jwt.decode(token, {
            algorithms: ["HS256"]
        })
    );
});

app.listen(3001, ()=>{
    console.log('Listen on port 3001');
})
