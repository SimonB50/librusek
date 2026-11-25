import {defineConfig} from 'vite'
import react, {reactCompilerPreset} from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'

/**
 * Dev-only CORS proxy: `/proxy/<host>/<path>?<query>` -> `https://<host>/<path>?<query>`.
 *
 * Every upstream cookie ends up in the single `localhost` cookie jar, so cookies are
 * namespaced by the domain they belong to (`<scope>~<name>`) and only forwarded to
 * matching hosts. Without this `DZIENNIKSID` from wiadomosci.librus.pl overwrites the
 * one from synergia.librus.pl and both sessions break.
 */
const PROXY_PREFIX = '/proxy/';

/** Vite rewrites `req.url` to the upstream path - connect keeps the original in `originalUrl`. */
const urlOf = (req: { url?: string; originalUrl?: string }) => req.originalUrl ?? req.url ?? '';
const SCOPE_SEPARATOR = '~';

const scopeOf = (domain: string) => domain.replace(/^\./, '').toLowerCase().replace(/[^a-z0-9]/g, '_');
const matchesHost = (scope: string, host: string) => {
  const hostScope = scopeOf(host);
  return hostScope === scope || hostScope.endsWith(`_${scope}`);
};

/** `/proxy/synergia.librus.pl/a?b` -> `{host, path: "/a?b"}`, `null` for anything outside librus.pl. */
const parseTarget = (path: string) => {
  if (!path.startsWith(PROXY_PREFIX)) return null;
  const rest = path.slice(PROXY_PREFIX.length);
  const slash = rest.indexOf('/');
  const host = slash === -1 ? rest : rest.slice(0, slash);
  if (!/^(?:[a-z0-9-]+\.)*librus\.pl$/i.test(host)) return null;
  return {host, path: slash === -1 ? '/' : rest.slice(slash)};
};

/** `name=value; Domain=.librus.pl; Path=/; Secure` -> `librus_pl~name=value; Path=/; SameSite=Lax` */
const rewriteSetCookie = (cookie: string, host: string) => {
  const [pair, ...attributes] = cookie.split(';').map(part => part.trim());
  const domain = attributes.find(attribute => /^domain=/i.test(attribute))?.slice('domain='.length);
  const scope = scopeOf(domain ?? host);
  const kept = attributes.filter(attribute => !/^(domain|path|secure|samesite|partitioned)\b/i.test(attribute));
  return [`${scope}${SCOPE_SEPARATOR}${pair}`, 'Path=/', 'SameSite=Lax', ...kept].join('; ');
};

/** Forward only cookies scoped to the target host (or its parent domain), without the scope prefix. */
const filterCookies = (header: string, host: string) => header
  .split(';')
  .map(part => part.trim())
  .flatMap(part => {
    const separator = part.indexOf(SCOPE_SEPARATOR);
    if (separator === -1) return [];
    const scope = part.slice(0, separator);
    return matchesHost(scope, host) ? [part.slice(separator + 1)] : [];
  })
  .join('; ');

// https://vite.dev/config/
export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version ?? '0.0.0'),
  },
  plugins: [
    react(),
    babel({presets: [reactCompilerPreset()]}),
    tailwindcss()
  ],
  server: {
    proxy: {
      '/proxy/': {
        changeOrigin: true,
        followRedirects: false,
        // Not a librus.pl target -> 404 (returning `false` stops the request before it is proxied)
        bypass: req => (parseTarget(urlOf(req)) ? undefined : false),
        configure(proxy, options) {
          // `rewrite` runs synchronously right before the request is proxied, so setting the target here is safe
          options.rewrite = path => {
            const target = parseTarget(path);
            if (!target) return path;
            options.target = `https://${target.host}`;
            return target.path;
          };
          proxy.on('proxyReq', (proxyReq, req) => {
            const target = parseTarget(urlOf(req));
            if (!target) return;
            const cookies = filterCookies(req.headers.cookie ?? '', target.host);
            if (cookies) proxyReq.setHeader('cookie', cookies);
            else proxyReq.removeHeader('cookie');
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            const target = parseTarget(urlOf(req));
            if (!target) return;
            const cookies = proxyRes.headers['set-cookie']?.map(cookie => rewriteSetCookie(cookie, target.host));
            // Copied to the response by http-proxy after this handler
            if (cookies) proxyRes.headers['set-cookie'] = cookies;

            // Redirects are not followed (they would leave the proxy) - expose them as an empty 200 instead
            const status = proxyRes.statusCode ?? 0;
            const location = proxyRes.headers.location;
            if (status >= 300 && status < 400 && location) {
              if (cookies) res.setHeader('set-cookie', cookies);
              res.setHeader('x-upstream-location', new URL(location, `https://${target.host}${target.path}`).href);
              res.setHeader('x-upstream-status', String(status));
              res.setHeader('access-control-expose-headers', 'x-upstream-location, x-upstream-status');
              res.statusCode = 200;
              res.end();
            }
          });
        },
      }
    }
  }
})
