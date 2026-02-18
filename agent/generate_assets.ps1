Add-Type -AssemblyName System.Drawing

function Create-PlaceholderImage {
    param (
        [string]$Path,
        [int]$Width,
        [int]$Height,
        [string]$Color,
        [string]$Text
    )

    $bitmap = New-Object System.Drawing.Bitmap($Width, $Height)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromName($Color))
    $graphics.FillRectangle($brush, 0, 0, $Width, $Height)

    if ($Text) {
        $font = New-Object System.Drawing.Font("Arial", 10)
        $textBrush = [System.Drawing.Brushes]::White
        $textSize = $graphics.MeasureString($Text, $font)
        $x = ($Width - $textSize.Width) / 2
        $y = ($Height - $textSize.Height) / 2
        $graphics.DrawString($Text, $font, $textBrush, $x, $y)
    }

    $bitmap.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
    $graphics.Dispose()
    $bitmap.Dispose()
    Write-Host "Created $Path"
}

Create-PlaceholderImage "agent/msix_build/Assets/Square150x150Logo.png" 150 150 "Blue" "SysTracker"
Create-PlaceholderImage "agent/msix_build/Assets/Square44x44Logo.png" 44 44 "Blue" "ST"
Create-PlaceholderImage "agent/msix_build/Assets/StoreLogo.png" 50 50 "Blue" "ST"
Create-PlaceholderImage "agent/msix_build/Assets/Square150x150Logo.scale-200.png" 300 300 "Blue" "SysTracker"
Create-PlaceholderImage "agent/msix_build/Assets/Square44x44Logo.scale-200.png" 88 88 "Blue" "ST"
Create-PlaceholderImage "agent/msix_build/Assets/StoreLogo.scale-200.png" 100 100 "Blue" "ST"
