CREATE TABLE IF NOT EXISTS user (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    bio TEXT NOT NULL,
    avatar TEXT DEFAULT 'default.png' --default avatar path or upload by the user
);

--mock data

INSERT OR IGNORE INTO user(username, email, bio) VALUES 
('otman', 'otman@gmail.com', 'ingenieur QA'),
('tarik', 'tarik@gmail.com', 'ingenieur automatisation'),
('omar', 'omar@gmail.com', 'administrateur system'),
('mustafa', 'mustafa@gmail.com', 'ingenieur devops');