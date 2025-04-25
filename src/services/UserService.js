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
        user.pass = await bcrypt.hash(user.pass || '', 10);
        try {
            await this.userDao.addUser(user);
            return true;
        } catch (error) {   

           return false;
        }
    }

    async updateUser(body)
    {
        const keys = Object.keys(body);
        const user = await this.userDao.getUser({ [keys[0]]: body[keys[0]] });
        
        if (!user)
            return false;
        await this.userDao.updateUser( { [keys[0]]: body[keys[0]] }, body.data);              
        return true;
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
