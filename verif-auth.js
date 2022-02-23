
function verifAuthInHeadersForPrivatePath(req,res,next){
  //console.log("verifAuthInHeadersForPrivatePath, req.path="+req.path);
	 if( !req.path.includes("/private/"))
       next();
    else 
       verifAuthInHeaders(req,res,next);
}

function verifAuthInHeaders(req,res,next) {
	//console.log("verifAuthInHeaders, req.headers=" + JSON.stringify(req.headers));
	let authorizationInHeaders = req.headers['authorization']; //may be Bearer ...
	let authUserIdInHeaders = req.headers['x-authenticated-userid']; //may be userId/username add by kong oauth2 plugin
	let scopesInHeaders = req.headers['x-authenticated-scope']; //may be scope add by kong oauth2 plugin (ex: "read")
	console.log("verifAuthInHeaders, authorizationInHeaders= " + authorizationInHeaders);
	console.log("verifAuthInHeaders, authUserIdInHeaders= " + authUserIdInHeaders);
	console.log("verifAuthInHeaders, scopesInHeaders= " + scopesInHeaders);
	//if(true)
	   next();
	//else res.status(401).send("Unauthorized ...");
}

export default { verifAuthInHeaders , verifAuthInHeadersForPrivatePath }
