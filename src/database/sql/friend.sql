CREATE TABLE IF NOT EXISTS friendship (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uid1 INTEGER NOT NULL,
    uid2 INTEGER NOT NULL,
    sender INTEGER, --user can be blcked without sending any friendship request yet(sender can be null)
    stat TEXT NOT NULL,

     --friend table constraint
    CHECK (stat IN ('pending', 'approved', 'blocked')),
    CHECK (uid1 < uid2), UNIQUE (uid1, uid2), --to avoid duplicate bidirection data((1. 2) (2, 1)) (one friendship entry for 2 users) 
    FOREIGN KEY (uid1) REFERENCES user(id) ON DELETE CASCADE,
    FOREIGN KEY (uid2) REFERENCES user(id) ON DELETE CASCADE,
    FOREIGN KEY (sender) REFERENCES user(id) ON DELETE CASCADE
);

--mock data

INSERT OR IGNORE INTO friendship (uid1, uid2, stat) VALUES 
(1, 2, 'pending'),
(1, 3, 'approved'),
(1, 4, 'blocked'),
(2, 3, 'approved'),
(2, 4, 'pending'),
(3, 4, 'approved');
