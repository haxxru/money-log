# 프로젝트명

머니로그 (Money Log)

간단한 프로젝트 소개 작성  
월별 수입/지출, 예산, 목표, 분석을 한 번에 관리하는 개인 가계부 서비스입니다.

---

# 프로젝트 개요

- 프로젝트 목적
  - 개인 재무 데이터를 빠르게 기록하고 월 단위로 확인할 수 있는 실사용형 가계부 제공
- 주요 기능 설명
  - 인증, 대시보드, 거래 CRUD, 예산 관리, 분석 차트, 목표 관리, 정기 급여 설정
- 어떤 문제를 해결하는지
  - 흩어진 소비 기록과 월별 지출 파악의 어려움을 해결
  - 카테고리/유형 기반으로 지출 흐름을 명확하게 시각화
- 프로젝트 진행 배경
  - `ui-demo` 디자인을 실제 서비스 기능과 연결해 운영 가능한 MVP로 완성하기 위해 진행

---

# 기술 스택

## Frontend

- Next.js / React
- TypeScript
- TailwindCSS
- Recharts
- shadcn/ui (Radix UI 기반)

## Backend

- Supabase (Auth + Postgres + RLS)

## AI Agent

- Codex CLI

---

# 주요 기능

- 기능 1
  - Supabase Auth 기반 회원가입/로그인/로그아웃
  - 회원가입 시 닉네임/초기 잔액 입력
- 기능 2
  - 대시보드: 월별 수입/지출/잔액/저축 요약, 현금흐름/카테고리 차트
  - 거래 추가/수정/삭제, 절약 팁 자동 생성
- 기능 3
  - 거래 내역 페이지 CRUD
  - CSV/XLSX 내보내기/가져오기
  - 예산/목표/정기 급여(설정 탭) 관리

---

# 프로젝트 구조

```text
app/
 ├── actions/
 ├── analytics/
 ├── api/
 ├── budget/
 ├── goals/
 ├── login/
 ├── settings/
 ├── signup/
 └── transactions/
components/
 ├── analytics/
 ├── auth/
 ├── dashboard/
 ├── layout/
 └── ui/
hooks/
lib/
 ├── supabase/
 └── ledger.ts
docs/
public/
```

---

# 실행 방법

## 1. 프로젝트 설치

```bash
npm install
```

## 2. 환경변수 설정

`.env.local`

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## 3. 실행

```bash
npm run dev
```

---

# Supabase 설정

- Authentication 사용 여부
  - 사용 (이메일/비밀번호)
- 사용한 테이블 설명
  - `user_profiles`: 닉네임, 초기 잔액, 급여 설정
  - `expenses`: 거래 내역(금액, 유형, 카테고리, 날짜)
  - `budgets`: 카테고리별 월 예산
  - `goals`: 저축/목표 금액과 진행률
- 주요 정책(RLS) 설명
  - 모든 테이블은 `auth.uid() = user_id` 기준으로 본인 데이터만 조회/수정/삭제 가능
- Storage 사용 여부
  - 현재 미사용

---

# AI 에이전트 활용 방식

- 사용한 도구
  - Codex CLI 중심으로 구현/리팩토링/문서화
- 어떤 작업에 활용했는지
  - UI 이식, 서버 액션 연결, DB 호환 로직 추가, 버그 수정, 문서 정리
- 문서 기반 작업 방식
  - `AGENTS.md` 규칙 + `docs/*` TODO/CONTEXT/로그 문서 기준 진행
- 프롬프트 전략
  - 기능 단위 요청 후 즉시 구현/검증, 이슈 발생 시 재현 에러 기반 수정
- 코드 검증 방식
  - 변경 후 `npm run lint` 실행
  - 주요 플로우 수동 점검(회원가입/로그인/거래 CRUD/가져오기/내보내기)

예시

- README 초안 작성
- 컴포넌트 생성
- 리팩터링
- 테스트 코드 생성 (필요 시)
- 버그 수정
- 문서 정리

---

# 트러블 슈팅

## 문제 상황

- 신규 계정에서 지난달 대비 수치가 비정상적으로 크게 노출됨
- 거래 추가 시 DB 제약조건 오류(`expenses_amount_check`) 발생
- 배포 환경에서 로그인 실패 시 서버 에러 페이지 노출

## 원인

- 분모(지난달 수입)가 0인 케이스 방어 부족
- `amount` 저장 규칙(양수 저장 + `tx_type` 구분)과 입력값 정규화 불일치
- 로그인 실패 예외를 사용자 메시지로 전환하지 못함

## 해결 방법

- 지난달 데이터 없음일 때 `데이터 없음`으로 처리
- 서버 액션에서 금액 파싱/검증 강화, 양수 저장 규칙 일관 적용
- 로그인 예외를 안전하게 처리해 UI 레벨에서 안내

---

# 회고

- 어려웠던 점
  - 디자인 정합성과 기능 구현을 동시에 맞추는 과정
- 개선하고 싶은 점
  - 자동 테스트(E2E/통합 테스트) 보강
- 새롭게 배운 점
  - Supabase 스키마 호환(fallback) 전략과 RLS 운영 패턴
- AI 에이전트를 사용하며 느낀 점
  - 반복 작업과 문서 정리에 큰 생산성 향상, 다만 최종 의사결정과 검증은 사람이 책임져야 안정적

---

# 참고 자료

- 공식 문서
  - Next.js: https://nextjs.org/docs
  - Supabase: https://supabase.com/docs
  - TailwindCSS: https://tailwindcss.com/docs
- 참고한 사이트
  - shadcn/ui: https://ui.shadcn.com
  - Recharts: https://recharts.org
- 사용한 라이브러리 링크
  - `@supabase/supabase-js`
  - `xlsx`
  - `recharts`
