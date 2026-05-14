# ARCHITECTURE-CONSTITUTION

- UI는 `ui-demo` 전역 디자인 토큰과 `components/ui` 컴포넌트 세트를 기준으로 구성한다.
- 애플리케이션은 App Router 기반으로 `/`, `/transactions`, `/budget`, `/analytics`, `/goals` 라우트를 제공한다.
- 사용자 데이터는 Supabase Auth 사용자 단위로 분리하며, 서버 액션/서버 컴포넌트에서 인증 검증 후 처리한다.
- 재무 데이터의 단일 기준 저장소는 Supabase(Postgres)이다.
