// Définition de la classe City représentant une ville dans le graphe
class City {
    constructor(name, x, y, parent, data) {
        this.name = name; // Nom de la ville
        this.x = x; // Coordonnée x de la ville
        this.y = y; // Coordonnée y de la ville
        this.parent = parent; // Ville parente dans le parcours
        this.g = 0; // Coût du chemin du départ à cette ville
        this.h = 0; // Heuristique (estimation du coût du chemin de cette ville à la destination)
        this.f = 0; // Coût total : f = g + h
        this.data = data; // Données supplémentaires de la ville
        this.listConnection = []; // Liste des villes connectées
    }

    // Méthode pour ajouter une connexion à une autre ville
    addConnection(city) {
        this.listConnection.push(city);
    }

    // Méthode pour récupérer les connexions de la ville
    getConnection() {
        return this.listConnection;
    }

    // Méthode de parcours de la ville pour retracer le chemin parcouru
    parcours() {
        let listParent = [];
        let current = this;
        while (current !== null) {
            listParent.push(current);
            current = current.parent;
        }
        // Créer un tableau avec trois colonnes : name, x et y
        let table = [];
        listParent.reverse().forEach(city => {
            table.push([city.name, city.x, city.y]);
        });
        // Retourner une chaîne vide car le tableau a déjà été affiché
        return table;
    }
}

// Dictionnaire pour stocker les villes
const cityDic = {};
// Dictionnaire pour stocker les connexions entre les villes
const cityConnection = {};

// Fonction pour traiter les positions des villes
function positionParse(positions) {
    const lines = positions.split('\n');
    for (let line of lines) {
        const [name, x, y] = line.split(':');
        const city = new City(name, parseFloat(x), parseFloat(y), null, []);
        cityDic[name] = city;
    }
}

// Fonction pour traiter les connexions entre les villes
function connectionParse(connections) {
    const lines = connections.split('\n');
    for (let line of lines) {
        const [city1, city2, distance] = line.split(':');
        if (city1 && city2 && distance) {
            cityConnection[city1] = cityConnection[city1] || {};
            cityConnection[city1][city2] = parseFloat(distance);
            cityConnection[city2] = cityConnection[city2] || {};
            cityConnection[city2][city1] = parseFloat(distance);
        }
    }
}

// Fonction pour traiter les données supplémentaires des villes
function dataParse(data) {
    const lines = data.split('\n');
    for (let line of lines) {
        const [name, ...values] = line.split(':');
        const city = cityDic[name];
        if (city) {
            city.data = values.map(val => parseFloat(val));
        }
    }
}

// Heuristique basée sur les données
function h1_data(c1, c2, indice) {
    if (indice >= 0 && indice < c1.data.length && indice < c2.data.length) {
        return Math.abs(c1.data[indice] - c2.data[indice]);
    } else {
        return 0;
    }
}

// Heuristique basée sur la première donnée
function h2_data(c1, c2) {
    if (c1.data && c2.data && c1.data.length > 0 && c2.data.length > 0) {
        return Math.abs(c1.data[0] - c2.data[0]);
    } else {
        return Number.MAX_SAFE_INTEGER;
    }
}

// Fonction pour créer les connexions entre les villes
function createConnection() {
    for (const city in cityConnection) {
        const currentCity = cityDic[city];
        for (const connection in cityConnection[city]) {
            currentCity.addConnection(cityDic[connection]);
        }
    }
}

// Fonction d'heuristique pour l'algorithme A*
function heuristic(city, goal, dataIdx) {
    let h = 0;
    h += cityConnection[city.name][goal.name];
    if (dataIdx !== -1) {
        h += h2_data(city, goal) + h1_data(city, goal, dataIdx);
    }
    return h;
}

// Fonction pour reconstruire le chemin parcouru
function reconstructPath(cameFrom, current) {
    const path = [];
    while (current !== null && current !== undefined) {
        if (cityDic[current.name]) { // Vérifier si la ville existe dans cityDic
            path.push(current);
        }
        current = cameFrom[current.name];
    }
    return path.reverse();
}


