import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import nodemailer from 'nodemailer';

class AuthService
{
    constructor(authDao, userService)
    {
        this.authDao = authDao;
        this.userService = userService;
    }

    generateToken(payload, secretKey, expiresIn = '1h')
    {
        return jwt.sign(payload, secretKey, { expiresIn });
    }

    validToken(token)
    {
        try {
            if (!token)
                throw new Error("no token provided");
            jwt.verify(token, process.env.JWT_TOKEN_SECRET || "salam kalam 3alam");
            return { stat: true };
        } catch (error) {
            error.stat = false
            return error; 
        }
    }

    shouldAuthenticate(url)
    {
        const routes = [
            '/signin', '/signup', '/logout', '/google', '/callback', '/get-otp', 'validate-otp'
        ];
        return !routes.some(path => url.pathname.endsWith(path));
    }

    async canSignIn(body)
    {
        try {
            const { user } = await this.userService.getUser(body.username);
            if (user && await bcrypt.compare(body.pass, user.pass)) // if user is null, it means the user does not exist
                return { stat: true };
            return new Error("username or password is wrrong")
        }
        catch (error) {
            error.stat = false;
            return error
        }
    }

    async canSignUp(body)
    {     
        try {
            const serviceResult = await this.userService.getUser(body.username);
            if (!serviceResult.user)
                return await this.userService.addUser(body);
            if (serviceResult.user.username === body.username)
                throw new Error('username already used');
            throw new Error('email already used');
        }
        catch (error) {
            error.stat = false;
            return error
        }
    }

    async sendOTP(body)
    {
        try {
            const { user } = await this.userService.getUser({email: body.email});
            if (!user)
                throw new Error('no user exit with the provided email');
            const transporter = nodemailer.createTransport({
                service: process.env.MAIL_PROVIDER ||'gmail',
                auth: {
                    user: process.env.PONG_EMAIL,
                    pass: process.env.PONG_PASS
                }
            });
            const otp = Math.floor(Math.random() * 864198 + 123456);  // otp will be between 123456 and 987654
            //add the  otp in redis instance with an amount of time to expire

            const mailOptions = {
                from: `'ping pong' ${process.env.PONG_EMAIL}`,
                to: body.email,
                subject: 'restore your password',
                html: `<h1>${otp}</h1>`
            };
            await transporter.sendMail(mailOptions);
            return { stat: true };
        } 
        catch ( error ) {
            error.stat = false;
            return error;
        }
    }

    async validOtp(body)
    {
        // verify the otp if it valid or not and expire it if it is valid
        return { stat: true };
    }
}

export { AuthService };
