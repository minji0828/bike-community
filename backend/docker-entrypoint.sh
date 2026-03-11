#!/bin/sh
set -eu

if [ -z "${SPRING_DATASOURCE_URL:-}" ] && [ -n "${RENDER_DATABASE_URL:-}" ]; then
  db_no_scheme="${RENDER_DATABASE_URL#postgresql://}"
  db_host_and_name="${db_no_scheme#*@}"
  db_hostport="${db_host_and_name%%/*}"
  db_name="${db_host_and_name#*/}"

  export SPRING_DATASOURCE_URL="jdbc:postgresql://${db_hostport}/${db_name}"
fi

exec java -jar /app/app.jar
