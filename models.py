from google.appengine.ext import db
from google.appengine.api import users

class KotongIncident(db.Model):
	datetime = db.DateTimeProperty(auto_now_add=True)
	description = db.TextProperty(required=True)
	date = db.DateProperty()
	contributor = db.UserProperty(auto_current_user_add=True)
	location = db.GeoPtProperty(required=True)