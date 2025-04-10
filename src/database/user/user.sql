CREATE TABLE IF NOT EXISTS user (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    bio TEXT NOT NULL
    -- avatar TEXT NOT NULL --default avatar path or upload by the user
);

--mock data

INSERT OR IGNORE INTO user(username, email, bio) VALUES ('otman', 'otman@gmail.com', 'ingenieur QA');
INSERT OR IGNORE INTO user(username, email, bio) VALUES ('tarik', 'tarik@gmail.com', 'ingenieur automatisation');
INSERT OR IGNORE INTO user(username, email, bio) VALUES ('omar', 'omar@gmail.com', 'administrateur system');
INSERT OR IGNORE INTO user(username, email, bio) VALUES ('mustafa', 'mustafa@gmail.com', 'ingenieur devops');