;<?php die(); ?>
[database]
db_conn     = 10.155.194.56/bcqas
db_user     = util
db_password = util

[application]
onsite_redirect_url = http://10.155.194.133/BCOnsiteUI/login/
oracle_redirect_url = bcapp2024r1-poc://

[okta]
onsite_redirect_uri = 'http://10.155.194.6/bconsiteapp/'
oracle_redirect_uri = 'http://10.155.194.6/bcoracleapp/'
metadata_url = 'https://wellsky-ciam.oktapreview.com/oauth2/aussyy6p7tqLFjziZ1d6/.well-known/openid-configuration'
onsite_client_id = '0oalotocpbqkCNpW21d7'
onsite_client_secret = 'Mzl1hgQ0n_FkA-SrajGkkSNJkVHbii9Aq5jG51TA3R6-GCMwSCrB4-K6bKsu3VUw'
oracle_client_id = '0oalotmip7x8ep3Qt1d7'
oracle_client_secret = 'AVDhFnZzmk52B8_4Y5H2FjM_OnifdiHsuplB1435auZ4FGzdxh7KPGtYlBB0JU-o'

[agent]
map_edi = DOD_EDIPN_ID
map_unique = UNIQUE_ID
