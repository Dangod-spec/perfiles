// Base de datos simulada utilizando localStorage
class MagicalGirlsDB {
    constructor() {
        this.girls = JSON.parse(localStorage.getItem('magicalGirls')) || [];
        this.stateHistory = JSON.parse(localStorage.getItem('stateHistory')) || [];
        this.currentId = parseInt(localStorage.getItem('currentId')) || 1;
    }

    saveData() {
        localStorage.setItem('magicalGirls', JSON.stringify(this.girls));
        localStorage.setItem('stateHistory', JSON.stringify(this.stateHistory));
        localStorage.setItem('currentId', this.currentId.toString());
    }

    addGirl(girl) {
        girl.id = this.currentId++;
        this.girls.push(girl);
        
        // Registrar cambio de estado inicial
        this.addStateChange(girl.id, null, girl.estado, new Date().toISOString());
        
        this.saveData();
        return girl;
    }

    updateGirl(id, updatedGirl) {
        const index = this.girls.findIndex(girl => girl.id === parseInt(id));
        if (index !== -1) {
            const oldGirl = this.girls[index];
            
            // Registrar cambio de estado si es diferente
            if (oldGirl.estado !== updatedGirl.estado) {
                this.addStateChange(id, oldGirl.estado, updatedGirl.estado, new Date().toISOString());
            }
            
            this.girls[index] = { ...this.girls[index], ...updatedGirl };
            this.saveData();
            return true;
        }
        return false;
    }

    deleteGirl(id) {
        const index = this.girls.findIndex(girl => girl.id === parseInt(id));
        if (index !== -1) {
            this.girls.splice(index, 1);
            this.saveData();
            return true;
        }
        return false;
    }

    getGirl(id) {
        return this.girls.find(girl => girl.id === parseInt(id)) || null;
    }

    getAllGirls() {
        return [...this.girls];
    }

    filterGirlsByState(state) {
        if (!state) return this.getAllGirls();
        return this.girls.filter(girl => girl.estado === state);
    }

    addStateChange(girlId, oldState, newState, date) {
        this.stateHistory.push({
            girlId: parseInt(girlId),
            oldState,
            newState,
            date
        });
        this.saveData();
    }

    getStateHistory(girlId) {
        return this.stateHistory
            .filter(record => record.girlId === parseInt(girlId))
            .sort((a, b) => new Date(b.date) - new Date(a.date));
    }
}

// Inicializar la base de datos
const db = new MagicalGirlsDB();

// Referencias a elementos del DOM
const form = document.getElementById('magical-girl-form');
const girlsList = document.getElementById('magical-girls-list');
const modal = document.getElementById('profile-modal');
const closeModalBtn = document.querySelector('.close');
const cancelBtn = document.getElementById('cancel-button');
const stateFilter = document.getElementById('filter-estado');

// Formatear fecha para mostrar
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('es-ES', options);
}

// Formatear estado para mostrar
function formatState(state) {
    const states = {
        'activa': 'Activa',
        'desaparecida': 'Desaparecida',
        'rescatada': 'Rescatada por la Ley de los Ciclos'
    };
    return states[state] || state;
}

// Renderizar lista de chicas mágicas
function renderGirlsList(girls) {
    girlsList.innerHTML = '';
    
    if (girls.length === 0) {
        girlsList.innerHTML = '<p>No hay chicas mágicas registradas.</p>';
        return;
    }
    
    girls.forEach(girl => {
        const listItem = document.createElement('li');
        listItem.className = 'girl-item';
        listItem.innerHTML = `
            <div class="girl-info" data-id="${girl.id}">
                <strong>${girl.nombre}</strong> (${girl.edad} años) - 
                <span class="estado estado-${girl.estado}">${formatState(girl.estado)}</span>
            </div>
            <div class="girl-actions">
                <button class="edit-btn" data-id="${girl.id}">✏️</button>
                <button class="delete-btn" data-id="${girl.id}">❌</button>
            </div>
        `;
        girlsList.appendChild(listItem);
    });
    
    // Agregar event listeners
    document.querySelectorAll('.girl-info').forEach(item => {
        item.addEventListener('click', showProfile);
    });
    
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', editGirl);
    });
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', deleteGirl);
    });
}

