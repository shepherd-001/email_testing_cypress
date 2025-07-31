import {EmailUtils} from "../../../utils/emailUtil";

describe('Email Test', () => {
    it('invite organization', () => {
        cy.visit("/auth/login")
        cy.get('[data-testid="loginEmailId"]').type("noreply-dev+semicolon@meedl.africa")
        cy.get('[data-testid="password"]').type("Password321$")
        cy.get('[data-testid="auth-button"]').click()

        // cy.wait(2000)
        cy.get('[data-testid="navbarRouteNameorganizations"]').click()
        cy.get('#active-buttonId').click()
        // cy.get('#invited-buttonId').click()
        cy.get('#organizationName').type(`${EmailUtils.generateRandomString()} LTD`)
        cy.get('#phoneNumber').type("08067564556")
        cy.get('#email').type(EmailUtils.generateEmail())
        cy.get("#industryTriggerId").click();
        cy.get('[role="option"]').contains('EDUCATION').click();
        cy.get("#serviceOfferingTriggerId").click();
        cy.get('[role="option"]').contains('TRAINING').click();
        cy.get("#rcNumber").click().type(EmailUtils.generateRcNumber());
        cy.get("#tin").click().type(EmailUtils.generateTaxNumber());
        cy.get("#adminFirstName").click().type("Abeke");
        cy.get("#adminLastName").click().type("Ajadi");
        cy.get("#adminEmail").click().type(EmailUtils.generateEmail());
        cy.get("#inviteOrganization").click();
    });

    it('fetches latest email content', () => {
        cy.task("extractInviteLinkFromEmail").then((link) => {
            cy.log(link);
            console.log(link);
            cy.visit(link);
        })
    });

});
