module.exports = function override(config, env) {
    // Add a fallback for 'buffer' in the resolve configuration
    config.resolve = {
        ...config.resolve, // Spread existing resolve configuration
        fallback: {
            ...config.resolve.fallback, // Spread any existing fallbacks
            'buffer': require.resolve('buffer/'), // Add buffer polyfill
        },
    };

    // Return the modified config
    return config;
};


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