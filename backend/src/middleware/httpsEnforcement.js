function isEnabled() {
  return process.env.ENFORCE_HTTPS === 'true' || process.env.NODE_ENV === 'production';
}

function firstForwardedProtocol(req) {
  return String(req.headers['x-forwarded-proto'] || '')
    .split(',')[0]
    .trim()
    .toLowerCase();
}

function requestProtocol(req) {
  if (process.env.TRUST_PROXY === 'true') {
    const forwarded = firstForwardedProtocol(req);
    if (forwarded) return forwarded;
  }
  return String(req.protocol || '').toLowerCase();
}

function configuredRedirectHost() {
  const host = String(process.env.HTTPS_CANONICAL_HOST || '').trim();
  return /^[A-Za-z0-9.-]+(?::[0-9]{1,5})?$/.test(host) ? host : null;
}

// @spec AC-FE02-024, BR-FE02-017, NFR-FE02-SEC-003
function createHttpsEnforcementMiddleware({ enabled = isEnabled(), redirect = process.env.HTTPS_REDIRECT === 'true' } = {}) {
  return (req, res, next) => {
    if (!enabled || !req.path.startsWith('/api/auth/') || requestProtocol(req) === 'https') {
      return next();
    }

    if (redirect) {
      const host = configuredRedirectHost();
      if (host) {
        return res.redirect(308, `https://${host}${req.originalUrl}`);
      }
    }

    return res.status(400).json({
      error: {
        code: 'HTTPS_REQUIRED',
        message: 'HTTPS is required for authentication requests.',
      },
    });
  };
}

module.exports = {
  createHttpsEnforcementMiddleware,
};
