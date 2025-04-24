import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import nodemailer from 'nodemailer';

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

    validToken(token)
    {
        try {
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
        const routes = [
            '/signin', '/signup', '/logout', '/google', '/callback', '/get-otp', 'validate-otp'
        ];

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

    async sendOTP(body)
    {
        const user = await this.userDao.getUser({email: body.email})
        if (!user)
            throw "no user exit with the provided email";
        const transporter = nodemailer.createTransport({
            service: process.env.MAIL_PROVIDER ||'gmail',
            auth: {
                user: process.env.PONG_EMAIL,
                pass: process.env.PONG_PASS
            }
        });
        const otp = Math.floor(Math.random() * 864198 + 123456)  // otp will be between 123456 and 987654
        //add the  otp in redis instance with an amount of time to expire

        const mailOptions = {
            from: `'ping pong' ${process.env.PONG_EMAIL}`,
            to: body.email,
            subject: 'restore your password',
            html: `<h1>${otp}</h1>`
        };
        await transporter.sendMail(mailOptions);
    }

    async validOtp(body)
    {
        // verify the otp if it valid or not and expire it if it is valid
        return true;
    }
}

export { AuthService };
