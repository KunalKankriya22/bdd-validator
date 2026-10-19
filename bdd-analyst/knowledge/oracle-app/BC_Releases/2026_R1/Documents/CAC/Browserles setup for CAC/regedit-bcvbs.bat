@echo off
reg add HKEY_CLASSES_ROOT\bcvbs /t REG_SZ /f
reg add HKEY_CLASSES_ROOT\bcvbs /v "URL Protocol" /t REG_SZ /f
reg add HKEY_CLASSES_ROOT\bcvbs\shell /f
reg add HKEY_CLASSES_ROOT\bcvbs\shell\open /f
reg add HKEY_CLASSES_ROOT\bcvbs\shell\open\command /t REG_SZ /d "\"wscript\" \"C:\BCCAC\BCCAC_FSAL.vbs\" \"%%1\"" /f
pause;