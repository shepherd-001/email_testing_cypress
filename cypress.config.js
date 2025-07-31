const { defineConfig } = require("cypress");
const {fetchLatestEmail, extractInviteLinkFromEmail} = require("./cypress/tasks/fetchEmail");

module.exports = defineConfig({
  watchForFileChanges: false,
  e2e: {
    setupNodeEvents(on, config) {
      on("task", {
        fetchLatestEmail() {
          return fetchLatestEmail();
        },

        extractInviteLinkFromEmail: () => {
          return extractInviteLinkFromEmail()
        }
      })
    },

    baseUrl: "https://systest.meedl.africa",
    
    defaultCommandTimeout: 3000,
    responseTimeout: 30000,
    pageLoadTimeout: 100000,
   
    testIsolation: false,
    specPattern: "cypress/e2e/thespec.cy.js",
  },
});