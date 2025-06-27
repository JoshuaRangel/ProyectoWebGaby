// Variables globales
let temas = [];
let archivosPorTema = {};

document.addEventListener('DOMContentLoaded', function() {
    // Cargar datos del usuario
    if(typeof getCookie === 'function') {
        document.getElementById("username-display").textContent = getCookie("username") || "Profesor";
        document.getElementById("tipo-usuario-display").textContent = getCookie("tipoUsuario") || "Docente";
    }

    // Cargar temas y archivos existentes
    cargarTemas();
    
    // Configurar eventos
    document.getElementById('btn-nuevo-tema').addEventListener('click', mostrarFormularioTema);
    document.getElementById('btn-guardar-tema').addEventListener('click', guardarTema);
    document.getElementById('btn-cancelar-tema').addEventListener('click', ocultarFormularioTema);
    document.getElementById('btn-subir').addEventListener('click', () => document.getElementById('subir-archivo').click());
    document.getElementById('subir-archivo').addEventListener('change', subirArchivo);
    document.getElementById('lista-temas').addEventListener('change', cargarArchivosTema);
});

function cargarTemas() {
    // Cargar temas desde localStorage o usar valores por defecto
    const temasGuardados = localStorage.getItem('temasMateriales');
    
    if (temasGuardados) {
        temas = JSON.parse(temasGuardados);
    } else {
        // Temas iniciales
        temas = [
            { id: 'matematicas', nombre: 'Matemáticas', archivos: [] },
            { id: 'ciencias', nombre: 'Ciencias', archivos: [] },
            { id: 'espanol', nombre: 'Español', archivos: [] }
        ];
        localStorage.setItem('temasMateriales', JSON.stringify(temas));
    }
    
    // Inicializar estructura de archivos por tema
    archivosPorTema = {};
    temas.forEach(tema => {
        archivosPorTema[tema.id] = tema.archivos || [];
    });
    
    // Llenar la lista desplegable
    const select = document.getElementById('lista-temas');
    select.innerHTML = '<option value="">-- Seleccione un tema --</option>';
    
    temas.forEach(tema => {
        const option = document.createElement('option');
        option.value = tema.id;
        option.textContent = tema.nombre;
        select.appendChild(option);
    });
}

function actualizarTemas() {
    // Actualizar los temas con sus archivos
    temas.forEach(tema => {
        tema.archivos = archivosPorTema[tema.id] || [];
    });
    
    // Guardar en localStorage
    localStorage.setItem('temasMateriales', JSON.stringify(temas));
}

function mostrarFormularioTema() {
    document.getElementById('nuevo-tema-form').style.display = 'block';
    document.getElementById('btn-nuevo-tema').style.display = 'none';
    document.getElementById('nombre-tema').focus();
}

function ocultarFormularioTema() {
    document.getElementById('nuevo-tema-form').style.display = 'none';
    document.getElementById('btn-nuevo-tema').style.display = 'inline-block';
    document.getElementById('nombre-tema').value = '';
}

function guardarTema() {
    const nombreTema = document.getElementById('nombre-tema').value.trim();
    if (!nombreTema) {
        alert('Por favor ingrese un nombre para el tema');
        return;
    }
    
    // Crear ID único para el tema
    const temaId = nombreTema.toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
    
    // Verificar si el tema ya existe
    if (temas.some(tema => tema.id === temaId)) {
        alert('Ya existe un tema con ese nombre');
        return;
    }
    
    const nuevoTema = {
        id: temaId,
        nombre: nombreTema,
        archivos: []
    };
    
    // Agregar el nuevo tema
    temas.push(nuevoTema);
    archivosPorTema[temaId] = [];
    
    // Actualizar la interfaz
    const select = document.getElementById('lista-temas');
    const option = document.createElement('option');
    option.value = temaId;
    option.textContent = nombreTema;
    select.appendChild(option);
    
    // Seleccionar el nuevo tema
    select.value = temaId;
    
    // Guardar y limpiar
    actualizarTemas();
    ocultarFormularioTema();
    cargarArchivosTema();
    
    // Mostrar mensaje
    document.getElementById('mensaje-subida').textContent = `Tema "${nombreTema}" creado correctamente`;
    document.getElementById('mensaje-subida').style.color = 'green';
}

