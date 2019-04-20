// Listen on a specific host via the HOST environment variable
var host = process.env.HOST || '0.0.0.0';
// Listen on a specific port via the PORT environment variable
var port = process.env.PORT || 8080;

// Grab the blacklist from the command-line so that we can update the blacklist without deploying
// again. CORS Anywhere is open by design, and this blacklist is not used, except for countering
// immediate abuse (e.g. denial of service). If you want to block all origins except for some,
// use originWhitelist instead.
var originBlacklist = parseEnvList(process.env.CORSANYWHERE_BLACKLIST);
var originWhitelist = parseEnvList(process.env.CORSANYWHERE_WHITELIST);
function parseEnvList(env) {
  if (!env) {
    return [];
  }
  return env.split(',');
}

// Set up rate-limiting to avoid abuse of the public CORS Anywhere server.
var checkRateLimit = require('./lib/rate-limit')(process.env.CORSANYWHERE_RATELIMIT);

var cors_proxy = require('./lib/cors-anywhere');
cors_proxy.createServer({
  originBlacklist: originBlacklist,
  originWhitelist: originWhitelist,
  requireHeader: [],
  checkRateLimit: checkRateLimit,
  setHeaders: {'Access-Control-Allow-Headers': 'Origin,Accept,DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range',
               'Access-Control-Expose-Headers': 'Content-Length,Content-Range',
               'access-control-allow-headers': 'origin,accept,dnt,user-agent,x-requested-with,if-modified-since,cache-control,content-type,range',
               'access-control-expose-headers': 'content-length,content-range',
               'Access-Control-Allow-Origin': '*',
               'access-control-allow-origin': '*',
               'Content-Type': 'text/plain; application/json',
               'content-type': 'text/plain; application/json',},
  removeHeaders: [
    'cookie',
    'cookie2',
    // Strip Heroku-specific headers
    'x-heroku-queue-wait-time',
    'x-heroku-queue-depth',
    'x-heroku-dynos-in-use',
    'x-request-start',
  ],
  redirectSameOrigin: true,
  httpProxyOptions: {
    // Do not add X-Forwarded-For, etc. headers, because Heroku already adds it.
    xfwd: false,
  },
}).listen(port, host, function() {
  console.log('Running CORS Anywhere on ' + host + ':' + port);
});
