import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'

class AuthService
{
    constructor(authDao, userDao)
    {
        this.authDao = authDao;
        this.userDao = userDao;
    }

    generateToken(payload, secretKey, expiresIn = '1h')
    {
        return jwt.sign(payload, secretKey, { expiresIn });
    }

    validToken(headerValue)
    {
        try {
            const token = headerValue && headerValue.split(' ')[1];            
            if (!token)
                return 400;
            jwt.verify(token, process.env.TOKEN_SECRET || "salam kalam 3alam");
            return 200;
        } catch (err) {
            return 401; 
        }
    }

    shouldAuthenticate(url)
    {
        const routes = ['/signin', '/signup', '/logout', '/google', '/callback'];

        return !routes.some(path => url.pathname.endsWith(path));
    }
    
    async canSignIn(user)
    {
        let fields = {
            username: user.username,
        }
        const fetchedUser = await this.userDao.getUser(fields);
        return fetchedUser && await bcrypt.compare(user.pass, fetchedUser.pass); // if user is null, it means the user does not exist
    }

    async canSignUp(user)
    {
        let fields = {
            username: user.username,
            email: user.email
        }
        const fetchedUser = await this.userDao.getUser(fields, ' OR ');
       if (!fetchedUser)
            return { status: true };
        if (user.username === fetchedUser.username)
            return { status: false, error: 'username already used' };
        return { status: false, error: 'email already used' };
    }
}

export { AuthService };
