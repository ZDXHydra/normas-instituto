/**
 * Script para la página de normas
 * Carga dinámicamente desde Google Sheets
 */

console.log('[Normas] Página iniciada');

const checkbox = document.getElementById('accept-checkbox');
const continueBtn = document.getElementById('continue-btn');
const normasContent = document.getElementById('normas-content');
const noticiasContent = document.getElementById('noticias-content');

// Cambio del checkbox
checkbox.addEventListener('change', () => {
  continueBtn.disabled = !checkbox.checked;
  continueBtn.style.background = checkbox.checked ? '#28a745' : '#ccc';
});

// Click en continuar
continueBtn.addEventListener('click', () => {
  if (checkbox.checked) {
    // Guardar en localStorage que el usuario aceptó
    localStorage.setItem('normasAceptadas', JSON.stringify({
      aceptadas: true,
      fecha: new Date().toISOString()
    }));
    
    // Redirigir a Google
    window.location.href = 'https://www.google.com';
  }
});

// Cargar contenido
async function cargarContenido() {
  const normasUrl = 'https://script.google.com/macros/s/AKfycbyw3SZWBXDkdCveM6bExvJp0rPIUyfZMjT6tU2mPUi16iBZdvja77MtH_D29rqSlsxb/exec?type=normas';
  const noticiasUrl = 'https://script.google.com/macros/s/AKfycbyw3SZWBXDkdCveM6bExvJp0rPIUyfZMjT6tU2mPUi16iBZdvja77MtH_D29rqSlsxb/exec?type=noticias';

  try {
    console.log('[Normas] Cargando normas...');
    const normasResponse = await fetch(normasUrl);
    const normasData = await normasResponse.json();
    
    if (normasData.normas) {
      normasContent.innerHTML = sanitizeHTML(normasData.normas);
      
      // Verificar si las normas son nuevas
      const normasActualizadas = normasData.lastUpdated || new Date().toISOString();
      const esNuevo = esContenidoNuevo('normas', normasActualizadas);
      
      if (esNuevo) {
        const h2 = document.querySelector('h2[style*="c41e3a"]');
        if (h2) {
          const etiqueta = document.createElement('span');
          etiqueta.className = 'etiqueta-nuevo';
          etiqueta.style.cssText = `
            position: absolute;
            top: -5px;
            right: 0;
            background: #c41e3a;
            color: white;
            padding: 4px 12px;
            border-radius: 4px;
            font-size: 0.65em;
            font-weight: 700;
            text-transform: uppercase;
          `;
          etiqueta.textContent = 'Nuevo';
          h2.style.position = 'relative';
          h2.appendChild(etiqueta);
        }
      }
      
      console.log('[Normas] Normas cargadas correctamente');
    }
  } catch (error) {
    console.error('[Normas] Error cargando normas:', error);
    normasContent.innerHTML = '<p style="color: #c41e3a;">Error al cargar normas</p>';
  }

  try {
    console.log('[Normas] Cargando noticias...');
    const noticiasResponse = await fetch(noticiasUrl);
    const noticiasData = await noticiasResponse.json();
    
    if (noticiasData.noticias && noticiasData.noticias.length > 0) {
      // Detectar noticias nuevas
      const noticiasConEstado = noticiasData.noticias.map(noticia => {
        const esNuevo = esContenidoNuevo('noticia_' + noticia.fecha + '_' + noticia.titulo, noticia.fecha);
        return { ...noticia, esNuevo };
      });

      noticiasContent.innerHTML = noticiasConEstado
        .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
        .map((noticia) => `
          <div style="
            background: white; 
            padding: 12px; 
            margin-bottom: 10px; 
            border-radius: 6px; 
            border-left: 3px solid #007bff;
            position: relative;
          ">
            ${noticia.esNuevo ? `
              <span style="
                position: absolute;
                top: 5px;
                right: 8px;
                background: #c41e3a;
                color: white;
                padding: 3px 8px;
                border-radius: 3px;
                font-size: 0.7em;
                font-weight: 700;
                text-transform: uppercase;
              ">Nuevo</span>
            ` : ''}
            <div style="font-size: 0.85em; color: #666; margin-bottom: 5px; margin-top: ${noticia.esNuevo ? '20px' : '0'};">${new Date(noticia.fecha).toLocaleDateString('es-ES')}</div>
            <div style="font-weight: 600; color: #c41e3a; margin-bottom: 5px;">${sanitizeHTML(noticia.titulo)}</div>
            <div style="font-size: 0.9em; color: #333;">${sanitizeHTML(noticia.contenido)}</div>
          </div>
        `).join('');
      
      console.log('[Normas] Noticias cargadas correctamente');
    }
  } catch (error) {
    console.error('[Normas] Error cargando noticias:', error);
    noticiasContent.innerHTML = '<p style="color: #666;">Error al cargar noticias</p>';
  }
}

// Función para detectar si el contenido es nuevo (menos de 7 días)
function esContenidoNuevo(clave, fecha) {
  try {
    const ahora = new Date().getTime();
    const fechaContenido = new Date(fecha).getTime();
    const diasTranscurridos = (ahora - fechaContenido) / (1000 * 60 * 60 * 24);
    
    console.log('[Normas] Verificando', clave, '- Días transcurridos:', diasTranscurridos.toFixed(2));
    
    // Si pasaron menos de 7 días, es nuevo
    if (diasTranscurridos < 7) {
      // Verificar si ya lo hemos marcado como visto
      const cacheKey = 'contenido_nuevo_' + clave;
      const estaEnCache = localStorage.getItem(cacheKey);
      
      if (!estaEnCache) {
        // Marcarlo como visto
        localStorage.setItem(cacheKey, JSON.stringify({
          fecha: fecha,
          marcadoEn: new Date().toISOString()
        }));
        console.log('[Normas]', clave, 'marcado como NUEVO');
        return true;
      }
      
      return false;
    }
    
    // Limpiar del cache si ya pasaron 7 días
    localStorage.removeItem('contenido_nuevo_' + clave);
    return false;
  } catch (error) {
    console.error('[Normas] Error verificando si es nuevo:', error);
    return false;
  }
}

function sanitizeHTML(html) {
  const div = document.createElement('div');
  div.textContent = html;
  let text = div.innerHTML;
  
  text = text
    .replace(/&lt;br\/?&gt;/g, '<br>')
    .replace(/&lt;p&gt;/g, '<p>')
    .replace(/&lt;\/p&gt;/g, '</p>')
    .replace(/&lt;strong&gt;/g, '<strong>')
    .replace(/&lt;\/strong&gt;/g, '</strong>')
    .replace(/&lt;em&gt;/g, '<em>')
    .replace(/&lt;\/em&gt;/g, '</em>')
    .replace(/&lt;ul&gt;/g, '<ul>')
    .replace(/&lt;\/ul&gt;/g, '</ul>')
    .replace(/&lt;li&gt;/g, '<li>')
    .replace(/&lt;\/li&gt;/g, '</li>');
    
  return text;
}

// Cargar contenido al iniciar
cargarContenido();
