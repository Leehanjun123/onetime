-- 자주 사용되는 쿼리에 대한 최적화 인덱스 추가

-- 일자리 검색 최적화
CREATE INDEX "jobs_status_workDate_idx" ON "public"."jobs"("status", "workDate");
CREATE INDEX "jobs_category_status_idx" ON "public"."jobs"("category", "status");
CREATE INDEX "jobs_urgent_status_idx" ON "public"."jobs"("urgent", "status");
CREATE INDEX "jobs_employerId_status_idx" ON "public"."jobs"("employerId", "status");

-- 지원 현황 조회 최적화
CREATE INDEX "job_applications_workerId_status_idx" ON "public"."job_applications"("workerId", "status");
CREATE INDEX "job_applications_jobId_status_idx" ON "public"."job_applications"("jobId", "status");
CREATE INDEX "job_applications_createdAt_idx" ON "public"."job_applications"("createdAt" DESC);

-- 작업 세션 조회 최적화
CREATE INDEX "work_sessions_status_startTime_idx" ON "public"."work_sessions"("status", "startTime");
CREATE INDEX "work_sessions_workerId_status_idx" ON "public"."work_sessions"("workerId", "status");
CREATE INDEX "work_sessions_jobId_status_idx" ON "public"."work_sessions"("jobId", "status");

-- 리뷰 조회 최적화
CREATE INDEX "reviews_revieweeId_rating_idx" ON "public"."reviews"("revieweeId", "rating");
CREATE INDEX "reviews_reviewerId_idx" ON "public"."reviews"("reviewerId");
CREATE INDEX "reviews_createdAt_idx" ON "public"."reviews"("createdAt" DESC);

-- 결제 조회 최적화
CREATE INDEX "payments_userId_status_idx" ON "public"."payments"("userId", "status");
CREATE INDEX "payments_createdAt_idx" ON "public"."payments"("createdAt" DESC);
CREATE INDEX "payments_status_idx" ON "public"."payments"("status");

-- 정산 조회 최적화  
CREATE INDEX "settlements_workerId_status_idx" ON "public"."settlements"("workerId", "status");
CREATE INDEX "settlements_scheduledDate_idx" ON "public"."settlements"("scheduledDate");
CREATE INDEX "settlements_status_idx" ON "public"."settlements"("status");

-- 알림 조회 최적화 (이미 있는 것 외 추가)
CREATE INDEX "notifications_type_idx" ON "public"."notifications"("type");

-- 저장된 일자리/회사 조회 최적화
CREATE INDEX "saved_jobs_createdAt_idx" ON "public"."saved_jobs"("createdAt" DESC);
CREATE INDEX "saved_companies_createdAt_idx" ON "public"."saved_companies"("createdAt" DESC);

-- 인증 토큰 최적화 (이미 있는 것 외 추가)
CREATE INDEX "verification_tokens_expiresAt_idx" ON "public"."verification_tokens"("expiresAt");

-- 포트폴리오 파일 조회 최적화
CREATE INDEX "portfolio_files_createdAt_idx" ON "public"."portfolio_files"("createdAt" DESC);

-- 사용자 로그인 최적화
CREATE INDEX "users_email_password_idx" ON "public"."users"("email", "password");
CREATE INDEX "users_userType_idx" ON "public"."users"("userType");
CREATE INDEX "users_verified_idx" ON "public"."users"("verified");

-- 제목과 설명 검색을 위한 일반 인덱스
CREATE INDEX "jobs_title_idx" ON "public"."jobs"("title");
CREATE INDEX "users_name_idx" ON "public"."users"("name");