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
        const formatedUser = {
            username: user.username,
            email: user.email,
        };
        try {
            formatedUser.pass = await bcrypt.hash(user.pass || '', 10) // empty pass in case of OAuth
            await this.userDao.addUser(formatedUser);
            return { stat: true };
        } catch (error) {
            error.stat = false;
            return error;
        }
    }

    async updateUser(body)
    {
        const keys = Object.keys(body);
        try {
            const user = await this.userDao.getUser({ [keys[0]]: body[keys[0]] });
            if (!user)
                throw new  Error("user not exist");
            await this.userDao.updateUser( { [keys[0]]: body[keys[0]] }, body.data);
            return { stat: true };           
        }
        catch (error) {
            error.stat = false;
            return error
        }
    }

    async deleteUser(name)
    {
        try {
            await this.userDao.deleteUser(name);
            return { stat: true };
        } catch (error) {
            error.stat = false;
            return error;
        }
    }

    async getUser(username, ...fetchedFields)
    {
        try {
            const user = await this.userDao.getUser({ username }, fetchedFields);
            return { stat: true, user };
        } catch (error) {
            error.stat = false;
            return error;
        }
    }

    async getUsers(criteria, ...fetchedFields)
    {
        try {
            const users = await this.userDao.getUsers(criteria, fetchedFields);
            return { stat: true, users };
        } catch (error) {
            error.stat = false;
            return error;
        }
    }
}

export { UserService };
