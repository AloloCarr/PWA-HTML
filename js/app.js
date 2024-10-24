const apiUrl = "http://localhost:4000/api/characters";

// Función para obtener los personajes 
async function fetchCharactersFromAPI() {
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`Error al obtener los personajes: ${response.statusText}`);
        }
        const characters = await response.json();
        displayCharacters(characters);
    } catch (error) {
        console.error("Error al traer los personajes del servidor:", error);
    }
}

// Función para mostrar los personajes en el DOM
function displayCharacters(characters) {
    const characterContainer = document.getElementById("characters");
    characterContainer.innerHTML = ""; 
    characters.forEach((character) => {
        const formattedBirthDate = new Date(character.birthDate).toISOString().split('T')[0];

        const card = `
            <div class="col-md-4 mb-4" id="character-${character.characterId}">
                <div class="card">
                    <img src="${character.img}" class="card-img-top" alt="${character.name}">
                    <div class="card-body">
                        <h5 class="card-title">${character.name}</h5>
                        <p class="card-text"><strong>Casa:</strong> ${character.house}</p>
                        <p class="card-text"><strong>Varita:</strong> ${character.wand}</p>
                        <p class="card-text"><strong>Fecha de Nacimiento:</strong> ${formattedBirthDate}</p>
                        <div class="d-flex justify-content-around align-content-center button-group">
                            <button class="btn btn-danger" onclick="confirmDeleteCharacter(${character.characterId})">Eliminar</button>
                            <button class="btn btn-primary" onclick="loadCharacterData(${character.characterId})" data-toggle="modal" data-target="#updateCharacterModal">Actualizar</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        characterContainer.insertAdjacentHTML("beforeend", card);
    });
}

// Función para agregar un nuevo personaje (POST)
async function addCharacterToAPI(characterData) {
    if (navigator.onLine) {
        try {
            const response = await fetch(apiUrl, {
                method: "POST",
                body: characterData,
            });

            if (!response.ok) {
                throw new Error(`Error al agregar el personaje: ${response.statusText}`);
            }

            const result = await response.text();
            console.log("Personaje agregado:", result);
            fetchCharactersFromAPI();
        } catch (error) {
            console.error("Error al agregar el personaje:", error);
            saveCharacterLocally(characterData);
        }
    } else {
        saveCharacterLocally(characterData);
    }
}

// Función para guardar el personaje localmente
function saveCharacterLocally(characterData) {
    const characters = JSON.parse(localStorage.getItem("characters")) || [];
    const newCharacter = Object.fromEntries(characterData.entries()); // Convertir FormData a objeto
    characters.push(newCharacter);
    localStorage.setItem("characters", JSON.stringify(characters));
    console.log("Personaje guardado localmente:", newCharacter);
}

// Función para sincronizar personajes guardados localmente
async function syncLocalCharacters() {
    const characters = JSON.parse(localStorage.getItem("characters")) || [];
    for (const character of characters) {
        try {
            const response = await fetch(apiUrl, {
                method: "POST",
                body: JSON.stringify(character),
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Error al sincronizar el personaje: ${response.statusText}`);
            }

            console.log("Personaje sincronizado:", character);
        } catch (error) {
            console.error("Error al sincronizar el personaje:", error);
        }
    }
    localStorage.removeItem("characters");
}

// Función para manejar el envío del formulario
document.getElementById('character-form').addEventListener('submit', function (event) {
    event.preventDefault();

    const formData = new FormData();
    formData.append('name', document.getElementById('name').value);
    formData.append('house', document.getElementById('house').value);
    formData.append('wand', document.getElementById('wand').value);
    formData.append('birthDate', document.getElementById('birthDate').value);
    formData.append('img', document.getElementById('img').files[0]);

    addCharacterToAPI(formData);
    $('#characterModal').modal('hide');
});

// Función para eliminar un personaje (DELETE)
async function deleteCharacterFromAPI(characterId) {
    try {
        const response = await fetch(`${apiUrl}/${characterId}`, {
            method: "DELETE",
        });

        if (!response.ok) {
            throw new Error(`Error al eliminar el personaje: ${response.statusText}`);
        }

        const result = await response.text();
        console.log("Personaje eliminado:", result);
        document.getElementById(`character-${characterId}`).remove();
    } catch (error) {
        console.error("Error al eliminar el personaje:", error);
    }
}

// Función para confirmar eliminación de personaje
function confirmDeleteCharacter(characterId) {
    $('#deleteConfirmModal').modal('show');

    document.getElementById('confirm-delete-btn').onclick = function () {
        deleteCharacterFromAPI(characterId);
        $('#deleteConfirmModal').modal('hide');
    };
}

// Función para cargar los datos del personaje en el modal de actualización
async function loadCharacterData(characterId) {
    try {
        const response = await fetch(`${apiUrl}/${characterId}`);
        if (!response.ok) {
            throw new Error(`Error al obtener los datos del personaje: ${response.statusText}`);
        }

        const character = await response.json();

        document.getElementById('updateCharacterName').value = character.name;
        document.getElementById('updateCharacterHouse').value = character.house;
        document.getElementById('updateCharacterWand').value = character.wand;
        document.getElementById('updateCharacterBirthDate').value = new Date(character.birthDate).toISOString().split('T')[0];
        document.getElementById('updateCharacterForm').onsubmit = function (event) {
            event.preventDefault();
            updateCharacterInAPI(characterId);
        };
    } catch (error) {
        console.error("Error al cargar los datos del personaje:", error);
    }
}

// Función para actualizar un personaje en la API 
async function updateCharacterInAPI(characterId) {
    const formData = new FormData();
    formData.append('name', document.getElementById('updateCharacterName').value);
    formData.append('house', document.getElementById('updateCharacterHouse').value);
    formData.append('wand', document.getElementById('updateCharacterWand').value);
    formData.append('birthDate', document.getElementById('updateCharacterBirthDate').value);
    if (document.getElementById('updateCharacterImg').files.length > 0) {
        formData.append('img', document.getElementById('updateCharacterImg').files[0]);
    }

    try {
        const response = await fetch(`${apiUrl}/${characterId}`, {
            method: "PUT",
            body: formData,
        });

        if (!response.ok) {
            throw new Error(`Error al actualizar el personaje: ${response.statusText}`);
        }

        const result = await response.text();
        console.log("Personaje actualizado:", result);
        fetchCharactersFromAPI();
        $('#updateCharacterModal').modal('hide');
    } catch (error) {
        console.error("Error al actualizar el personaje:", error);
    }
}

// Cargar los personajes al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    fetchCharactersFromAPI();
    if (navigator.onLine) {
        syncLocalCharacters(); // Sincroniza si está en línea
    }
});

// Detectar cuando el navegador vuelve a estar en línea
window.addEventListener('online', syncLocalCharacters);
