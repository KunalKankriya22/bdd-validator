Dim Arg,FsalPath
FsalPath = "C:\BCCAC\BCCAC_FSAL.bat"
Set Arg = WScript.Arguments
Set WshShell = CreateObject("WScript.Shell") 
if WScript.Arguments.Count = 0 then
	WshShell.Run chr(34) & FsalPath & Chr(34), 0
else
	WshShell.Run chr(34) & FsalPath & Chr(34) & Arg(0), 0
end if

Set WshShell = Nothing