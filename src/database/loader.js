import fs from 'fs';

export default (dbInstance, sqlPath) => {
  const sql = fs.readFileSync(sqlPath, 'utf8');
  try {
    dbInstance.exec(sql);
  } catch (error) {
    console.error(`Error executing SQL from ${sqlPath}:\n`, error);
  }
};