// Fonction A* pour trouver le chemin optimal entre une ville de départ et une ville de destination
function astar(departure, destination, dataIdx = -1) {
    const cityStart = cityDic[departure]; // Récupérer la ville de départ
    const cityEnd = cityDic[destination]; // Récupérer la ville de destination
    let result = []; // Utiliser un tableau pour stocker les résultats du parcours
    const openSet = new Set(); // Ensemble des villes à évaluer
    const closedSet = new Set(); // Ensemble des villes déjà évaluées
    const cameFrom = {}; // Dictionnaire pour stocker le chemin parcouru

    // Initialiser les coûts de la ville de départ
    cityStart.g = 0;
    cityStart.h = heuristic(cityStart, cityEnd, dataIdx);
    cityStart.f = cityStart.h;

    // Ajouter la ville de départ à l'ensemble des villes à évaluer
    openSet.add(cityStart);

    // Tant qu'il reste des villes à évaluer
    while (openSet.size > 0) {
        let current = null;
        // Sélectionner la ville avec le coût f le plus bas dans l'ensemble des villes à évaluer
        for (const city of openSet) {
            if (!current || city.f < current.f) {
                current = city;
            }
        }

        // Si la ville actuelle est la ville de destination, reconstruire le chemin parcouru et le retourner
        if (current === cityEnd) {
            result = reconstructPath(cameFrom, cityEnd);
            return result;
        }

        // Retirer la ville actuelle de l'ensemble des villes à évaluer et l'ajouter à l'ensemble des villes évaluées
        openSet.delete(current);
        closedSet.add(current);

        // Parcourir les voisins de la ville actuelle
        for (const neighbor of current.getConnection()) {
            // Si le voisin a déjà été évalué, passer au voisin suivant
            if (closedSet.has(neighbor)) {
                continue;
            }

            // Calculer le coût G pour le voisin
            const tentativeGScore = current.g + cityConnection[current.name][neighbor.name];
            let betterPath = false;

            // Si le voisin n'est pas dans l'ensemble des villes à évaluer, l'ajouter et marquer un meilleur chemin
            if (!openSet.has(neighbor)) {
                openSet.add(neighbor);
                betterPath = true;
            } else if (tentativeGScore < neighbor.g) {
                // Sinon, si le coût G calculé est inférieur au coût G actuel du voisin, marquer un meilleur chemin
                betterPath = true;
            }

            // Si un meilleur chemin a été trouvé
            if (betterPath) {
                // Mettre à jour le chemin parcouru, le coût G, le coût H et le coût F du voisin
                cameFrom[neighbor.name] = current;
                neighbor.g = tentativeGScore;
                neighbor.h = heuristic(neighbor, cityEnd, dataIdx);
                neighbor.f = neighbor.g + neighbor.h;
            }
        }
    }

    return result; // Retourner le tableau des résultats du parcours
}


// Fonction principale exécutant l'algorithme A*
async function algorithmeAstar(source, destination, currentTime) {
    try {
        // Lecture des fichiers de données
        const fileConnectionsResponse = await fetch("distances.txt");
        const filePositionsResponse = await fetch("street_long_lat.txt");
        const fileDataResponse = await fetch("extracted_street_data.txt");
        const fileConnections = await fileConnectionsResponse.text();
        const filePositions = await filePositionsResponse.text();
        const fileData = await fileDataResponse.text();

        // Traitement des données
        positionParse(filePositions);
        connectionParse(fileConnections);
        dataParse(fileData);
        createConnection();

        let astarResult = astar(source, destination, currentTime);
        console.table(astarResult);

        const routeCoordinates = astarResult.map(city => [city.x, city.y]);

        return routeCoordinates;

    } catch (error) {
        console.error("Erreur lors de l'exécution de l'algorithme A* :", error);
    }
}
