# PowerShell static HTTP server for demo
$ErrorActionPreference = 'Stop'
$port = 8767
$root = 'd:\PW CANVAS\Main\demos\cdn\pinia'

Add-Type -AssemblyName System.Net

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()
Write-Host "PWCA Demo Server started: http://localhost:$port/" -ForegroundColor Green
Write-Host "Serving: $root" -ForegroundColor Yellow
Write-Host "Press Ctrl+C to stop." -ForegroundColor Gray

while ($listener.IsListening) {
    $context = $listener.GetContext()
    $request = $context.Request
    $response = $context.Response

    $localPath = $request.Url.LocalPath
    if ($localPath -eq '/' -or [string]::IsNullOrEmpty($localPath)) { $localPath = '/index.html' }
    $rel = $localPath.TrimStart('/')
    $filePath = Join-Path $root ($rel -replace '/', [IO.Path]::DirectorySeparatorChar)

    if (Test-Path -LiteralPath $filePath -PathType Leaf) {
        $bytes = [System.IO.File]::ReadAllBytes($filePath)
        $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
        $mime = switch ($ext) {
            '.html' { 'text/html; charset=utf-8' }
            '.js'   { 'application/javascript; charset=utf-8' }
            '.mjs'  { 'application/javascript; charset=utf-8' }
            '.cjs'  { 'application/javascript; charset=utf-8' }
            '.css'  { 'text/css; charset=utf-8' }
            '.json' { 'application/json; charset=utf-8' }
            '.svg'  { 'image/svg+xml' }
            '.png'  { 'image/png' }
            '.jpg'  { 'image/jpeg' }
            '.ico'  { 'image/x-icon' }
            '.map'  { 'application/json; charset=utf-8' }
            default { 'application/octet-stream' }
        }
        $response.ContentType = $mime
        $response.ContentLength64 = $bytes.Length
        $response.StatusCode = 200
        $response.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
        $msg = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found: $localPath")
        $response.StatusCode = 404
        $response.ContentType = 'text/plain; charset=utf-8'
        $response.ContentLength64 = $msg.Length
        $response.OutputStream.Write($msg, 0, $msg.Length)
    }
    $response.Close()
}
