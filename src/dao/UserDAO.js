class UserDAO
{
    constructor(db)
    {
        this.db = db;
    }

    async addUser(user)
    {
        return await this.db.insert('user', user);
    }

    async getUsers()
    {
        return await this.db.getAll('user');
    }

    async getUser(fields)
    {
        return await this.db.getOne('user', fields);
    }

    async deleteUser(username)
    {
        this.db.delete('user', { username });
    }
    
    async updateUser(field, user)
    {
        return await this.db.update('user', user, field)
    }    
}

export { UserDAO };
