class UserDAO
{
    constructor(db) {
        this.db = db;
    }

    async addUser(user)
    {
        const statement = this.db.prepare("INSERT INTO user(id, name, bio) VALUES (?, ?, ?)");
        statement.run(user.id, user.name, user.bio);
    }

    async getUser(id)
    {

    }

    async getUsers()
    {
        return this.db.prepare('SELECT * FROM user').all()
    }

    async deleteUser()
    {

    }

    async updateUser()
    {

    }
}

export {UserDAO};