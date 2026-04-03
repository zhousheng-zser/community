import http.server
import socketserver
import json
import base64
import os

PORT = 8005
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
IMG_DIR = os.path.join(BASE_DIR, 'img')

class Handler(http.server.SimpleHTTPRequestHandler):
    def do_POST(self):
        if self.path == '/upload':
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            folder = data.get('folder', '')
            filename = data.get('filename', '')
            b64str = data.get('image', '').split(',')[1]
            
            target_dir = os.path.join(IMG_DIR, folder)
            os.makedirs(target_dir, exist_ok=True)
            
            target_file = os.path.join(target_dir, f"{filename}.png")
            with open(target_file, "wb") as fh:
                fh.write(base64.b64decode(b64str))
                
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'status': 'ok'}).encode('utf-8'))
        else:
            self.send_error(404)

if __name__ == '__main__':
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print("Starting server on port", PORT)
        httpd.serve_forever()
