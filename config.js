module.exports = {
  common: {
    port: 22, // SSH Listen port (Should always be 22 to be efficient) | Please ensure that this port is unused !
    falsePositiveRatio: 0.01, // '0' to disable | '1' to always send false positive | False Positive Ratio
    privateKeyPath: 'host.key' // RSA private key path. If not existing, will generate one.
  }
};