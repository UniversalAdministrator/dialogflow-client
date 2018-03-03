# Dialogflow Web Client


## Run on Docker

docker run -it --name dialogflow-client -v $PWD:/app -p 5000:5000 python:3.6 bash
cd /app
pip install  -r requirements.txt

python run.py

Flask REST Plus Swagger
http://localhost:5000

Dialogflow Web Client
http://localhost:5000/app