function cargarArchivosTema() {
    const temaId = document.getElementById('lista-temas').value;
    const listaArchivos = document.getElementById('lista-archivos');
    const visorPdf = document.getElementById('visor-pdf');
    
    if (!temaId) {
        listaArchivos.innerHTML = '<p>Seleccione un tema para ver sus materiales</p>';
        visorPdf.style.display = 'none';
        return;
    }
    
    listaArchivos.innerHTML = '';
    
    if (archivosPorTema[temaId] && archivosPorTema[temaId].length > 0) {
        archivosPorTema[temaId].forEach(archivo => {
            const item = document.createElement('div');
            item.className = 'archivo-item';
            
            item.innerHTML = `
                <span>${archivo.nombre} (${formatBytes(archivo.tamaño)})</span>
                <div>
                    <button class="boton-accion boton-ver" data-tema="${temaId}" data-archivo="${archivo.nombre}">Ver</button>
                    <button class="boton-accion boton-eliminar" data-tema="${temaId}" data-archivo="${archivo.nombre}">Eliminar</button>
                </div>
            `;
            
            listaArchivos.appendChild(item);
        });
        
        // Agregar eventos a los botones nuevos
        document.querySelectorAll('.boton-ver').forEach(btn => {
            btn.addEventListener('click', function() {
                verArchivo(this.dataset.tema, this.dataset.archivo);
            });
        });
        
        document.querySelectorAll('.boton-eliminar').forEach(btn => {
            btn.addEventListener('click', function() {
                eliminarArchivo(this.dataset.tema, this.dataset.archivo);
            });
        });
    } else {
        listaArchivos.innerHTML = '<p>No hay materiales disponibles para este tema</p>';
    }
    
    visorPdf.style.display = 'none';
}

function verArchivo(temaId, nombreArchivo) {
    const visor = document.getElementById('visor-pdf');
    const rutaArchivo = `../../Materiales/${temaId}/${encodeURIComponent(nombreArchivo)}`;
    
    visor.src = rutaArchivo;
    visor.style.display = 'block';
    
    // Desplazarse al visor
    visor.scrollIntoView({ behavior: 'smooth' });
}

function subirArchivo(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const temaId = document.getElementById('lista-temas').value;
    if (!temaId) {
        mostrarMensaje('Por favor seleccione un tema primero', 'error');
        return;
    }
    
    if (!file.name.toLowerCase().endsWith('.pdf')) {
        mostrarMensaje('Solo se permiten archivos PDF', 'error');
        return;
    }
    
    // Configurar elementos de la interfaz
    const progressContainer = document.querySelector('.progress-container');
    const progressBar = document.getElementById('barra-progreso');
    
    progressContainer.style.display = 'block';
    progressBar.style.width = '0%';
    mostrarMensaje('Preparando para subir...', 'info');
    
    // Simular progreso de subida
    let progress = 0;
    const interval = setInterval(() => {
        progress += 5;
        progressBar.style.width = `${progress}%`;
        
        if (progress >= 100) {
            clearInterval(interval);
            completarSubida(file, temaId);
        }
    }, 100);
}

function completarSubida(file, temaId) {
    // Crear objeto de archivo
    const nuevoArchivo = {
        nombre: file.name,
        fecha: new Date().toISOString(),
        tamaño: file.size
    };
    
    // Agregar a la lista de archivos del tema
    if (!archivosPorTema[temaId]) {
        archivosPorTema[temaId] = [];
    }
    
    archivosPorTema[temaId].push(nuevoArchivo);
    
    // Actualizar temas y guardar
    actualizarTemas();
    
    // Mostrar mensaje de éxito
    const temaNombre = temas.find(t => t.id === temaId).nombre;
    mostrarMensaje(`Archivo "${file.name}" agregado al tema "${temaNombre}"`, 'success');
    
    // Actualizar lista de archivos
    cargarArchivosTema();
    
    // Reiniciar progreso
    document.querySelector('.progress-container').style.display = 'none';
    document.getElementById('subir-archivo').value = '';
}

function eliminarArchivo(temaId, nombreArchivo) {
    if (!confirm(`¿Está seguro de eliminar "${nombreArchivo}"?`)) return;
    
    // Eliminar de la lista
    archivosPorTema[temaId] = archivosPorTema[temaId].filter(a => a.nombre !== nombreArchivo);
    
    // Actualizar y guardar
    actualizarTemas();
    cargarArchivosTema();
    
    // Ocultar visor si estaba mostrando este archivo
    const visor = document.getElementById('visor-pdf');
    if (visor.src.includes(encodeURIComponent(nombreArchivo))) {
        visor.style.display = 'none';
    }
    
    mostrarMensaje(`Archivo "${nombreArchivo}" eliminado`, 'success');
}

function mostrarMensaje(texto, tipo) {
    const mensaje = document.getElementById('mensaje-subida');
    mensaje.textContent = texto;
    
    switch(tipo) {
        case 'error':
            mensaje.style.color = '#f44336';
            mensaje.style.backgroundColor = '#ffebee';
            break;
        case 'success':
            mensaje.style.color = '#4CAF50';
            mensaje.style.backgroundColor = '#e8f5e9';
            break;
        case 'info':
            mensaje.style.color = '#2196F3';
            mensaje.style.backgroundColor = '#e3f2fd';
            break;
        default:
            mensaje.style.color = '#000';
            mensaje.style.backgroundColor = '#fff';
    }
}

function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
