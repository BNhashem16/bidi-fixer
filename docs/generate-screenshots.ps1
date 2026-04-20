Add-Type -AssemblyName System.Drawing

$outDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$imgDir = Join-Path $outDir "images"
New-Item -ItemType Directory -Force -Path $imgDir | Out-Null

function New-RoundedPath {
    param($x, $y, $w, $h, $r)
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $d = $r * 2
    $path.AddArc($x, $y, $d, $d, 180, 90)
    $path.AddArc($x + $w - $d, $y, $d, $d, 270, 90)
    $path.AddArc($x + $w - $d, $y + $h - $d, $d, $d, 0, 90)
    $path.AddArc($x, $y + $h - $d, $d, $d, 90, 90)
    $path.CloseFigure()
    return $path
}

function New-Canvas {
    param([int]$w, [int]$h, [System.Drawing.Color]$bg)
    $bmp = New-Object System.Drawing.Bitmap($w, $h)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit
    $g.FillRectangle((New-Object System.Drawing.SolidBrush($bg)), 0, 0, $w, $h)
    return @{ Bmp = $bmp; G = $g }
}

function Set-GradientBg {
    param($g, $w, $h, [System.Drawing.Color]$c1, [System.Drawing.Color]$c2)
    $rect = New-Object System.Drawing.Rectangle(0, 0, $w, $h)
    $br = New-Object System.Drawing.Drawing2D.LinearGradientBrush($rect, $c1, $c2, 135.0)
    $g.FillRectangle($br, $rect)
    $br.Dispose()
}

function Draw-Card {
    param($g, $x, $y, $w, $h, $r, [System.Drawing.Color]$fill, [System.Drawing.Color]$border)
    $path = New-RoundedPath $x $y $w $h $r
    $fb = New-Object System.Drawing.SolidBrush($fill)
    $g.FillPath($fb, $path)
    $pen = New-Object System.Drawing.Pen($border, 1)
    $g.DrawPath($pen, $path)
    $fb.Dispose(); $pen.Dispose(); $path.Dispose()
}

