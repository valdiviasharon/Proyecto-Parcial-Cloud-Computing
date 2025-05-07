# Proyecto de Búsqueda en Videos con Docker, Flask y Apache

Este repositorio implementa una aplicación web que permite buscar palabras clave en los frames extraídos de videos. La búsqueda se basa en un índice invertido generado a partir del contenido visual extraído con Google Cloud Vision API. El sistema incluye una interfaz web simple y un backend construido con Flask, todo orquestado mediante Docker.

1. Extrae *frames* de videos.
2. Analiza los frames con *Google Vision API* para obtener etiquetas descriptivas.
3. Crea un *índice invertido* que asocia palabras a imágenes y videos.
4. Permite al usuario *buscar términos* (y sus sinónimos) desde una interfaz web.
5. Devuelve los nombres de los archivos donde aparece ese término o sus sinónimos.

## 🗂 Estructura del proyecto

├── backend/
│ ├── app.py # Servidor Flask que gestiona las búsquedas y la indexación
│ ├── Dockerfile # Imagen Docker del backend
│ ├── requirements.txt # Dependencias del backend
│ ├── inverted_index.json # Índice invertido de palabras
│ ├── metadata.json # Metadatos de etiquetas por imagen/video
│ └── uploads/ # Frames extraídos de videos
│
├── frontend/
│ ├── index.html # Interfaz web
│ ├── main.js # Lógica JS que conecta con el backend
│ ├── style.css # Estilos
│ ├── Dockerfile # Imagen Docker del frontend
│
├── docker-compose.yml # Orquestador para levantar frontend y backend
