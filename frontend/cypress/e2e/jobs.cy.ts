describe('Job Management Tests', () => {
  beforeEach(() => {
    cy.login(Cypress.env('TEST_EMPLOYER_EMAIL'), Cypress.env('TEST_EMPLOYER_PASSWORD'));
  });

  describe('Job Creation', () => {
    it('should create a new job posting', () => {
      cy.visit('/jobs/create');
      
      // Fill in job details
      cy.get('input[name="title"]').type('배송 도우미 긴급 모집');
      cy.get('select[name="category"]').select('DELIVERY');
      cy.get('input[name="location"]').type('서울 강남구');
      cy.get('input[name="address"]').type('테헤란로 123 건물 1층');
      cy.get('input[name="wage"]').clear().type('15000');
      cy.get('input[name="workDate"]').type('2025-01-15');
      cy.get('input[name="startTime"]').type('09:00');
      cy.get('input[name="endTime"]').type('18:00');
      cy.get('textarea[name="description"]').type('배송 업무 도우미를 모집합니다. 경험자 우대합니다.');
      
      // Add requirements
      cy.get('button').contains('요구사항 추가').click();
      cy.get('input[placeholder="요구사항 입력"]').last().type('운전면허 필수');
      
      // Mark as urgent
      cy.get('input[name="urgent"]').check();
      
      // Submit
      cy.get('button[type="submit"]').click();
      
      // Verify creation
      cy.url().should('match', /\/jobs\/[a-z0-9]+$/);
      cy.get('[data-testid="job-title"]').should('contain', '배송 도우미 긴급 모집');
      cy.get('[data-testid="success-toast"]').should('contain', '일자리가 등록되었습니다');
    });

    it('should validate required fields', () => {
      cy.visit('/jobs/create');
      
      // Try to submit without filling required fields
      cy.get('button[type="submit"]').click();
      
      // Check for validation errors
      cy.get('[data-testid="title-error"]').should('be.visible');
      cy.get('[data-testid="category-error"]').should('be.visible');
      cy.get('[data-testid="location-error"]').should('be.visible');
      cy.get('[data-testid="wage-error"]').should('be.visible');
    });

    it('should save draft and resume later', () => {
      cy.visit('/jobs/create');
      
      // Fill partial data
      cy.get('input[name="title"]').type('Draft Job');
      cy.get('select[name="category"]').select('DELIVERY');
      
      // Save as draft
      cy.get('button').contains('임시 저장').click();
      cy.get('[data-testid="success-toast"]').should('contain', '임시 저장되었습니다');
      
      // Navigate away and come back
      cy.visit('/');
      cy.visit('/jobs/drafts');
      
      // Resume draft
      cy.get('[data-testid="draft-item"]').contains('Draft Job').click();
      cy.get('input[name="title"]').should('have.value', 'Draft Job');
    });
  });

  describe('Job Search and Filtering', () => {
    it('should search jobs by keyword', () => {
      cy.visit('/jobs');
      
      cy.get('input[name="search"]').type('배송');
      cy.get('button[data-testid="search-button"]').click();
      
      cy.wait('@apiGet');
      
      cy.get('[data-testid="job-card"]').each(($card) => {
        cy.wrap($card).should('contain.text', '배송');
      });
    });

    it('should filter jobs by category', () => {
      cy.visit('/jobs');
      
      cy.get('select[name="category"]').select('DELIVERY');
      cy.wait('@apiGet');
      
      cy.get('[data-testid="job-category"]').each(($category) => {
        cy.wrap($category).should('contain', '배송');
      });
    });

    it('should filter jobs by location', () => {
      cy.visit('/jobs');
      
      cy.get('input[name="location"]').type('강남구');
      cy.get('button[data-testid="apply-filters"]').click();
      
      cy.wait('@apiGet');
      
      cy.get('[data-testid="job-location"]').each(($location) => {
        cy.wrap($location).should('contain', '강남구');
      });
    });

    it('should sort jobs by wage', () => {
      cy.visit('/jobs');
      
      cy.get('select[name="sort"]').select('wage_desc');
      cy.wait('@apiGet');
      
      let previousWage = Infinity;
      cy.get('[data-testid="job-wage"]').each(($wage) => {
        const wage = parseInt($wage.text().replace(/[^0-9]/g, ''));
        expect(wage).to.be.at.most(previousWage);
        previousWage = wage;
      });
    });

    it('should use location-based search', () => {
      cy.mockGeolocation(37.5665, 126.9780); // Seoul coordinates
      cy.visit('/jobs');
      
      cy.get('button[data-testid="nearby-jobs"]').click();
      cy.wait('@apiGet');
      
      cy.get('[data-testid="job-distance"]').should('be.visible');
      cy.get('[data-testid="job-distance"]').first().should('contain', 'km');
    });
  });

  describe('Job Application', () => {
    beforeEach(() => {
      cy.logout();
      cy.login(Cypress.env('TEST_USER_EMAIL'), Cypress.env('TEST_USER_PASSWORD'));
    });

    it('should apply to a job', () => {
      cy.visit('/jobs');
      cy.get('[data-testid="job-card"]').first().click();
      
      cy.get('button[data-testid="apply-button"]').click();
      
      // Fill application form
      cy.get('textarea[name="message"]').type('저는 이 일자리에 매우 관심이 있습니다.');
      cy.get('input[name="availableDate"]').type('2025-01-15');
      cy.get('button[type="submit"]').click();
      
      // Verify application
      cy.get('[data-testid="success-toast"]').should('contain', '지원이 완료되었습니다');
      cy.get('button[data-testid="apply-button"]').should('contain', '지원 완료');
    });

    it('should show application status', () => {
      cy.visit('/my-applications');
      
      cy.get('[data-testid="application-card"]').should('have.length.greaterThan', 0);
      cy.get('[data-testid="application-status"]').first().should('be.visible');
    });

    it('should cancel application', () => {
      cy.visit('/my-applications');
      
      cy.get('[data-testid="application-card"]').first().within(() => {
        cy.get('button[data-testid="cancel-application"]').click();
      });
      
      cy.get('[data-testid="confirm-dialog"]').within(() => {
        cy.get('button').contains('취소하기').click();
      });
      
      cy.get('[data-testid="success-toast"]').should('contain', '지원이 취소되었습니다');
    });
  });

  describe('Job Management (Employer)', () => {
    it('should view applicants list', () => {
      cy.visit('/my-jobs');
      cy.get('[data-testid="job-card"]').first().click();
      cy.get('button[data-testid="view-applicants"]').click();
      
      cy.get('[data-testid="applicant-card"]').should('be.visible');
    });

    it('should accept an applicant', () => {
      cy.visit('/my-jobs');
      cy.get('[data-testid="job-card"]').first().click();
      cy.get('button[data-testid="view-applicants"]').click();
      
      cy.get('[data-testid="applicant-card"]').first().within(() => {
        cy.get('button[data-testid="accept-applicant"]').click();
      });
      
      cy.get('[data-testid="confirm-dialog"]').within(() => {
        cy.get('button').contains('승인').click();
      });
      
      cy.get('[data-testid="success-toast"]').should('contain', '지원자를 승인했습니다');
    });

    it('should edit job posting', () => {
      cy.visit('/my-jobs');
      cy.get('[data-testid="job-card"]').first().click();
      cy.get('button[data-testid="edit-job"]').click();
      
      cy.get('input[name="title"]').clear().type('수정된 일자리 제목');
      cy.get('button[type="submit"]').click();
      
      cy.get('[data-testid="success-toast"]').should('contain', '일자리가 수정되었습니다');
      cy.get('[data-testid="job-title"]').should('contain', '수정된 일자리 제목');
    });

    it('should close job posting', () => {
      cy.visit('/my-jobs');
      cy.get('[data-testid="job-card"]').first().click();
      cy.get('button[data-testid="close-job"]').click();
      
      cy.get('[data-testid="confirm-dialog"]').within(() => {
        cy.get('button').contains('마감').click();
      });
      
      cy.get('[data-testid="job-status"]').should('contain', '마감');
    });
  });

  describe('Saved Jobs', () => {
    beforeEach(() => {
      cy.logout();
      cy.login(Cypress.env('TEST_USER_EMAIL'), Cypress.env('TEST_USER_PASSWORD'));
    });

    it('should save a job', () => {
      cy.visit('/jobs');
      cy.get('[data-testid="job-card"]').first().within(() => {
        cy.get('button[data-testid="save-job"]').click();
      });
      
      cy.get('[data-testid="success-toast"]').should('contain', '저장되었습니다');
    });

    it('should view saved jobs', () => {
      cy.visit('/saved-jobs');
      cy.get('[data-testid="saved-job-card"]').should('have.length.greaterThan', 0);
    });

    it('should unsave a job', () => {
      cy.visit('/saved-jobs');
      cy.get('[data-testid="saved-job-card"]').first().within(() => {
        cy.get('button[data-testid="unsave-job"]').click();
      });
      
      cy.get('[data-testid="success-toast"]').should('contain', '저장이 취소되었습니다');
    });
  });
});