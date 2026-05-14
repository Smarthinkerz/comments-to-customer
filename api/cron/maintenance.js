'use strict';
const { ensureInit, runMaintenanceOnce } = require('../../server.cjs');

module.exports = async (req, res) => {
    if (process.env.CRON_SECRET) {
        const auth = req.headers['authorization'] || '';
        if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
            res.statusCode = 401;
            return res.end('unauthorized');
        }
    }
    try {
        await ensureInit();
        const t0 = Date.now();
        await runMaintenanceOnce();
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ ok: true, ms: Date.now() - t0 }));
    } catch (err) {
        res.statusCode = 500;
        return res.end(JSON.stringify({ ok: false, error: String(err && err.message || err) }));
    }
};
