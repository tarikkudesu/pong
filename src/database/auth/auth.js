import fs from 'fs'
 
let load = async (db) =>
{
  const sql = fs.readFileSync('./src/database/auth/auth.sql', 'utf8');
  try {
    await db.exec(sql);
  } catch (error) {
    console.log(error);
  }
};

export default { load }
