import Database from 'better-sqlite3'
import user from './user/user.js'
import chat from './chat/chat.js'
import friend from './friend/friend.js'
// import auth from './auth/auth.js'

let connection = async () => {

    const db = new Database('./src/database/pong.sqlite')
    await user.load(db);
    await friend.load(db);
    await chat.load(db);
    // await auth.load(db);
    return db;
}

export default await connection()

