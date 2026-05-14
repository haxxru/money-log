# 💰 머니로그

Next.js + Supabase 기반 개인 가계부 서비스입니다.  
월별 수입/지출 관리, 예산 추적, 분석 차트, 목표 관리까지 한 화면 흐름으로 제공합니다.

## ✨ 주요 기능

- 🔐 인증
  - Supabase Auth 이메일/비밀번호 회원가입/로그인/로그아웃
  - 회원가입 시 닉네임/초기 잔액/월급일/월급액 입력
- 📊 대시보드
  - 이번 달 수입/지출/잔액/저축 요약
  - 현금 흐름 추세, 카테고리별 지출 비중
  - 거래 추가/수정/삭제 (모달)
  - 데이터 기반 절약 팁 자동 생성
- 🧾 거래 내역
  - 거래 추가/조회/수정/삭제
- 📅 예산
  - 카테고리별 월 예산 설정 및 소진률 확인
- 📈 분석
  - 최근 거래 기반 지출 추세/비중 차트
- 🎯 목표
  - 목표 추가/진행률 업데이트/삭제
- 💵 월급 자동 반영
  - 로그인 시 이번 달 월급 거래 누락 시 자동 생성
  - 단, 가입한 달에 `salary_day < 가입일`이면 자동 생성하지 않음

## 🛠️ 기술 스택

- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS + shadcn/ui 계열 컴포넌트
- Supabase (Auth + Postgres + RLS)
- Recharts

## 🚀 실행 방법

## 1) 📦 의존성 설치

```bash
npm install
```


## 2) 🧪 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:3000`

## 3) ✅ 품질 확인

```bash
npm run lint
npm run build
```

## 📌 데이터 규칙 요약

- 거래 저장 테이블: `expenses`
- 저장 규칙:
  - `amount`: 양수 저장
  - `tx_type`: `income | expense`
  - `category`: `식비 | 주거 | 교통 | 쇼핑 | 여가 | 수입 | 기타`
- 구 스키마 호환(fallback) 로직 포함:
  - `tx_type/category` 컬럼이 없어도 읽기/쓰기 동작

## 🧱 프로젝트 구조 (핵심)

```text
app/
  actions/
    auth.ts
    finance.ts
  page.tsx
  transactions/page.tsx
  budget/page.tsx
  analytics/page.tsx
  goals/page.tsx
components/
  dashboard/dashboard-client.tsx
  layout/app-frame.tsx
  layout/app-sidebar.tsx
lib/
  ledger.ts
  supabase/
docs/
  PRODUCT-PLAN.md
```

## 🩺 트러블슈팅

- 대시보드 값이 기대와 다를 때 🔍
  - `초기 잔액` 거래 반영 방식과 월급 자동반영 여부 확인
  - `user_profiles` 값(`initial_balance`, `salary_day`, `salary_amount`) 점검

## 📚 문서

- 제품 기획: [`docs/PRODUCT-PLAN.md`](docs/PRODUCT-PLAN.md)
- 아키텍처/도메인 규칙: `docs/ARCHITECTURE-*`, `docs/DOMAIN-*`
- 작업 이력: `docs/AI-ACTION-LOGS.md`, `docs/AI-MAJOR-EVENT*.md`