function Draw-Logo {
    param($g, $x, $y, $size)
    $path = New-RoundedPath $x $y $size $size ([int]($size * 0.22))
    $c1 = [System.Drawing.Color]::FromArgb(124, 108, 255)
    $c2 = [System.Drawing.Color]::FromArgb(75, 181, 255)
    $rect = New-Object System.Drawing.Rectangle($x, $y, $size, $size)
    $br = New-Object System.Drawing.Drawing2D.LinearGradientBrush($rect, $c1, $c2, 135.0)
    $g.FillPath($br, $path)
    $font = New-Object System.Drawing.Font("Segoe UI", [single]($size * 0.42), [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
    $sf = New-Object System.Drawing.StringFormat
    $sf.Alignment = [System.Drawing.StringAlignment]::Center
    $sf.LineAlignment = [System.Drawing.StringAlignment]::Center
    $tb = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    $arabicBa = [char]0x0628
    $label = [string]$arabicBa + "B"
    $g.DrawString($label, $font, $tb, [System.Drawing.RectangleF]::new($x, $y, $size, $size), $sf)
    $br.Dispose(); $font.Dispose(); $sf.Dispose(); $tb.Dispose(); $path.Dispose()
}

function Draw-Text {
    param($g, $text, $x, $y, $size, [System.Drawing.Color]$color, [string]$weight = "Regular")
    $style = if ($weight -eq "Bold") { [System.Drawing.FontStyle]::Bold } else { [System.Drawing.FontStyle]::Regular }
    $font = New-Object System.Drawing.Font("Segoe UI", [single]$size, $style, [System.Drawing.GraphicsUnit]::Pixel)
    $br = New-Object System.Drawing.SolidBrush($color)
    $g.DrawString($text, $font, $br, [single]$x, [single]$y)
    $font.Dispose(); $br.Dispose()
}

function Draw-Pill {
    param($g, $x, $y, $w, $h, [System.Drawing.Color]$fill, [System.Drawing.Color]$border, [string]$label, [System.Drawing.Color]$labelColor)
    Draw-Card $g $x $y $w $h ([int]($h / 2.2)) $fill $border
    $font = New-Object System.Drawing.Font("Segoe UI", 12, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
    $sf = New-Object System.Drawing.StringFormat
    $sf.Alignment = [System.Drawing.StringAlignment]::Center
    $sf.LineAlignment = [System.Drawing.StringAlignment]::Center
    $br = New-Object System.Drawing.SolidBrush($labelColor)
    $g.DrawString($label, $font, $br, [System.Drawing.RectangleF]::new($x, $y, $w, $h), $sf)
    $font.Dispose(); $br.Dispose(); $sf.Dispose()
}

function Draw-Popup {
    param([string]$theme = "dark")

    if ($theme -eq "dark") {
        $bg = [System.Drawing.Color]::FromArgb(15, 18, 34)
        $surface = [System.Drawing.Color]::FromArgb(24, 28, 51)
        $surfaceHi = [System.Drawing.Color]::FromArgb(34, 40, 72)
        $border = [System.Drawing.Color]::FromArgb(42, 49, 90)
        $text = [System.Drawing.Color]::FromArgb(238, 241, 255)
        $muted = [System.Drawing.Color]::FromArgb(154, 163, 199)
        $accent = [System.Drawing.Color]::FromArgb(124, 108, 255)
    } else {
        $bg = [System.Drawing.Color]::FromArgb(246, 247, 251)
        $surface = [System.Drawing.Color]::White
        $surfaceHi = [System.Drawing.Color]::FromArgb(238, 241, 248)
        $border = [System.Drawing.Color]::FromArgb(227, 230, 240)
        $text = [System.Drawing.Color]::FromArgb(27, 33, 64)
        $muted = [System.Drawing.Color]::FromArgb(92, 100, 130)
        $accent = [System.Drawing.Color]::FromArgb(106, 91, 255)
    }

    $w = 720; $h = 600
    $c = New-Canvas $w $h $bg
    $g = $c.G; $bmp = $c.Bmp

    $px = 60; $py = 40; $pw = 600; $ph = 520
    Draw-Card $g ($px + 6) ($py + 10) $pw $ph 18 ([System.Drawing.Color]::FromArgb(24, 0, 0, 0)) $border
    Draw-Card $g $px $py $pw $ph 18 $surface $border

    Draw-Logo $g ($px + 24) ($py + 24) 56
    Draw-Text $g "Bidi Fixer" ($px + 96) ($py + 28) 22 $text "Bold"
    Draw-Text $g "youtube.com" ($px + 96) ($py + 58) 13 $muted

    $swX = $px + 520; $swY = $py + 38
    $swPath = New-RoundedPath $swX $swY 68 34 17
    $c1 = [System.Drawing.Color]::FromArgb(124, 108, 255)
    $c2 = [System.Drawing.Color]::FromArgb(75, 181, 255)
    $swRect = New-Object System.Drawing.Rectangle($swX, $swY, 68, 34)
    $swBr = New-Object System.Drawing.Drawing2D.LinearGradientBrush($swRect, $c1, $c2, 135.0)
    $g.FillPath($swBr, $swPath)
    $knobBr = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    $g.FillEllipse($knobBr, ($swX + 36), ($swY + 3), 28, 28)
    $swBr.Dispose(); $knobBr.Dispose(); $swPath.Dispose()

    Draw-Text $g "DIRECTION MODE" ($px + 24) ($py + 110) 11 $muted "Bold"

    $tileW = 176; $tileH = 70; $tileY = $py + 132
    Draw-Card $g ($px + 24) $tileY $tileW $tileH 12 $surfaceHi $accent
    Draw-Text $g "Auto" ($px + 80) ($tileY + 14) 16 $text "Bold"
    Draw-Text $g "Detect per element" ($px + 52) ($tileY + 40) 12 $muted

    Draw-Card $g ($px + 212) $tileY $tileW $tileH 12 $surface $border
    Draw-Text $g "Force RTL" ($px + 254) ($tileY + 14) 16 $text "Bold"
    Draw-Text $g "Arabic-first" ($px + 260) ($tileY + 40) 12 $muted

    Draw-Card $g ($px + 400) $tileY $tileW $tileH 12 $surface $border
    Draw-Text $g "Force LTR" ($px + 442) ($tileY + 14) 16 $text "Bold"
    Draw-Text $g "Latin-first" ($px + 452) ($tileY + 40) 12 $muted

    Draw-Text $g "THIS SITE" ($px + 24) ($py + 232) 11 $muted "Bold"
    Draw-Card $g ($px + 24) ($py + 254) 552 94 12 $surfaceHi $border
    Draw-Text $g "Disable on this site" ($px + 44) ($py + 268) 13 $text
    Draw-Text $g "Override mode: Auto" ($px + 44) ($py + 296) 12 $muted
    Draw-Text $g "Clear override" ($px + 440) ($py + 296) 12 $muted

    Draw-Card $g ($px + 24) ($py + 372) 268 80 12 $surface $border
    Draw-Text $g "42" ($px + 140) ($py + 386) 28 $text "Bold"
    Draw-Text $g "FIXED ELEMENTS" ($px + 98) ($py + 424) 10 $muted "Bold"

    Draw-Card $g ($px + 308) ($py + 372) 268 80 12 $surface $border
    Draw-Text $g "AUTO" ($px + 410) ($py + 390) 22 $text "Bold"
    Draw-Text $g "DIRECTION MODE" ($px + 380) ($py + 424) 10 $muted "Bold"

    $dotBr = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(74, 222, 128))
    $g.FillEllipse($dotBr, ($px + 24), ($py + 478), 12, 12)
    $dotBr.Dispose()
    Draw-Text $g "Active" ($px + 44) ($py + 476) 13 ([System.Drawing.Color]::FromArgb(74, 222, 128))
    Draw-Pill $g ($px + 400) ($py + 470) 80 30 $surface $border "Options" $muted
    Draw-Pill $g ($px + 496) ($py + 470) 80 30 $accent $accent "Rescan" ([System.Drawing.Color]::White)

    $out = Join-Path $imgDir ("popup-" + $theme + ".png")
    $bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose(); $bmp.Dispose()
    Write-Host "Wrote $out"
}

function Draw-BeforeAfter {
    $w = 1400; $h = 600
    $c = New-Canvas $w $h ([System.Drawing.Color]::FromArgb(11, 14, 31))
    $g = $c.G; $bmp = $c.Bmp

    Set-GradientBg $g $w $h ([System.Drawing.Color]::FromArgb(17, 21, 44)) ([System.Drawing.Color]::FromArgb(11, 14, 31))

    Draw-Logo $g 80 60 64
    Draw-Text $g "Bidi Fixer" 160 62 36 ([System.Drawing.Color]::FromArgb(238, 241, 255)) "Bold"
    Draw-Text $g "Arabic + English text that finally reads right." 160 108 16 ([System.Drawing.Color]::FromArgb(154, 163, 199))

    $accent = [System.Drawing.Color]::FromArgb(124, 108, 255)
    $text = [System.Drawing.Color]::FromArgb(238, 241, 255)
    $muted = [System.Drawing.Color]::FromArgb(154, 163, 199)
    $surface = [System.Drawing.Color]::FromArgb(24, 28, 51)
    $border = [System.Drawing.Color]::FromArgb(42, 49, 90)
    $bad = [System.Drawing.Color]::FromArgb(239, 68, 68)
    $good = [System.Drawing.Color]::FromArgb(74, 222, 128)

    $arabicSample = ([char]0x0627) + ([char]0x0634) + ([char]0x062A) + ([char]0x0631) + ([char]0x064A) + ([char]0x062A) + " iPhone 15 Pro Max " + ([char]0x0628) + ([char]0x0633) + ([char]0x0639) + ([char]0x0631) + " 4999 " + ([char]0x0631) + ([char]0x064A) + ([char]0x0627) + ([char]0x0644)

    Draw-Card $g 80 200 600 330 18 $surface $border
    Draw-Pill $g 108 224 90 28 $bad $bad "BEFORE" ([System.Drawing.Color]::White)
    Draw-Text $g $arabicSample 108 296 22 $text "Bold"
    Draw-Text $g "numbers and Latin flip inside the RTL run" 108 340 14 $muted
    Draw-Text $g "- Reversed order" 108 390 15 $bad
    Draw-Text $g "- Hard to read" 108 420 15 $bad
    Draw-Text $g "- Breaks search and copy" 108 450 15 $bad

    Draw-Card $g 720 200 600 330 18 $surface $border
    Draw-Pill $g 748 224 80 28 $good $good "AFTER" ([System.Drawing.Color]::White)
    Draw-Text $g $arabicSample 748 296 22 $text "Bold"
    Draw-Text $g "dir=auto + unicode-bidi: plaintext" 748 340 14 $muted
    Draw-Text $g "+ Natural reading order" 748 390 15 $good
    Draw-Text $g "+ Numbers stay LTR" 748 420 15 $good
    Draw-Text $g "+ Fully reversible" 748 450 15 $good

    $pen = New-Object System.Drawing.Pen($accent, 4)
    $pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::ArrowAnchor
    $g.DrawLine($pen, 690, 365, 715, 365)
    $pen.Dispose()

    Draw-Text $g "MV3  -  Zero dependencies  -  Zero tracking  -  MIT" 80 560 13 $muted

    $out = Join-Path $imgDir "hero.png"
    $bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose(); $bmp.Dispose()
    Write-Host "Wrote $out"
}

function Draw-StorePromo {
    param([int]$w, [int]$h, [string]$name)
    $c = New-Canvas $w $h ([System.Drawing.Color]::FromArgb(11, 14, 31))
    $g = $c.G; $bmp = $c.Bmp
    Set-GradientBg $g $w $h ([System.Drawing.Color]::FromArgb(23, 28, 58)) ([System.Drawing.Color]::FromArgb(11, 14, 31))

    $logoSize = [int]([Math]::Min($h * 0.4, 180))
    Draw-Logo $g ([int]($w * 0.08)) ([int](($h - $logoSize) / 2)) $logoSize

    $textX = [int]($w * 0.08 + $logoSize + 30)
    $titleSize = [int]($h * 0.14)
    Draw-Text $g "Bidi Fixer" $textX ([int]($h * 0.22)) $titleSize ([System.Drawing.Color]::FromArgb(238, 241, 255)) "Bold"
    Draw-Text $g "Arabic + English that reads right." $textX ([int]($h * 0.52)) ([int]($h * 0.07)) ([System.Drawing.Color]::FromArgb(154, 163, 199))
    Draw-Text $g "Works on every site. MV3. Free." $textX ([int]($h * 0.7)) ([int]($h * 0.055)) ([System.Drawing.Color]::FromArgb(124, 108, 255))

    $out = Join-Path $imgDir $name
    $bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose(); $bmp.Dispose()
    Write-Host "Wrote $out"
}

Draw-Popup "dark"
Draw-Popup "light"
Draw-BeforeAfter
Draw-StorePromo 440 280 "store-small-tile.png"
Draw-StorePromo 1400 560 "store-marquee.png"
