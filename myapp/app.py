from flask import Flask, request, jsonify, render_template
from flask_restplus import Resource, Api
import json

from myapp.models import flipkart_product
from myapp.scraper import flipkart

app = Flask(__name__, static_folder='static')
api = Api(app)

flipkart_search = flipkart.FKSearch()


@app.route('/app', methods=['GET'])
def index():
    return render_template('index.html')

@api.route('/hello')
class HelloWorld(Resource):
    def get(self):
        return {'hello': 'world'}

@api.route('/webhook')
class Webhook(Resource):
    def post(self):
        postdata = request.get_json()
        print(postdata)
        result = postdata['result']
        parameters = result['parameters']

        res = {
            "speech": "Here is your list of products",
            "displayText": "Here is your list of products",
            "contextOut": result['contexts'],
            "source": "My Service"
        }
        if 'product' in parameters:
            data = flipkart_search.getResult(parameters['product'], 1)
            res['data'] = data
        else:
            res['data'] = {}

        return jsonify(res)


@api.route('/search/<search_str>')
@api.param('search_str', 'Name of the product')
class Search(Resource):
    def get(self, search_str):

        page = request.args.get('page', default=1, type=int)
        if page < 1:
            page = 1
        result = flipkart_search.getResult(search_str, page)

        return jsonify(result)


if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=True)
