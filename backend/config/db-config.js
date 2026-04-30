// ============================================
// INTERNMATCH — DATABASE CONFIG HELPERS
// Shared MySQL connection resolution for local, Render, and hosted MySQL
// ============================================

function toNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function shouldUseSsl(host, env) {
  const sslFlag = String(env.DB_SSL || env.MYSQL_SSL || env.SSL || '').toLowerCase();
  if (sslFlag === 'true' || sslFlag === '1') return true;

  const normalizedHost = String(host || '').toLowerCase();
  return normalizedHost.includes('aivencloud') || normalizedHost.includes('render.com');
}

function resolveMysqlConfig({ includeDatabase = true } = {}) {
  const env = process.env;
  const databaseUrl = env.DATABASE_URL || env.MYSQL_URL || env.CLEARDB_DATABASE_URL;

  let config = {};

  if (databaseUrl) {
    const url = new URL(databaseUrl);
    config = {
      host: url.hostname,
      port: toNumber(url.port, 3306),
      user: decodeURIComponent(url.username || ''),
      password: decodeURIComponent(url.password || ''),
      database: includeDatabase ? url.pathname.replace(/^\//, '') : undefined,
    };

    if (shouldUseSsl(config.host, env)) {
      config.ssl = { rejectUnauthorized: false };
    }

    return config;
  }

  const host = env.DB_HOST || env.MYSQLHOST || env.MYSQL_HOST || 'localhost';
  config = {
    host,
    user: env.DB_USER || env.MYSQLUSER || env.MYSQL_USER || 'root',
    password: env.DB_PASSWORD || env.MYSQLPASSWORD || env.MYSQL_PASSWORD || '',
    port: toNumber(env.DB_PORT || env.MYSQLPORT || env.MYSQL_PORT, 3306),
  };

  if (includeDatabase) {
    config.database = env.DB_NAME || env.MYSQLDATABASE || env.MYSQL_DATABASE || 'internmatch';
  }

  if (shouldUseSsl(host, env)) {
    config.ssl = { rejectUnauthorized: false };
  }

  return config;
}

function describeMysqlConfig(config) {
  return {
    host: config.host,
    port: config.port,
    user: config.user,
    database: config.database,
    ssl: Boolean(config.ssl),
  };
}

module.exports = {
  resolveMysqlConfig,
  describeMysqlConfig,
};
