
import os
from bs4 import BeautifulSoup

import json
import requests
import ssl

import logging

from ..models.flipkart_product import Product

class FKSearch(object):

    """FKSearch - Flipkart product search"""

    def __init__(self):
        super(FKSearch, self).__init__()

        self.base_url = 'https://www.flipkart.com'
        self.search_url = self.base_url + '/search?q='

        # Remove SSL error
        requests.packages.urllib3.disable_warnings()

        try:
            _create_unverified_https_context = ssl._create_unverified_context
        except AttributeError:
            # Legacy Python that doesn't verify HTTPS certificates by default
            pass
        else:
            # Handle target environment that doesn't support HTTPS verification
            ssl._create_default_https_context = _create_unverified_https_context

        self.headers = {'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6)\
                AppleWebKit/537.36 (KHTML, like Gecko)\
                Chrome/53.0.2785.143 Safari/537.36'}


    def getResult(self, search_str, page_no=1):

        if not search_str:
            return {}

        url = self.search_url + search_str + '&page=' + str(page_no)
        try:
            print(url)
            response = requests.get(url, headers=self.headers, timeout=25)
            return self.extract_data(response.text)
        except Exception as e:
            print('Error requesting : ' + url)
            print('Error : ' + str(e))

        # print(response.text)
        return {}

    def extract_data(self, html):
        soup = BeautifulSoup(html, 'html.parser')
        
        results = soup.select('a._1UoZlX')
        resp_list = [{'link': self.base_url + link['href'].strip(), 'text': self.get_text(link, '._3wU53n')}
                     for link in results]

        return resp_list

    def get_text(self, parent, element):
        ele = parent.select(element)
        if len(ele) > 0:
            return ele[0].text.strip()
        return ''
          
def is_url(url):
    """
    checks if :url is a url
    """
    regex = r'((https?):((//)|(\\\\))+([\w\d:#@%/;$()~_?\+-=\\\.&](#!)?)*)'
    return re.match(regex, url) is not None
