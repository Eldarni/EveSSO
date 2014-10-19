##### EveSSO
This is an example of how (not) to implement the SSO in an NodeJS enviroment.

#### Installation
    npm install git://github.com:RickyBaby/EveSSO.git

#### Methods

### setUserAgent(user_agent) & getUserAgent()
As a good person you will set a user agent that will allow CCP to contact you if anything goes wrong. This should include your in-game name or another method of contact.

    //set the user agent
    evesso.setUserAgent('YOURAPPNAME/1.0 - Your Name - @twitter');

    //get the current user agent
    evesso.getUserAgent();

### setClientID(client_id) & getClientID()
Set the "Client ID" of the application - this is provided by CCP when you register your application at https://developers.testeveonline.com

    //set the client id
    evesso.setClientID('asjdqour4091jskjud91');

    //get the current client id
    evesso.getClientID();

### setSecretKey(secret_key) & getSecretKey()
Set the "Secret Key" of the application - this is provided by CCP when you register your application at https://developers.testeveonline.com

    //set the secret key
    evesso.setSecretKey('kvrhlw35lvwthf65ldgd');

    //get the current secret key
    evesso.getSecretKey();

### setCallbackURL(callback_url) & getCallbackURL()
Set the "Callback URL" of the application - this should match the one you entered while setting up your application

    //set the callback url
    evesso.setClientID('https://yourappdomain/ssocallback/');

    //get the current callback url
    evesso.getClientID();

### useTestServer(use_test_server)
The toggles the oauth server to the test server

    //set the server address to "https://sisilogin.testeveonline.com"
    evesso.useTestServer(true);

    //revert the change back to "https://login.eveonline.com"
    evesso.useTestServer(false);

### getRedirectURL(state_token, callback)
This will pass the redirect url to the provided callback - allowing you to perform a HTTP 302 redirection

    evesso.getRedirectURL('somerandomstatetoken', function(error, result) {
        res.redirect(302, result);
    });

### getAccessToken(authorisation_code, callback)
This validates the authorisation code and gets the access_token

    evesso.getAccessToken(authorisation_code, function(error, result) {
        console.log(result.access_token);
    });

### getCharacterID(access_token, callback)
Returns the character information that the use selected as they were logging in

    evesso.getCharacterID(access_token, function(error, result) {
        console.log('Character ID' + result.CharacterID);
        console.log('Character Name' + result.CharacterName);
    });

### Example

    //set the user agent
    evesso.setUserAgent('YOURAPPNAME/1.0 - Your Name - @twitter');

    //set the client id and secret key
    evesso.setClientID('asjdqour4091jskjud91');
    evesso.setSecretKey('kvrhlw35lvwthf65ldgd');

    //set the callback url
    evesso.setClientID('https://yourappdomain/ssocallback/');

    //configure the express routes
    app.get('/login/', function(req, res) {

        //create a state key and store it into the session system
        //............

        evesso.getRedirectURL(session_state, function(error, result) {
            res.redirect(302, result);
        });
    });

    app.get('/login/', function(req, res) {

        //get the code and state
        authorisation_code  = request.query.code;
        authorisation_state = request.query.state;

        //validate the state token
        //...............

        evesso.getAccessToken(authorisation_code, function(error, result) {
            evesso.getCharacterID(result.access_token, function(error, result) {
                
                //got the details
                console.log('Character ID' + result.CharacterID);
                console.log('Character Name' + result.CharacterName);

                //update the session
                //...............

            });
        });
    });