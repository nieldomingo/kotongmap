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
        
        # variables for recaptcha
        challenge = self.request.get('challenge', '')
        response = self.request.get('response', '')
        remoteip = os.environ['REMOTE_ADDR']
        
        if not (lat and lon and description):
            #utils.setErrorResponse(self.response, 400, "Missing Required Arguments")
        
            self.response.headers["Content-Type"] = "text/json"
            #self.response.set_status(400)
            self.response.out.write(json.dumps(dict(result="failed", message="Missing Required Arguments. Try again.")))
        
            return
        
        cResponse = captcha.submit(
                 challenge,
                 response,
                 "6LfKnsQSAAAAABUdzDpWvKmf_2lpRaXmwZPaVzSj",
                 remoteip)
                 
        if not cResponse.is_valid:
            self.response.headers["Content-Type"] = "text/json"
            #response.set_status(400)
            self.response.out.write(json.dumps(dict(result="failed", message="Invalid Captcha. Try again.")))
            
            return
        	
        incident = models.KotongIncident(description=description, location=db.GeoPt(float(lat), float(lon)))
        
        if incidentdate:
            try:
                dt = datetime.datetime.strptime(incidentdate, "%m/%d/%Y")
                incident.date = dt.date()
            except ValueError:
                #utils.setErrorResponse(self.response, 400, "Invalid Incident Date Format")
                self.response.headers["Content-Type"] = "text/json"
                #self.response.set_status(400)
                self.response.out.write(json.dumps(dict(result="failed", message="Invalid Date Format. Try again.")))
                return
                
        incident.put()
        self.response.headers["Content-Type"] = "text/json"
        self.response.out.write(json.dumps(dict(result="saved", key=str(incident.key()))))
        
    def get(self):
        incidents = models.KotongIncident.all()
    
        path = os.path.join(os.path.dirname(__file__), 'templates/georssfeed.html')
        self.response.out.write(template.render(path, dict(incidents=incidents)))
        
def main():
    application = webapp.WSGIApplication([('/', MainHandler),
                                          ('/incidents/', IncidentsHandler)],
                                         debug=True)
    util.run_wsgi_app(application)


if __name__ == '__main__':
    main()
