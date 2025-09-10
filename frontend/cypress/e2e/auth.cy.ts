describe('Authentication Tests', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  describe('Registration', () => {
    it('should register a new worker account', () => {
      cy.visit('/register');
      
      // Step 1: Basic info
      cy.get('input[name="email"]').type('newuser@test.com');
      cy.get('input[name="password"]').type('Test123!@#');
      cy.get('input[name="passwordConfirm"]').type('Test123!@#');
      cy.get('button').contains('다음').click();
      
      // Step 2: Personal info
      cy.get('input[name="name"]').type('테스트 유저');
      cy.get('input[name="phone"]').type('01012345678');
      cy.get('input[name="birthDate"]').type('1990-01-01');
      cy.get('button').contains('다음').click();
      
      // Step 3: User type selection
      cy.get('[data-testid="worker-type"]').click();
      cy.get('button').contains('가입 완료').click();
      
      // Verify registration success
      cy.url().should('include', '/login');
      cy.get('[data-testid="success-message"]').should('contain', '회원가입이 완료되었습니다');
    });

    it('should show validation errors for invalid inputs', () => {
      cy.visit('/register');
      
      // Try to submit with invalid email
      cy.get('input[name="email"]').type('invalid-email');
      cy.get('input[name="password"]').type('weak');
      cy.get('button').contains('다음').click();
      
      // Check for validation errors
      cy.get('[data-testid="email-error"]').should('contain', '올바른 이메일 형식이 아닙니다');
      cy.get('[data-testid="password-error"]').should('contain', '비밀번호는 8자 이상');
    });

    it('should prevent duplicate email registration', () => {
      cy.visit('/register');
      
      // Try to register with existing email
      cy.get('input[name="email"]').type(Cypress.env('TEST_USER_EMAIL'));
      cy.get('input[name="password"]').type('Test123!@#');
      cy.get('input[name="passwordConfirm"]').type('Test123!@#');
      cy.get('button').contains('다음').click();
      
      // Should show error
      cy.get('[data-testid="error-message"]').should('contain', '이미 등록된 이메일입니다');
    });
  });

  describe('Login', () => {
    it('should login with valid credentials', () => {
      cy.visit('/login');
      
      cy.get('input[name="email"]').type(Cypress.env('TEST_USER_EMAIL'));
      cy.get('input[name="password"]').type(Cypress.env('TEST_USER_PASSWORD'));
      cy.get('button[type="submit"]').click();
      
      // Verify successful login
      cy.url().should('eq', Cypress.config('baseUrl') + '/');
      cy.get('[data-testid="user-menu"]').should('be.visible');
      cy.window().its('localStorage.token').should('exist');
    });

    it('should show error for invalid credentials', () => {
      cy.visit('/login');
      
      cy.get('input[name="email"]').type('wrong@email.com');
      cy.get('input[name="password"]').type('wrongpassword');
      cy.get('button[type="submit"]').click();
      
      cy.get('[data-testid="error-message"]').should('contain', '이메일 또는 비밀번호가 올바르지 않습니다');
    });

    it('should redirect to login for protected routes', () => {
      cy.visit('/profile');
      cy.url().should('include', '/login');
      cy.get('[data-testid="redirect-message"]').should('contain', '로그인이 필요합니다');
    });

    it('should handle remember me functionality', () => {
      cy.visit('/login');
      
      cy.get('input[name="email"]').type(Cypress.env('TEST_USER_EMAIL'));
      cy.get('input[name="password"]').type(Cypress.env('TEST_USER_PASSWORD'));
      cy.get('input[name="rememberMe"]').check();
      cy.get('button[type="submit"]').click();
      
      // Check if refresh token is stored
      cy.window().its('localStorage.refreshToken').should('exist');
    });
  });

  describe('Logout', () => {
    beforeEach(() => {
      cy.login(Cypress.env('TEST_USER_EMAIL'), Cypress.env('TEST_USER_PASSWORD'));
    });

    it('should logout successfully', () => {
      cy.visit('/');
      cy.get('[data-testid="user-menu"]').click();
      cy.get('[data-testid="logout-button"]').click();
      
      // Verify logout
      cy.url().should('eq', Cypress.config('baseUrl') + '/');
      cy.get('[data-testid="login-button"]').should('be.visible');
      cy.window().its('localStorage.token').should('not.exist');
    });
  });

  describe('Password Reset', () => {
    it('should send password reset email', () => {
      cy.visit('/forgot-password');
      
      cy.get('input[name="email"]').type(Cypress.env('TEST_USER_EMAIL'));
      cy.get('button[type="submit"]').click();
      
      cy.get('[data-testid="success-message"]').should('contain', '비밀번호 재설정 이메일을 전송했습니다');
    });

    it('should reset password with valid token', () => {
      // This would normally come from email
      const resetToken = 'valid-reset-token';
      
      cy.visit(`/reset-password?token=${resetToken}`);
      
      cy.get('input[name="newPassword"]').type('NewPassword123!@#');
      cy.get('input[name="confirmPassword"]').type('NewPassword123!@#');
      cy.get('button[type="submit"]').click();
      
      cy.url().should('include', '/login');
      cy.get('[data-testid="success-message"]').should('contain', '비밀번호가 재설정되었습니다');
    });
  });

  describe('Session Management', () => {
    it('should refresh token when expired', () => {
      cy.login(Cypress.env('TEST_USER_EMAIL'), Cypress.env('TEST_USER_PASSWORD'));
      
      // Simulate token expiration
      cy.window().then((win) => {
        const expiredToken = 'expired.token.here';
        win.localStorage.setItem('token', expiredToken);
      });
      
      // Make an API call
      cy.visit('/profile');
      
      // Should automatically refresh token
      cy.wait('@apiPost');
      cy.window().its('localStorage.token').should('not.equal', 'expired.token.here');
    });

    it('should handle concurrent requests with expired token', () => {
      cy.login(Cypress.env('TEST_USER_EMAIL'), Cypress.env('TEST_USER_PASSWORD'));
      
      // Simulate multiple concurrent requests
      cy.visit('/jobs');
      
      // All requests should succeed
      cy.get('[data-testid="job-card"]').should('have.length.greaterThan', 0);
    });
  });
});