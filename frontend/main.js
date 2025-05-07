// // frontend/main.js
// document.getElementById('fetchData').addEventListener('click', async () => {
//    try {
//      const res = await fetch('http://localhost:5000/data');
//      const data = await res.json();
//      document.getElementById('response').innerText = data.message;
//    } catch (err) {
//      console.error(err);
//      document.getElementById('response').innerText = 'Error fetching data';
//    }
//  });
 

// Usando la IP del ingress (cloud)
//const apiBaseUrl = '/api'; // Cambia esto según la URL del backend

// Para local:
//const apiBaseUrl = 'http://localhost:5000'; // Cambia esto según la URL del backend
const apiBaseUrl = 'http://localhost:5000/api';  // Matches service name in docker-compose


async function buscarVideos() {
    const consulta = document.getElementById('busqueda').value.trim();
    if (!consulta) {
        console.error('La consulta de búsqueda está vacía.');
        alert('Por favor, ingresa un término de búsqueda.');
        return;
    }

    try {
        console.log(`Buscando videos relacionados con: "${consulta}"`);
        const response = await fetch(`${apiBaseUrl}/buscar?consulta=${encodeURIComponent(consulta)}`);
        if (!response.ok) {
            console.error('Error en la búsqueda de videos:', response.statusText);
            alert('Error al buscar videos. Revisa la consola para más detalles.');
            return;
        }
        const videos = await response.json();
        const resultadosDiv = document.getElementById('resultados');
        resultadosDiv.innerHTML = '';

        console.log("Response:", response);
        console.log("videos:", videos);

        if (videos.length === 0) {
            resultadosDiv.innerHTML = '<p>No se encontraron videos que coincidan con tu búsqueda.</p>';
            return;
        }

        //GET LINK OF DOWNLOAD VIDEO
        const mergedFileResponse = await fetch('merged_file.txt');
        if (!mergedFileResponse.ok) {
            console.error('Error al cargar el archivo merged_file.txt');
            alert('Error al cargar el archivo de enlaces de videos.');
            return;
        }
        const mergedFileContent = await mergedFileResponse.text();
        const videoLinks = mergedFileContent.split('\n').reduce((links, line) => {
            const [videoName, videoLink] = line.split(',');
            if (videoName && videoLink) {
                links[videoName.trim()] = videoLink.trim();
                console.log(videoName.trim());
                console.log(videoLink.trim());
            }
            return links;
        }, {});

        videos.forEach(video => {
            const videoElement = document.createElement('div');
            videoElement.className = 'video-item';
            const [rawName,rawTime] = video.split(':');
            const baseName = rawName.trim();
            const time = parseInt(rawTime);

            let timeFormat = '';
            if (!isNaN(time)) {
                const minutos = Math.floor(time / 60);
                const segundos = time % 60;
                timeFormat = ` (${minutos}m ${segundos}s)`;
            }

            const titulo = `VIRAT VIDEO ${timeFormat}`;

            if (videoLinks[baseName]) {
                // Si existe un enlace externo en merged_file.txt
                videoElement.innerHTML = `
                    <h3><a href="${videoLinks[baseName]}" target="_blank">${titulo}</a></h3>
                `;
            } else {
                // Consultar al backend por el video con su nombre
                videoElement.innerHTML = `
                    <h3>${video}</h3>
                    <video controls>
                        <source src="${apiBaseUrl}/videos/${encodeURIComponent(video)}" type="video/mp4">
                        Tu navegador no soporta la reproducción de videos.
                    </video>
                `;
            }

            resultadosDiv.appendChild(videoElement);
        });

        console.log(`${videos.length} videos encontrados.`);
    } catch (error) {
        console.error('Error al buscar videos:', error);
        alert('Ocurrió un error al buscar videos. Revisa la consola para más detalles.');
    }
}

async function mostrarMetadata() {
    console.log("FRONTEND: Fetching metadata...");
    const metadataDisplay = document.getElementById('metadata-display');
    metadataDisplay.textContent = "Cargando metadata...";

    try {
        const response = await fetch(`${apiBaseUrl}/metadata`);
        if (!response.ok) {
            console.error("FRONTEND: Error fetching metadata:", response.statusText);
            metadataDisplay.textContent = "Error al cargar metadata.";
            return;
        }

        const metadata = await response.json();
        console.log("FRONTEND: Metadata received:", metadata);
        metadataDisplay.textContent = JSON.stringify(metadata, null, 2);
    } catch (error) {
        console.error("FRONTEND: Error fetching metadata:", error);
        metadataDisplay.textContent = "Error al cargar metadata.";
    }
}

