const jwt = require('jsonwebtoken');

const accessTokenSecret = '6s54dfytrtrtr4s65d4fs6fd46s5fd45s64df4';
const refreshTokenSecret = '6s54dfytrtrtr4s65d4fs6fd46s5fd45s64df4';
const accessTokenExp = 2592000; // 30 days

function setJsonOrPlaintext(res) {
    // Send the client application/json if they asked for it,
    // else send text/plain; charset=utf-8. This mimics CouchDB.
    const type = res.req.accepts(['text', 'json']);
    if (type === "json") {
        res.setHeader('Content-Type', 'application/json');
    } else {
        //adds ; charset=utf-8
        res.type('text/plain');
    }
}

function sendJSON(res, status, body) {
    res.status(status);
    setJsonOrPlaintext(res);
    res.send(jsonToBuffer(body));
}

function sendError(res, err, baseStatus) {
    const status = err.status || baseStatus || 500;

    // last argument is optional
    if (err.name && err.message) {
        if (err.name === 'Error' || err.name === 'TypeError') {
            if (err.message.indexOf("Bad special document member") !== -1) {
                err.name = 'doc_validation';
                // add more clauses here if the error name is too general
            } else {
                err.name = 'bad_request';
            }
        }
        err = {
            error: err.name,
            reason: err.message
        };
    }
    sendJSON(res, status, err);
}

function generateJwtTokens(id) {
    const access = jwt.sign(
        {
            id
        },
        accessTokenSecret,
        { expiresIn: accessTokenExp }
    )

    const refresh = jwt.sign(
        {
            id
        },
        refreshTokenSecret,
  //      { expiresIn: this.refreshTokenExp }
    )

    return { access, refresh }
}

function verify(token) {
    console.log('verify accessToken %j', token)
    return jwt.verify(token, accessTokenSecret, {
        algorithms: ["HS256"]
    });
}

function verifyRefresh(token) {
    console.log('verify refreshToken %j', token)
    return jwt.verify(token, refreshTokenSecret, {
        algorithms: ["HS256"]
    });
}

function refreshToken(req, res) {
    const { token } = req.body;

    console.log('refresh %j', token)
    verifyRefresh(token);

    return res.status(200)
            .json(generateJwtTokens('b26ac690-ea92-4952-9348-67a61ee615fd'));
}

function auth(req, res, next){
    // ignore requests without authorization
    const auth = req.headers.authorization;
    if (!auth || !/^Bearer /.test(auth))
        return sendError(res, new Error('Unauthorized'), 401);

    const token = auth.substr(6).trim();
    let payload;

    try {
        payload = verify(token);
    } catch(e) {
        return sendError(res, e, 401);
    }

    if (typeof payload.id !== "string") payload.id = null;

    req.user = payload;

    return next();
}

module.exports = {
    generateJwtTokens,
    refreshToken,
    auth,
    sendError,
}
