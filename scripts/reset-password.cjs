const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');

async function main() {
  const client = await MongoClient.connect('mongodb://127.0.0.1:27017/car_hero');
  const db = client.db('car_hero');
  const hash = await bcrypt.hash('Ahmed@123', 10);
  const result = await db.collection('users').updateOne(
    { phoneNumber: '+963991112222' },
    { $set: { password: hash } }
  );
  console.log('Password reset for +963991112222:', result.modifiedCount ? 'SUCCESS' : 'No change (already correct)');
  await client.close();
}
main().catch(e => console.error('Error:', e.message));
