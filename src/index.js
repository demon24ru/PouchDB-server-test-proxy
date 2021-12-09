const { generateJwtTokens, auth, refreshToken, sendError } = require('./auth');
const jwt = require('jsonwebtoken');
const qs = require('qs');
const httpProxy = require('http-proxy');

const apiProxy = httpProxy.createProxyServer({
    target: 'http://192.168.8.1:5984'
});

const express = require('express');
const app = express();


app.use('/db', auth, function(req, res) {

    const { url } = req;
    const sep = url.split('/');

    if (sep[1] && sep[1] !== 'queue')
        sendError(res, new Error('Forbidden'), 403);

    const filter = {
        filter: 'myfilter/myfilter',
        deviceId: req.user.id
    };

    if (/_changes\?/.test(req.url)) {
        console.log('url=>', url);
        req.url = `${req.url}&${qs.stringify(filter)}`;
        console.log('req.url=> %j', req.url);
        // Object.assign(req.query, filter);
    }
    apiProxy.web(req, res);
});

app.use(express.json());

app.post('/login', (req, res, next)=> {
    res.status(200).json(generateJwtTokens('b26ac690-ea92-4952-9348-67a61ee615fd'));
});

app.post('/refresh', (req, res, next)=> {
    return refreshToken(req, res);
});

// app.post('/decode', (req, res, next)=> {
//     const { token } = req.body;
//     res.status(200).json(
//         jwt.decode(token, {
//             algorithms: ["HS256"]
//         })
//     );
// });

app.listen(5984, ()=>{
    console.log('Listen on port 4000');
})
