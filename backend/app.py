from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import json
import requests
import nltk
from nltk.corpus import wordnet
import base64  # ← You were missing this import!
import logging  # Add this import
import os
from google.cloud import vision
import cv2

# Init flask
app = Flask(__name__)
CORS(app)  # ← Allow all origins (for simplicity)

# Configure logging
logging.basicConfig(level=logging.INFO)  # Ensure INFO level logs are displayed
app.logger.setLevel(logging.INFO)

# Init nltk
nltk.download('omw-1.4')
nltk.download('wordnet')

# Init globals
METADATA_FILE = 'metadata.json'
INVERTED_INDEX_FILE = 'inverted_index.json'
CLOUD_VISION_API_KEY = "YOUR_OWN_KEY" # THIS IS A PRIVATE KEY
VISION_URL = f"https://vision.googleapis.com/v1/images:annotate?key={CLOUD_VISION_API_KEY}"

os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "/app/kubeletes-4bf0d7b9a7c5.json"

# Init Metadata
if os.path.exists(METADATA_FILE):
    with open(METADATA_FILE, 'r') as f:
        metadata = json.load(f)
else:
    metadata = {}

#Init Inverted index
if os.path.exists(INVERTED_INDEX_FILE):
    with open(INVERTED_INDEX_FILE, 'r') as f:
        indice_invertido = json.load(f)
else:
    indice_invertido = {}

@app.route('/data')
def data():
    return jsonify({"message": "Hello from Flask!"})

# Aux functions ----
def obtener_sinonimos(palabra):
    sinonimos = set()
    for syn in wordnet.synsets(palabra, lang='spa') + wordnet.synsets(palabra, lang='eng'):
        for lemma in syn.lemmas():
            sinonimos.add(lemma.name().lower())
    return sinonimos

def actualizar_inverted_index(nombre_video, etiquetas):
    for etiqueta in etiquetas:
        sinonimos = obtener_sinonimos(etiqueta)
        sinonimos.add(etiqueta)
        for palabra in sinonimos:
            palabra = palabra.lower()
            if palabra not in metadata:
                metadata[palabra] = []
            if nombre_video not in metadata[palabra]:
                metadata[palabra].append(nombre_video)
    with open(METADATA_FILE, 'w') as f:
        json.dump(metadata, f)

def procesar_imagen_bytes(image_bytes):
    app.logger.info("BACKEND: Starting to process image bytes.")

    try:
        client = vision.ImageAnnotatorClient()
        app.logger.info("BACKEND: Vision client created.")

        image = vision.Image(content=image_bytes)
        app.logger.info("BACKEND: Image object created.")

        response = client.label_detection(image=image)
        app.logger.info("BACKEND: Response received from Vision API.")

        raw_labels = set()
        for label in response.label_annotations:
            raw_labels.add(label.description.lower())

        app.logger.info("BACKEND: Extracted raw labels: %s", raw_labels)

        # Split multi-word labels into individual words and remove stop words
        stop_words = {"and", "or", "of", "the", "a", "an", "in", "on", "at", "to", "for", "with", "by", "as", "is", "are"}
        processed_labels = set()
        for raw_label in raw_labels:
            words = raw_label.split()
            for word in words:
                if word not in stop_words:
                    processed_labels.add(word)

        app.logger.info("BACKEND: Processed unique labels: %s", processed_labels)
        return processed_labels

    except Exception as e:
        app.logger.error("BACKEND: Error processing image bytes: %s", str(e))
        return set()

# ----- Routes -----

