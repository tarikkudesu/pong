export class AuthController
{
    constructor(authService)
    {
        this.authService = authService;
    }

    signin (request, reply)
    {
        reply.send(this.authService.signin());
    }

    async refreshToken (request, reply)
    {
    
    }

    async signup (request, reply)
    {

    }


    async logout (request, reply)
    {
    
    }

    async getOtp (request, reply)
    {

    }

    async verifyOtp (request, reply)
    {

    }

    async preflight (request, reply)
    {

    }
}
