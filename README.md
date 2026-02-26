# MinMax Game - Poda Alfa-Beta

Ejemplo interactivo en React + Vite que ilustra la poda alfa-beta en un
árbol de juego de 3 niveles. Permite a los estudiantes rellenar α, β y
valores, y marcar manualmente las aristas que se deben podar.

## Estructura del proyecto

- `src/` : componentes y lógica del árbol.
- `index.html`, `vite.config.js` : configuración de Vite.
- `tailwind.config.js`, `postcss.config.js`, `src/index.css` : Tailwind CSS.
- `package.json` : dependencias y scripts.

## Requisitos

- Node.js >= 16
- npm (incluido con Node)

## Instalación

```bash
# clona el repositorio
git clone (https://github.com/frankcoste/MiniMax-Game---Poda-Alfa-Beta.git)
cd MinMax

# instala dependencias
npm install
```

## Uso

```bash
# iniciar servidor de desarrollo
npm run dev
```

Abre `http://localhost:5173` en el navegador. El árbol se genera
aleatoriamente; utiliza los botones para comprobar respuestas o ver la
solución.

## Cómo funciona

- Al generar el árbol se construye una estructura en `nodes` y se
  calcula la solución (`calculateSolution`) con alfa-beta, almacenando
  estados, nodos y aristas podadas.
- El usuario puede clickear líneas para marcar poda y completar entradas.
- El modo `checkMode` muestra retroalimentación visual (verde/rojo).

## Documentación adicional

Incluye comentarios en `src/App.jsx` explicando cada parte.

## Preview

<img width="1847" height="1242" alt="image" src="https://github.com/user-attachments/assets/9bc1ca59-7c47-4700-aa19-79e2813305d1" />


## Contribuciones

Puedes abrir issues o pull requests para mejoras, correcciones o
extensiones (más niveles, diferentes árboles, etc.).

## Licencia

MIT © 2026
