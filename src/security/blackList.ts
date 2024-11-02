// Exemple d'une fonction pour ajouter un token à une blacklist (à stocker en mémoire, Redis, etc.)
const blacklist: string[] = [];

export const blacklistToken = (token: string | undefined) => {
    if (token) {
        blacklist.push(token);
    }
};

// Middleware pour vérifier si un token est blacklisté
export const isTokenBlacklisted = (token: string | undefined): boolean => {
    return token ? blacklist.includes(token) : false;
};

