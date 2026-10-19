CREATE OR REPLACE FORCE EDITIONABLE VIEW "DONSYS"."DRIVE_SPON" ( "DRIVE_ID",
"DRIVE_DATE",
"DRIVE_TYPE",
"PROJECTED_SHOW",
"PROJECTED_DRAW",
"SCHEDULE_START_TIME",
"SCHEDULE_END_TIME",
"LOCATION_ID",
"NAME" ) AS
    SELECT
        drives.drive_id,
        drive_date,
        drive_type,
        drives.projected_show,
        drives.projected_draw,
        schedule_start_time,
        schedule_end_time,
        location_id,
        name
    FROM
        drives,
        drive_sponsors,
        sponsors
    WHERE
            drives.chapter_id = (
                SELECT
                    chapter_id
                FROM
                    system_users
                WHERE
                    user_id = decode(substr(lt_user_session.get_userid, 1, 3),
                                     'OPS',
                                     substr(lt_user_session.get_userid, 5),
                                     lt_user_session.get_userid)
            )
        AND drive_sponsors.sponsor_id = (
            SELECT
                sponsor_id
            FROM
                drive_sponsors
            WHERE
                    drive_id = drives.drive_id
                AND chapter_id = drives.chapter_id
                AND ROWNUM = 1
        )
        AND drive_sponsors.drive_id = drives.drive_id
        AND drive_sponsors.chapter_id = drives.chapter_id
        AND sponsors.sponsor_id = drive_sponsors.sponsor_id
        AND sponsors.chapter_id = drive_sponsors.chapter_id
        AND drives.status != 'CANCL';

GRANT DELETE ON "DONSYS"."DRIVE_SPON" TO "LTAPI";

GRANT DELETE ON "DONSYS"."DRIVE_SPON" TO "LTWEB";

GRANT DELETE ON "DONSYS"."DRIVE_SPON" TO "SBCSYS";

GRANT DELETE ON "DONSYS"."DRIVE_SPON" TO "SRVSYS";

GRANT DELETE ON "DONSYS"."DRIVE_SPON" TO "UTIL";

GRANT DELETE ON "DONSYS"."DRIVE_SPON" TO "VISTA";

GRANT DELETE ON "DONSYS"."DRIVE_SPON" TO "DBADMN";

GRANT DELETE ON "DONSYS"."DRIVE_SPON" TO "LTRAK_ROLE";

GRANT INSERT ON "DONSYS"."DRIVE_SPON" TO "LTAPI";

GRANT INSERT ON "DONSYS"."DRIVE_SPON" TO "LTWEB";

GRANT INSERT ON "DONSYS"."DRIVE_SPON" TO "SBCSYS";

GRANT INSERT ON "DONSYS"."DRIVE_SPON" TO "SRVSYS";

GRANT INSERT ON "DONSYS"."DRIVE_SPON" TO "UTIL";

GRANT INSERT ON "DONSYS"."DRIVE_SPON" TO "VISTA";

GRANT INSERT ON "DONSYS"."DRIVE_SPON" TO "DBADMN";

GRANT INSERT ON "DONSYS"."DRIVE_SPON" TO "LTRAK_ROLE";

GRANT SELECT ON "DONSYS"."DRIVE_SPON" TO "LTAPI";

GRANT SELECT ON "DONSYS"."DRIVE_SPON" TO "LTWEB";

GRANT SELECT ON "DONSYS"."DRIVE_SPON" TO "SBCSYS";

GRANT SELECT ON "DONSYS"."DRIVE_SPON" TO "SRVSYS";

GRANT SELECT ON "DONSYS"."DRIVE_SPON" TO "UTIL";

GRANT SELECT ON "DONSYS"."DRIVE_SPON" TO "VISTA";

GRANT SELECT ON "DONSYS"."DRIVE_SPON" TO "DBADMN";

GRANT SELECT ON "DONSYS"."DRIVE_SPON" TO "LTRAK_ROLE";

GRANT UPDATE ON "DONSYS"."DRIVE_SPON" TO "LTAPI";

GRANT UPDATE ON "DONSYS"."DRIVE_SPON" TO "LTWEB";

GRANT UPDATE ON "DONSYS"."DRIVE_SPON" TO "SBCSYS";

GRANT UPDATE ON "DONSYS"."DRIVE_SPON" TO "SRVSYS";

GRANT UPDATE ON "DONSYS"."DRIVE_SPON" TO "UTIL";

GRANT UPDATE ON "DONSYS"."DRIVE_SPON" TO "VISTA";

GRANT UPDATE ON "DONSYS"."DRIVE_SPON" TO "DBADMN";

GRANT UPDATE ON "DONSYS"."DRIVE_SPON" TO "LTRAK_ROLE";

GRANT UPDATE ON "DONSYS"."DRIVE_SPON" TO "BLOODC_ROLE";

GRANT SELECT ON "DONSYS"."DRIVE_SPON" TO "BLOODC_ROLE";

GRANT INSERT ON "DONSYS"."DRIVE_SPON" TO "BLOODC_ROLE";

GRANT DELETE ON "DONSYS"."DRIVE_SPON" TO "BLOODC_ROLE";