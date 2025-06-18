class UserRepository
{
    #db = null;

    constructor(db)
    {
        this.#db = db;
    }

    async addUser(user)
    {
        return await this.#db.insert('user', user);
    }

    async getUsers(criteria, fetchedFields)
    {
        return await this.#db.getAll('user', criteria, fetchedFields);
    }

    async getUser(criteria, fetchedFields)
    {        
        const user = await this.#db.getOne('user',criteria, fetchedFields);
        return user;
    }

    async deleteUser(user)
    {
        this.#db.delete('user', user);
    }

    async updateUser(field, user)
    {
        return await this.#db.update('user', user, field)
    }    
}

export { UserRepository };