function setupDragAndDrop() {
    const dragDropArea = document.getElementById('dragDropArea');
    const videoInput = document.getElementById('videoFile');
    const browseButton = document.querySelector('.browse-button');
    const previewContainer = document.getElementById('video-preview');

    if (!dragDropArea || !videoInput || !browseButton || !previewContainer) {
        console.error("Elementos requeridos no encontrados en el DOM.");
        return;
    }

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dragDropArea.addEventListener(eventName, e => {
        e.preventDefault();
        e.stopPropagation();
        dragDropArea.style.backgroundColor = '#e6f0fa';
        });
    });

    dragDropArea.addEventListener('dragover', () => {
        dragDropArea.classList.add('highlight');
        e.preventDefault();
        dragDropArea.style.backgroundColor = '#e6f0fa';
    });

    dragDropArea.addEventListener('dragleave', () => {
        dragDropArea.classList.remove('highlight');
        dragDropArea.style.backgroundColor = '#f5faff';
    });

    dragDropArea.addEventListener('drop', (e) => {
        const files = e.dataTransfer.files;
        if (files.length > 0) {
        videoInput.files = files;
        handleFiles(files);
        }
    });

    browseButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        videoInput.click();
    });
    

    videoInput.addEventListener('change', () => {
        handleFiles(videoInput.files);
    });

    function handleFiles(files) {
        previewContainer.innerHTML = '';

        for (let file of files) {
        if (file.type.startsWith('video/')) {
            const video = document.createElement('video');
            video.src = URL.createObjectURL(file);
            video.controls = true;
            video.style.width = "300px";
            video.style.marginTop = "10px";
            previewContainer.appendChild(video);
        } else {
            alert("Solo se permiten archivos de video.");
        }
        }
    }
}

window.onload = function () {
setupDragAndDrop();
};

async function subirVideo() {
    const videoFiles = document.getElementById('videoFile').files;
    const numFrames = document.getElementById('numFrames').value;

    if (videoFiles.length === 0) {
        alert('Por favor, selecciona uno o más videos.');
        return;
    }

    const progressContainer = document.getElementById('progress-container');
    const progressBar = document.getElementById('progress-bar');
    progressContainer.style.display = 'block';
    progressBar.style.width = '0%';

    for (let i = 0; i < videoFiles.length; i++) {
        const videoFile = videoFiles[i];
        const formData = new FormData();
        formData.append('frames', videoFile);  // Video file
        formData.append('label', videoFile.name);  // Video label
        formData.append('num_frames', numFrames);  // Number of frames

        try {
            console.log(`Subiendo "${videoFile.name}" con ${numFrames} frames...`);
            const response = await fetch(`${apiBaseUrl}/subir_frames`, {
                method: 'POST',
                body: formData
            });

            await actualizarProgreso(50, `Procesando "${videoFile.name}"...`);

            const result = await response.json();
            if (response.ok) {
                console.log(`"${videoFile.name}" subido con éxito.`);
                alert(`"${videoFile.name}" subido con éxito.`);
            } else {
                console.error(`Error al subir "${videoFile.name}": ${result.error}`);
                alert(`Error al subir "${videoFile.name}": ${result.error}`);
            }
        } catch (error) {
            console.error(`Error al subir "${videoFile.name}":`, error);
            alert(`Error al subir "${videoFile.name}": ${error}`);
        }
    }

    await actualizarProgreso(100, 'Procesamiento completado.');
    console.log('Todos los videos han sido procesados.');
}

function actualizarProgreso(targetPercentage, mensaje) {
    return new Promise((resolve) => {
        const progressBar = document.getElementById('progress-bar');
        let currentWidth = parseInt(progressBar.style.width) || 0;
        const step = 1;
        const intervalTime = 20; // ms

        const interval = setInterval(() => {
            if (currentWidth >= targetPercentage) {
                clearInterval(interval);
                console.log(mensaje);
                resolve();
            } else {
                currentWidth += step;
                progressBar.style.width = `${currentWidth}%`;
            }
        }, intervalTime);
    });
}