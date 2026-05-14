# DOMAIN-COMMON-CONSTITUTION

- `expenses.amount`는 부호로 의미를 구분한다.
  - 수입: 양수
  - 지출: 음수
- 사용자별 재무 데이터는 다른 사용자와 격리되어야 한다.
- 목표/예산/거래는 모두 동일 사용자 컨텍스트에서만 읽고 수정한다.
