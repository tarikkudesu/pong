
export default async (fastify) => {
    fastify.register(await import('../schemas/bad-schema.js'));
}