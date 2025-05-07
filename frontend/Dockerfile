# Use an Nginx image to serve static files
FROM nginx:alpine

# Copy the frontend files to the appropriate directory in the container
COPY index.html /usr/share/nginx/html/index.html
COPY main.js /usr/share/nginx/html/main.js
COPY style.css /usr/share/nginx/html/style.css
COPY merged_file.txt /usr/share/nginx/html/merged_file.txt

# Expose port 80 for Nginx
# EXPOSE 80
