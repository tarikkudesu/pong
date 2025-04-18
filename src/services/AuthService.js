import jwt from 'jsonwebtoken'

class AuthService
{
    constructor(authDao)
    {
        this.authDao = authDao;
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
            jwt.verify(token, 'salam kalam 3alam');
            console.log('valid token : ' + token);
            return 200;
        } catch (err) {
            return 401; 
        }
    }

    shouldAuthenticate(request)
    {
        const url = request.url;
        const routes = ['/signin', '/signup', '/logout'];

        return !routes.some(path => url.endsWith(path));
    }
    

}

export { AuthService };
