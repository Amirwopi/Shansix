const { spawnSync } = require('child_process');
const mysql = require('mysql2/promise');

function requireEnv(name) {
  const v = process.env[name];
  if (!v) {
    throw new Error(`${name} is not set`);
  }
  return v;
}

async function ensureDatabaseExists() {
  const databaseUrl = requireEnv('DATABASE_URL');

  const url = new URL(databaseUrl);
  if (url.protocol !== 'mysql:') {
    throw new Error(`DATABASE_URL must start with mysql:// (received: ${url.protocol}//)`);
  }

  const dbName = decodeURIComponent(url.pathname.replace(/^\//, ''));
  if (!dbName) {
    throw new Error('DATABASE_URL must include a database name (e.g. mysql://user:pass@host:3306/dbname)');
  }

  const connection = await mysql.createConnection({
    host: url.hostname,
    port: url.port ? Number(url.port) : 3306,
    user: decodeURIComponent(url.username || ''),
    password: decodeURIComponent(url.password || ''),
    multipleStatements: false,
  });

  try {
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
  } finally {
    await connection.end();
  }
}

function run(cmd, args) {
  const res = spawnSync(cmd, args, { stdio: 'inherit', shell: false });
  if (res.status !== 0) {
    process.exit(res.status ?? 1);
  }
}

async function main() {
  await ensureDatabaseExists();

  // No prisma/migrations in this repo; use db push to sync schema in production.
  // If you later add migrations, you can switch this to: prisma migrate deploy
  run('npx', ['prisma', 'db', 'push']);
}

if (require.main === module) {
  main().catch((err) => {
    console.error('ensure-db failed:', err);
    process.exit(1);
  });
} else {
  module.exports = main();
}