// Mostrar perfil completo
function showProfile(e) {
    const girlId = e.currentTarget.dataset.id;
    const girl = db.getGirl(parseInt(girlId));
    
    if (!girl) return;
    
    const profileDetails = document.getElementById('profile-details');
    profileDetails.innerHTML = `
        <div class="profile-field">
            <span class="field-label">Nombre:</span> ${girl.nombre}
        </div>
        <div class="profile-field">
            <span class="field-label">Edad:</span> ${girl.edad} años
        </div>
        <div class="profile-field">
            <span class="field-label">Ciudad de Origen:</span> ${girl.ciudad}
        </div>
        <div class="profile-field">
            <span class="field-label">Estado Actual:</span> 
            <span class="estado estado-${girl.estado}">${formatState(girl.estado)}</span>
        </div>
        <div class="profile-field">
            <span class="field-label">Fecha de Contrato:</span> ${formatDate(girl.contrato)}
        </div>
    `;
    
    // Mostrar historial de estados
    const historyList = document.getElementById('state-history-list');
    historyList.innerHTML = '';
    
    const stateHistory = db.getStateHistory(girlId);
    
    if (stateHistory.length === 0) {
        historyList.innerHTML = '<p>No hay cambios de estado registrados.</p>';
    } else {
        stateHistory.forEach(record => {
            const historyItem = document.createElement('li');
            historyItem.className = 'history-item';
            
            let stateChange;
            if (record.oldState === null) {
                stateChange = `Estado inicial: <span class="estado estado-${record.newState}">${formatState(record.newState)}</span>`;
            } else {
                stateChange = `Cambió de <span class="estado estado-${record.oldState}">${formatState(record.oldState)}</span> a <span class="estado estado-${record.newState}">${formatState(record.newState)}</span>`;
            }
            
            historyItem.innerHTML = `
                <div>${stateChange}</div>
                <div>${formatDate(record.date)}</div>
            `;
            
            historyList.appendChild(historyItem);
        });
    }
    
    modal.style.display = 'block';
}

// Editar chica mágica
function editGirl(e) {
    e.stopPropagation();
    const girlId = e.currentTarget.dataset.id;
    const girl = db.getGirl(parseInt(girlId));
    
    if (!girl) return;
    
    // Llenar formulario con los datos
    document.getElementById('id-input').value = girl.id;
    document.getElementById('nombre-input').value = girl.nombre;
    document.getElementById('edad-input').value = girl.edad;
    document.getElementById('ciudad-input').value = girl.ciudad;
    document.getElementById('estado-input').value = girl.estado;
    document.getElementById('contrato-input').value = girl.contrato.split('T')[0];
    
    document.getElementById('save-button').textContent = 'Actualizar';
    document.querySelector('.form-container h2').textContent = 'Editar Chica Mágica';
}

// Eliminar chica mágica
function deleteGirl(e) {
    e.stopPropagation();
    if (!confirm('¿Estás seguro de que deseas eliminar esta chica mágica?')) return;
    
    const girlId = e.currentTarget.dataset.id;
    if (db.deleteGirl(parseInt(girlId))) {
        renderGirlsList(db.filterGirlsByState(stateFilter.value));
    }
}

// Guardar o actualizar chica mágica
form.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const girlData = {
        nombre: document.getElementById('nombre-input').value.trim(),
        edad: parseInt(document.getElementById('edad-input').value),
        ciudad: document.getElementById('ciudad-input').value.trim(),
        estado: document.getElementById('estado-input').value,
        contrato: document.getElementById('contrato-input').value
    };
    
    const id = document.getElementById('id-input').value;
    
    if (id) {
        // Actualizar
        db.updateGirl(parseInt(id), girlData);
    } else {
        // Agregar nueva
        db.addGirl(girlData);
    }
    
    resetForm();
    renderGirlsList(db.filterGirlsByState(stateFilter.value));
});

// Filtrar por estado
stateFilter.addEventListener('change', function() {
    const estado = this.value;
    renderGirlsList(db.filterGirlsByState(estado));
});

// Cancelar edición
cancelBtn.addEventListener('click', resetForm);

// Cerrar modal
closeModalBtn.addEventListener('click', function() {
    modal.style.display = 'none';
});

// Cerrar modal al hacer clic fuera de él
window.addEventListener('click', function(e) {
    if (e.target === modal) {
        modal.style.display = 'none';
    }
});

// Resetear formulario
function resetForm() {
    form.reset();
    document.getElementById('id-input').value = '';
    document.getElementById('save-button').textContent = 'Guardar';
    document.querySelector('.form-container h2').textContent = 'Agregar Chica Mágica';
}

// Cargar la lista de chicas mágicas al iniciar
document.addEventListener('DOMContentLoaded', function() {
    renderGirlsList(db.getAllGirls());
});
