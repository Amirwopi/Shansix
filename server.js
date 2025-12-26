const path = require('path');

async function main() {
  await require('./scripts/ensure-db');

  require(path.join(process.cwd(), '.next', 'standalone', 'server.js'));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
