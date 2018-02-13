import BaseHTTPServer, SimpleHTTPServer
import ssl

print "Server listening on : https://0.0.0.0:4443"
httpd = BaseHTTPServer.HTTPServer(('0.0.0.0', 4443), SimpleHTTPServer.SimpleHTTPRequestHandler)
httpd.socket = ssl.wrap_socket (httpd.socket, certfile='./server.pem', server_side=True)
httpd.serve_forever()
