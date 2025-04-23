class UserService {
    constructor(userDao)
    {
        this.userDao = userDao;
    }

    /**
     * 
     * transactions error handling & service logic will be added later
     * 
     */

    async addUser(user)
    {
        try {
            await this.userDao.addUser(user);
            return true;
        } catch (error) {            
            return false;
        }
    }

    async updateUser(name, user)
    {
        try {
            await this.userDao.updateUser(name, user);
            return true;
        } catch (error) {
            return false;
        }
    }
    
    async deleteUser(name)
    {
        try {
            await this.userDao.deleteUser(name);
            return true;
        } catch (error) {
            return false;
        }
    }

    async getUser(name)
    {
        return await this.userDao.getUser(name);
    }

    async getUsers()
    {
        return await this.userDao.getUsers();
    }

    async userExist(body)
    {
        const user = await this.getUser(body.username)
        return (user && body.pass === user.pass)
    }
}

export { UserService };
