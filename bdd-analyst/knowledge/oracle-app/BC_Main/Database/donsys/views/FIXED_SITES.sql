CREATE OR REPLACE FORCE EDITIONABLE VIEW "DONSYS"."FIXED_SITES" ( "SITE_ID",
"LOCATION_NAME",
"CHAPTER_ID",
"ROTATION_FLAG",
"STAFF_FACILITY" ) AS
    SELECT
        location_id site_id,
        location_name,
        chapter_id,
        rotation_flag,
        staff_facility
    FROM
        locations
    WHERE
        location_type IN ( 'FIX', 'F' )
        AND lifetrack_timezone_convert.get_local_time(chapter_id, sysdate) BETWEEN eff_date AND nvl(term_date,
                                                                                                    lifetrack_timezone_convert.get_local_time
                                                                                                    (chapter_id, sysdate) + 1)
        AND chapter_id IN (
            SELECT
                chapter_id
            FROM
                system_users
       --where user_id = decode(substr(user ,1,3),'OPS',substr(user ,5),user ))
            WHERE
                user_id = decode(substr(lt_user_session.get_userid, 1, 3),
                                 'OPS',
                                 substr(lt_user_session.get_userid, 5),
                                 lt_user_session.get_userid)
        )
WITH READ ONLY;

GRANT DELETE ON "DONSYS"."FIXED_SITES" TO "LTAPI";

GRANT DELETE ON "DONSYS"."FIXED_SITES" TO "LTWEB";

GRANT DELETE ON "DONSYS"."FIXED_SITES" TO "SBCSYS";

GRANT DELETE ON "DONSYS"."FIXED_SITES" TO "SRVSYS";

GRANT DELETE ON "DONSYS"."FIXED_SITES" TO "UTIL";

GRANT DELETE ON "DONSYS"."FIXED_SITES" TO "VISTA";

GRANT DELETE ON "DONSYS"."FIXED_SITES" TO "DBADMN";

GRANT DELETE ON "DONSYS"."FIXED_SITES" TO "LTRAK_ROLE";

GRANT INSERT ON "DONSYS"."FIXED_SITES" TO "LTAPI";

GRANT INSERT ON "DONSYS"."FIXED_SITES" TO "LTWEB";

GRANT INSERT ON "DONSYS"."FIXED_SITES" TO "SBCSYS";

GRANT INSERT ON "DONSYS"."FIXED_SITES" TO "SRVSYS";

GRANT INSERT ON "DONSYS"."FIXED_SITES" TO "UTIL";

GRANT INSERT ON "DONSYS"."FIXED_SITES" TO "VISTA";

GRANT INSERT ON "DONSYS"."FIXED_SITES" TO "DBADMN";

GRANT INSERT ON "DONSYS"."FIXED_SITES" TO "LTRAK_ROLE";

GRANT SELECT ON "DONSYS"."FIXED_SITES" TO "LTAPI";

GRANT SELECT ON "DONSYS"."FIXED_SITES" TO "LTWEB";

GRANT SELECT ON "DONSYS"."FIXED_SITES" TO "SBCSYS";

GRANT SELECT ON "DONSYS"."FIXED_SITES" TO "SRVSYS";

GRANT SELECT ON "DONSYS"."FIXED_SITES" TO "UTIL";

GRANT SELECT ON "DONSYS"."FIXED_SITES" TO "VISTA";

GRANT SELECT ON "DONSYS"."FIXED_SITES" TO "DBADMN";

GRANT SELECT ON "DONSYS"."FIXED_SITES" TO "LTRAK_ROLE";

GRANT UPDATE ON "DONSYS"."FIXED_SITES" TO "LTAPI";

GRANT UPDATE ON "DONSYS"."FIXED_SITES" TO "LTWEB";

GRANT UPDATE ON "DONSYS"."FIXED_SITES" TO "SBCSYS";

GRANT UPDATE ON "DONSYS"."FIXED_SITES" TO "SRVSYS";

GRANT UPDATE ON "DONSYS"."FIXED_SITES" TO "UTIL";

GRANT UPDATE ON "DONSYS"."FIXED_SITES" TO "VISTA";

GRANT UPDATE ON "DONSYS"."FIXED_SITES" TO "DBADMN";

GRANT UPDATE ON "DONSYS"."FIXED_SITES" TO "LTRAK_ROLE";

GRANT UPDATE ON "DONSYS"."FIXED_SITES" TO "BLOODC_ROLE";

GRANT SELECT ON "DONSYS"."FIXED_SITES" TO "BLOODC_ROLE";

GRANT INSERT ON "DONSYS"."FIXED_SITES" TO "BLOODC_ROLE";

GRANT DELETE ON "DONSYS"."FIXED_SITES" TO "BLOODC_ROLE";