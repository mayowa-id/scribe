import { DataSource } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import * as dotenv from 'dotenv';
import * as bcrypt from 'bcryptjs';

dotenv.config();

async function run() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 5432,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    // Enable SSL for AWS RDS connection
    ssl: { rejectUnauthorized: false },
    namingStrategy: new SnakeNamingStrategy(),
  });

  console.log('Connecting to database...');
  await dataSource.initialize();
  console.log('Database connected successfully.');

  const email = 'idowumayowa02@gmail.com';
  console.log(`Searching for user with email: ${email}`);

  // Query raw since we don't need to load entity definition files that might fail compilation
  const queryRunner = dataSource.createQueryRunner();
  const users = await queryRunner.query('SELECT * FROM users WHERE email = $1', [email]);

  if (users.length === 0) {
    console.log('No user found with this email.');
    await dataSource.destroy();
    return;
  }

  const user = users[0];
  console.log('User Details found:');
  console.log(JSON.stringify(user, null, 2));

  // Determine what operation to do based on command arguments
  const action = process.argv[2];
  if (action === 'verify') {
    console.log('Verifying user email...');
    await queryRunner.query('UPDATE users SET is_email_verified = true, email_verification_token = null WHERE email = $1', [email]);
    console.log('User verified successfully!');
  } else if (action === 'reset-password') {
    const plainPassword = process.argv[3] || 'Password123!';
    console.log(`Resetting password to: ${plainPassword}`);
    const passwordHash = await bcrypt.hash(plainPassword, 10);
    await queryRunner.query('UPDATE users SET password_hash = $1 WHERE email = $2', [passwordHash, email]);
    console.log('Password hash updated successfully!');
  } else if (action === 'delete') {
    console.log('Deleting user row...');
    await queryRunner.query('DELETE FROM users WHERE email = $1', [email]);
    console.log('User row deleted successfully!');
  } else {
    console.log('\nAvailable actions:');
    console.log('  npm run db-query verify -> Set is_email_verified to true');
    console.log('  npm run db-query reset-password <new_password> -> Set password_hash');
    console.log('  npm run db-query delete -> Delete user row');
  }

  await dataSource.destroy();
}

run().catch((err) => {
  console.error('Error running script:', err);
});
