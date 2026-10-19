. oraenv

SQLDBA="sqlplus /nolog"

$SQLDBA <<EOF
connect /
@/home/donsys/vista/config/vista_config.sql
quit
EOF

