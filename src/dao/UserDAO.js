class UserDAO
{
    constructor(db)
    {
        this.db = db;
    }

    async addUser(user)
    {
        this.db
            .prepare("INSERT INTO user(id, name, bio) VALUES (?, ?, ?)")
            .run(user.id, user.name, user.bio);
    }
    
    async getUsers()
    {
        return this.db.prepare('SELECT * FROM user').all()
    }

    async getUser(id)
    {
        return this.db.prepare(`SELECT * FROM user WHERE id = ?`).get(id);
    }
    
    async deleteUser(id)
    {
        this.db
            .prepare(`DELETE FROM user WHERE id = ?`)
            .run(id);
    }
    
    async updateUser(id, user)
    {
        this.db
            .prepare(`UPDATE user SET name = ?, bio = ? WHERE id = ?`)
            .run(user.name, user.bio, id);
    }    
}

export {UserDAO};
