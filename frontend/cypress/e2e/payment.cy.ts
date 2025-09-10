describe('Payment Tests', () => {
  beforeEach(() => {
    cy.login(Cypress.env('TEST_USER_EMAIL'), Cypress.env('TEST_USER_PASSWORD'));
  });

  describe('Payment Processing', () => {
    it('should complete payment with Toss Payments', () => {
      // Create a completed work session
      cy.visit('/work-history');
      cy.get('[data-testid="completed-work"]').first().click();
      cy.get('button[data-testid="request-payment"]').click();
      
      // Payment details page
      cy.get('[data-testid="payment-amount"]').should('contain', '120,000원');
      cy.get('button[data-testid="proceed-payment"]').click();
      
      // Toss Payments checkout (mocked)
      cy.window().then((win) => {
        // Mock Toss Payments success callback
        win.postMessage({ 
          type: 'TOSS_PAYMENT_SUCCESS',
          paymentKey: 'test_payment_key',
          orderId: 'test_order_id',
          amount: 120000
        }, '*');
      });
      
      // Verify payment success
      cy.url().should('include', '/payment-success');
      cy.get('[data-testid="success-message"]').should('contain', '결제가 완료되었습니다');
    });

    it('should handle payment failure', () => {
      cy.visit('/work-history');
      cy.get('[data-testid="completed-work"]').first().click();
      cy.get('button[data-testid="request-payment"]').click();
      cy.get('button[data-testid="proceed-payment"]').click();
      
      // Mock payment failure
      cy.window().then((win) => {
        win.postMessage({ 
          type: 'TOSS_PAYMENT_FAIL',
          code: 'PAY_PROCESS_CANCELED',
          message: '사용자가 결제를 취소했습니다'
        }, '*');
      });
      
      cy.get('[data-testid="error-message"]').should('contain', '결제가 취소되었습니다');
    });

    it('should view payment history', () => {
      cy.visit('/payments');
      
      cy.get('[data-testid="payment-item"]').should('have.length.greaterThan', 0);
      cy.get('[data-testid="payment-status"]').first().should('be.visible');
      cy.get('[data-testid="payment-amount"]').first().should('contain', '원');
    });

    it('should download payment receipt', () => {
      cy.visit('/payments');
      cy.get('[data-testid="payment-item"]').first().click();
      
      cy.get('button[data-testid="download-receipt"]').click();
      
      // Verify download started
      cy.readFile('cypress/downloads/receipt.pdf').should('exist');
    });
  });

  describe('Settlement Management', () => {
    it('should request settlement', () => {
      cy.visit('/settlements');
      cy.get('button[data-testid="request-settlement"]').click();
      
      // Fill settlement form
      cy.get('input[name="bankName"]').type('국민은행');
      cy.get('input[name="accountNumber"]').type('123-456-789012');
      cy.get('input[name="accountHolder"]').type('홍길동');
      cy.get('button[type="submit"]').click();
      
      cy.get('[data-testid="success-toast"]').should('contain', '정산 요청이 완료되었습니다');
    });

    it('should track settlement status', () => {
      cy.visit('/settlements');
      
      cy.get('[data-testid="settlement-item"]').first().within(() => {
        cy.get('[data-testid="settlement-status"]').should('be.visible');
        cy.get('[data-testid="settlement-amount"]').should('contain', '원');
      });
    });
  });
});