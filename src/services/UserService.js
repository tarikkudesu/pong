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

    addUser(user)
    {
        return this.userDao.addUser(user);
    }

    updateUser(name, user)
    {
        return this.userDao.updateUser(name, user);
    }

    deleteUser(name)
    {
        return this.userDao.deleteUser(name)
    }

    getUser(name)
    {
        return this.userDao.getUser(name);
    }

    getUsers()
    {
        return this.userDao.getUsers();
    }
}

export { UserService };
