// Función para convertir fecha del formato DD-MM-YYYY a Date
function parseFecha(fechaString) {
    if (!fechaString || fechaString === '') return null;
    const [dia, mes, anio] = fechaString.split('-').map(Number);
    return new Date(anio, mes - 1, dia);
}

// Función para formatear fecha a formato legible
function formatearFecha(date) {
    const meses = [
        'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
        'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];
    
    if (!date) return '';
    const dia = date.getDate();
    const mes = meses[date.getMonth()];
    const anio = date.getFullYear();
    return `${dia} de ${mes} ${anio}`;
}

// Función para formatear rango de fechas
function formatearRangoFecha(fechaInicio, fechaFin) {
    if (!fechaInicio) return '';
    
    const fechaInicioDate = parseFecha(fechaInicio);
    const fechaFinDate = parseFecha(fechaFin);
    
    if (!fechaFinDate || fechaInicioDate.getTime() === fechaFinDate.getTime()) {
        return formatearFecha(fechaInicioDate);
    }
    
    const inicioFormateada = formatearFecha(fechaInicioDate);
    const finFormateada = formatearFecha(fechaFinDate);
    
    // Si es el mismo año, simplificar
    if (fechaInicioDate.getFullYear() === fechaFinDate.getFullYear()) {
        const diaInicio = fechaInicioDate.getDate();
        const mesInicio = fechaInicioDate.getMonth();
        const diaFin = fechaFinDate.getDate();
        const mesFin = fechaFinDate.getMonth();
        
        if (mesInicio === mesFin) {
            const meses = [
                'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
                'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
            ];
            return `${diaInicio} al ${diaFin} de ${meses[mesInicio]} ${fechaInicioDate.getFullYear()}`;
        }
    }
    
    return `${inicioFormateada} al ${finFormateada}`;
}

// Función para determinar si una etapa está activa según la fecha actual
function esEtapaActiva(etapa, fechaActual) {
    const fecha = etapa.fecha;
    
    if (!fecha) return false;
    
    if (fecha.tipo_fecha === 'fecha_unica') {
        const fechaInicio = parseFecha(fecha.fecha_inicio);
        const fechaFin = parseFecha(fecha.fecha_fin);
        
        // Si solo hay fecha_fin (como la primera etapa), está activa ANTES de esa fecha
        if (!fechaInicio && fechaFin) {
            const fin = new Date(fechaFin);
            fin.setHours(0, 0, 0, 0);
            return fechaActual.getTime() < fin.getTime();
        }
        
        // Si hay fecha_inicio, está activa desde esa fecha en adelante
        if (fechaInicio) {
            const inicio = new Date(fechaInicio);
            inicio.setHours(0, 0, 0, 0);
            return fechaActual.getTime() >= inicio.getTime();
        }
        
        return false;
    }
    
    if (fecha.tipo_fecha === 'periodo') {
        const fechaInicio = parseFecha(fecha.fecha_inicio);
        const fechaFin = parseFecha(fecha.fecha_fin);
        
        if (!fechaInicio) return false;
        
        const inicio = new Date(fechaInicio);
        inicio.setHours(0, 0, 0, 0);
        const fin = fechaFin ? (() => {
            const f = new Date(fechaFin);
            f.setHours(23, 59, 59, 999);
            return f;
        })() : Infinity;
        const actual = fechaActual.getTime();
        
        const finTime = fin === Infinity ? Infinity : fin.getTime();
        return actual >= inicio.getTime() && actual <= finTime;
    }
    
    return false;
}

// Variable global para almacenar la fecha personalizada (null = usar fecha actual)
let fechaPersonalizada = null;

// Función para obtener la fecha a usar (personalizada o actual)
function obtenerFechaActual() {
    if (fechaPersonalizada) {
        // La fecha personalizada viene en formato YYYY-MM-DD o YYYY-MM-DDTHH:mm:ss
        let fechaStr = fechaPersonalizada;
        if (!fechaStr.includes('T')) {
            fechaStr = fechaStr + 'T00:00:00';
        }
        const fecha = new Date(fechaStr);
        if (isNaN(fecha.getTime())) {
            console.error('Fecha inválida:', fechaPersonalizada);
            return new Date();
        }
        fecha.setHours(0, 0, 0, 0);
        return fecha;
    }
    const fecha = new Date();
    fecha.setHours(0, 0, 0, 0);
    return fecha;
}

// Función para encontrar la etapa destacada activa
function encontrarEtapaDestacada(datos) {
    const fechaActual = obtenerFechaActual();
    
    // Buscar la etapa más reciente que esté activa y tenga sección destacada
    const etapasDestacadas = datos.calendario.etapas
        .filter(etapa => etapa.seccion_destacada?.mostrar_en_seccion_destacada)
        .sort((a, b) => b.orden_en_flujo - a.orden_en_flujo);
    
    // Primero intentar encontrar una etapa activa según las fechas
    for (const etapa of etapasDestacadas) {
        if (esEtapaActiva(etapa, fechaActual)) {
            return etapa;
        }
    }
    
    // Si no hay ninguna activa según fechas, usar la primera etapa solo si:
    // - Tiene sección destacada
    // - No tiene fecha_inicio (está en estado "pre-convocatoria")
    // - La fecha actual es anterior a la fecha_fin de la primera etapa
    const primeraEtapa = datos.calendario.etapas.find(etapa => etapa.orden_en_flujo === 0);
    if (primeraEtapa && primeraEtapa.seccion_destacada?.mostrar_en_seccion_destacada) {
        const tieneFechaInicio = primeraEtapa.fecha?.fecha_inicio && primeraEtapa.fecha.fecha_inicio !== '';
        const fechaFin = parseFecha(primeraEtapa.fecha?.fecha_fin);
        
        // Solo mostrar como predeterminada si no tiene fecha_inicio Y la fecha actual es anterior a fecha_fin
        if (!tieneFechaInicio && fechaFin) {
            const fin = new Date(fechaFin);
            fin.setHours(23, 59, 59, 999);
            if (fechaActual.getTime() < fin.getTime()) {
                return primeraEtapa;
            }
        }
    }
    
    return null;
}

// Función para actualizar el Hero Banner
function actualizarHeroBanner(etapaDestacada) {
    const heroCta = document.getElementById('hero-cta');
    const ctaText = document.getElementById('cta-text');
    
    if (!heroCta) return;
    
    heroCta.innerHTML = '';
    
    if (etapaDestacada && etapaDestacada.seccion_destacada) {
        const seccionDestacada = etapaDestacada.seccion_destacada;
        
        // Si contiene botón y tiene enlace, mostrar botón
        if (seccionDestacada.contiene_boton && seccionDestacada.enlace_seccion_destacada) {
            const boton = document.createElement('a');
            boton.href = seccionDestacada.enlace_seccion_destacada;
            boton.className = 'cta-button';
            boton.textContent = seccionDestacada.texto_boton_destacado || 'Ver más';
            if (seccionDestacada.enlace_seccion_destacada.startsWith('http')) {
                boton.target = '_blank';
                boton.rel = 'noopener noreferrer';
            }
            heroCta.appendChild(boton);
        } else {
            // Mostrar solo texto
            const texto = document.createElement('p');
            texto.className = 'cta-text';
            texto.textContent = seccionDestacada.texto_seccion_destacada || '';
            heroCta.appendChild(texto);
        }
    }
}

// Función para renderizar las etapas
function renderizarEtapas(datos) {
    const stagesList = document.getElementById('stages-list');
    if (!stagesList) return;
    
    stagesList.innerHTML = '';
    
    const fechaActual = obtenerFechaActual();
    
    // Ordenar etapas por orden_en_flujo y filtrar la etapa 0 (no se muestra)
    const etapasOrdenadas = [...datos.calendario.etapas]
        .filter(etapa => etapa.orden_en_flujo !== 0)
        .sort((a, b) => a.orden_en_flujo - b.orden_en_flujo);
    
    etapasOrdenadas.forEach((etapa, index) => {
        const etapaActiva = esEtapaActiva(etapa, fechaActual);
        
        // Crear elemento de etapa
        const stageItem = document.createElement('div');
        stageItem.className = 'stage-item';
        
        // Número de etapa (ajustar para que empiece desde 1, ya que la etapa 0 no se muestra)
        const stageNumber = document.createElement('div');
        stageNumber.className = `stage-number ${etapaActiva ? '' : 'inactive'}`;
        stageNumber.textContent = index + 1;
        
        // Nombre de etapa
        const stageName = document.createElement('div');
        stageName.className = 'stage-name';
        stageName.textContent = etapa.nombre_etapa;
        
        // Fecha de etapa
        const stageDate = document.createElement('div');
        stageDate.className = 'stage-date';
        if (etapa.fecha.tipo_fecha === 'periodo') {
            stageDate.className += ' period';
            stageDate.textContent = formatearRangoFecha(etapa.fecha.fecha_inicio, etapa.fecha.fecha_fin);
        } else {
            const fechaUnica = parseFecha(etapa.fecha.fecha_inicio || etapa.fecha.fecha_fin);
            stageDate.textContent = formatearFecha(fechaUnica);
        }
        
        // Botón de consultar
        const stageButton = document.createElement('a');
        stageButton.className = `stage-button ${etapaActiva ? 'active' : 'disabled'}`;
        stageButton.textContent = 'Consultar';
        stageButton.href = etapa.enlace_documento || '#';
        
        if (!etapaActiva || !etapa.enlace_documento) {
            stageButton.classList.add('disabled');
            stageButton.style.pointerEvents = 'none';
            stageButton.href = '#';
        } else {
            if (etapa.enlace_documento.startsWith('http')) {
                stageButton.target = '_blank';
                stageButton.rel = 'noopener noreferrer';
            }
        }
        
        // Agregar flecha al botón
        const arrow = document.createElement('span');
        arrow.textContent = ' >';
        stageButton.appendChild(arrow);
        
        // Ensamblar el elemento
        stageItem.appendChild(stageNumber);
        stageItem.appendChild(stageName);
        stageItem.appendChild(stageDate);
        stageItem.appendChild(stageButton);
        
        stagesList.appendChild(stageItem);
    });
}

// Función principal para inicializar la página
async function inicializarPagina() {
    try {
        let datos;
        
        // Intentar usar los datos incrustados primero (evita problemas de CORS)
        if (typeof DATOS_ETAPAS !== 'undefined') {
            datos = DATOS_ETAPAS;
        } else {
            // Si no hay datos incrustados, intentar cargar desde archivo JSON
            try {
                const response = await fetch('datos.json');
                if (!response.ok) {
                    throw new Error('Error al cargar el archivo datos.json');
                }
                datos = await response.json();
            } catch (fetchError) {
                throw new Error('No se pudieron cargar los datos. Verifica que el archivo datos.json exista o que los datos estén incrustados en el HTML.');
            }
        }
        
        // Guardar datos globalmente para poder actualizar con diferentes fechas
        window.datosGlobales = datos;
        
        // Actualizar la página
        actualizarPagina(datos);
        
        // Configurar controles de fecha
        configurarControlesFecha(datos);
        
    } catch (error) {
        console.error('Error al inicializar la página:', error);
        // Mostrar mensaje de error al usuario si es necesario
        const heroCta = document.getElementById('hero-cta');
        if (heroCta) {
            heroCta.innerHTML = '<p class="cta-text" style="color: #d32f2f;">Error al cargar la información: ' + error.message + '</p>';
        }
    }
}

// Función para actualizar toda la página con los datos
function actualizarPagina(datos) {
    const fechaActual = obtenerFechaActual();
    console.log('=== Actualizando página ===');
    console.log('Fecha actual/simulada:', fechaActual);
    console.log('Fecha timestamp:', fechaActual.getTime());
    
    // Encontrar etapa destacada activa
    const etapaDestacada = encontrarEtapaDestacada(datos);
    console.log('Etapa destacada encontrada:', etapaDestacada ? etapaDestacada.nombre_etapa : 'Ninguna');
    
    // Actualizar hero banner
    actualizarHeroBanner(etapaDestacada);
    
    // Renderizar etapas
    renderizarEtapas(datos);
    
    // Actualizar indicador de fecha seleccionada
    actualizarIndicadorFecha();
}

// Función para configurar los controles de fecha
function configurarControlesFecha(datos) {
    const fechaInput = document.getElementById('fecha-prueba');
    const btnFechaActual = document.getElementById('btn-fecha-actual');
    const btnTogglePanel = document.getElementById('btn-toggle-panel');
    
    if (!fechaInput || !btnFechaActual) return;
    
    // Establecer fecha actual como valor inicial
    const hoy = new Date();
    fechaInput.value = hoy.toISOString().split('T')[0];
    
    // Listener para cambio de fecha
    fechaInput.addEventListener('change', function() {
        if (this.value) {
            fechaPersonalizada = this.value;
            console.log('Fecha seleccionada en input:', this.value);
            const datosActuales = window.datosGlobales || datos;
            if (datosActuales) {
                actualizarPagina(datosActuales);
            } else {
                console.error('No hay datos disponibles para actualizar');
            }
        }
    });
    
    // También escuchar input para actualización en tiempo real
    fechaInput.addEventListener('input', function() {
        if (this.value) {
            fechaPersonalizada = this.value;
            const datosActuales = window.datosGlobales || datos;
            if (datosActuales) {
                actualizarPagina(datosActuales);
            }
        }
    });
    
    // Listener para botón de fecha actual
    btnFechaActual.addEventListener('click', function() {
        fechaPersonalizada = null;
        const hoy = new Date();
        fechaInput.value = hoy.toISOString().split('T')[0];
        const datosActuales = window.datosGlobales || datos;
        if (datosActuales) {
            actualizarPagina(datosActuales);
        }
    });
    
    // Listener para minimizar/maximizar panel
    if (btnTogglePanel) {
        btnTogglePanel.addEventListener('click', function() {
            const panel = document.getElementById('date-control-panel');
            if (panel) {
                const isMinimized = panel.classList.toggle('minimized');
                this.textContent = isMinimized ? '+' : '−';
                
                // Ajustar padding del body
                document.body.style.paddingTop = isMinimized ? '40px' : '60px';
            }
        });
        
        // Permitir click en panel minimizado para expandirlo
        const panel = document.getElementById('date-control-panel');
        if (panel) {
            panel.addEventListener('click', function(e) {
                if (this.classList.contains('minimized') && e.target === this) {
                    btnTogglePanel.click();
                }
            });
        }
    }
}

// Función para actualizar el indicador de fecha seleccionada
function actualizarIndicadorFecha() {
    const indicador = document.getElementById('fecha-seleccionada');
    if (!indicador) return;
    
    const fecha = obtenerFechaActual();
    const meses = [
        'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
        'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];
    
    const dia = fecha.getDate();
    const mes = meses[fecha.getMonth()];
    const anio = fecha.getFullYear();
    
    const fechaFormateada = `${dia} de ${mes} ${anio}`;
    
    if (fechaPersonalizada) {
        indicador.textContent = `📅 Fecha simulada: ${fechaFormateada}`;
        indicador.style.color = '#ff9800';
    } else {
        indicador.textContent = `📅 Fecha actual: ${fechaFormateada}`;
        indicador.style.color = '#4caf50';
    }
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarPagina);
} else {
    inicializarPagina();
}

