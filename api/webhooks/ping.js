'use strict';
module.exports = (req, res) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ ok: true, msg: 'webhook subdir reachable', at: new Date().toISOString() }));
};
