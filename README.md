# Landing Page - Bachillerato Nacional

Landing page semi-dinámica para el programa Bachillerato Nacional que se actualiza automáticamente según las fechas y etapas del proceso definidas en un archivo JSON.

## Estructura del Proyecto

```
pruebaLanding/
├── index.html          # Estructura HTML de la página
├── styles.css          # Estilos CSS según el diseño
├── script.js           # Lógica JavaScript para funcionalidad dinámica
├── datos.json          # Datos de configuración (etapas, fechas, textos)
└── README.md           # Este archivo
```

## Funcionalidades Principales

### 1. **Hero Banner Dinámico**
El banner principal cambia automáticamente según la etapa activa:
- **Antes de la fecha de inicio**: Muestra el texto informativo (ej: "Convocatoria disponible a partir del 13 de febrero del 2026")
- **Cuando llega la fecha**: Cambia a un botón interactivo para descargar/ver la convocatoria

### 2. **Etapas Dinámicas**
- Las etapas se generan automáticamente desde el JSON
- Cada etapa muestra:
  - Número de etapa (con indicador visual si está activa)
  - Nombre de la etapa
  - Fecha o rango de fechas formateado en español
  - Botón "Consultar" que se activa cuando la etapa está vigente

### 3. **Sistema de Fechas Inteligente**
- Reconoce dos tipos de fechas:
  - **Fecha única**: Una fecha específica (ej: "18-08-2026")
  - **Periodo**: Un rango de fechas (ej: "17-03-2026" a "14-04-2026")
- Compara automáticamente con la fecha actual para determinar qué etapa está activa

## Estructura del JSON

El archivo `datos.json` contiene toda la configuración:

```json
{
  "ciclo_escolar": "2025-2026",
  "calendario": {
    "etapas": [
      {
        "identificador_etapa": 0,
        "nombre_etapa": "Publicación",
        "fecha": {
          "tipo_fecha": "fecha_unica",
          "fecha_inicio": "",
          "fecha_fin": "13-02-2026"
        },
        "orden_en_flujo": 0,
        "estado": "activo",
        "seccion_destacada": {
          "mostrar_en_seccion_destacada": true,
          "texto_seccion_destacada": "Convocatoria disponible a partir del 13 de febrero del 2026",
          "contiene_boton": false,
          "texto_boton_destacado": "",
          "enlace_seccion_destacada": ""
        }
      }
    ]
  }
}
```

### Campos Importantes

- **`fecha.tipo_fecha`**: Puede ser `"fecha_unica"` o `"periodo"`
- **`fecha.fecha_inicio`**: Fecha de inicio en formato `DD-MM-YYYY`
- **`fecha.fecha_fin`**: Fecha final (opcional para fecha única, requerida para periodo)
- **`seccion_destacada.mostrar_en_seccion_destacada`**: Si es `true`, esta etapa puede aparecer en el hero banner
- **`seccion_destacada.contiene_boton`**: Si es `true`, muestra un botón en lugar de texto
- **`orden_en_flujo`**: Determina el orden de aparición en la sección de etapas

## Cómo Funciona

1. **Carga de Datos**: Al cargar la página, `script.js` carga el archivo `datos.json`

2. **Determinación de Etapa Activa**: 
   - Compara la fecha actual con las fechas de cada etapa
   - Selecciona la etapa más reciente que esté activa y tenga `mostrar_en_seccion_destacada: true`

3. **Actualización del Hero Banner**:
   - Si `contiene_boton: true` y hay un `enlace_seccion_destacada`, muestra un botón
   - Si no, muestra el texto de `texto_seccion_destacada`

4. **Renderizado de Etapas**:
   - Crea dinámicamente cada etapa según los datos del JSON
   - Activa el botón "Consultar" solo si la etapa está vigente (fecha actual dentro del rango)
   - Formatea las fechas en español legible

## Uso

1. Abre `index.html` en un navegador web
2. Asegúrate de que el archivo `datos.json` esté en la misma carpeta
3. Para probar diferentes escenarios, modifica las fechas en `datos.json`

## Notas Importantes

- Las fechas deben estar en formato `DD-MM-YYYY` (ej: "13-02-2026")
- Para probar con fechas futuras, puedes cambiar la fecha del sistema o modificar temporalmente la lógica de comparación en `script.js`
- El sistema usa la fecha actual del navegador para determinar qué etapa está activa
- Los enlaces externos (que empiezan con "http") se abren en una nueva pestaña automáticamente

## Personalización

### Cambiar Colores
Los colores principales están definidos en `styles.css`:
- Color rojo principal: `#8B1A1A`
- Fondo gris claro: `#f5f5f5`

### Agregar Más Etapas
Simplemente añade más objetos al array `etapas` en `datos.json` siguiendo la misma estructura.

### Modificar Textos
Todos los textos informativos se pueden cambiar directamente en `datos.json` sin tocar el código.

