'use strict';
const { requestHandler, ensureInit } = require('../../server.cjs');

module.exports = async (req, res) => {
    try {
        await ensureInit();
    } catch (err) {
        res.statusCode = 503;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ ok: false, error: 'init_failed' }));
    }
    return requestHandler(req, res);
};
