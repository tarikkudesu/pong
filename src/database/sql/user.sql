CREATE TABLE IF NOT EXISTS user (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    pass TEXT NOT NULL,
    bio TEXT DEFAULT '',
    avatar TEXT DEFAULT 'default.png' --default avatar path or upload by the user
);

--mock data

INSERT OR IGNORE INTO user(username, email, pass, bio) VALUES 
('otman', 'otman@gmail.com', 'pass', 'ingenieur QA'),
('tarik', 'tarik@gmail.com', 'pass', 'ingenieur automatisation'),
('omar', 'omar@gmail.com', 'pass', 'administrateur system'),
('mustafa', 'mustafa@gmail.com', 'pass', 'ingenieur devops');
