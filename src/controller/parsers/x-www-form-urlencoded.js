import fp from "fastify-plugin";
import querystring from 'querystring'

export default fp(async (fastify) => {
    fastify.addContentTypeParser(
        'application/x-www-form-urlencoded',
        { parseAs: 'string' },
        async function (req, body) {
            return querystring.decode(body);
        }
    );
});
