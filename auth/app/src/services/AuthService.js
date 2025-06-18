import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import nodemailer from 'nodemailer';

class AuthService
{
    constructor(userService)
    {
        this.userService = userService;
    }

    signin()
    {
        return {
            msg: 'test'
        };
    }
}

export { AuthService };
