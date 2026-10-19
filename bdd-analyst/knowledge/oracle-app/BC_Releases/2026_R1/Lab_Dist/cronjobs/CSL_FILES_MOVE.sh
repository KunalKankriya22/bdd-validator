
# This Shell Script is to move the files from UTL_FILE_DIR to /home/sbcsys/CSL_FILES Directory.
# Please Update the Actual UTIL directory with /tmp/qtrak_util directory

find /tmp/bcqas_util/*.asn -size +0k -exec mv {} /home/sbcsys/bcqas/CSL_FILES \;

