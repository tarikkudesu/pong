import bcrypt from "bcrypt";

class UserService {
    constructor(UserRepository)
    {
        this.UserRepository = UserRepository;
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
            await this.UserRepository.addUser(formatedUser);
            return { stat: true };
        } catch (error) {
            error.stat = false;
            return error;
        }
    }

    async updateUser(body)
    {
        try {
            const user = await this.UserRepository.getUser(body.filter);
            if (!user)
                throw new  Error("user not exist");
            await this.UserRepository.updateUser( body.filter, body.data);
            return { stat: true };           
        }
        catch (error) {
            error.stat = false;
            return error
        }
    }

    async deleteUser(user)
    {
        try {
            await this.UserRepository.deleteUser(user);
            return { stat: true };
        } catch (error) {
            error.stat = false;
            return error;
        }
    }

    async getUser(username, ...fetchedFields)
    {
        try {
            const user = await this.UserRepository.getUser({ username }, fetchedFields);
            return { stat: true, user };
        } catch (error) {
            error.stat = false;
            return error;
        }
    }

    async getUsers(criteria, ...fetchedFields)
    {
        // return {stat: true, data: fetchedFields};        
        try {
            const users = await this.UserRepository.getUsers(criteria, fetchedFields);
            return { stat: true, users };
        } catch (error) {
            error.stat = false;
            return error;
        }
    }
}

export { UserService };
