const NodePolyfillPlugin = require("node-polyfill-webpack-plugin");

module.exports = function override(config, env) {
  config.plugins = (config.plugins || []).concat([
    new NodePolyfillPlugin()
  ]);
  return config;
};



/*
module.exports = function override(config, env) {
    // Add a fallback for 'buffer' and 'fs' in the resolve configuration
    config.resolve = {
        ...config.resolve, // Spread existing resolve configuration
        fallback: {
            ...config.resolve.fallback, // Spread any existing fallbacks
            fs: false, // Add false for fs
            Buffer: false, // Add false for Buffer
        },
    };

    // Return the modified config
    return config;
};
*/


/*
module.exports = function override(config, env) {
    // Show the config before the changes
    console.log('Original Config:', config);
  
    // Custom configuration
    config.resolve = config.resolve || {};
    config.resolve.fallback = config.resolve.fallback || {};
    config.resolve.fallback.buffer = require.resolve('buffer/');
  
    // Show the config after the changes
    console.log('Modified Config:', config);
  
    return config;
  };
  */