@app.route('/api/subir_frames', methods=['POST'])
def subir_frames():
    app.logger.info("BACKEND: Entered /api/subir_frames POST route.")
    if 'frames' not in request.files:
        app.logger.info("BACKEND: No video file provided.")
        return jsonify({'error': 'No video file provided.'}), 400

    video_file = request.files['frames']
    num_frames = int(request.form.get('num_frames', 2))
    label = request.form.get('label', 'unknown')

    # Save the uploaded video in the 'videos' folder
    videos_dir = "./videos"
    os.makedirs(videos_dir, exist_ok=True)
    video_path = os.path.join(videos_dir, video_file.filename)
    video_file.save(video_path)
    app.logger.info("BACKEND: Video file saved at '%s'.", video_path)

    # Process the video (existing logic)
    save_path = f"./uploads/{label}"
    os.makedirs(save_path, exist_ok=True)

    # Open the video with OpenCV
    cap = cv2.VideoCapture(video_path)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

    if total_frames == 0:
        app.logger.info("BACKEND: Invalid video file.")
        return jsonify({'error': 'Invalid video file.'}), 400

    frame_interval = max(total_frames // num_frames, 1)
    frame_count = 0
    saved_frames = 0
    etiquetas_totales = set()

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
        if frame_count % frame_interval == 0:
            frame_filename = os.path.join(save_path, f"frame_{saved_frames}.jpg")
            cv2.imwrite(frame_filename, frame)
            app.logger.info("BACKEND: Saved frame '%s'.", frame_filename)

            # Process the frame
            _, buffer = cv2.imencode('.jpg', frame)
            image_bytes = buffer.tobytes()
            etiquetas_totales |= procesar_imagen_bytes(image_bytes)

            saved_frames += 1
        frame_count += 1

        if saved_frames >= num_frames:
            break

    cap.release()
    app.logger.info("BACKEND: Finished processing video '%s'.", video_path)

    # Update metadata
    nombre_video = label.replace(" ", "_")
    actualizar_inverted_index(nombre_video, etiquetas_totales)
    app.logger.info("BACKEND: All the labels for '%s': %s", nombre_video, etiquetas_totales)
    app.logger.info("BACKEND: Inverted index updated for '%s'.", nombre_video)

    return jsonify({
        'message': f'{saved_frames} frames saved and processed for {label}',
        'video': nombre_video,
        'labels': sorted(etiquetas_totales)
    }), 200

# Search for videos
@app.route('/api/buscar')
def buscar_videos():
    app.logger.info("BACKEND: Entered /api/buscar GET route.")
    consulta = request.args.get('consulta', '').lower()
    resultados = set()
    if consulta:
        app.logger.info("BACKEND: Received query: '%s'", consulta)
        palabras = consulta.split()
        sinonimos = set()
        for palabra in palabras:
            sinonimos.update(obtener_sinonimos(palabra))
        sinonimos.update(palabras)

        app.logger.info("BACKEND QUERY: Searching these labels: %s", sinonimos)

        for palabra in sinonimos:
            videos = metadata.get(palabra, [])
            resultados.update(videos)
            if palabra in indice_invertido:
                resultados.update(indice_invertido[palabra])

        #app.logger.info("BACKEND QUERY: Resulting videos: %s", resultados)
    else:
        app.logger.info("BACKEND QUERY: Query is empty")

    return jsonify(sorted(resultados))

@app.route('/api/metadata', methods=['GET'])
def obtener_metadata():
    app.logger.info("BACKEND: Entered /api/metadata GET route.")
    app.logger.info("BACKEND: Returning full metadata: %s", metadata)
    return jsonify(metadata)

@app.route('/api/videos/<video_name>', methods=['GET'])
def obtener_video(video_name):
    app.logger.info("BACKEND: Fetching video '%s' from videos folder.", video_name)
    videos_dir = "./videos"
    video_path = os.path.join(videos_dir, video_name)

    if not os.path.exists(video_path):
        app.logger.error("BACKEND: Video '%s' not found.", video_name)
        return jsonify({'error': 'Video not found'}), 404

    return send_from_directory(videos_dir, video_name)

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Ruta no encontrada'}), 404

@app.errorhandler(500)
def server_error(error):
    return jsonify({'error': 'Error interno del servidor'}), 500

@app.route('/')
def home():
    return "Backend alive!", 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
