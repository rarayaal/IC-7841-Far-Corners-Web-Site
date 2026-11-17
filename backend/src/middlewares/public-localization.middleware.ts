import type { RequestHandler } from 'express';
import { localizePublicContent, type PublicContentKind } from '../services/public-localization.service.js';

/** Opt-in display metadata on public GETs; administrative and legacy reads stay unchanged. */
export function publicLocalization(kind: PublicContentKind): RequestHandler {
  return (req, res, next) => {
    const language = req.query.lang;
    if (language === undefined || req.query.admin === 'true') { next(); return; }
    if (language !== 'es' && language !== 'en') {
      res.status(400).json({ message: "El idioma debe ser 'es' o 'en'." }); return;
    }
    const send = res.json.bind(res);
    res.json = body => {
      if (res.statusCode !== 200) return send(body);
      void localizePublicContent(body, kind, language).then(result => {
        if (res.destroyed || res.writableEnded) return;
        res.setHeader('X-Translation-State', result.state);
        send(result.data);
      }).catch(() => {
        if (!res.destroyed && !res.writableEnded) {
          res.setHeader('X-Translation-State', 'unavailable'); send(body);
        }
      });
      return res;
    };
    next();
  };
}
