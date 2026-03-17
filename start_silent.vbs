Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

folderPath = fso.GetParentFolderName(WScript.ScriptFullName) & "\"

' Install node_modules if missing
If Not fso.FolderExists(folderPath & "node_modules") Then
    WshShell.Run "cmd /c cd /d """ & folderPath & """ && npm install", 1, True
End If

' Launch Electron with no window (0 = hidden)
WshShell.Run "cmd /c cd /d """ & folderPath & """ && npm start", 0, False
