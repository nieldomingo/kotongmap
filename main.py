#!/usr/bin/env python

from google.appengine.dist import use_library
use_library('django', '1.2')

from google.appengine.ext import webapp
from google.appengine.ext.webapp import util
from google.appengine.ext import db
from google.appengine.ext.webapp import template

from django.utils import simplejson as json
import datetime
import os

import models
import utils
import captcha


class MainHandler(webapp.RequestHandler):
    def get(self):
        self.response.out.write('Hello world!')
        
class IncidentsHandler(webapp.RequestHandler):
    def post(self):
        lat = self.request.get('lat', '')
        lon = self.request.get('lon', '')
        description = self.request.get('description', '')
        incidentdate = self.request.get('date', '')
        
        if not (lat and lon and description):
        	utils.setErrorResponse(self.response, 400, "Missing Required Arguments")
        	return
        	
        incident = models.KotongIncident(description=description, location=db.GeoPt(float(lat), float(lon)))
        
        if incidentdate:
            try:
                dt = datetime.datetime.strptime(incidentdate, "%m/%d/%Y")
                incident.date = dt.date()
            except ValueError:
                utils.setErrorResponse(self.response, 400, "Invalid Incident Date Format")
                return
                
        incident.put()
        self.response.headers["Content-Type"] = "text/json"
        self.response.out.write(json.dumps(dict(result="saved", key=str(incident.key()))))
        
    def get(self):
        incidents = models.KotongIncident.all()
    
        path = os.path.join(os.path.dirname(__file__), 'templates/georssfeed.html')
        self.response.out.write(template.render(path, dict(incidents=incidents)))
        
class CaptchaFieldHandler(webapp.RequestHandler):
    def get(self):
        chtml = captcha.displayhtml(
            public_key = "6LfKnsQSAAAAAC8cVZdszsRFIdfFDA5WDu3b9TYd",
            use_ssl = False,
            error = None)
        self.response.out.write(chtml)
        
def main():
    application = webapp.WSGIApplication([('/', MainHandler),
                                          ('/incidents/', IncidentsHandler),
                                          ('/recaptcha/', CaptchaFieldHandler)],
                                         debug=True)
    util.run_wsgi_app(application)


if __name__ == '__main__':
    main()
