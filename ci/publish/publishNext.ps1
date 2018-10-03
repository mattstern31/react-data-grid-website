if (!$env:APPVEYOR_SCHEDULED_BUILD -and !$env:APPVEYOR_PULL_REQUEST_NUMBER -and $env:APPVEYOR_REPO_BRANCH -eq 'next') {
  $nextVersion = node ./ci/publish/getNextVersion prerelease
  git config --global credential.helper store
  git config --global push.default simple
  Add-Content "$env:USERPROFILE\.git-credentials" "https://$($env:access_token):x-oauth-basic@github.com`n"
  git config --global user.name $env:APPVEYOR_REPO_COMMIT_AUTHOR
  git config --global user.email $env:APPVEYOR_REPO_COMMIT_AUTHOR_EMAIL
  git checkout $env:APPVEYOR_REPO_BRANCH
  Write-Host "Publishing $($nextVersion) to npm"
  if($?) {
    ./node_modules/.bin/lerna publish --repo-version $nextVersion --npm-tag=$env:APPVEYOR_REPO_BRANCH --yes --skip-git
  }

  exit $lastexitcode
}
