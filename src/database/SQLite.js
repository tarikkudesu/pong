import fp from 'fastify-plugin'
import Database from 'better-sqlite3'

export default fp(async function (fastify, opts) {
  const db = new Database('./src/database/user.sqlite')

  db.exec(`
    CREATE TABLE IF NOT EXISTS user (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      bio TEXT NOT NULL
    );
  `)

  try {
    db.exec(`INSERT OR IGNORE INTO user(id, name, bio) VALUES (1, 'otman', 'ingenieur QA')`)
    db.exec(`INSERT OR IGNORE INTO user(id, name, bio) VALUES (2, 'tarik', 'ingenieur devops')`)
    db.exec(`INSERT OR IGNORE INTO user(id, name, bio) VALUES (3, 'omar', 'developer')`)
    db.exec(`INSERT OR IGNORE INTO user(id, name, bio) VALUES (4, 'mustafa', 'developer')`)
  } catch (error) {
    fastify.log.error(error)
  }
  
  fastify.decorate('sqlite', db);

  fastify.addHook('onClose', (instance, done) => {
    instance.sqlite.close()
    done()
  })
})
