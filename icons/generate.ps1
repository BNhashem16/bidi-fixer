Add-Type -AssemblyName System.Drawing

$sizes = @(16, 32, 48, 128)
$outDir = Split-Path -Parent $MyInvocation.MyCommand.Path

foreach ($size in $sizes) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic

    $rect = New-Object System.Drawing.Rectangle(0, 0, $size, $size)
    $radius = [Math]::Max(2, [int]($size * 0.22))

    # Rounded rect path
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $d = $radius * 2
    $path.AddArc($rect.X, $rect.Y, $d, $d, 180, 90)
    $path.AddArc($rect.Right - $d, $rect.Y, $d, $d, 270, 90)
    $path.AddArc($rect.Right - $d, $rect.Bottom - $d, $d, $d, 0, 90)
    $path.AddArc($rect.X, $rect.Bottom - $d, $d, $d, 90, 90)
    $path.CloseFigure()

    # Gradient fill (purple -> blue)
    $c1 = [System.Drawing.Color]::FromArgb(124, 108, 255)
    $c2 = [System.Drawing.Color]::FromArgb(75, 181, 255)
    $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($rect, $c1, $c2, 135)
    $g.FillPath($brush, $path)

    # Subtle inner highlight
    $hlColor = [System.Drawing.Color]::FromArgb(40, 255, 255, 255)
    $hlBrush = New-Object System.Drawing.SolidBrush($hlColor)
    $hlRect = New-Object System.Drawing.RectangleF(0, 0, $size, $size * 0.45)
    $g.FillRectangle($hlBrush, $hlRect)
    $hlBrush.Dispose()

    # Text: "ب·B"
    $text = "ب" + [char]0x00B7 + "B"
    $fontSize = [single]([Math]::Max(6, $size * 0.42))
    $font = New-Object System.Drawing.Font("Segoe UI", $fontSize, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
    $sf = New-Object System.Drawing.StringFormat
    $sf.Alignment = [System.Drawing.StringAlignment]::Center
    $sf.LineAlignment = [System.Drawing.StringAlignment]::Center

    $textColor = [System.Drawing.Color]::White
    $textBrush = New-Object System.Drawing.SolidBrush($textColor)
    $g.DrawString($text, $font, $textBrush, [System.Drawing.RectangleF]::new(0, 0, $size, $size), $sf)

    $outPath = Join-Path $outDir ("icon{0}.png" -f $size)
    $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)

    $textBrush.Dispose()
    $font.Dispose()
    $sf.Dispose()
    $brush.Dispose()
    $path.Dispose()
    $g.Dispose()
    $bmp.Dispose()

    Write-Host "Wrote $outPath"
}
