# PowerShell script to check Supabase connection status
# Run with: .\check-supabase-connection.ps1

Write-Host "🔍 Checking Supabase Database Connection..." -ForegroundColor Cyan
Write-Host ""

# Check for .env.local in frontend directory
$envPath = "frontend\.local"
$envExists = Test-Path $envPath

Write-Host "📋 Environment File Check:" -ForegroundColor Yellow
if ($envExists) {
    Write-Host "  ✅ .env.local file found in frontend/" -ForegroundColor Green
} else {
    Write-Host "  ❌ .env.local file NOT found in frontend/" -ForegroundColor Red
    Write-Host ""
    Write-Host "📝 To connect your Supabase database:" -ForegroundColor Yellow
    Write-Host "   1. Create a file named .env.local in the frontend/ directory" -ForegroundColor White
    Write-Host "   2. Add the following variables:" -ForegroundColor White
    Write-Host ""
    Write-Host "   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url" -ForegroundColor Gray
    Write-Host "   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key" -ForegroundColor Gray
    Write-Host "   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   3. Get these values from: https://app.supabase.com/project/_/settings/api" -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host ""

# Try to check if values are set (without exposing them)
try {
    $envContent = Get-Content $envPath -Raw
    $hasUrl = $envContent -match "NEXT_PUBLIC_SUPABASE_URL\s*=" -and $envContent -notmatch "NEXT_PUBLIC_SUPABASE_URL\s*=\s*(your_|placeholder|example)"
    $hasAnonKey = $envContent -match "NEXT_PUBLIC_SUPABASE_ANON_KEY\s*=" -and $envContent -notmatch "NEXT_PUBLIC_SUPABASE_ANON_KEY\s*=\s*(your_|placeholder|example)"
    $hasServiceKey = $envContent -match "SUPABASE_SERVICE_ROLE_KEY\s*=" -and $envContent -notmatch "SUPABASE_SERVICE_ROLE_KEY\s*=\s*(your_|placeholder|example)"
    
    Write-Host "📋 Environment Variables Check:" -ForegroundColor Yellow
    if ($hasUrl) {
        Write-Host "  ✅ NEXT_PUBLIC_SUPABASE_URL: Set" -ForegroundColor Green
    } else {
        Write-Host "  ❌ NEXT_PUBLIC_SUPABASE_URL: Missing or placeholder" -ForegroundColor Red
    }
    
    if ($hasAnonKey) {
        Write-Host "  ✅ NEXT_PUBLIC_SUPABASE_ANON_KEY: Set" -ForegroundColor Green
    } else {
        Write-Host "  ❌ NEXT_PUBLIC_SUPABASE_ANON_KEY: Missing or placeholder" -ForegroundColor Red
    }
    
    if ($hasServiceKey) {
        Write-Host "  ✅ SUPABASE_SERVICE_ROLE_KEY: Set" -ForegroundColor Green
    } else {
        Write-Host "  ❌ SUPABASE_SERVICE_ROLE_KEY: Missing or placeholder" -ForegroundColor Red
    }
    
    Write-Host ""
    
    if (-not ($hasUrl -and $hasServiceKey)) {
        Write-Host "⚠️  Some environment variables are missing or still have placeholder values." -ForegroundColor Yellow
        Write-Host "   Please update frontend/.env.local with your actual Supabase credentials." -ForegroundColor White
        Write-Host ""
        exit 1
    }
    
    Write-Host "✅ Environment variables are configured!" -ForegroundColor Green
    Write-Host ""
    Write-Host "💡 Next steps:" -ForegroundColor Cyan
    Write-Host "   1. Make sure your Supabase project is set up" -ForegroundColor White
    Write-Host "   2. Run the database setup SQL script in Supabase SQL Editor" -ForegroundColor White
    Write-Host "   3. Test the connection with: cd frontend; npm run test:db" -ForegroundColor White
    Write-Host "   4. Or start your dev server: cd frontend; npm run dev" -ForegroundColor White
    Write-Host ""
    
} catch {
    Write-Host "⚠️  Could not read .env.local file (may be protected)" -ForegroundColor Yellow
    Write-Host "   Please verify the file exists and contains your Supabase credentials." -ForegroundColor White
    Write-Host ""
}










