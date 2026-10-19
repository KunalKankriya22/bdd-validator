;<?php die(); ?>
[database]
db_conn     = 10.155.194.6/bcdev
db_user     = util
db_password = util

[application]
onsite_redirect_url = http://10.155.194.6/BCOnsiteUI/login/
oracle_redirect_url = bcapp2024r1-cac://

[okta]
onsite_redirect_uri = 'http://localhost:80/bconsiteapp/'
metadata_url = 'https://dev-78781018.okta.com/oauth2/default/.well-known/openid-configuration'
onsite_client_id = '0oamm0cvp9hVtjHon5d7'
onsite_client_secret = 'sbUBtx6Lv1SzKKa8UmXfAXz9yeKaTtzk0yjr77HhqhbZ93dFGXSLC3dgfT-z0sks'
onsite_redirect_uri = 'http://localhost:80/bconsiteapp/'
oracle_client_id = '0oamtryvcrnZjPLgj5d7'
oracle_client_secret = 'FWjVjYmIsJmCveX3-6k3y3eRRdkxLyFXTIFj8rncQkvx51qfBuaN3TZYMpjqLnm_'
oracle_redirect_uri = 'http://localhost:80/bcoracleapp/'


[agent]
map_edi = DOD_EDIPN_ID
map_unique = UNIQUE_ID
