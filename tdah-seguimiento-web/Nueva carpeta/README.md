# Sistema de Seguimiento TDAH

Prototipo funcional para el monitoreo y seguimiento de pacientes con Trastorno por Déficit de Atención e Hiperactividad (TDAH).

## 🧠 Características Principales

- **Panel de Control**: Vista general con estadísticas importantes
- **Gestión de Pacientes**: Registro y seguimiento de pacientes
- **Evaluaciones TDAH**: Sistema de evaluación estandarizado
- **Gestión de Medicación**: Control de tratamientos y dosis
- **Reportes de Progreso**: Generación de informes detallados
- **Interfaz Intuitiva**: Diseño moderno y fácil de usar

## 📁 Estructura del Proyecto

```
tdah/
├── index.html          # Página principal del sistema
├── script.js           # Funcionalidades JavaScript
└── README.md          # Documentación del proyecto
```

## 🎯 Funcionalidades Implementadas

### 1. Panel Principal
- Estadísticas en tiempo real
- Pacientes activos
- Evaluaciones del día
- Recordatorios pendientes
- Progreso promedio

### 2. Gestión de Pacientes
- Lista de pacientes con búsqueda
- Información básica (nombre, edad, ID)
- Estado actual del paciente
- Acciones rápidas (ver, editar, estadísticas)

### 3. Acciones Rápidas
- Nueva evaluación TDAH
- Gestión de medicación
- Generación de reportes
- Agendamiento de citas

### 4. Interfaz Responsiva
- Diseño adaptable a todos los dispositivos
- Animaciones y transiciones suaves
- Notificaciones del sistema
- Menú flotante de acciones

## 🛠️ Tecnologías Utilizadas

- **HTML5**: Estructura semántica y accesible
- **Tailwind CSS**: Diseño moderno y responsive
- **JavaScript Vanilla**: Interactividad y funcionalidades
- **Font Awesome**: Iconos profesionales

## 🎨 Diseño y UX

- **Esquema de colores**: Púrpura y azul (calmante y profesional)
- **Tipografía**: Clara y legible
- **Iconografía**: Intuitiva y consistente
- **Animaciones**: Suaves y no intrusivas

## 📱 Características Técnicas

- **Responsive Design**: Funciona en móviles, tablets y desktop
- **Performance**: Optimizado para carga rápida
- **Accesibilidad**: Cumple con estándares WCAG
- **Navegación**: Intuitiva y fácil de usar

## 🚀 Cómo Usar

1. **Abrir el Sistema**: 
   ```bash
   # Iniciar servidor local
   python -m http.server 8000
   ```
   Luego abrir `http://localhost:8000` en el navegador

2. **Navegación**:
   - Panel principal: Vista general del sistema
   - Búsqueda: Filtrar pacientes por nombre o ID
   - Acciones rápidas: Botón flotante (+) para acciones comunes

3. **Funcionalidades**:
   - Click en "👁️" para ver detalles del paciente
   - Click en "✏️" para editar información
   - Click en "📊" para ver estadísticas
   - Usar el buscador para filtrar pacientes

## 🔧 Personalización

### Cambiar Colores
Edita las clases de Tailwind CSS en `index.html`:
```html
<!-- Cambiar color principal -->
<div class="bg-purple-600"> <!-- Reemplaza purple-600 -->
```

### Agregar Nuevas Funcionalidades
1. Agrega nuevos botones en el HTML
2. Crea funciones correspondientes en `script.js`
3. Estiliza con clases de Tailwind CSS

### Modificar Datos
Los datos actualmente están simulados. Para conectar con una API:
1. Reemplaza las funciones simuladas con llamadas fetch
2. Actualiza el manejo de datos asíncronos
3. Agrega manejo de errores y loading states

## 📊 Secciones Futuras

Para una implementación completa:

- [ ] Sistema de autenticación
- [ ] Base de datos real (Firebase, MongoDB, etc.)
- [ ] Evaluaciones TDAH detalladas
- [ ] Sistema de recordatorios
- [ ] Integración con calendario
- [ ] Exportación de reportes (PDF, Excel)
- [ ] Módulo para padres/tutores
- [ ] Telemedicina integrada

## 🎯 Objetivo del Prototipo

Este prototipo demuestra las capacidades básicas de un sistema de seguimiento TDAH, incluyendo:
- Gestión eficiente de pacientes
- Interfaz profesional y moderna
- Funcionalidades clave para el monitoreo
- Base escalable para desarrollo futuro

---

**Desarrollado para presentación de proyecto TDAH ⚡**
