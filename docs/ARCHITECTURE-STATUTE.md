# ARCHITECTURE-STATUTE

- Supabase 서버 클라이언트는 `lib/supabase/server.ts`를 사용한다.
- 도메인 데이터 접근은 `lib/ledger.ts`에 모아 페이지별 중복 로직을 줄인다.
- 인증 관련 액션은 `app/actions/auth.ts`, 재무 CRUD 액션은 `app/actions/finance.ts`에서 처리한다.
- 대시보드 UI는 `components/dashboard/dashboard-client.tsx`를 중심으로 구성한다.
- 공통 셸(좌측 사이드바 + 상단 헤더)은 `components/layout/app-frame.tsx`를 사용한다.
