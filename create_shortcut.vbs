Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

folderPath = fso.GetParentFolderName(WScript.ScriptFullName) & "\"

Set oShortcut = WshShell.CreateShortcut(WshShell.SpecialFolders("Desktop") & "\VoiceChat.lnk")
oShortcut.TargetPath = "wscript.exe"
oShortcut.Arguments = """" & folderPath & "start_silent.vbs"""
oShortcut.WorkingDirectory = folderPath
oShortcut.WindowStyle = 1
oShortcut.Description = "VoiceChat - VOICEVOX x Claude"

iconPath = folderPath & "icon.ico"
If fso.FileExists(iconPath) Then
    oShortcut.IconLocation = iconPath
End If

oShortcut.Save
MsgBox "Shortcut created on Desktop! Double-click VoiceChat to launch.", 64, "Done"
