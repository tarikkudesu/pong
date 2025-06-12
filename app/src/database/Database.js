import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import fs from 'fs'

class Database {
    static #db = null;

    static loadTables(path)
    {
        fs.readdirSync(path).forEach(file => {
            try {
                const sql = fs.readFileSync(path + file, 'utf-8');
                Database.#db.exec(sql).then(result => {})
                .catch(err => console.error(`Error executing SQL from file ${file}:`, err.message));
            } catch (err) {
                console.error(`Error reading file ${file}:`, err);
            }
        });
    }

    static async getDBInstance(path)
    {
        if (!Database.#db)
        {
            Database.#db = await open({
                filename: path,
                driver: sqlite3.Database,
            });
        }
        return Database.#db;
    }

    static close()
    {
        Database.#db.close()
    }
}

export default Database;
