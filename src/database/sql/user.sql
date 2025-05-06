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
('otman', 'ooulcaid.1337@gmail.com', '$2b$10$Wc36lPHxvSP.gsMlMDdgl./tIMeWrTXrkKpxb4kc0G5.NiyPBUzYe', 'ingenieur QA');
INSERT OR IGNORE INTO user(username, email, pass, bio) VALUES
('tarik', 'tarik@gmail.com', '$2b$10$cte0fcC8dvZvN/W1YlmbeOQsPc2g0HcE.ZToHnXLcFdZLWMICM4LO', 'ingenieur automatisation');
INSERT OR IGNORE INTO user(username, email, pass, bio) VALUES
('omar', 'omar@gmail.com', '$2b$10$JyueI1ESZfXweEbLbZVTXuwO9ndpR252dJh7RTYp7XuB.Nb94twj6', 'administrateur system');
INSERT OR IGNORE INTO user(username, email, pass, bio) VALUES
('mustafa', 'mustafa@gmail.com', '$2b$10$ZdiL4OydjBTFaAslzgyFBuXxkOVv9VBW3nZ.sBpF.xOkYJOzISjPe', 'ingenieur devops');
