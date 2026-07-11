const fs = require("fs");
const path = require("path");

module.exports = function withGoogleServices(config) {
  if (process.env.GOOGLE_SERVICES_FILE) {
    const googleServicesPath = path.join(
      config.modRequest.projectRoot,
      "google-services.json",
    );

    // Write the file from environment variable
    fs.writeFileSync(googleServicesPath, process.env.GOOGLE_SERVICES_FILE);
  }

  return config;
};
