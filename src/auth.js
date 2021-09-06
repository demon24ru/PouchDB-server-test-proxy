const jwt = require('jsonwebtoken');
const utils = require("express-pouchdb/lib/utils");

const accessTokenSecret = 'sdfsdfssdfsdfsdf';
const refreshTokenSecret = 'lklgkjdljfljkgdlkfgjldkfg';
const accessTokenExp = 2592000; // 30 days

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
            .json(generateJwtTokens('dfgdfgdfg-dfgdfgdfg-dfg-gfgfgf-fdgd'));
}

function auth(req, res, next){
    // ignore requests without authorization
    const auth = req.get("authorization");
    if (!auth || !/^Bearer /.test(auth))
        return utils.sendError(res, new Error('Unauthorized'), 401);

    const token = auth.substr(6).trim();
    let payload;

    try {
        payload = verify(token);
    } catch(e) {
        return utils.sendError(res, e, 401);
    }

    if (typeof payload.id !== "string") payload.id = null;

    req.user = payload;

    return next();
}

module.exports = {
    generateJwtTokens,
    refreshToken,
    auth,
}
