# DOMAIN-MEMBER-STATUTE

- 인증은 Supabase Auth(이메일/비밀번호)로 처리한다.
- 회원가입은 `nickname`, `initial_balance`를 `auth.signUp(...options.data)`에 포함한다.
- `salary_day`, `salary_amount`는 회원가입 이후 `/settings`에서 사용자 프로필로 수정한다.
- 가입 직후 프로필 초기화는 DB 트리거(`auth.users` → `public.user_profiles`)로 처리한다.
- 금융 관련 서버 액션은 모두 인증 사용자 확인 후 진행하며, 미인증 시 로그인으로 유도하거나 에러를 반환한다.
- 데이터 소유권은 모든 테이블에서 `user_id = auth.uid()` 기준으로 분리한다.
- RLS 정책은 `expenses`, `user_profiles`, `budgets`, `goals`에 대해 본인 행만 `select/insert/update/delete` 허용으로 구성한다.
