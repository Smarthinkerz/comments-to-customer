'use strict';
const { ensureInit, outboxTick } = require('../../server.cjs');

module.exports = async (req, res) => {
    /* Vercel Cron auth: when CRON_SECRET is set, only allow Bearer-matching calls.
       This is in addition to Vercel's own internal protection on Pro/Enterprise. */
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
        await outboxTick();
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ ok: true, ms: Date.now() - t0 }));
    } catch (err) {
        res.statusCode = 500;
        return res.end(JSON.stringify({ ok: false, error: String(err && err.message || err) }));
    }
};
