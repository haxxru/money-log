# DOMAIN-COMMON-STATUTE

- 입력 검증은 서버 액션에서 수행한다.
- 거래 저장 시 `description`은 비어 있을 수 없다.
- 거래 저장 시 `tx_type`과 `category`는 정규 컬럼으로 저장한다.
- `tx_type = income`이면 `category = 수입`만 허용한다.
- 월급 자동 입금은 사용자 프로필(`salary_day`, `salary_amount`)을 기준으로 월 1회만 반영한다.
- 단, 가입한 달에는 `salary_day`가 가입일보다 이르면 자동 월급을 생성하지 않는다.
