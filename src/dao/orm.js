import Database from "../database/Database.js";

class ORM {

    constructor(db) {
       this.db = db;
    }

    static async getORMInstance()
    {
        this.db = await Database.getDBInstance('./src/database/pong.sqlite');
        Database.loadTables('./src/database/sql/');
        return new ORM(this.db);
    }

    async delete(table, dataObject)
    {
        const conditions = Object.keys(dataObject).map(key => `${key} = ?`).join(' AND ');
        const statement = `DELETE FROM ${table} WHERE ${conditions}`;
        await this.db.run(statement, Object.values(dataObject));
    }

    async getOne(table, criteria, fetchedFields)
    {
        const selected = fetchedFields.length ? fetchedFields.join(', ') : '*';
        const conditions = Object.keys(criteria).map(key => `${key} = ?`).join(' AND ');
        const statement = `SELECT ${selected} FROM ${table} WHERE ${conditions}`;
        return await this.db.get(statement, Object.values(criteria));
    }

    async getAll(table, criteria, fetchedFields)
    {
        let statement;
        const selected = fetchedFields.length ? fetchedFields.join(', ') : '*';
        if (criteria)
        {
            const conditions = Object.keys(criteria).map(key => `${key} = ?`).join(' AND ');
            statement = `SELECT ${selected} FROM ${table} WHERE ${conditions}`;
            return await this.db.all(statement, Object.values(criteria));
        }
        statement = `SELECT ${selected} FROM ${table}`;
        return await this.db.all(statement);

    }

    async update(table, dataObject, creteriaObject)
    {
        const updatedField = Object.keys(dataObject).map(key => `${key} = ?`).join(', ');
        const currField = Object.keys(creteriaObject).map(key => `${key} = ?`).join(' AND ');
        const statement = `UPDATE ${table} SET ${updatedField} WHERE ${currField}`;
        await this.db.run(statement, [...Object.values(dataObject), ...Object.values(creteriaObject)])
    }

    async insert(table, dataObject)
    {
        const inserted = Object.keys(dataObject).join(', ');
        const values = Object.values(dataObject).map(e => '?').join(', ');
        const statement = `INSERT INTO ${table} (${inserted}) VALUES (${values});`;        
        await this.db.run(statement, Object.values(dataObject));
    }

    async run(query, dataObject)
    {
        if (dataObject)
            return await this.db.run(query, Object.values(dataObject))
        return await this.db.run(query); 
    }

    async all(query, dataObject)
    {
        if (dataObject)
            return await this.db.all(query, Object.values(dataObject))
        return await this.db.all(query); 
    }
}

export default ORM;
