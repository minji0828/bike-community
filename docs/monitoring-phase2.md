# 모니터링 2단계 도입 가이드 (Prometheus + Loki + Grafana)

목표:
- MVP1 배포 안정화 후, 운영 관측을 단계적으로 확장한다.

## 1) 포함 범위
- 메트릭: Prometheus (`/actuator/prometheus`)
- 로그: Loki + Promtail (Docker 컨테이너 로그 수집)
- 대시보드: Grafana

## 2) 사전 확인
- 백엔드 앱이 `actuator/prometheus` 노출 중인지 확인
- 앱 배포 compose 네트워크 이름 확인
  - 기본값: `deploy_bikeoasis-net`
  - 다르면 `BIKEOASIS_APP_NETWORK` 환경변수로 지정

## 3) 실행
```bash
cd /opt/bike-project
mkdir -p deploy/runtime/monitoring/{grafana,loki,prometheus,promtail}
docker compose -f deploy/monitoring/docker-compose.monitoring.yml up -d
```

접속:
- Prometheus: `http://<EC2-IP>:9090`
- Loki: `http://<EC2-IP>:3100`
- Grafana: `http://<EC2-IP>:3000`

## 4) 초기 Grafana 연결
1) 로그인 후 Data source 추가
   - Prometheus: `http://prometheus:9090`
   - Loki: `http://loki:3100`
2) 기본 대시보드 생성
   - JVM Heap / CPU / HTTP request count
   - 에러율(5xx)
   - backend-blue/green 컨테이너 로그

## 5) 운영 권장
- 3000/9090/3100 포트는 사설망 또는 VPN으로 제한
- Grafana admin 비밀번호 즉시 변경
- 알림은 Grafana Alerting 또는 별도 채널(Discord/Telegram)로 연동
