Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "D:\Mob-trade\backend"
WshShell.Run """D:\Mob-trade\backend\run-server-24-7.bat""", 0, False
