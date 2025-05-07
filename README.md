# Proyecto de Búsqueda en Videos con Docker

Este repositorio implementa una aplicación web que permite buscar palabras clave en los frames extraídos de videos. La búsqueda se basa en un índice invertido generado a partir del contenido visual extraído con Google Cloud Vision API. El sistema incluye una interfaz web simple y un backend construido con Flask, todo orquestado mediante Docker.

1. Extrae *frames* de videos.
2. Analiza los frames con *Google Vision API* para obtener etiquetas descriptivas.
3. Crea un *índice invertido* que asocia palabras a imágenes y videos.
4. Permite al usuario *buscar términos* (y sus sinónimos) desde una interfaz web.
5. Devuelve los nombres de los archivos donde aparece ese término o sus sinónimos.

## Estructura del Proyecto

* backend/                  
   * app.py                       
   * Dockerfile                   
   * requirements.txt             
   * uploads/                    
   * inverted\_index.json         
   * metadata.json               
* frontend/                 
   * index.html                  
   * style.css                   
   * main.js                      
   * Dockerfile                   
* docker-compose.yml       

## Ejecución en Google Cloud Platform

### Prerrequisitos

- Tener una instancia activa en Google Compute Engine (máquina virtual).
- Haber instalado Docker y Docker Compose en la VM.
- Tener habilitada la Google Cloud Vision API.
- Contar con el archivo de credenciales del servicio (kubeletes-xxx.json).

### Pasos

1. *Subir el proyecto a tu instancia GCP*:
   - Abrir la *consola web de Google Cloud*.
   - Ir a tu máquina virtual y hacer clic en *"Abrir en el navegador mediante SSH"*.
   - En la terminal web, hacer clic en el ícono de carpeta 📁 y elegir *"Subir archivos"*.
   - Subir todo el proyecto .zip o sus archivos descomprimidos directamente.
2. *Descomprimir el archivo (si es necesario)*:
   ```bash
   unzip Proyecto-Parcial-Cloud-Computing.zip
   cd Proyecto-Parcial-Cloud-Computing

3. *Colocar el archivo de credenciales del API de Vision* en la carpeta backend/ con el nombre kubeletes-xxx.json.

4. *Construir y subir las imágenes a Artifact Registry*:

   - Asegúrate de haber creado un repositorio en Artifact Registry:
   >
   > bash
   > gcloud artifacts repositories create video-repo \
   >     --repository-format=docker \
   >     --location=us-central1
   > 

   Luego ejecuta:

   bash
   # Backend
   cd backend
   docker build -t us-central1-docker.pkg.dev/kubeletes/video-repo/video-backend:latest .
   docker push us-central1-docker.pkg.dev/kubeletes/video-repo/video-backend:latest

   # Frontend
   cd ../frontend
   docker build -t us-central1-docker.pkg.dev/kubeletes/video-repo/video-frontend:latest .
   docker push us-central1-docker.pkg.dev/kubeletes/video-repo/video-frontend:latest
   

5. *Despliega los servicios en tu clúster de GKE*:
   Asegúrate de que tu clúster esté configurado y el contexto esté apuntando a él (gcloud container clusters get-credentials).

   Luego aplica los manifiestos YAML:

   bash
   kubectl apply -f kubernetes/
   

6. *Verifica el estado de los pods y servicios*:

   bash
   kubectl get pods
   kubectl get services
   kubectl get ingress
   

7. *Accede a la aplicación desde el navegador* usando la IP externa del servicio frontend o el balanceador de carga:

   
   http://<EXTERNAL_IP>:80
   
