class UserDAO
{
    constructor(db)
    {
        this.db = db;
    }

    async addUser(user)
    {
        let fields = Object.keys(user);
        let prepare = fields.map(key => '?').join(', ');
        let values = Object.values(user);
        return this.db
            .prepare(`INSERT INTO user(${fields.join(', ')}) VALUES (${prepare})`)
            .run(values);
    }

    async getUsers()
    {
        return this.db.prepare('SELECT * FROM user').all()
    }

    async getUser(fields, union = " AND ")
    {
        let conditions = Object.keys(fields).map(key => `${key} = ?`).join(union);
        let query = `SELECT * FROM user WHERE ${conditions}`;
        return this.db.prepare(query).get(Object.values(fields));
    }

    async deleteUser(username)
    {
        this.db
            .prepare(`DELETE FROM user WHERE username = ?`)
            .run(username);
    }
    
    async updateUser(field, user)
    {
        let conditions = Object.keys(user).map(key => `${key} = ?`).join(', ');
        let values = Object.values(user);
        let key = Object.keys(field)[0]
        values.push(field[key]);
        return this.db
            .prepare(`UPDATE user SET ${conditions} WHERE ${key} = ?`)
            .run(values);
    }    
}

export { UserDAO };
