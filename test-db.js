import postgres from 'postgres';

const sql = postgres('postgresql://postgres.ubfxznyetmbhkisbksxd:2HsTHrUI6Eiigg5j@aws-0-eu-central-1.pooler.supabase.com:6543/postgres', {
  ssl: 'require',
});

async function main() {
  try {
    const result = await sql`SELECT version()`;
    console.log('Connected:', result);
  } catch (err) {
    console.error('Pooler failed, trying direct db...');
    try {
      const sqlDirect = postgres('postgresql://postgres:2HsTHrUI6Eiigg5j@db.ubfxznyetmbhkisbksxd.supabase.co:5432/postgres', {
        ssl: 'require',
      });
      const res = await sqlDirect`SELECT version()`;
      console.log('Connected direct:', res);
      process.exit(0);
    } catch (e) {
      console.error('Direct connection failed:', e);
      process.exit(1);
    }
  }
  process.exit(0);
}

main();
