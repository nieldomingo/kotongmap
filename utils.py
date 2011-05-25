

def setErrorResponse(response, statuscode, message):
    """
    a helper function for making a proper error response
    """
    
    response.clear()
    response.set_status(statuscode)
    response.write.out.write(message)