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

    async getUsers(criteria, fetchedFields)
    {
        return await this.db.getAll('user', criteria, fetchedFields);
    }

    async getUser(criteria, fetchedFields)
    {
        return await this.db.getOne('user',criteria, fetchedFields);
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
