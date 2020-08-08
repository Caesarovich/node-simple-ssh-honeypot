/*
  Simple SSH HoneyPot
   ~ by Caesarovich

  S-SSH-HP is a very basic SSH honeypot made in NodeJS for fun.
  
*/
const fs = require('fs');
const path = require('path');
const settings = require('settings');
const ssh2 = require('ssh2');
const keygen = require('ssh-keygen');


process.env.VERBOSE = true

console.log('[S-SSH-HP] Starting...');

const config = new settings(require('./config'));

if (!config.port || !config.falsePositiveRatio || !config.privateKeyPath){
  console.error('[S-SSH-HP] There\'s a problem in the configuration file !');
  process.exit(1);
}

if (!fs.existsSync(config.privateKeyPath)) { // Unexisting RSA key pair
  console.warn('[S-SSH-HP] No key found in the specified path, generating new ones...');

  keygen({
    location: path.join(__dirname, config.privateKeyPath),
    comment: 'No comment',
    password: false,
    read: true,
  }, (err, out) => {
    if(err) return console.error(`[S-SSH-HP] Something went wrong while generating RSA keys: ${err}`);
    console.log('[S-SSH-HP] Keys created!');
    console.log('[S-SSH-HP] Private key: ' + out.key);
    console.log('[S-SSH-HP] Public key: ' + out.pubKey);
    main();
  });
} else {
  main();
}


function main() {
  new ssh2.Server({
    hostKeys: [fs.readFileSync(config.privateKeyPath)]
  }, function(client) {
    console.log(`${client._sock.remoteAddress} >>> Connection`); 
  
    client.on('authentication', function(ctx) { 
      if(ctx.method === 'password') {
        const falsePositive = Math.random() <= config.falsePositiveRatio;
        if (falsePositive) {
          console.log(`${client._sock.remoteAddress} >> '${ctx.username}' | '${ctx.password}' - ACCEPTED`);
          ctx.accept();
        } else {
          console.log(`${client._sock.remoteAddress} >> '${ctx.username}' | '${ctx.password}' - REJECTED`);
          return ctx.reject(['password']); // Refusing Access
        }
      } else {
        return ctx.reject(['password']); // Forwarding authentication method to password
      }    
    }).on('ready', function() {
      console.log(`${client._sock.remoteAddress} >>> Authenticated (Not really of course :p)`);
  
      client.on('session', function(accept, reject) {
        const session = accept();
        session.once('shell', function(accept, _, _) {
          var stream = accept();
          stream.write('Welcome Visitor !\n');
          stream.exit(0);
          stream.end();
          reject();
        });
      });
    }).on('end', function() {
      console.log(`${client._sock.remoteAddress} >>> Disconnected`);
    }).on('close', function() {
      console.log(`${client._sock.remoteAddress} >>> Connection closed`);
    }).on('error', () => {}); // Into the void you go !
  }).listen(config.port, '127.0.0.1', function() {
    console.log(`[S-SSH-HP] Listening on 127.0.0.1:${this.address().port}`);
  });
}
