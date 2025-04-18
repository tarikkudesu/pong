import Database from 'better-sqlite3'
import load from "./loader.js";

let connection = () =>
{
    const services = [
        './src/database/sql/user.sql',
        './src/database/sql/chat.sql',
        './src/database/sql/friend.sql',
        // './src/database/sql/auth.sql',
        // './src/database/sql/game.sql',
    ];
    const db = new Database('./src/database/pong.sqlite')
    services.forEach(service => load(db, service));
    return db;
}

export default connection();
