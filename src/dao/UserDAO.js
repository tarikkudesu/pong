class UserDAO
{
    constructor(db)
    {
        this.db = db;
    }

    async addUser(user)
    {
        return this.db
            .prepare("INSERT INTO user(username, email, pass, bio) VALUES (?, ?, ?, ?)")
            .run(user.username, user.email, user.pass, user.bio);
    }
    
    async getUsers()
    {
        return this.db.prepare('SELECT * FROM user').all()
    }

    async getUser(username)
    {
        return this.db.prepare(`SELECT * FROM user WHERE username = ?`).get(username);
    }
    
    async deleteUser(username)
    {
        this.db
            .prepare(`DELETE FROM user WHERE username = ?`)
            .run(username);
    }
    
    async updateUser(username, user)
    {
        this.db
            .prepare(`UPDATE user SET username = ?, email = ?, bio = ? WHERE username = ?`)
            .run(user.username, user.email, user.bio, username);
    }    
}

export { UserDAO };
