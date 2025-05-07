# Proyecto de Búsqueda en Videos con Docker
## Integrantes
```plaintext
Cabrera Huanqui, Luigi
Concha Sifuentes, Fabián
Gómez del Carpio, Alexander
Luque Juárez, Camila
Valdivia Begazo, Sharon
```
Este repositorio implementa una aplicación web que permite buscar palabras clave en los frames extraídos de videos. La búsqueda se basa en un índice invertido generado a partir del contenido visual extraído con Google Cloud Vision API. El sistema incluye una interfaz web simple y un backend construido con Flask, todo orquestado mediante Docker.

En el siguiente [link](https://drive.google.com/file/d/1Q1rfC2QVkg7nPSkhtKEKY9QkUOYWFgJx/view?usp=sharing), se encuentra un video mostranso su funcionamiento.  


1. Extrae *frames* de videos.
2. Analiza los frames con *Google Vision API* para obtener etiquetas descriptivas.
3. Crea un *índice invertido* que asocia palabras a imágenes y videos.
4. Permite al usuario *buscar términos* (y sus sinónimos) desde una interfaz web.
5. Devuelve los nombres de los archivos donde aparece ese término o sus sinónimos.

## Estructura del Proyecto

```plaintext
.
├── backend/
│   ├── app.py                  # Lógica del backend (API)
│   ├── Dockerfile              # Dockerfile para construir la imagen del backend
│   ├── requirements.txt        # Dependencias de Python
│   ├── uploads/                # Carpeta para archivos subidos
│   ├── inverted_index.json     # Índice invertido generado
│   └── metadata.json           # Metadatos de los archivos procesados
│
├── frontend/
│   ├── index.html              # Página principal del frontend
│   ├── style.css               # Estilos CSS
│   ├── main.js                 # Lógica del cliente (JavaScript)
│   └── Dockerfile              # Dockerfile para construir la imagen del frontend
│
└── docker-compose.yml          # Orquestador de servicios con Docker Compose
    
```
## Ejecución en Google Cloud Platform

### ¿Cómo ejecutar el proyecto en Google Cloud Platform?

### Prerrequisitos

- Tener una instancia de VM o un clúster de GKE activo.
- Haber instalado Docker y tener configurado `gcloud` con permisos adecuados.
- Google Cloud Vision API habilitada.
- Archivo de credenciales `kubeletes-xxx.json` disponible.
- Haber creado un repositorio en Artifact Registry.

---

### Pasos para desplegar con Artifact Registry y Kubernetes

1. **Sube el proyecto a tu instancia GCP**:
   - Abre la **consola web de Google Cloud**.
   - Ve a tu VM y haz clic en **"Abrir en el navegador mediante SSH"**.
   - En la terminal web, haz clic en el ícono de carpeta 📁 y selecciona **"Subir archivos"**.
   - Sube `Proyecto-Cloud-Completado.zip` o los archivos descomprimidos directamente.

2. **Descomprime el archivo (si es necesario)**:
   ```bash
   unzip Proyecto-Cloud-Completado.zip
   cd Proyecto-Cloud-Completado
    ```

3. *Configura tu repositorio en Artifact Registry*:
   Desde la consola de Google Cloud:

   * Ve a *Artifact Registry > Repositories*
   * Haz clic en *"Create Repository"*
   * Rellena los campos:

     | Campo         | Valor sugerido                       |
     | ------------- | ------------------------------------ |
     | Name          | video-repo (o el que prefieras)    |
     | Format        | Docker                             |
     | Location Type | Regional                           |
     | Region        | us-central1 o southamerica-west1 |
     | Encryption    | Google-managed (por defecto)       |

4. **Coloca el archivo de credenciales en la carpeta `backend/`** con el nombre `kubeletes-xxx.json`.

5. **Autentica Docker con Artifact Registry**:

   ```bash
   gcloud auth configure-docker us-central1-docker.pkg.dev
   ```

6. **Construye y sube las imágenes**:

   # Backend
    ```bash
   cd backend
   docker build -t us-central1-docker.pkg.dev/<TU_PROYECTO>/video-repo/video-backend:latest .
   docker push us-central1-docker.pkg.dev/<TU_PROYECTO>/video-repo/video-backend:latest
    ```
   # Frontend
    ```bash
   cd ../frontend
   docker build -t us-central1-docker.pkg.dev/<TU_PROYECTO>/video-repo/video-frontend:latest .
   docker push us-central1-docker.pkg.dev/<TU_PROYECTO>/video-repo/video-frontend:latest
   ```

   > Reemplaza `<TU_PROYECTO>` con el ID de tu proyecto en GCP.

8. **Despliega el sistema en GKE**:
   Asegúrate de tener configurado el acceso al clúster:

   ```bash
   gcloud container clusters get-credentials <nombre-cluster> --region <region>
   kubectl apply -f kubernetes/
   ```

9. **Verifica el estado del despliegue**:

   ```bash
   kubectl get pods
   kubectl get services
   kubectl get ingress
   ```

10. **Accede a tu aplicación** usando la IP externa del servicio o balanceador:

   ```bash
   http://<EXTERNAL-IP>
   ```
