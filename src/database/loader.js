import fs from 'fs/promises';

export default async (dbInstance, sqlPath) => {
  try {
    const sql = await fs.readFile(sqlPath, 'utf8');
    dbInstance.exec(sql);
  } catch (error) {
    console.error(`Error executing SQL from ${sqlPath}:\n`, error);
  }
};
