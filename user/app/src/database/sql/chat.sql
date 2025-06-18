CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    u_from INTEGER, -- Can be NULL if the sender is blocked or not yet a friend
    u_to INTEGER NOT NULL,
    content TEXT NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    stat TEXT DEFAULT 'sent',
    
    CHECK (stat IN ('sent', 'received', 'vue')),
    FOREIGN KEY (u_from) REFERENCES user(id) ON DELETE CASCADE,
    FOREIGN KEY (u_to) REFERENCES user(id) ON DELETE CASCADE
);


--mock data

INSERT OR IGNORE INTO messages (u_from, u_to, content, stat) VALUES
(1, 2, 'Salut Tarik, t’as avancé sur les tests auto ?', 'sent'),
(2, 1, 'Oui, j’ai terminé le scénario login. Je t’envoie ça.', 'received'),
(3, 4, 'Salut Mustafa, tu peux checker les logs du serveur ?', 'vue'),
(4, 3, 'Je suis dessus, je te fais un retour dans 10 min.', 'sent'),
(2, 3, 'Tu peux ajouter une règle firewall pour Jenkins ?', 'sent'),
(4, 1, 'Bonne nouvelle, le déploiement est passé sans erreur.', 'vue'),
(3, 2, 'Je viens de redémarrer le service nginx, c’est bon maintenant.', 'received');
