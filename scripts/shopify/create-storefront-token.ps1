# Create Shopify Storefront API token via Admin API.
# Uses client_credentials to get Admin token, then storefrontAccessTokenCreate mutation.
# Secrets must be passed as env vars; do not hardcode in repo.
# Usage: $env:SHOPIFY_CLIENT_ID='...'; $env:SHOPIFY_CLIENT_SECRET='...'; .\create-storefront-token.ps1

$ErrorActionPreference = 'Stop'
$clientId = $env:SHOPIFY_CLIENT_ID
$clientSecret = $env:SHOPIFY_CLIENT_SECRET
$storeDomain = $env:SHOPIFY_STORE_DOMAIN
if (-not $storeDomain) { $storeDomain = 'ubee-furniture.myshopify.com' }

if (-not $clientId -or -not $clientSecret) {
    Write-Error 'Set env SHOPIFY_CLIENT_ID and SHOPIFY_CLIENT_SECRET (do not commit).'
}

# Step 1: Admin token via client_credentials
$oauthBody = "client_id=$([uri]::EscapeDataString($clientId))&client_secret=$([uri]::EscapeDataString($clientSecret))&grant_type=client_credentials"
$oauthUri = "https://$storeDomain/admin/oauth/access_token"
try {
    $tokenResp = Invoke-RestMethod -Method Post -Uri $oauthUri -ContentType 'application/x-www-form-urlencoded' -Body $oauthBody
} catch {
    $status = $_.Exception.Response.StatusCode.value__
    $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
    $body = $reader.ReadToEnd()
    Write-Error "OAuth failed ($status): $body"
}
$adminToken = $tokenResp.access_token
if (-not $adminToken) { Write-Error 'No access_token in OAuth response.' }

# Step 2: Storefront token via Admin GraphQL
$apiVersion = '2024-01'
$graphqlUri = "https://$storeDomain/admin/api/$apiVersion/graphql.json"
$mutation = 'mutation StorefrontAccessTokenCreate($input: StorefrontAccessTokenInput!) { storefrontAccessTokenCreate(input: $input) { userErrors { field message } storefrontAccessToken { accessToken title } } }'
$variables = @{ input = @{ title = 'uBee Headless Storefront' } }
$graphqlBody = @{ query = $mutation; variables = $variables } | ConvertTo-Json -Depth 5 -Compress
$headers = @{
    'Content-Type' = 'application/json'
    'X-Shopify-Access-Token' = $adminToken
}
try {
    $sfResp = Invoke-RestMethod -Method Post -Uri $graphqlUri -Headers $headers -Body $graphqlBody
} catch {
    $status = $_.Exception.Response.StatusCode.value__
    $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
    $body = $reader.ReadToEnd()
    Write-Error "GraphQL failed ($status): $body"
}
$create = $sfResp.data.storefrontAccessTokenCreate
if ($create.userErrors -and $create.userErrors.Count -gt 0) {
    $msg = ($create.userErrors | ForEach-Object { $_.message }) -join '; '
    Write-Error "storefrontAccessTokenCreate userErrors: $msg"
}
$storefrontToken = $create.storefrontAccessToken.accessToken
if (-not $storefrontToken) { Write-Error 'No storefront accessToken in response.' }

# Output token only for piping to .env update (do not log)
$storefrontToken
