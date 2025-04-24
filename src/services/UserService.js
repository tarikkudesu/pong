import bcrypt from "bcrypt";
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
        user.pass = await bcrypt.hash(user.pass, 10);
        try {
            await this.userDao.addUser(user);
            return true;
        } catch (error) {   

           return false;
        }
    }

    async updateUser(body)
    {
        try {
            await this.userDao.updateUser(body.user, body.data);
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

    async getUser(username)
    {
        return await this.userDao.getUser({ username });
    }

    async getUsers()
    {
        return await this.userDao.getUsers();
    }
}

export { UserService };
