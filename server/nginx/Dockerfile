FROM nginx:1.27-alpine

# Copy central gateway Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose Gateway HTTP port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
