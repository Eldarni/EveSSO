/**
 * evesso.js - allow for access to the eve online single sign on system
 *
 * @author Richard Smith <richard@smith-net.org.uk>
 * @copyright 2014 Richard Smith (Ricky Baby)
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */
(function() {

    //==============================================================================

    /**
     * Perform the initialization - get dependencies, set defaults etc
     * @return void
     */
    var EveSSO = function() {

        //core module dependencies
        this._modules = {
            'url'         : require('url'),
            'https'       : require('https'),
            'querystring' : require('querystring'),
        };

        //user settings
        this._settings = {};

        //setup the defaults where we can
        this._settings['login_url']  = 'https://login.eveonline.com';
        this._settings['user_agent'] = 'EveSSO/1.0 - NodeJS SSO Module';
    };

    //==============================================================================
    

    /**
     * Get an separate instance of the EveSSO system - useful for people running many applications
     * @return object
     */
    EveSSO.prototype.EveSSO = function() {
        return new this;
    };

    //==============================================================================

    /**
     * Set the user agent that we should use to identify ourselves to CCP
     * @param string callback_url  Required - The string to use as a user-agent in requests
     * @return self
     */
    EveSSO.prototype.setUserAgent = function(user_agent) {
        this._settings['user_agent'] = user_agent;
        return this;
    };

    /**
     * Get the user agent that we are using to identify ourselves to CCP
     * @return string
     */
    EveSSO.prototype.getUserAgent = function() {
        return this._settings['user_agent'];
    };

    /**
     * Set the "Client ID" of the application - this is provided by CCP
     * @param string client_id  Required - The client id as provided in the application screen
     * @return self
     */
    EveSSO.prototype.setClientID = function(client_id) {
        this._settings['client_id'] = client_id;
        return this;
    };

    /**
     * Get the "Client ID" that has been set previously
     * @return string
     */
    EveSSO.prototype.getClientID = function() {
        return this._settings['client_id'];
    };

    /**
     * Set the "Secret Key" of the application - this is provided by CCP
     * @param string secret_key  Required - The secret key as provided in the application screen
     * @return self
     */
    EveSSO.prototype.setSecretKey = function(secret_key) {
        this._settings['secret_key'] = secret_key;
        return this;
    };

    /**
     * Get the "Secret Key" that has been set previously
     * @return string
     */
    EveSSO.prototype.getSecretKey = function() {
        return this._settings['secret_key'];
    };

    /**
     * Set the "Callback URL" of the application - this is provided by CCP
     * @param string callback_url  Required - The callback URL as entered on the application page
     * @return self
     */
    EveSSO.prototype.setCallbackURL = function(callback_url) {
        this._settings['callback_url'] = callback_url;
        return this;
    };

    /**
     * Get the "Callback URL" that has been set previously
     * @return string
     */
    EveSSO.prototype.getCallbackURL = function() {
        return this._settings['callback_url'];
    };

    //==============================================================================

    /**
     * Should we login to the test (sisi) cluster
     * @return this
     */
    EveSSO.prototype.useTestServer = function(use_test_server) {
        switch (use_test_server || true) {
            case true:  this._settings['login_url'] = 'https://sisilogin.testeveonline.com'; break;
            case false: this._settings['login_url'] = 'https://login.eveonline.com';         break;
        }
        return this;
    };

    //==============================================================================

    /**
     * Wrap the https.request() method to make things a little more readable when making requests to the eve-online login server
     * @param  {string}   request_url Required - 
     * @param  {object}   headers     Required - 
     * @param  {object}   parameters  Required - 
     * @param  {function} callback    Required - The callback to use once the request is complete
     * @return void
     */
    EveSSO.prototype.request = function(request_url, options, callback) {

        // parse the url, to get the needed bits for our request
        request_url = this._modules.url.parse(request_url);

        // https.request settings
        var settings = {
            'method': options.method,
            'headers': options.headers,
            'host': request_url.hostname,
            'port': request_url.port,
            'path': request_url.pathname,
        };

        //get our user agent - as we are good api consumers
        settings.headers['User-Agent'] = this._settings['user_agent'];

        // do we have some parameters to send with the request
        if (options.parameters !== undefined) {
            options.parameters = this._modules.querystring.stringify(options.parameters);
            settings.headers['Content-Type']   = 'application/x-www-form-urlencoded';
            settings.headers['Content-Length'] = options.parameters.length;
        };

        //start the request using the built in https request method
        var http_request = this._modules.https.request(settings);

        //if there are parameters: then its time to send them
        if (options.parameters !== undefined) { 
            http_request.write(options.parameters);
        };

        // when the response comes back
        http_request.on('response', function(response) {

            //create a buffer as we get the full response
            var response_body = '';

            //push the chunks onto the array as we get them
            response.on('data', function(chunk) {
                response_body += chunk;
            });

            //once we got the full request - handle it - pass it through the json parser
            response.on('end', function() {
                try { response_body = JSON.parse(response_body); }
                catch (error) { return callback(error); }
                callback(null, response_body);
            });
        });

        //end the request
        http_request.end();
    };

    //==============================================================================

    /**
     * Get the url to redirect the user to the eve sso login page
     * @param {string}   state_token Required - A token used to identify the state of the current process
     * @param {function} callback    Required - A callback to be executed, the result will contain the url to redirect to
     * @return object
     */
    EveSSO.prototype.getRedirectURL = function(state_token, callback) {

        //set the basic paramaters to pass to the oauth server
        var redirect_options = {'response_type' : 'code', 'scope' : ''};

        //populate the client id and callback fields
        redirect_options.client_id    = this._settings['client_id']
        redirect_options.redirect_uri = this._settings['callback_url']
        redirect_options.state        = state_token;

        //build the url to goto the login page - and run the callback - passing the url
        callback(null, this._settings['login_url'] + '/oauth/authorize/?' + this._modules.querystring.stringify(redirect_options));
    };

    //==============================================================================

    /**
     * Use the authentication code to get an access token
     * @param {string}   authorisation_code Required - The authorisation code provided back by the sso system
     * @param {function} callback           Required - A callback to be executed, the result will contain response from the sso
     * @return void
     */
    EveSSO.prototype.getAccessToken = function(authorisation_code, callback) {
        var headers = { 'Authorization' : 'Basic ' + (new Buffer(this._settings['client_id'] + ':' + this._settings['secret_key']).toString('base64')) };
        var parameters = { 'grant_type' : 'authorization_code', 'code' : authorisation_code };
        this.request(this._settings['login_url'] + '/oauth/token', {'method': 'POST', 'headers' : headers, 'parameters' : parameters}, function(result) {
            if (result.error) return callback(new Error('CREST Error: ' + result.error + ' - "' + result.error_description + '"'));
            callback(null, result);
        });
    };

    /**
     * Complete the authentication process by getting the character id
     * @param {string}   access_token Required - The access_token provided back by the sso system
     * @param {function} callback     Required - A callback to be executed, the result will contain response from the sso
     * @return object
     */
    EveSSO.prototype.getCharacterID = function(access_token, callback) {
        var headers = { 'Authorization' : 'Bearer ' + access_token };
        this.request(this._settings['login_url'] + '/oauth/verify', {'method': 'GET', 'headers' : headers}, function(result) {
            if (result.error) return callback(new Error('CREST Error: ' + result.error + ' - "' + result.error_description + '"'));
            callback(null, result);
        });
    };

    //==============================================================================

    //export the module
    module.exports = new EveSSO;

    //==============================================================================

}).call(this);
